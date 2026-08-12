import { createFileRoute } from "@tanstack/react-router";
import { DrawdownChart, LineSeriesChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtBps, fmtInt, fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/backtest")({
  head: () => ({
    meta: [
      { title: "Backtesting — STRATUM" },
      {
        name: "description",
        content:
          "Event-driven backtest with a mandatory one-bar execution lag, commission, slippage, turnover accounting and baseline comparisons.",
      },
      { property: "og:title", content: "Backtesting — STRATUM" },
      {
        property: "og:description",
        content: "Simulated performance net of modelled costs, compared with buy-and-hold and momentum baselines.",
      },
    ],
  }),
  component: Backtesting,
});

function Backtesting() {
  const exp = getExperiment();
  const s = exp.strategy;
  const m = s.metrics;
  const equity = s.points.map((p) => ({ timestamp: p.timestamp, strategy: p.equity, benchmark: p.benchmarkEquity }));

  return (
    <Shell
      title="Backtesting"
      subtitle={`Simulated on the held-out segment ${s.periodStart} → ${s.periodEnd}, net of all modelled frictions.`}
      meta={<Provenance kind="backtest" note="Simulated, not realised" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Cumulative return" value={fmtPct(m.cumulativeReturn)} tone={m.cumulativeReturn >= 0 ? "positive" : "negative"} hint={`${fmtInt(m.bars)} bars`} />
        <Stat label="Annualised return" value={fmtPct(m.annualisedReturn)} hint="Geometric, 252 bars per year" />
        <Stat label="Annualised volatility" value={fmtPct(m.annualisedVolatility)} hint="Standard deviation of bar returns" />
        <Stat label="Sharpe" value={fmtNum(m.sharpe)} hint="Risk-free rate assumed 0" />
        <Stat label="Sortino" value={fmtNum(m.sortino)} hint="Downside deviation in the denominator" />
        <Stat label="Max drawdown" value={fmtPct(m.maxDrawdown)} tone="negative" hint="Worst peak-to-trough" />
        <Stat label="Calmar" value={fmtNum(m.calmar)} hint="Annualised return over max drawdown" />
        <Stat label="Costs paid" value={fmtMoney(m.totalCosts)} hint={`${fmtInt(s.trades.length)} rebalances`} />
      </div>

      <Panel className="mt-6" title="Equity curves" description="Strategy against buy-and-hold on the identical window with identical frictions.">
        <LineSeriesChart
          data={equity}
          xKey="timestamp"
          areaFirst
          series={[
            { key: "strategy", label: "Strategy", color: "var(--color-primary)" },
            { key: "benchmark", label: "Buy & hold", color: "var(--color-muted-foreground)" },
          ]}
          yTickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          height={300}
        />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Drawdown" description="Continuous peak-to-trough series for the strategy.">
          <DrawdownChart data={s.points.map((p) => ({ timestamp: p.timestamp, drawdown: p.drawdown }))} height={220} />
        </Panel>
        <Panel title="Exposure" description="Realised position weight after the execution lag and exposure cap.">
          <LineSeriesChart
            data={s.points.map((p) => ({ timestamp: p.timestamp, weight: p.weight }))}
            xKey="timestamp"
            series={[{ key: "weight", label: "Weight", color: "var(--color-chart-3)" }]}
            yTickFormatter={(v) => v.toFixed(2)}
            height={220}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Execution assumptions" description="Every friction is explicit and configurable in one place.">
          <KeyValue
            items={[
              ["Initial capital", fmtMoney(s.config.initialCapital)],
              ["Execution lag", `${s.config.executionLag} bar (signal at close t, fill at close t+${s.config.executionLag})`],
              ["Commission", fmtBps(s.config.transactionCost)],
              ["Slippage", fmtBps(s.config.slippage)],
              ["Round-trip friction", fmtBps(2 * (s.config.transactionCost + s.config.slippage))],
              ["Rebalance frequency", `Every ${s.config.rebalanceEvery} bar(s)`],
              ["Max gross exposure", fmtNum(s.config.maxGrossExposure, 2)],
              ["Annualised turnover", fmtNum(m.turnover, 1)],
              ["Hit rate", fmtPct(m.hitRate)],
            ]}
          />
        </Panel>

        <Panel title="Known limitations" description="Reasons a live result would differ from this simulation.">
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• Fills happen at the close with no market impact, partial fills, or queue position.</li>
            <li>• Costs are linear in notional; real impact grows with size and shrinks with liquidity.</li>
            <li>• No borrow cost, financing, or short availability constraint is charged on short exposure.</li>
            <li>• No taxes, dividends, or corporate actions are modelled; adjusted close equals close.</li>
            <li>• The universe is synthetic and fixed, so there is no survivorship or delisting effect to correct.</li>
            <li>• One asset is traded, so the result is highly path-dependent on a single simulated series.</li>
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="Strategy vs baselines" description="A model earns its complexity only by beating simple rules under the same assumptions.">
        <Table
          head={["Strategy", "Cumulative", "Annualised", "Vol", "Sharpe", "Sortino", "Max DD", "Calmar", "Costs"]}
          rows={[
            [
              "ML signal",
              fmtPct(m.cumulativeReturn),
              fmtPct(m.annualisedReturn),
              fmtPct(m.annualisedVolatility),
              fmtNum(m.sharpe),
              fmtNum(m.sortino),
              fmtPct(m.maxDrawdown),
              fmtNum(m.calmar),
              fmtMoney(m.totalCosts),
            ],
            ...exp.baselines.map((b) => [
              b.name,
              fmtPct(b.result.metrics.cumulativeReturn),
              fmtPct(b.result.metrics.annualisedReturn),
              fmtPct(b.result.metrics.annualisedVolatility),
              fmtNum(b.result.metrics.sharpe),
              fmtNum(b.result.metrics.sortino),
              fmtPct(b.result.metrics.maxDrawdown),
              fmtNum(b.result.metrics.calmar),
              fmtMoney(b.result.metrics.totalCosts),
            ]),
          ]}
        />
      </Panel>

      <Panel className="mt-4" title="Trade ledger" description="Each rebalance with its traded notional and the cost charged for it.">
        <Table
          head={["Timestamp", "Symbol", "From", "To", "Notional", "Cost"]}
          rows={s.trades
            .slice(-20)
            .reverse()
            .map((t, i) => [
              t.timestamp,
              <span key={`${t.timestamp}-${i}`} className="num">
                {t.symbol}
              </span>,
              fmtNum(t.fromWeight, 2),
              fmtNum(t.toWeight, 2),
              fmtMoney(t.notional),
              fmtMoney(t.cost),
            ])}
        />
      </Panel>
    </Shell>
  );
}
