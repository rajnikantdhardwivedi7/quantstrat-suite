/**
 * Risk engine.
 *
 * All metrics are computed from realised historical (or simulated) returns.
 * They describe the sample period only and are not forecasts.
 */

import {
  beta,
  conditionalVaR,
  correlationMatrix,
  covarianceMatrix,
  downsideDeviation,
  drawdown,
  historicalVaR,
  parametricVaR,
  annualisedVolatility,
  TRADING_DAYS,
} from "./math";

export interface RiskReport {
  observations: number;
  periodStart: string;
  periodEnd: string;
  annualisedVolatility: number;
  maxDrawdown: number;
  historicalVaR95: number;
  parametricVaR95: number;
  cvar95: number;
  historicalVaR99: number;
  downsideDeviation: number;
  beta: number | null;
  /** Herfindahl index of absolute weights; 1 = fully concentrated. */
  concentration: number | null;
  averageGrossExposure: number | null;
  annualTurnover: number | null;
  assumptions: string[];
}

export interface RiskInputs {
  returns: number[];
  equity: number[];
  timestamps: string[];
  benchmarkReturns?: number[];
  weights?: number[];
  averageGrossExposure?: number;
  annualTurnover?: number;
}

export function buildRiskReport(inputs: RiskInputs): RiskReport {
  const { returns, equity, timestamps } = inputs;
  return {
    observations: returns.length,
    periodStart: timestamps[0] ?? "n/a",
    periodEnd: timestamps[timestamps.length - 1] ?? "n/a",
    annualisedVolatility: annualisedVolatility(returns),
    maxDrawdown: drawdown(equity).maxDrawdown,
    historicalVaR95: historicalVaR(returns, 0.95),
    parametricVaR95: parametricVaR(returns, 0.95),
    cvar95: conditionalVaR(returns, 0.95),
    historicalVaR99: historicalVaR(returns, 0.99),
    downsideDeviation: downsideDeviation(returns),
    beta: inputs.benchmarkReturns ? beta(returns, inputs.benchmarkReturns) : null,
    concentration: inputs.weights ? herfindahl(inputs.weights) : null,
    averageGrossExposure: inputs.averageGrossExposure ?? null,
    annualTurnover: inputs.annualTurnover ?? null,
    assumptions: [
      `Annualisation uses ${TRADING_DAYS} trading days per year.`,
      "VaR/CVaR are 1-bar (daily) figures reported as positive loss magnitudes.",
      "Historical VaR assumes the sample distribution represents future risk.",
      "Parametric VaR assumes normally distributed returns and understates fat tails.",
      "Beta is an OLS estimate against the stated benchmark over the same sample.",
      "Drawdown is measured on the simulated equity curve, net of modelled costs.",
    ],
  };
}

/** Concentration risk: sum of squared normalised absolute weights. */
export function herfindahl(weights: number[]): number {
  const total = weights.reduce((a, w) => a + Math.abs(w), 0);
  if (!total) return 0;
  return weights.reduce((a, w) => a + (Math.abs(w) / total) ** 2, 0);
}

export { covarianceMatrix, correlationMatrix };
