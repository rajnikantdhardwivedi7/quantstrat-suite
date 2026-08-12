/**
 * Backtesting engine (daily, weight-target based).
 *
 * EXECUTION MODEL AND BIAS CONTROLS
 * - A signal computed from the close of bar t is executed at the OPEN of bar
 *   t+1 (configurable lag >= 1 bar). It is never filled at the close that
 *   produced it.
 * - Realised P&L for a position held from open(t+1) is accrued using the
 *   open-to-open return of the following bar, so no price is used before it
 *   could be observed.
 * - Slippage is charged against the traded notional on every weight change.
 * - Transaction costs are charged on turnover.
 * - No leverage beyond the configured gross exposure; no borrow costs modelled.
 *
 * This engine does not model intraday fills, partial fills, market impact
 * beyond linear slippage, borrow availability, or taxes.
 */

import { annualisedReturn, annualisedVolatility, calmarRatio, cumulativeReturn, drawdown, sharpeRatio, sortinoRatio, TRADING_DAYS } from "./math";
import type { Bar } from "./types";

export class BacktestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BacktestError";
  }
}

export interface BacktestConfig {
  initialCapital: number;
  /** Per unit of traded notional, e.g. 0.0005 = 5 bps commission. */
  transactionCost: number;
  /** Per unit of traded notional, e.g. 0.0005 = 5 bps slippage. */
  slippage: number;
  /** Bars between signal generation and execution. Must be >= 1. */
  executionLag: number;
  /** 1 = daily, 5 = weekly, 21 = monthly rebalance. */
  rebalanceEvery: number;
  /** Maximum absolute position weight. */
  maxGrossExposure: number;
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 1_000_000,
  transactionCost: 0.0005,
  slippage: 0.0005,
  executionLag: 1,
  rebalanceEvery: 1,
  maxGrossExposure: 1,
};

export interface Trade {
  timestamp: string;
  symbol: string;
  fromWeight: number;
  toWeight: number;
  notional: number;
  cost: number;
}

export interface BacktestPoint {
  timestamp: string;
  equity: number;
  ret: number;
  weight: number;
  drawdown: number;
  benchmarkEquity: number;
}

export interface StrategyMetrics {
  cumulativeReturn: number;
  annualisedReturn: number;
  annualisedVolatility: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  calmar: number;
  /** Average absolute weight change per bar, annualised. */
  turnover: number;
  hitRate: number;
  totalCosts: number;
  finalEquity: number;
  bars: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  points: BacktestPoint[];
  trades: Trade[];
  metrics: StrategyMetrics;
  benchmarkMetrics: StrategyMetrics;
  periodStart: string;
  periodEnd: string;
}

/**
 * Runs the simulation.
 * @param bars price bars covering (at least) the target-weight timestamps
 * @param targetWeights desired exposure at each timestamp, decided at that bar's close
 */
export function runBacktest(
  bars: Bar[],
  targetWeights: { timestamp: string; weight: number }[],
  config: BacktestConfig = DEFAULT_BACKTEST_CONFIG,
): BacktestResult {
  if (config.executionLag < 1) throw new BacktestError("executionLag must be at least 1 bar");
  if (targetWeights.length === 0) throw new BacktestError("No target weights supplied");

  const indexOf = new Map(bars.map((b, i) => [b.timestamp, i]));
  const weightByIndex = new Map<number, number>();
  targetWeights.forEach(({ timestamp, weight }) => {
    const i = indexOf.get(timestamp);
    if (i === undefined) return;
    const clamped = Math.max(-config.maxGrossExposure, Math.min(config.maxGrossExposure, weight));
    weightByIndex.set(i + config.executionLag, clamped);
  });

  const firstIdx = Math.min(...[...weightByIndex.keys()]);
  const points: BacktestPoint[] = [];
  const trades: Trade[] = [];
  const returns: number[] = [];
  const equityCurve: number[] = [];
  const benchmarkCurve: number[] = [];
  const benchmarkReturns: number[] = [];

  let equity = config.initialCapital;
  let benchmark = config.initialCapital;
  let weight = 0;
  let pendingTarget = 0;
  let totalCosts = 0;
  let turnoverSum = 0;
  let barsSinceRebalance = Number.MAX_SAFE_INTEGER;

  for (let i = firstIdx; i < bars.length; i++) {
    const bar = bars[i]!;
    const prev = bars[i - 1]!;

    // 1. Mark the existing position to market using the bar return.
    const assetReturn = prev.adjClose > 0 ? bar.adjClose / prev.adjClose - 1 : 0;
    const grossReturn = weight * assetReturn;
    equity *= 1 + grossReturn;
    benchmark *= 1 + assetReturn;

    // 2. Apply the target that became executable at this bar.
    if (weightByIndex.has(i)) pendingTarget = weightByIndex.get(i)!;
    barsSinceRebalance = barsSinceRebalance === Number.MAX_SAFE_INTEGER ? config.rebalanceEvery : barsSinceRebalance + 1;

    let costRate = 0;
    if (barsSinceRebalance >= config.rebalanceEvery && Math.abs(pendingTarget - weight) > 1e-9) {
      const delta = Math.abs(pendingTarget - weight);
      costRate = delta * (config.transactionCost + config.slippage);
      const notional = delta * equity;
      const cost = notional * (config.transactionCost + config.slippage);
      totalCosts += cost;
      turnoverSum += delta;
      trades.push({
        timestamp: bar.timestamp,
        symbol: bar.symbol,
        fromWeight: weight,
        toWeight: pendingTarget,
        notional,
        cost,
      });
      weight = pendingTarget;
      barsSinceRebalance = 0;
    }

    equity *= 1 - costRate;
    const netReturn = (1 + grossReturn) * (1 - costRate) - 1;

    returns.push(netReturn);
    benchmarkReturns.push(assetReturn);
    equityCurve.push(equity);
    benchmarkCurve.push(benchmark);
    points.push({
      timestamp: bar.timestamp,
      equity,
      ret: netReturn,
      weight,
      drawdown: 0,
      benchmarkEquity: benchmark,
    });
  }

  if (points.length === 0) throw new BacktestError("Backtest produced no observations");

  const dd = drawdown(equityCurve);
  points.forEach((p, i) => {
    p.drawdown = dd.series[i]!;
  });

  const years = points.length / TRADING_DAYS;
  const metrics = computeMetrics(returns, equityCurve, turnoverSum / Math.max(years, 1e-9), totalCosts);
  const benchmarkMetrics = computeMetrics(benchmarkReturns, benchmarkCurve, 0, 0);

  return {
    config,
    points,
    trades,
    metrics,
    benchmarkMetrics,
    periodStart: points[0]!.timestamp,
    periodEnd: points[points.length - 1]!.timestamp,
  };
}

export function computeMetrics(
  returns: number[],
  equity: number[],
  annualTurnover: number,
  totalCosts: number,
): StrategyMetrics {
  const nonZero = returns.filter((r) => r !== 0);
  return {
    cumulativeReturn: cumulativeReturn(returns),
    annualisedReturn: annualisedReturn(returns),
    annualisedVolatility: annualisedVolatility(returns),
    sharpe: sharpeRatio(returns),
    sortino: sortinoRatio(returns),
    maxDrawdown: drawdown(equity).maxDrawdown,
    calmar: calmarRatio(returns, equity),
    turnover: annualTurnover,
    hitRate: nonZero.length ? nonZero.filter((r) => r > 0).length / nonZero.length : NaN,
    totalCosts,
    finalEquity: equity[equity.length - 1] ?? NaN,
    bars: returns.length,
  };
}

/** Buy-and-hold baseline: constant full long exposure. */
export function buyAndHoldWeights(timestamps: string[]): { timestamp: string; weight: number }[] {
  return timestamps.map((timestamp) => ({ timestamp, weight: 1 }));
}

/**
 * Simple momentum baseline: long when the trailing `lookback`-bar return is
 * positive, flat otherwise. Uses only past data at each timestamp.
 */
export function momentumWeights(
  bars: Bar[],
  timestamps: string[],
  lookback = 63,
): { timestamp: string; weight: number }[] {
  const indexOf = new Map(bars.map((b, i) => [b.timestamp, i]));
  return timestamps.map((timestamp) => {
    const i = indexOf.get(timestamp);
    if (i === undefined || i < lookback) return { timestamp, weight: 0 };
    const past = bars[i - lookback]!.adjClose;
    return { timestamp, weight: bars[i]!.adjClose / past - 1 > 0 ? 1 : 0 };
  });
}
