/**
 * Feature engineering.
 *
 * CAUSALITY INVARIANT: the feature row at index t is computed only from bars
 * with index <= t. Every transform here is a trailing-window operation, and
 * the pipeline never shifts data backwards in time. Rows whose lookback
 * window is incomplete are dropped rather than back-filled.
 */

import { autocorrelation, kurtosis, mean, skewness, stdDev } from "./math";
import type { Bar, FeatureMatrix, FeatureSpec } from "./types";

export class FeatureGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureGenerationError";
  }
}

export const FEATURE_VERSION = "features-v1";

interface FeatureDefinition extends FeatureSpec {
  compute(bars: Bar[]) : number[];
}

const closes = (bars: Bar[]) => bars.map((b) => b.adjClose);
const volumes = (bars: Bar[]) => bars.map((b) => b.volume);

/** Trailing simple return over `n` periods at each index. */
function trailingReturn(xs: number[], n: number): number[] {
  return xs.map((x, i) => (i < n ? NaN : x / xs[i - n]! - 1));
}

function trailingWindow(xs: number[], window: number, fn: (w: number[]) => number): number[] {
  return xs.map((_, i) => (i + 1 < window ? NaN : fn(xs.slice(i + 1 - window, i + 1))));
}

function sma(xs: number[], window: number): number[] {
  return trailingWindow(xs, window, mean);
}

function ema(xs: number[], window: number): number[] {
  const alpha = 2 / (window + 1);
  const out: number[] = [];
  let prev = NaN;
  xs.forEach((x, i) => {
    if (i + 1 < window) {
      out.push(NaN);
      if (i + 1 === window - 1) prev = NaN;
      return;
    }
    if (!Number.isFinite(prev)) prev = mean(xs.slice(i + 1 - window, i + 1));
    else prev = alpha * x + (1 - alpha) * prev;
    out.push(prev);
  });
  return out;
}

function rsi(xs: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (i < window) {
      out.push(NaN);
      continue;
    }
    let gain = 0;
    let loss = 0;
    for (let j = i - window + 1; j <= i; j++) {
      const d = xs[j]! - xs[j - 1]!;
      if (d >= 0) gain += d;
      else loss -= d;
    }
    const rs = loss === 0 ? Infinity : gain / loss;
    out.push(loss === 0 ? 100 : 100 - 100 / (1 + rs));
  }
  return out;
}

function atr(bars: Bar[], window: number): number[] {
  const tr = bars.map((b, i) => {
    const prevClose = i === 0 ? b.close : bars[i - 1]!.close;
    return Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
  });
  return trailingWindow(tr, window, mean).map((v, i) => (Number.isFinite(v) ? v / bars[i]!.close : NaN));
}

/** Feature catalogue. Each entry declares its own lookback. */
export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    name: "ret_1d",
    lookback: 2,
    sourceColumns: ["adjClose"],
    group: "price",
    description: "Simple return over the previous bar.",
    compute: (b) => trailingReturn(closes(b), 1),
  },
  {
    name: "logret_1d",
    lookback: 2,
    sourceColumns: ["adjClose"],
    group: "price",
    description: "Log return over the previous bar.",
    compute: (b) => trailingReturn(closes(b), 1).map((r) => (Number.isFinite(r) ? Math.log1p(r) : NaN)),
  },
  {
    name: "ret_5d",
    lookback: 6,
    sourceColumns: ["adjClose"],
    group: "price",
    description: "Trailing 5-bar return.",
    compute: (b) => trailingReturn(closes(b), 5),
  },
  {
    name: "ret_21d",
    lookback: 22,
    sourceColumns: ["adjClose"],
    group: "price",
    description: "Trailing 21-bar return (roughly one month).",
    compute: (b) => trailingReturn(closes(b), 21),
  },
  {
    name: "momentum_63d",
    lookback: 64,
    sourceColumns: ["adjClose"],
    group: "trend",
    description: "Trailing 63-bar price momentum.",
    compute: (b) => trailingReturn(closes(b), 63),
  },
  {
    name: "sma_ratio_10_50",
    lookback: 50,
    sourceColumns: ["adjClose"],
    group: "trend",
    description: "10-bar SMA divided by 50-bar SMA, minus one.",
    compute: (b) => {
      const c = closes(b);
      const fast = sma(c, 10);
      const slow = sma(c, 50);
      return c.map((_, i) => (Number.isFinite(fast[i]!) && Number.isFinite(slow[i]!) && slow[i]! !== 0 ? fast[i]! / slow[i]! - 1 : NaN));
    },
  },
  {
    name: "price_vs_ema_20",
    lookback: 20,
    sourceColumns: ["adjClose"],
    group: "trend",
    description: "Close relative to its 20-bar EMA.",
    compute: (b) => {
      const c = closes(b);
      const e = ema(c, 20);
      return c.map((x, i) => (Number.isFinite(e[i]!) && e[i]! !== 0 ? x / e[i]! - 1 : NaN));
    },
  },
  {
    name: "vol_21d",
    lookback: 22,
    sourceColumns: ["adjClose"],
    group: "volatility",
    description: "Rolling 21-bar standard deviation of log returns.",
    compute: (b) => {
      const lr = trailingReturn(closes(b), 1).map((r) => (Number.isFinite(r) ? Math.log1p(r) : NaN));
      return lr.map((_, i) => (i < 21 ? NaN : stdDev(lr.slice(i - 20, i + 1))));
    },
  },
  {
    name: "vol_ratio_5_21",
    lookback: 22,
    sourceColumns: ["adjClose"],
    group: "volatility",
    description: "Short-horizon volatility relative to 21-bar volatility.",
    compute: (b) => {
      const lr = trailingReturn(closes(b), 1).map((r) => (Number.isFinite(r) ? Math.log1p(r) : NaN));
      return lr.map((_, i) => {
        if (i < 21) return NaN;
        const s = stdDev(lr.slice(i - 4, i + 1));
        const l = stdDev(lr.slice(i - 20, i + 1));
        return l ? s / l - 1 : NaN;
      });
    },
  },
  {
    name: "atr_14_pct",
    lookback: 15,
    sourceColumns: ["high", "low", "close"],
    group: "volatility",
    description: "14-bar average true range as a fraction of close.",
    compute: (b) => atr(b, 14),
  },
  {
    name: "volume_zscore_21d",
    lookback: 22,
    sourceColumns: ["volume"],
    group: "volume",
    description: "Volume z-score against its trailing 21-bar distribution.",
    compute: (b) => {
      const v = volumes(b);
      return v.map((x, i) => {
        if (i < 21) return NaN;
        const w = v.slice(i - 20, i + 1);
        const s = stdDev(w);
        return s ? (x - mean(w)) / s : 0;
      });
    },
  },
  {
    name: "volume_change_5d",
    lookback: 6,
    sourceColumns: ["volume"],
    group: "volume",
    description: "Volume relative to its 5-bar average.",
    compute: (b) => {
      const v = volumes(b);
      const avg = sma(v, 5);
      return v.map((x, i) => (Number.isFinite(avg[i]!) && avg[i]! !== 0 ? x / avg[i]! - 1 : NaN));
    },
  },
  {
    name: "skew_63d",
    lookback: 64,
    sourceColumns: ["adjClose"],
    group: "statistical",
    description: "Rolling 63-bar skewness of log returns.",
    compute: (b) => {
      const lr = trailingReturn(closes(b), 1).map((r) => (Number.isFinite(r) ? Math.log1p(r) : NaN));
      return lr.map((_, i) => (i < 63 ? NaN : skewness(lr.slice(i - 62, i + 1))));
    },
  },
  {
    name: "kurtosis_63d",
    lookback: 64,
    sourceColumns: ["adjClose"],
    group: "statistical",
    description: "Rolling 63-bar excess kurtosis of log returns.",
    compute: (b) => {
      const lr = trailingReturn(closes(b), 1).map((r) => (Number.isFinite(r) ? Math.log1p(r) : NaN));
      return lr.map((_, i) => (i < 63 ? NaN : kurtosis(lr.slice(i - 62, i + 1))));
    },
  },
  {
    name: "autocorr_1_21d",
    lookback: 23,
    sourceColumns: ["adjClose"],
    group: "statistical",
    description: "Lag-1 autocorrelation of log returns over 21 bars.",
    compute: (b) => {
      const lr = trailingReturn(closes(b), 1).map((r) => (Number.isFinite(r) ? Math.log1p(r) : NaN));
      return lr.map((_, i) => (i < 22 ? NaN : autocorrelation(lr.slice(i - 20, i + 1), 1)));
    },
  },
  {
    name: "rsi_14",
    lookback: 15,
    sourceColumns: ["adjClose"],
    group: "technical",
    description: "14-bar Relative Strength Index, rescaled to [-1, 1].",
    compute: (b) => rsi(closes(b), 14).map((v) => (Number.isFinite(v) ? v / 50 - 1 : NaN)),
  },
  {
    name: "macd_hist",
    lookback: 35,
    sourceColumns: ["adjClose"],
    group: "technical",
    description: "MACD histogram (12/26 EMA difference minus its 9-bar EMA), normalised by price.",
    compute: (b) => {
      const c = closes(b);
      const fast = ema(c, 12);
      const slow = ema(c, 26);
      const macd = c.map((_, i) => (Number.isFinite(fast[i]!) && Number.isFinite(slow[i]!) ? fast[i]! - slow[i]! : NaN));
      const startIdx = macd.findIndex(Number.isFinite);
      const valid = macd.slice(startIdx).map((v) => (Number.isFinite(v) ? v : 0));
      const signal = ema(valid, 9);
      return macd.map((v, i) => {
        const s = i >= startIdx ? signal[i - startIdx] : NaN;
        return Number.isFinite(v) && Number.isFinite(s!) ? (v - s!) / c[i]! : NaN;
      });
    },
  },
  {
    name: "bollinger_pct_b_20",
    lookback: 20,
    sourceColumns: ["adjClose"],
    group: "technical",
    description: "Position within 20-bar Bollinger Bands (2 sigma), centred at zero.",
    compute: (b) => {
      const c = closes(b);
      return c.map((x, i) => {
        if (i + 1 < 20) return NaN;
        const w = c.slice(i - 19, i + 1);
        const s = stdDev(w);
        return s ? (x - mean(w)) / (2 * s) : 0;
      });
    },
  },
];

export interface BuildFeaturesResult {
  matrix: FeatureMatrix;
  /** Rows dropped because their lookback window was incomplete. */
  droppedRows: number;
}

/** Builds the aligned feature matrix, dropping warm-up rows. */
export function buildFeatures(bars: Bar[], selected?: string[]): BuildFeaturesResult {
  const defs = selected ? FEATURE_DEFINITIONS.filter((d) => selected.includes(d.name)) : FEATURE_DEFINITIONS;
  if (defs.length === 0) throw new FeatureGenerationError("No features selected");
  const maxLookback = Math.max(...defs.map((d) => d.lookback));
  if (bars.length <= maxLookback + 5) {
    throw new FeatureGenerationError(`Need more than ${maxLookback + 5} bars to build features; got ${bars.length}`);
  }

  const columns = defs.map((d) => d.compute(bars));
  const timestamps: string[] = [];
  const rows: number[][] = [];

  for (let i = 0; i < bars.length; i++) {
    const row = columns.map((c) => c[i]!);
    if (row.every((v) => Number.isFinite(v))) {
      timestamps.push(bars[i]!.timestamp);
      rows.push(row);
    }
  }

  return {
    matrix: {
      version: FEATURE_VERSION,
      createdAt: new Date().toISOString(),
      symbol: bars[0]?.symbol ?? "unknown",
      specs: defs.map(({ name, lookback, sourceColumns, group, description }) => ({
        name,
        lookback,
        sourceColumns,
        group,
        description,
      })),
      timestamps,
      rows,
    },
    droppedRows: bars.length - rows.length,
  };
}

/**
 * Forward target: the return realised from t to t+horizon.
 * Used only as a training label and never as an input feature. Rows whose
 * forward window extends past the data end are marked NaN and excluded.
 */
export function forwardReturns(bars: Bar[], timestamps: string[], horizon: number): number[] {
  const index = new Map(bars.map((b, i) => [b.timestamp, i]));
  return timestamps.map((ts) => {
    const i = index.get(ts);
    if (i === undefined) return NaN;
    const j = i + horizon;
    if (j >= bars.length) return NaN;
    return bars[j]!.adjClose / bars[i]!.adjClose - 1;
  });
}

export function featureSpecs(): FeatureSpec[] {
  return FEATURE_DEFINITIONS.map(({ name, lookback, sourceColumns, group, description }) => ({
    name,
    lookback,
    sourceColumns,
    group,
    description,
  }));
}
