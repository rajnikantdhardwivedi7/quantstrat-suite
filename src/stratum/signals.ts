/**
 * Signal generation.
 *
 * A signal for timestamp t is derived exclusively from the model prediction
 * made with features available at t. Execution lag is applied later, in the
 * backtesting engine.
 */

import type { Signal, SignalLabel } from "./types";

export interface SignalConfig {
  /** Predicted return above which the strategy goes long. */
  upperThreshold: number;
  /** Predicted return below which the strategy goes short. */
  lowerThreshold: number;
  /** Minimum confidence to act; below this the signal is NEUTRAL. */
  minConfidence: number;
  allowShort: boolean;
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig = {
  upperThreshold: 0.0015,
  lowerThreshold: -0.0015,
  minConfidence: 0.5,
  allowShort: true,
};

export function generateSignals(
  timestamps: string[],
  symbol: string,
  predictions: number[],
  confidences: number[],
  modelVersion: string,
  config: SignalConfig = DEFAULT_SIGNAL_CONFIG,
): Signal[] {
  return timestamps.map((timestamp, i) => {
    const prediction = predictions[i] ?? NaN;
    const confidence = confidences[i] ?? 0.5;
    let signal: SignalLabel = "NEUTRAL";
    if (Number.isFinite(prediction) && confidence >= config.minConfidence) {
      if (prediction > config.upperThreshold) signal = "LONG";
      else if (prediction < config.lowerThreshold) signal = config.allowShort ? "SHORT" : "NEUTRAL";
    }
    return { timestamp, symbol, prediction, confidence, signal, modelVersion };
  });
}

export function signalToTargetWeight(signal: SignalLabel, grossExposure = 1): number {
  if (signal === "LONG") return grossExposure;
  if (signal === "SHORT") return -grossExposure;
  return 0;
}
