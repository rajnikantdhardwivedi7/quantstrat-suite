/**
 * Portfolio optimisation.
 *
 * Solved with projected gradient descent onto the feasible set
 * {sum w = 1, minWeight <= w_i <= maxWeight}. This is deterministic and
 * dependency-free. For the convex problems here (minimum variance and
 * mean-variance with a risk-aversion term) projected gradient descent
 * converges to the global optimum; the max-Sharpe variant is solved by
 * scanning the risk-aversion parameter, which is an approximation.
 *
 * All expected returns below are ESTIMATES from historical sample means.
 * Sample means are noisy estimators of expected return, so optimiser output
 * should be read as a modelling exercise, not an allocation recommendation.
 */

import { covarianceMatrix, mean, TRADING_DAYS } from "./math";

export interface OptimisationConstraints {
  longOnly: boolean;
  maxWeight: number;
  minWeight: number;
}

export const DEFAULT_CONSTRAINTS: OptimisationConstraints = {
  longOnly: true,
  maxWeight: 0.4,
  minWeight: 0,
};

export type ObjectiveName = "equal_weight" | "min_variance" | "max_sharpe" | "risk_aware";

export interface OptimisationResult {
  objective: ObjectiveName;
  symbols: string[];
  weights: number[];
  /** Annualised, from sample means. Estimated, not realised. */
  expectedReturn: number;
  /** Annualised, from the sample covariance matrix. */
  expectedVolatility: number;
  expectedSharpe: number;
  objectiveValue: number;
  iterations: number;
  constraints: OptimisationConstraints;
}

export function portfolioReturn(weights: number[], expectedReturns: number[]): number {
  return weights.reduce((a, w, i) => a + w * expectedReturns[i]!, 0);
}

export function portfolioVolatility(weights: number[], cov: number[][]): number {
  let v = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) v += weights[i]! * weights[j]! * cov[i]![j]!;
  }
  return Math.sqrt(Math.max(0, v));
}

export function portfolioSharpe(weights: number[], expectedReturns: number[], cov: number[][], riskFree = 0): number {
  const vol = portfolioVolatility(weights, cov);
  return vol ? (portfolioReturn(weights, expectedReturns) - riskFree) / vol : NaN;
}

/** Realised drawdown of a fixed-weight portfolio over the sample. */
export function portfolioDrawdown(weights: number[], returnSeries: number[][]): number {
  const n = Math.min(...returnSeries.map((r) => r.length));
  let equity = 1;
  let peak = 1;
  let mdd = 0;
  for (let t = 0; t < n; t++) {
    const r = returnSeries.reduce((a, series, i) => a + weights[i]! * series[t]!, 0);
    equity *= 1 + r;
    peak = Math.max(peak, equity);
    mdd = Math.min(mdd, equity / peak - 1);
  }
  return mdd;
}

/** Projects w onto {sum w = 1, lo <= w_i <= hi} by bisection on the shift. */
function projectToSimplexBox(w: number[], lo: number, hi: number): number[] {
  if (lo * w.length > 1 || hi * w.length < 1) {
    throw new Error("Weight bounds are infeasible: cannot sum to 1.");
  }
  let low = -10;
  let high = 10;
  for (let it = 0; it < 200; it++) {
    const mid = (low + high) / 2;
    const sum = w.reduce((a, x) => a + Math.min(hi, Math.max(lo, x + mid)), 0);
    if (sum > 1) high = mid;
    else low = mid;
  }
  const shift = (low + high) / 2;
  return w.map((x) => Math.min(hi, Math.max(lo, x + shift)));
}

/**
 * Minimises  w'Σw * riskAversion − w'μ  subject to the box/simplex set.
 * riskAversion -> large gives minimum variance.
 */
function solveMeanVariance(
  expectedReturns: number[],
  cov: number[][],
  riskAversion: number,
  constraints: OptimisationConstraints,
): { weights: number[]; iterations: number } {
  const n = expectedReturns.length;
  const lo = constraints.longOnly ? Math.max(0, constraints.minWeight) : constraints.minWeight;
  const hi = constraints.maxWeight;
  let w = projectToSimplexBox(new Array<number>(n).fill(1 / n), lo, hi);

  const scale = Math.max(...cov.map((row, i) => Math.abs(row[i]!))) || 1;
  const step = 0.5 / (riskAversion * scale + 1);
  let iterations = 0;

  for (let it = 0; it < 4000; it++) {
    const grad = w.map((_, i) => {
      let g = 0;
      for (let j = 0; j < n; j++) g += 2 * riskAversion * cov[i]![j]! * w[j]!;
      return g - expectedReturns[i]!;
    });
    const next = projectToSimplexBox(w.map((x, i) => x - step * grad[i]!), lo, hi);
    const move = Math.max(...next.map((x, i) => Math.abs(x - w[i]!)));
    w = next;
    iterations = it + 1;
    if (move < 1e-10) break;
  }
  return { weights: w, iterations };
}

export interface OptimiseInput {
  symbols: string[];
  /** Daily return series per symbol, aligned. */
  returnSeries: number[][];
  constraints?: OptimisationConstraints;
  riskFreeAnnual?: number;
}

export function optimise(objective: ObjectiveName, input: OptimiseInput): OptimisationResult {
  const constraints = input.constraints ?? DEFAULT_CONSTRAINTS;
  const { symbols, returnSeries } = input;
  const n = symbols.length;
  const muDaily = returnSeries.map((r) => mean(r));
  const covDaily = covarianceMatrix(returnSeries);
  const muAnnual = muDaily.map((m) => m * TRADING_DAYS);
  const covAnnual = covDaily.map((row) => row.map((v) => v * TRADING_DAYS));
  const riskFree = input.riskFreeAnnual ?? 0;

  let weights: number[];
  let iterations = 0;

  if (objective === "equal_weight") {
    weights = new Array<number>(n).fill(1 / n);
  } else if (objective === "min_variance") {
    const r = solveMeanVariance(new Array<number>(n).fill(0), covAnnual, 1, constraints);
    weights = r.weights;
    iterations = r.iterations;
  } else if (objective === "risk_aware") {
    const r = solveMeanVariance(muAnnual, covAnnual, 8, constraints);
    weights = r.weights;
    iterations = r.iterations;
  } else {
    // Max Sharpe: scan risk aversion and keep the best feasible Sharpe.
    let best: { weights: number[]; sharpe: number } | null = null;
    for (const lambda of [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64]) {
      const r = solveMeanVariance(muAnnual, covAnnual, lambda, constraints);
      iterations += r.iterations;
      const s = portfolioSharpe(r.weights, muAnnual, covAnnual, riskFree);
      if (!best || (Number.isFinite(s) && s > best.sharpe)) best = { weights: r.weights, sharpe: s };
    }
    weights = best!.weights;
  }

  const expectedReturn = portfolioReturn(weights, muAnnual);
  const expectedVolatility = portfolioVolatility(weights, covAnnual);
  const expectedSharpe = expectedVolatility ? (expectedReturn - riskFree) / expectedVolatility : NaN;

  return {
    objective,
    symbols,
    weights,
    expectedReturn,
    expectedVolatility,
    expectedSharpe,
    objectiveValue: objective === "min_variance" ? expectedVolatility ** 2 : expectedSharpe,
    iterations,
    constraints,
  };
}
