/** Presentation-layer formatters. Never rounds silently in the engine. */

export const fmtPct = (v: number, digits = 2): string =>
  Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : "n/a";

export const fmtNum = (v: number, digits = 2): string => (Number.isFinite(v) ? v.toFixed(digits) : "n/a");

export const fmtBps = (v: number): string => (Number.isFinite(v) ? `${(v * 10000).toFixed(1)} bps` : "n/a");

export const fmtMoney = (v: number): string =>
  Number.isFinite(v)
    ? v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "n/a";

export const fmtInt = (v: number): string => (Number.isFinite(v) ? Math.round(v).toLocaleString("en-US") : "n/a");

export const signClass = (v: number): string =>
  !Number.isFinite(v) || v === 0 ? "text-muted-foreground" : v > 0 ? "text-positive" : "text-negative";

export const NOT_MEASURED = "Not yet measured";
