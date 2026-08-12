/**
 * End-to-end research pipeline (the "demo experiment").
 *
 * Order of operations, with the bias controls that matter at each step:
 *   1. Ingest synthetic OHLCV (labelled synthetic everywhere).
 *   2. Validate + clean before anything else touches the data.
 *   3. Build trailing-window features (never forward-looking).
 *   4. Build the forward-return label; drop rows whose label window is
 *      incomplete so the last bars are excluded rather than guessed.
 *   5. Chronological train/validation/test split with an embargo equal to the
 *      label horizon, so overlapping labels cannot leak across boundaries.
 *   6. Fit on train only; scaling statistics come from train only.
 *   7. Predict on the test segment, form signals, execute with a 1-bar lag.
 *   8. Compare against buy-and-hold and momentum baselines.
 *
 * Nothing in this file invents numbers: every figure the dashboard shows is
 * produced by the code below from the simulated price series.
 */

import { DEFAULT_BACKTEST_CONFIG, buyAndHoldWeights, momentumWeights, runBacktest, type BacktestConfig, type BacktestResult } from "./backtest";
import { SyntheticDataProvider, type MarketDataProvider } from "./data";
import { buildFeatures, FEATURE_VERSION, forwardReturns } from "./features";
import { logReturns } from "./math";
import { classificationMetrics, regressionMetrics, type ClassificationMetrics, type RegressionMetrics } from "./metrics";
import { LogisticRegressionModel, permutationImportance, RidgeRegression } from "./models";
import { DEFAULT_CONSTRAINTS, optimise, type OptimisationResult } from "./portfolio";
import { buildRiskReport, correlationMatrix, type RiskReport } from "./risk";
import { experimentStore, modelRegistry, type ExperimentRecord, type ModelRecord } from "./registry";
import { DEFAULT_SIGNAL_CONFIG, generateSignals, signalToTargetWeight, type SignalConfig } from "./signals";
import { TimeSeriesSplitter, slice } from "./split";
import type { FeatureMatrix, PriceSeries, Signal, ValidationReport } from "./types";
import { assertValid, cleanSeries, validateSeries } from "./validation";

export interface PipelineConfig {
  symbol: string;
  bars: number;
  /** Label horizon in bars; also the embargo width. */
  horizon: number;
  trainFraction: number;
  validationFraction: number;
  ridgeLambda: number;
  signal: SignalConfig;
  backtest: BacktestConfig;
  seed: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  symbol: "SYN-EQ",
  bars: 1800,
  horizon: 1,
  trainFraction: 0.6,
  validationFraction: 0.2,
  ridgeLambda: 5,
  signal: DEFAULT_SIGNAL_CONFIG,
  backtest: DEFAULT_BACKTEST_CONFIG,
  seed: 20260101,
};

export interface UniverseAsset {
  symbol: string;
  name: string;
  assetClass: string;
  lastClose: number;
  dailyReturn: number;
  annualVol: number;
  series: PriceSeries;
  returns: number[];
}

export interface ExperimentOutput {
  experimentId: string;
  provider: { id: string; label: string; isSynthetic: boolean };
  config: PipelineConfig;
  series: PriceSeries;
  validation: ValidationReport;
  features: FeatureMatrix;
  droppedRows: number;
  split: { train: [string, string]; validation: [string, string]; test: [string, string]; counts: [number, number, number] };
  regression: { validation: RegressionMetrics; test: RegressionMetrics };
  classification: { validation: ClassificationMetrics; test: ClassificationMetrics };
  coefficientImportance: { feature: string; importance: number }[];
  permutationImportance: { feature: string; importance: number }[];
  walkForward: { fold: number; trainEnd: string; testStart: string; testEnd: string; rmse: number; directionalAccuracy: number; sharpe: number }[];
  signals: Signal[];
  predictions: { timestamp: string; prediction: number; confidence: number; realised: number }[];
  strategy: BacktestResult;
  baselines: { name: string; result: BacktestResult }[];
  risk: RiskReport;
  universe: UniverseAsset[];
  correlation: { symbols: string[]; matrix: number[][] };
  optimisations: OptimisationResult[];
  model: ModelRecord;
  experiment: ExperimentRecord;
}

export function runExperiment(
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG,
  provider: MarketDataProvider = new SyntheticDataProvider(config.seed),
): ExperimentOutput {
  // 1-2. Ingest, validate, clean.
  const raw = provider.getHistoricalPrices(config.symbol, config.bars);
  const series = cleanSeries(raw);
  const validation = validateSeries(series);
  assertValid(validation);
  const bars = series.bars;
  const datasetVersion = `${provider.id}:${config.symbol}:${bars.length}b:${bars[0]?.timestamp}->${bars[bars.length - 1]?.timestamp}`;

  // 3-4. Features and forward label.
  const { matrix, droppedRows } = buildFeatures(bars);
  const labels = forwardReturns(bars, matrix.timestamps, config.horizon);
  const usable = labels.map((v, i) => ({ v, i })).filter((r) => Number.isFinite(r.v)).map((r) => r.i);
  const X = usable.map((i) => matrix.rows[i]!);
  const y = usable.map((i) => labels[i]!);
  const timestamps = usable.map((i) => matrix.timestamps[i]!);
  const featureNames = matrix.specs.map((s) => s.name);

  // 5. Chronological split with embargo.
  const splitter = new TimeSeriesSplitter({
    trainFraction: config.trainFraction,
    validationFraction: config.validationFraction,
    embargo: config.horizon,
  });
  const ranges = splitter.split(X.length);

  const Xtrain = slice(X, ranges.train);
  const ytrain = slice(y, ranges.train);
  const Xval = slice(X, ranges.validation);
  const yval = slice(y, ranges.validation);
  const Xtest = slice(X, ranges.test);
  const ytest = slice(y, ranges.test);
  const tsTest = slice(timestamps, ranges.test);

  // 6. Fit on train only.
  const ridge = new RidgeRegression(config.ridgeLambda);
  ridge.fit(Xtrain, ytrain, featureNames);
  const logit = new LogisticRegressionModel();
  logit.fit(Xtrain, ytrain.map((v) => (v > 0 ? 1 : 0)), featureNames);

  const valPred = ridge.predict(Xval);
  const testPred = ridge.predict(Xtest);
  const valProba = logit.predictProba(Xval);
  const testProba = logit.predictProba(Xtest);

  const regression = {
    validation: regressionMetrics(valPred, yval),
    test: regressionMetrics(testPred, ytest),
  };
  const classification = {
    validation: classificationMetrics(valProba, yval.map((v) => (v > 0 ? 1 : 0))),
    test: classificationMetrics(testProba, ytest.map((v) => (v > 0 ? 1 : 0))),
  };

  // Walk-forward validation (expanding window, refit each fold).
  const folds = splitter.walkForward(X.length, 5);
  const walkForward = folds.map((f, k) => {
    const m = new RidgeRegression(config.ridgeLambda);
    m.fit(slice(X, f.train), slice(y, f.train), featureNames);
    const pred = m.predict(slice(X, f.test));
    const actual = slice(y, f.test);
    const reg = regressionMetrics(pred, actual);
    const foldTs = slice(timestamps, f.test);
    const foldSignals = generateSignals(
      foldTs,
      config.symbol,
      pred,
      logit.predictProba(slice(X, f.test)),
      ridge.version,
      config.signal,
    );
    const bt = runBacktest(bars, foldSignals.map((s) => ({ timestamp: s.timestamp, weight: signalToTargetWeight(s.signal) })), config.backtest);
    return {
      fold: k + 1,
      trainEnd: timestamps[f.train[1] - 1] ?? "n/a",
      testStart: foldTs[0] ?? "n/a",
      testEnd: foldTs[foldTs.length - 1] ?? "n/a",
      rmse: reg.rmse,
      directionalAccuracy: reg.directionalAccuracy,
      sharpe: bt.metrics.sharpe,
    };
  });

  // 7. Signals and execution on the held-out test segment only.
  const signals = generateSignals(tsTest, config.symbol, testPred, testProba, ridge.version, config.signal);
  const strategy = runBacktest(
    bars,
    signals.map((s) => ({ timestamp: s.timestamp, weight: signalToTargetWeight(s.signal) })),
    config.backtest,
  );

  // 8. Baselines over the identical window.
  const baselines = [
    { name: "Buy & Hold", result: runBacktest(bars, buyAndHoldWeights(tsTest), config.backtest) },
    { name: "Momentum (63d)", result: runBacktest(bars, momentumWeights(bars, tsTest, 63), config.backtest) },
  ];

  const risk = buildRiskReport({
    returns: strategy.points.map((p) => p.ret),
    equity: strategy.points.map((p) => p.equity),
    timestamps: strategy.points.map((p) => p.timestamp),
    benchmarkReturns: baselines[0]!.result.points.map((p) => p.ret),
    weights: [1],
    averageGrossExposure:
      strategy.points.reduce((a, p) => a + Math.abs(p.weight), 0) / Math.max(1, strategy.points.length),
    annualTurnover: strategy.metrics.turnover,
  });

  // Cross-sectional universe for portfolio optimisation and correlations.
  const universe: UniverseAsset[] = provider.getAssetMetadata().map((meta) => {
    const s = cleanSeries(provider.getHistoricalPrices(meta.symbol, config.bars));
    const closes = s.bars.map((b) => b.adjClose);
    const rets = logReturns(closes);
    const last = closes[closes.length - 1]!;
    const prev = closes[closes.length - 2] ?? last;
    return {
      symbol: meta.symbol,
      name: meta.name,
      assetClass: meta.assetClass,
      lastClose: last,
      dailyReturn: last / prev - 1,
      annualVol: Math.sqrt(252) * stdev(rets),
      series: s,
      returns: rets,
    };
  });

  const returnSeries = universe.map((u) => u.returns.slice(-Math.min(...universe.map((v) => v.returns.length))));
  const optInput = { symbols: universe.map((u) => u.symbol), returnSeries, constraints: DEFAULT_CONSTRAINTS };
  const optimisations: OptimisationResult[] = [
    optimise("equal_weight", optInput),
    optimise("min_variance", optInput),
    optimise("max_sharpe", optInput),
    optimise("risk_aware", optInput),
  ];

  const hyperparameters: Record<string, number | string | boolean> = {
    ridgeLambda: config.ridgeLambda,
    horizon: config.horizon,
    upperThreshold: config.signal.upperThreshold,
    lowerThreshold: config.signal.lowerThreshold,
    minConfidence: config.signal.minConfidence,
    allowShort: config.signal.allowShort,
    features: featureNames.length,
    seed: config.seed,
  };

  const model = modelRegistry.registerModel({
    name: ridge.name,
    version: ridge.version,
    kind: "regression",
    featureVersion: FEATURE_VERSION,
    datasetVersion,
    hyperparameters,
    metrics: { test_rmse: regression.test.rmse, test_r2: regression.test.r2, test_dir_acc: regression.test.directionalAccuracy },
    artifact: ridge.serialise(),
  });

  const experimentId = `exp-${config.symbol.toLowerCase()}-h${config.horizon}-s${config.seed}`;
  const experiment = experimentStore.save({
    experimentId,
    modelName: ridge.name,
    modelVersion: ridge.version,
    datasetVersion,
    featureVersion: FEATURE_VERSION,
    hyperparameters,
    trainingPeriod: [timestamps[ranges.train[0]] ?? "n/a", timestamps[ranges.train[1] - 1] ?? "n/a"],
    validationPeriod: [timestamps[ranges.validation[0]] ?? "n/a", timestamps[ranges.validation[1] - 1] ?? "n/a"],
    testPeriod: [timestamps[ranges.test[0]] ?? "n/a", timestamps[ranges.test[1] - 1] ?? "n/a"],
    metrics: {
      test_rmse: regression.test.rmse,
      test_r2: regression.test.r2,
      test_roc_auc: classification.test.rocAuc,
      strategy_sharpe: strategy.metrics.sharpe,
      strategy_return: strategy.metrics.cumulativeReturn,
      strategy_max_drawdown: strategy.metrics.maxDrawdown,
    },
    seed: config.seed,
    createdAt: new Date().toISOString(),
  });

  return {
    experimentId,
    provider: { id: provider.id, label: provider.label, isSynthetic: provider.isSynthetic },
    config,
    series,
    validation,
    features: matrix,
    droppedRows,
    split: {
      train: [timestamps[ranges.train[0]] ?? "n/a", timestamps[ranges.train[1] - 1] ?? "n/a"],
      validation: [timestamps[ranges.validation[0]] ?? "n/a", timestamps[ranges.validation[1] - 1] ?? "n/a"],
      test: [timestamps[ranges.test[0]] ?? "n/a", timestamps[ranges.test[1] - 1] ?? "n/a"],
      counts: [Xtrain.length, Xval.length, Xtest.length],
    },
    regression,
    classification,
    coefficientImportance: ridge.featureImportance(),
    permutationImportance: permutationImportance(ridge, Xtest, ytest, featureNames),
    walkForward,
    signals,
    predictions: tsTest.map((timestamp, i) => ({
      timestamp,
      prediction: testPred[i]!,
      confidence: testProba[i]!,
      realised: ytest[i]!,
    })),
    strategy,
    baselines,
    risk,
    universe,
    correlation: { symbols: universe.map((u) => u.symbol), matrix: correlationMatrix(returnSeries) },
    optimisations,
    model,
    experiment,
  };
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}
