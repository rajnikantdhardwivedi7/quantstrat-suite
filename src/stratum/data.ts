/**
 * Data ingestion layer.
 *
 * The application never depends on a concrete provider: everything goes
 * through the MarketDataProvider interface. The synthetic provider is the
 * default so the system runs with no API key and no network access.
 *
 * SYNTHETIC DATA IS NOT MARKET DATA. It is generated from a stochastic
 * process and is labelled as such everywhere it surfaces.
 */

import { createRng } from "./rng";
import type { AssetMetadata, Bar, PriceSeries } from "./types";

export interface MarketDataProvider {
  readonly id: string;
  readonly label: string;
  /** True when the data is generated, not observed. */
  readonly isSynthetic: boolean;
  getAssetMetadata(): AssetMetadata[];
  getHistoricalPrices(symbol: string, bars: number): PriceSeries;
  getLatestPrices(symbols: string[]): Record<string, number>;
  getVolume(symbol: string, bars: number): number[];
}

interface SyntheticAssetSpec {
  symbol: string;
  name: string;
  assetClass: string;
  /** Annualised drift of the log-price process. */
  drift: number;
  /** Long-run annualised volatility. */
  vol: number;
  /** Loading on the common market factor (0-1). */
  factorLoading: number;
  startPrice: number;
  seed: number;
}

/**
 * A small synthetic universe. Parameters are arbitrary modelling choices,
 * chosen only to produce plausible-looking series with differing risk.
 */
export const SYNTHETIC_UNIVERSE: SyntheticAssetSpec[] = [
  { symbol: "SYN-EQ", name: "Synthetic Broad Equity", assetClass: "Equity index", drift: 0.06, vol: 0.17, factorLoading: 0.95, startPrice: 100, seed: 11 },
  { symbol: "SYN-TC", name: "Synthetic Technology", assetClass: "Equity sector", drift: 0.09, vol: 0.29, factorLoading: 0.85, startPrice: 64, seed: 23 },
  { symbol: "SYN-EN", name: "Synthetic Energy", assetClass: "Equity sector", drift: 0.03, vol: 0.24, factorLoading: 0.55, startPrice: 41, seed: 37 },
  { symbol: "SYN-DF", name: "Synthetic Defensive", assetClass: "Equity sector", drift: 0.04, vol: 0.12, factorLoading: 0.6, startPrice: 78, seed: 53 },
  { symbol: "SYN-GV", name: "Synthetic Government Bond", assetClass: "Fixed income", drift: 0.02, vol: 0.06, factorLoading: -0.25, startPrice: 96, seed: 71 },
  { symbol: "SYN-CM", name: "Synthetic Commodity", assetClass: "Commodity", drift: 0.02, vol: 0.22, factorLoading: 0.2, startPrice: 55, seed: 89 },
];

const DAY_MS = 86_400_000;

/** Calendar of consecutive weekdays ending today (UTC), oldest first. */
export function businessDays(count: number, endDate = new Date("2026-06-30T00:00:00Z")): string[] {
  const out: string[] = [];
  let cursor = endDate.getTime();
  while (out.length < count) {
    const d = new Date(cursor);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
    cursor -= DAY_MS;
  }
  return out.reverse();
}

/**
 * Market factor shared by all synthetic assets, so that the covariance
 * matrix is non-trivial and portfolio optimisation is meaningful.
 * GARCH-like volatility clustering: sigma_t^2 follows a mean-reverting AR(1).
 */
function marketFactor(n: number, seed: number): number[] {
  const rng = createRng(seed);
  const out: number[] = [];
  let vol = 0.16 / Math.sqrt(252);
  const longRun = 0.16 / Math.sqrt(252);
  for (let i = 0; i < n; i++) {
    vol = Math.sqrt(0.92 * vol * vol + 0.08 * longRun * longRun * (1 + 0.9 * Math.abs(rng.normal())));
    out.push(vol * rng.normal());
  }
  return out;
}

export class SyntheticDataProvider implements MarketDataProvider {
  readonly id = "synthetic";
  readonly label = "Synthetic development data";
  readonly isSynthetic = true;

  constructor(private readonly baseSeed = 20260101) {}

  getAssetMetadata(): AssetMetadata[] {
    return SYNTHETIC_UNIVERSE.map((a) => ({
      symbol: a.symbol,
      name: a.name,
      assetClass: a.assetClass,
      currency: "USD",
      origin: "synthetic" as const,
    }));
  }

  getHistoricalPrices(symbol: string, bars: number): PriceSeries {
    const spec = SYNTHETIC_UNIVERSE.find((a) => a.symbol === symbol);
    if (!spec) throw new Error(`Unknown synthetic symbol: ${symbol}`);
    const dates = businessDays(bars);
    const factor = marketFactor(bars, this.baseSeed);
    const rng = createRng(this.baseSeed + spec.seed);

    const dailyDrift = spec.drift / 252;
    const idioVol = (spec.vol * Math.sqrt(Math.max(0, 1 - spec.factorLoading ** 2))) / Math.sqrt(252);

    const out: Bar[] = [];
    let price = spec.startPrice;
    for (let i = 0; i < bars; i++) {
      // Log-return = drift + factor exposure + idiosyncratic shock.
      const r = dailyDrift - 0.5 * (spec.vol / Math.sqrt(252)) ** 2 + spec.factorLoading * (spec.vol / 0.16) * factor[i]! + idioVol * rng.normal();
      const open = price;
      const close = open * Math.exp(r);
      const wick = Math.abs(r) + idioVol * Math.abs(rng.normal());
      const high = Math.max(open, close) * (1 + wick * 0.6);
      const low = Math.min(open, close) * (1 - wick * 0.6);
      const volume = Math.round(1_000_000 * (1 + 4 * Math.abs(r) / (spec.vol / Math.sqrt(252)) * 0.25 + 0.3 * rng.next()));
      out.push({
        timestamp: dates[i]!,
        symbol,
        open: round4(open),
        high: round4(high),
        low: round4(low),
        close: round4(close),
        adjClose: round4(close),
        volume,
      });
      price = close;
    }

    return {
      metadata: { symbol, name: spec.name, assetClass: spec.assetClass, currency: "USD", origin: "synthetic" },
      bars: out,
    };
  }

  getLatestPrices(symbols: string[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const s of symbols) {
      const series = this.getHistoricalPrices(s, 30);
      out[s] = series.bars[series.bars.length - 1]!.close;
    }
    return out;
  }

  getVolume(symbol: string, bars: number): number[] {
    return this.getHistoricalPrices(symbol, bars).bars.map((b) => b.volume);
  }
}

/**
 * CSV provider. Parses OHLCV text; no network access, so it is driven by
 * user-supplied content rather than a file path.
 */
export class CsvDataProvider implements MarketDataProvider {
  readonly id = "csv";
  readonly label = "CSV upload";
  readonly isSynthetic = false;

  constructor(private readonly csv: string, private readonly symbol: string) {}

  getAssetMetadata(): AssetMetadata[] {
    return [{ symbol: this.symbol, name: this.symbol, assetClass: "Unknown", currency: "USD", origin: "csv" }];
  }

  getHistoricalPrices(symbol: string, bars: number): PriceSeries {
    const lines = this.csv.trim().split(/\r?\n/);
    const header = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const parsed: Bar[] = [];
    for (const line of lines.slice(1)) {
      const cells = line.split(",");
      const close = Number(cells[idx("close")]);
      if (!Number.isFinite(close)) continue;
      parsed.push({
        timestamp: (cells[idx("timestamp")] ?? cells[idx("date")] ?? "").trim(),
        symbol,
        open: Number(cells[idx("open")] ?? close),
        high: Number(cells[idx("high")] ?? close),
        low: Number(cells[idx("low")] ?? close),
        close,
        adjClose: Number(cells[idx("adjclose")] ?? close),
        volume: Number(cells[idx("volume")] ?? 0),
      });
    }
    return {
      metadata: { symbol, name: symbol, assetClass: "Unknown", currency: "USD", origin: "csv" },
      bars: parsed.slice(-bars),
    };
  }

  getLatestPrices(symbols: string[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const s of symbols) {
      const bars = this.getHistoricalPrices(s, 1).bars;
      if (bars[0]) out[s] = bars[0].close;
    }
    return out;
  }

  getVolume(symbol: string, bars: number): number[] {
    return this.getHistoricalPrices(symbol, bars).bars.map((b) => b.volume);
  }
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

export const defaultProvider = new SyntheticDataProvider();
