/**
 * Machine-learning engine.
 *
 * Models are implemented from first principles so that training is fully
 * deterministic, inspectable, and dependency-free. They are deliberately
 * simple and interpretable: ridge regression and regularised logistic
 * regression. Nothing here is presented as state of the art.
 *
 * All models standardise inputs using statistics computed on the TRAINING
 * fold only, which is a leakage guard.
 */

import { mean, stdDev } from "./math";

export class ModelTrainingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelTrainingError";
  }
}

export interface TrainedStats {
  featureNames: string[];
  means: number[];
  stds: number[];
  coefficients: number[];
  intercept: number;
  iterations: number;
}

export interface QuantModel {
  readonly name: string;
  readonly kind: "regression" | "classification";
  readonly version: string;
  fit(X: number[][], y: number[], featureNames: string[]): void;
  predict(X: number[][]): number[];
  /** Only meaningful for classifiers; regressors return a mapped confidence. */
  predictProba(X: number[][]): number[];
  serialise(): TrainedStats;
  load(stats: TrainedStats): void;
  /** |standardised coefficient|, normalised to sum to 1. */
  featureImportance(): { feature: string; importance: number }[];
}

function standardise(X: number[][]): { means: number[]; stds: number[] } {
  const p = X[0]?.length ?? 0;
  const means: number[] = [];
  const stds: number[] = [];
  for (let j = 0; j < p; j++) {
    const col = X.map((r) => r[j]!);
    const m = mean(col);
    const s = stdDev(col) || 1;
    means.push(m);
    stds.push(s);
  }
  return { means, stds };
}

function applyScaling(X: number[][], means: number[], stds: number[]): number[][] {
  return X.map((r) => r.map((v, j) => (v - means[j]!) / stds[j]!));
}

/** Solves (A + lambda I) w = b by Gaussian elimination with partial pivoting. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r]![col]!) > Math.abs(M[pivot]![col]!)) pivot = r;
    }
    if (Math.abs(M[pivot]![col]!) < 1e-12) continue;
    [M[col], M[pivot]] = [M[pivot]!, M[col]!];
    const pv = M[col]![col]!;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r]![col]! / pv;
      if (!factor) continue;
      for (let c = col; c <= n; c++) M[r]![c]! -= factor * M[col]![c]!;
    }
  }
  return Array.from({ length: n }, (_, i) => {
    const d = M[i]![i]!;
    return Math.abs(d) < 1e-12 ? 0 : M[i]![n]! / d;
  });
}

/** Ridge (L2-regularised) linear regression, solved in closed form. */
export class RidgeRegression implements QuantModel {
  readonly kind = "regression" as const;
  readonly name: string;
  private stats: TrainedStats | null = null;

  constructor(private readonly lambda = 1.0, readonly version = "ridge-v1", name = "Ridge Regression") {
    this.name = name;
  }

  fit(X: number[][], y: number[], featureNames: string[]): void {
    if (X.length !== y.length || X.length === 0) throw new ModelTrainingError("X and y must be non-empty and aligned");
    const { means, stds } = standardise(X);
    const Z = applyScaling(X, means, stds);
    const p = featureNames.length;
    const yMean = mean(y);

    const A: number[][] = Array.from({ length: p }, () => new Array<number>(p).fill(0));
    const b = new Array<number>(p).fill(0);
    for (const [i, row] of Z.entries()) {
      const yc = y[i]! - yMean;
      for (let j = 0; j < p; j++) {
        b[j]! += row[j]! * yc;
        for (let k = j; k < p; k++) {
          const v = row[j]! * row[k]!;
          A[j]![k]! += v;
          if (k !== j) A[k]![j]! += v;
        }
      }
    }
    for (let j = 0; j < p; j++) A[j]![j]! += this.lambda;

    const coefficients = solveLinearSystem(A, b);
    this.stats = { featureNames, means, stds, coefficients, intercept: yMean, iterations: 1 };
  }

  predict(X: number[][]): number[] {
    const s = this.requireStats();
    return X.map((row) =>
      row.reduce((acc, v, j) => acc + ((v - s.means[j]!) / s.stds[j]!) * s.coefficients[j]!, s.intercept),
    );
  }

  /** Confidence proxy: predicted magnitude relative to in-sample dispersion. */
  predictProba(X: number[][]): number[] {
    const preds = this.predict(X);
    const scale = stdDev(preds) || 1;
    return preds.map((p) => 1 / (1 + Math.exp(-p / scale)));
  }

  serialise(): TrainedStats {
    return this.requireStats();
  }

  load(stats: TrainedStats): void {
    this.stats = stats;
  }

  featureImportance(): { feature: string; importance: number }[] {
    return normaliseImportance(this.requireStats());
  }

  private requireStats(): TrainedStats {
    if (!this.stats) throw new ModelTrainingError(`${this.name} has not been fitted`);
    return this.stats;
  }
}

/** L2-regularised logistic regression trained by full-batch gradient descent. */
export class LogisticRegressionModel implements QuantModel {
  readonly kind = "classification" as const;
  readonly name = "Logistic Regression";
  private stats: TrainedStats | null = null;

  constructor(
    private readonly lambda = 0.5,
    private readonly learningRate = 0.35,
    private readonly maxIterations = 600,
    readonly version = "logit-v1",
  ) {}

  fit(X: number[][], y: number[], featureNames: string[]): void {
    if (X.length === 0) throw new ModelTrainingError("Empty training set");
    if (!y.every((v) => v === 0 || v === 1)) throw new ModelTrainingError("Labels must be 0 or 1");
    const { means, stds } = standardise(X);
    const Z = applyScaling(X, means, stds);
    const p = featureNames.length;
    const w = new Array<number>(p).fill(0);
    let b = 0;
    const n = Z.length;
    let iterations = 0;

    for (let it = 0; it < this.maxIterations; it++) {
      const gradW = new Array<number>(p).fill(0);
      let gradB = 0;
      for (let i = 0; i < n; i++) {
        const row = Z[i]!;
        let z = b;
        for (let j = 0; j < p; j++) z += w[j]! * row[j]!;
        const err = 1 / (1 + Math.exp(-z)) - y[i]!;
        gradB += err;
        for (let j = 0; j < p; j++) gradW[j]! += err * row[j]!;
      }
      let maxStep = 0;
      for (let j = 0; j < p; j++) {
        const step = (this.learningRate * (gradW[j]! / n + (this.lambda * w[j]!) / n));
        w[j]! -= step;
        maxStep = Math.max(maxStep, Math.abs(step));
      }
      b -= this.learningRate * (gradB / n);
      iterations = it + 1;
      if (maxStep < 1e-7) break;
    }

    this.stats = { featureNames, means, stds, coefficients: w, intercept: b, iterations };
  }

  predictProba(X: number[][]): number[] {
    const s = this.requireStats();
    return X.map((row) => {
      const z = row.reduce((acc, v, j) => acc + ((v - s.means[j]!) / s.stds[j]!) * s.coefficients[j]!, s.intercept);
      return 1 / (1 + Math.exp(-z));
    });
  }

  /** Class label at the 0.5 threshold. */
  predict(X: number[][]): number[] {
    return this.predictProba(X).map((p) => (p >= 0.5 ? 1 : 0));
  }

  serialise(): TrainedStats {
    return this.requireStats();
  }

  load(stats: TrainedStats): void {
    this.stats = stats;
  }

  featureImportance(): { feature: string; importance: number }[] {
    return normaliseImportance(this.requireStats());
  }

  private requireStats(): TrainedStats {
    if (!this.stats) throw new ModelTrainingError("Logistic Regression has not been fitted");
    return this.stats;
  }
}

function normaliseImportance(stats: TrainedStats): { feature: string; importance: number }[] {
  const abs = stats.coefficients.map(Math.abs);
  const total = abs.reduce((a, b) => a + b, 0) || 1;
  return stats.featureNames
    .map((feature, j) => ({ feature, importance: abs[j]! / total }))
    .sort((a, b) => b.importance - a.importance);
}

/**
 * Permutation importance: the degradation in out-of-sample RMSE when a single
 * feature column is shuffled. This measures predictive dependence, NOT
 * causation.
 */
export function permutationImportance(
  model: QuantModel,
  X: number[][],
  y: number[],
  featureNames: string[],
  seedShift = 1,
): { feature: string; importance: number }[] {
  const baseline = rmse(model.predict(X), y);
  const out = featureNames.map((feature, j) => {
    const permuted = X.map((r) => [...r]);
    // Deterministic reversal-based permutation (no RNG needed, repeatable).
    for (let i = 0; i < permuted.length; i++) {
      const src = (permuted.length - 1 - i + seedShift) % permuted.length;
      permuted[i]![j] = X[src]![j]!;
    }
    const degraded = rmse(model.predict(permuted), y);
    return { feature, importance: Math.max(0, degraded - baseline) };
  });
  const total = out.reduce((a, b) => a + b.importance, 0) || 1;
  return out.map((o) => ({ ...o, importance: o.importance / total })).sort((a, b) => b.importance - a.importance);
}

function rmse(pred: number[], actual: number[]): number {
  const n = Math.min(pred.length, actual.length);
  if (!n) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) s += (pred[i]! - actual[i]!) ** 2;
  return Math.sqrt(s / n);
}
