/** Core domain types shared across every STRATUM layer. */

export type DataOrigin = "synthetic" | "csv" | "external";

export interface Bar {
  /** ISO date (UTC, calendar day). */
  timestamp: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Adjusted close. Equal to close for synthetic data (no corporate actions). */
  adjClose: number;
  volume: number;
}

export interface AssetMetadata {
  symbol: string;
  name: string;
  assetClass: string;
  currency: string;
  origin: DataOrigin;
}

export interface PriceSeries {
  metadata: AssetMetadata;
  bars: Bar[];
}

export interface ValidationIssue {
  code:
    | "missing_value"
    | "duplicate_timestamp"
    | "invalid_ohlc"
    | "non_monotonic_timestamp"
    | "extreme_move"
    | "non_positive_price";
  severity: "error" | "warning";
  message: string;
  count: number;
}

export interface ValidationReport {
  symbol: string;
  rows: number;
  periodStart: string;
  periodEnd: string;
  issues: ValidationIssue[];
  passed: boolean;
}

export interface FeatureSpec {
  name: string;
  /** Number of past observations required, including t. */
  lookback: number;
  sourceColumns: string[];
  group: "price" | "volatility" | "trend" | "volume" | "statistical" | "technical";
  description: string;
}

export interface FeatureMatrix {
  version: string;
  createdAt: string;
  symbol: string;
  specs: FeatureSpec[];
  timestamps: string[];
  /** rows x specs.length, aligned to timestamps. */
  rows: number[][];
}

export type SignalLabel = "LONG" | "NEUTRAL" | "SHORT";

export interface Signal {
  timestamp: string;
  symbol: string;
  prediction: number;
  confidence: number;
  signal: SignalLabel;
  modelVersion: string;
}

export interface SplitRanges {
  train: [number, number];
  validation: [number, number];
  test: [number, number];
}
