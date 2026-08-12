/**
 * Mathematical engine.
 *
 * Assumptions are documented per function. Nothing here assumes a particular
 * data source; every function operates on plain numeric arrays.
 *
 * Convention: 252 trading days per year for annualisation. This is an
 * approximation and is exposed as a parameter everywhere it matters.
 */

export const TRADING_DAYS = 252;

export class RiskCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiskCalculationError";
  }
}

/** Simple returns: r_t = P_t / P_{t-1} - 1. Length n-1. */
export function simpleReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    if (prev <= 0) throw new RiskCalculationError("Non-positive price in return calculation");
    out.push(prices[i] / prev - 1);
  }
  return out;
}

/** Log returns: r_t = ln(P_t / P_{t-1}). Length n-1. */
export function logReturns(prices: number[]): number[] {
  return simpleReturns(prices).map((r) => Math.log1p(r));
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Sample variance (Bessel-corrected, ddof = 1). */
export function variance(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}

export function stdDev(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function skewness(xs: number[]): number {
  const n = xs.length;
  if (n < 3) return NaN;
  const m = mean(xs);
  const s = stdDev(xs);
  if (!s) return 0;
  return (n / ((n - 1) * (n - 2))) * xs.reduce((a, x) => a + ((x - m) / s) ** 3, 0);
}

/** Excess kurtosis (normal distribution -> 0). */
export function kurtosis(xs: number[]): number {
  const n = xs.length;
  if (n < 4) return NaN;
  const m = mean(xs);
  const s = stdDev(xs);
  if (!s) return 0;
  const g2 = xs.reduce((a, x) => a + ((x - m) / s) ** 4, 0) / n - 3;
  return ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 + 6);
}

/** Lag-k autocorrelation of a series. */
export function autocorrelation(xs: number[], lag: number): number {
  if (xs.length <= lag + 1) return NaN;
  const m = mean(xs);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    den += (xs[i] - m) ** 2;
    if (i >= lag) num += (xs[i] - m) * (xs[i - lag] - m);
  }
  return den === 0 ? 0 : num / den;
}

/** Annualised volatility from periodic returns: sigma * sqrt(periods). */
export function annualisedVolatility(returns: number[], periods = TRADING_DAYS): number {
  return stdDev(returns) * Math.sqrt(periods);
}

/** Geometric (CAGR-style) annualised return from periodic returns. */
export function annualisedReturn(returns: number[], periods = TRADING_DAYS): number {
  if (returns.length === 0) return NaN;
  const growth = returns.reduce((a, r) => a * (1 + r), 1);
  if (growth <= 0) return -1;
  return growth ** (periods / returns.length) - 1;
}

export function cumulativeReturn(returns: number[]): number {
  return returns.reduce((a, r) => a * (1 + r), 1) - 1;
}

/**
 * Sharpe ratio using periodic returns and an annual risk-free rate.
 * Assumes i.i.d. returns; violated in practice (autocorrelation, fat tails).
 */
export function sharpeRatio(returns: number[], riskFreeAnnual = 0, periods = TRADING_DAYS): number {
  const vol = stdDev(returns);
  if (!vol) return NaN;
  const rfPeriodic = riskFreeAnnual / periods;
  return ((mean(returns) - rfPeriodic) / vol) * Math.sqrt(periods);
}

/** Downside deviation against a periodic minimum acceptable return (MAR). */
export function downsideDeviation(returns: number[], mar = 0): number {
  if (returns.length === 0) return NaN;
  const sq = returns.map((r) => Math.min(0, r - mar) ** 2);
  return Math.sqrt(mean(sq));
}

export function sortinoRatio(returns: number[], riskFreeAnnual = 0, periods = TRADING_DAYS): number {
  const rf = riskFreeAnnual / periods;
  const dd = downsideDeviation(returns, rf);
  if (!dd) return NaN;
  return ((mean(returns) - rf) / dd) * Math.sqrt(periods);
}

export interface DrawdownResult {
  /** Negative number, e.g. -0.21 for a 21% peak-to-trough decline. */
  maxDrawdown: number;
  series: number[];
  peakIndex: number;
  troughIndex: number;
}

/** Peak-to-trough drawdown of an equity curve. */
export function drawdown(equity: number[]): DrawdownResult {
  let peak = equity.length ? equity[0] : NaN;
  let peakIdx = 0;
  let best = { maxDrawdown: 0, peakIndex: 0, troughIndex: 0 };
  const series: number[] = [];
  equity.forEach((v, i) => {
    if (v > peak) {
      peak = v;
      peakIdx = i;
    }
    const dd = peak > 0 ? v / peak - 1 : 0;
    series.push(dd);
    if (dd < best.maxDrawdown) best = { maxDrawdown: dd, peakIndex: peakIdx, troughIndex: i };
  });
  return { ...best, series };
}

export function calmarRatio(returns: number[], equity: number[], periods = TRADING_DAYS): number {
  const mdd = Math.abs(drawdown(equity).maxDrawdown);
  if (!mdd) return NaN;
  return annualisedReturn(returns, periods) / mdd;
}

/**
 * Historical VaR: the empirical alpha-quantile loss, reported as a positive
 * number. Assumes the sample distribution represents future risk.
 */
export function historicalVaR(returns: number[], alpha = 0.95): number {
  if (returns.length === 0) return NaN;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((1 - alpha) * sorted.length)));
  return -sorted[idx];
}

/** Parametric (Gaussian) VaR. Understates tail risk for fat-tailed returns. */
export function parametricVaR(returns: number[], alpha = 0.95): number {
  const z = normalQuantile(1 - alpha);
  return -(mean(returns) + z * stdDev(returns));
}

/** Conditional VaR (expected shortfall) from the empirical distribution. */
export function conditionalVaR(returns: number[], alpha = 0.95): number {
  if (returns.length === 0) return NaN;
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.max(1, Math.floor((1 - alpha) * sorted.length));
  return -mean(sorted.slice(0, cutoff));
}

/** Acklam-style rational approximation of the standard normal quantile. */
export function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) return NaN;
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-7.78489400243029e-3, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [7.78469570904146e-3, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) return -normalQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function covariance(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return NaN;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let s = 0;
  for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my);
  return s / (n - 1);
}

export function correlation(x: number[], y: number[]): number {
  const denom = stdDev(x) * stdDev(y);
  return denom ? covariance(x, y) / denom : NaN;
}

/** Sample covariance matrix of column-wise return series. */
export function covarianceMatrix(series: number[][]): number[][] {
  return series.map((a) => series.map((b) => covariance(a, b)));
}

export function correlationMatrix(series: number[][]): number[][] {
  return series.map((a) => series.map((b) => correlation(a, b)));
}

/** OLS beta of asset returns against benchmark returns. */
export function beta(assetReturns: number[], benchmarkReturns: number[]): number {
  const v = variance(benchmarkReturns);
  return v ? covariance(assetReturns, benchmarkReturns) / v : NaN;
}

/** Trailing rolling window reduction; index i uses [i-window+1, i]. NaN before warm-up. */
export function rolling(xs: number[], window: number, fn: (w: number[]) => number): number[] {
  return xs.map((_, i) => (i + 1 < window ? NaN : fn(xs.slice(i + 1 - window, i + 1))));
}
