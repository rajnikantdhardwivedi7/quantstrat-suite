/**
 * Time-series validation.
 *
 * Random shuffled splitting is invalid for time-series prediction: it lets the
 * model learn from the future. Every split here is chronological, and an
 * embargo gap equal to the prediction horizon is removed between segments so
 * that overlapping forward-return labels cannot leak across the boundary.
 */

import type { SplitRanges } from "./types";

export interface SplitConfig {
  trainFraction: number;
  validationFraction: number;
  /** Bars removed between segments; should be >= label horizon. */
  embargo: number;
}

export class TimeSeriesSplitter {
  constructor(private readonly config: SplitConfig) {}

  /** Chronological train / validation / test ranges as [start, endExclusive). */
  split(n: number): SplitRanges {
    const { trainFraction, validationFraction, embargo } = this.config;
    const trainEnd = Math.floor(n * trainFraction);
    const valStart = trainEnd + embargo;
    const valEnd = Math.floor(n * (trainFraction + validationFraction));
    const testStart = valEnd + embargo;
    if (valStart >= valEnd || testStart >= n) {
      throw new Error("Split produces an empty segment; reduce the embargo or fractions.");
    }
    return { train: [0, trainEnd], validation: [valStart, valEnd], test: [testStart, n] };
  }

  /**
   * Expanding-window walk-forward folds. Each fold trains on everything up to
   * a cut point and tests on the following block, with an embargo between.
   */
  walkForward(n: number, folds: number): { train: [number, number]; test: [number, number] }[] {
    const { trainFraction, embargo } = this.config;
    const initialTrain = Math.floor(n * trainFraction);
    const remaining = n - initialTrain;
    const blockSize = Math.floor(remaining / folds);
    if (blockSize <= embargo + 5) {
      throw new Error("Not enough observations for the requested number of walk-forward folds.");
    }
    const out: { train: [number, number]; test: [number, number] }[] = [];
    for (let k = 0; k < folds; k++) {
      const trainEnd = initialTrain + k * blockSize;
      const testStart = trainEnd + embargo;
      const testEnd = k === folds - 1 ? n : trainEnd + blockSize;
      if (testStart >= testEnd) continue;
      out.push({ train: [0, trainEnd], test: [testStart, testEnd] });
    }
    return out;
  }
}

export function slice<T>(xs: T[], range: [number, number]): T[] {
  return xs.slice(range[0], range[1]);
}
