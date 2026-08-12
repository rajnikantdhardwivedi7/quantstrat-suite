/**
 * Data validation and cleaning.
 *
 * Validation runs before any feature is computed. Errors block the pipeline;
 * warnings are surfaced but do not.
 */

import type { Bar, PriceSeries, ValidationIssue, ValidationReport } from "./types";

export class DataValidationError extends Error {
  constructor(message: string, readonly report: ValidationReport) {
    super(message);
    this.name = "DataValidationError";
  }
}

export interface ValidationOptions {
  /** Absolute single-bar log-move above which a bar is flagged as extreme. */
  extremeMoveThreshold: number;
}

export function validateSeries(
  series: PriceSeries,
  options: ValidationOptions = { extremeMoveThreshold: 0.25 },
): ValidationReport {
  const bars = series.bars;
  const issues: ValidationIssue[] = [];

  const push = (
    code: ValidationIssue["code"],
    severity: ValidationIssue["severity"],
    message: string,
    count: number,
  ) => {
    if (count > 0) issues.push({ code, severity, message, count });
  };

  const seen = new Set<string>();
  let duplicates = 0;
  let nonMonotonic = 0;
  let missing = 0;
  let invalidOhlc = 0;
  let nonPositive = 0;
  let extreme = 0;

  bars.forEach((bar, i) => {
    if (seen.has(bar.timestamp)) duplicates++;
    seen.add(bar.timestamp);
    const prev = bars[i - 1];
    if (prev && prev.timestamp >= bar.timestamp) nonMonotonic++;
    const nums = [bar.open, bar.high, bar.low, bar.close, bar.adjClose, bar.volume];
    if (nums.some((n) => !Number.isFinite(n)) || !bar.timestamp) missing++;
    if (bar.high < Math.max(bar.open, bar.close) - 1e-9 || bar.low > Math.min(bar.open, bar.close) + 1e-9 || bar.high < bar.low) {
      invalidOhlc++;
    }
    if (bar.close <= 0 || bar.open <= 0) nonPositive++;
    if (prev && prev.close > 0 && bar.close > 0) {
      if (Math.abs(Math.log(bar.close / prev.close)) > options.extremeMoveThreshold) extreme++;
    }
  });

  push("duplicate_timestamp", "error", "Duplicate timestamps detected", duplicates);
  push("non_monotonic_timestamp", "error", "Timestamps are not strictly increasing", nonMonotonic);
  push("missing_value", "error", "Rows containing missing or non-finite values", missing);
  push("invalid_ohlc", "error", "Bars violating high >= max(open, close) >= min(open, close) >= low", invalidOhlc);
  push("non_positive_price", "error", "Non-positive prices", nonPositive);
  push(
    "extreme_move",
    "warning",
    `Bars with |log return| > ${(options.extremeMoveThreshold * 100).toFixed(0)}% (kept, but flagged)`,
    extreme,
  );

  return {
    symbol: series.metadata.symbol,
    rows: bars.length,
    periodStart: bars[0]?.timestamp ?? "n/a",
    periodEnd: bars[bars.length - 1]?.timestamp ?? "n/a",
    issues,
    passed: issues.every((i) => i.severity !== "error"),
  };
}

/**
 * Drops unusable rows: non-finite values, duplicate timestamps and
 * out-of-order bars. Nothing is imputed forward from the future.
 */
export function cleanSeries(series: PriceSeries): PriceSeries {
  const seen = new Set<string>();
  const bars: Bar[] = [];
  for (const bar of [...series.bars].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    if (seen.has(bar.timestamp)) continue;
    if (![bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite)) continue;
    if (bar.close <= 0) continue;
    seen.add(bar.timestamp);
    bars.push(bar);
  }
  return { ...series, bars };
}

export function assertValid(report: ValidationReport): void {
  if (!report.passed) {
    throw new DataValidationError(`Validation failed for ${report.symbol}`, report);
  }
}
