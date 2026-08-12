/**
 * Model and strategy evaluation.
 *
 * MODEL PERFORMANCE (how well predictions match realised returns) and
 * STRATEGY PERFORMANCE (what a traded portfolio actually did after costs) are
 * reported separately and must never be conflated.
 */

import { mean } from "./math";

export interface RegressionMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  /** Fraction of predictions with the correct sign; a directional sanity check. */
  directionalAccuracy: number;
  n: number;
}

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  n: number;
}

export function regressionMetrics(pred: number[], actual: number[]): RegressionMetrics {
  const n = Math.min(pred.length, actual.length);
  if (n === 0) return { mae: NaN, mse: NaN, rmse: NaN, r2: NaN, directionalAccuracy: NaN, n: 0 };
  let absSum = 0;
  let sqSum = 0;
  let correctSign = 0;
  const m = mean(actual.slice(0, n));
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const e = pred[i]! - actual[i]!;
    absSum += Math.abs(e);
    sqSum += e * e;
    ssTot += (actual[i]! - m) ** 2;
    if (Math.sign(pred[i]!) === Math.sign(actual[i]!)) correctSign++;
  }
  const mse = sqSum / n;
  return {
    mae: absSum / n,
    mse,
    rmse: Math.sqrt(mse),
    r2: ssTot === 0 ? NaN : 1 - sqSum / ssTot,
    directionalAccuracy: correctSign / n,
    n,
  };
}

export function classificationMetrics(proba: number[], labels: number[], threshold = 0.5): ClassificationMetrics {
  const n = Math.min(proba.length, labels.length);
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (let i = 0; i < n; i++) {
    const yhat = proba[i]! >= threshold ? 1 : 0;
    const y = labels[i]!;
    if (yhat === 1 && y === 1) tp++;
    else if (yhat === 1 && y === 0) fp++;
    else if (yhat === 0 && y === 0) tn++;
    else fn++;
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  return {
    accuracy: n === 0 ? NaN : (tp + tn) / n,
    precision,
    recall,
    f1: precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall),
    rocAuc: rocAuc(proba.slice(0, n), labels.slice(0, n)),
    confusion: { tp, fp, tn, fn },
    n,
  };
}

/** ROC-AUC via the rank-sum (Mann-Whitney U) identity, with tie handling. */
export function rocAuc(scores: number[], labels: number[]): number {
  const pairs = scores.map((s, i) => ({ s, y: labels[i]! })).sort((a, b) => a.s - b.s);
  const ranks = new Array<number>(pairs.length).fill(0);
  let i = 0;
  while (i < pairs.length) {
    let j = i;
    while (j + 1 < pairs.length && pairs[j + 1]!.s === pairs[i]!.s) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avgRank;
    i = j + 1;
  }
  const nPos = pairs.filter((p) => p.y === 1).length;
  const nNeg = pairs.length - nPos;
  if (nPos === 0 || nNeg === 0) return NaN;
  const rankSumPos = pairs.reduce((acc, p, idx) => acc + (p.y === 1 ? ranks[idx]! : 0), 0);
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}
