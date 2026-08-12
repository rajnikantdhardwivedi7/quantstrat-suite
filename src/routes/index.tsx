import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { DrawdownChart, LineSeriesChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STRATUM — Layered Quantitative Research Platform" },
      {
        name: "description",
        content:
          "STRATUM is an open research platform: synthetic market data, causal feature engineering, walk-forward validated models, cost-aware backtesting and a full risk engine.",
      },
      { property: "og:title", content: "STRATUM — Layered Quantitative Research Platform" },
      {
        property: "og:description",
        content:
          "Feature engineering, time-series validation, signal generation, cost-aware backtesting and risk analytics in one reproducible research stack.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const exp = getExperiment();
  const bars = exp.series.bars;
  const last = bars[bars.length - 1]!;
  const prev = bars[bars.length - 2] ?? last;
  const dailyReturn = last.adjClose / prev.adjClose - 1;
  const lastSignal = exp.signals[exp.signals.length - 1]!;
  const lastPoint = exp.strategy.points[exp.strategy.points.length - 1]!;
  const vol = exp.risk.annualisedVolatility;

  const equityData = exp.strategy.points.map((p) => ({
    timestamp: p.timestamp,
    strategy: p.equity,
    benchmark: p.benchmarkEquity,
  }));

  return (
    <Shell
      title="Overview"
      subtitle="One reproducible experiment, computed in-browser at page load: ingestion, validation, features, model, signals, backtest and risk."
      meta={
        <div className="flex flex-wrap items-center gap-2">
          <Provenance kind="simulated" />
          <span className="num text-xs text-muted-foreground">
            {exp.model.name} · {exp.model.version} · seed {exp.config.seed}
          </span>
        </div>
      }
    >
      <div className="panel mb-6 border-synthetic/40 bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-synthetic">Synthetic development data.</strong> No external market-data provider is
        connected, so prices come from a seeded stochastic simulation defined in{" "}
        <span className="num">src/stratum/data.ts</span>. Every number below is derived from that simulation by the code
        in this repository. Nothing here is a measurement of real market performance and nothing here is financial
        advice.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`Last close · ${exp.config.symbol}`} value={fmtNum(last.adjClose)} hint={`Simulated bar ${last.timestamp}`} />
        <Stat
          label="Daily return"
          value={fmtPct(dailyReturn)}
          tone={dailyReturn >= 0 ? "positive" : "negative"}
          hint="Last simulated bar"
        />
        <Stat label="Annualised volatility" value={fmtPct(vol)} hint="Realised over the test window" />
        <Stat
          label="Model prediction"
          value={fmtPct(lastSignal.prediction, 3)}
          tone="estimate"
          hint={`Next ${exp.config.horizon}-bar return · confidence ${fmtNum(lastSignal.confidence, 2)}`}
        />
        <Stat
          label="Current signal"
          value={lastSignal.signal}
          tone={lastSignal.signal === "LONG" ? "positive" : lastSignal.signal === "SHORT" ? "negative" : "neutral"}
          hint={`As of ${lastSignal.timestamp} · executed with a ${exp.config.backtest.executionLag}-bar lag`}
        />
        <Stat label="Simulated portfolio value" value={fmtMoney(lastPoint.equity)} hint="Backtested, net of costs" />
        <Stat
          label="Max drawdown"
          value={fmtPct(exp.strategy.metrics.maxDrawdown)}
          tone="negative"
          hint="Peak-to-trough on the backtest equity curve"
        />
        <Stat
          label="Sharpe ratio"
          value={fmtNum(exp.strategy.metrics.sharpe)}
          hint={`Backtested, rf = 0, ${exp.strategy.metrics.bars} bars`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Strategy vs buy-and-hold equity"
          description="Both curves start at the same capital and pay identical modelled transaction costs and slippage."
          action={<Provenance kind="backtest" />}
        >
          <LineSeriesChart
            data={equityData}
            xKey="timestamp"
            areaFirst
            series={[
              { key: "strategy", label: "ML strategy", color: "var(--color-primary)" },
              { key: "benchmark", label: "Buy & hold", color: "var(--color-muted-foreground)" },
            ]}
            yTickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            height={280}
          />
        </Panel>

        <Panel title="Experiment provenance" description="Everything needed to reproduce these figures." >
          <KeyValue
            items={[
              ["Experiment", exp.experimentId],
              ["Data provider", exp.provider.label],
              ["Dataset", `${bars.length} bars`],
              ["Dataset period", `${exp.validation.periodStart} → ${exp.validation.periodEnd}`],
              ["Feature version", exp.features.version],
              ["Features", String(exp.features.specs.length)],
              ["Model", `${exp.model.name} ${exp.model.version}`],
              ["Label horizon", `${exp.config.horizon} bar`],
              ["Train", `${exp.split.train[0]} → ${exp.split.train[1]}`],
              ["Validation", `${exp.split.validation[0]} → ${exp.split.validation[1]}`],
              ["Test", `${exp.split.test[0]} → ${exp.split.test[1]}`],
              ["Seed", String(exp.config.seed)],
            ]}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Backtest drawdown" description="Computed on the net-of-cost simulated equity curve.">
          <DrawdownChart data={exp.strategy.points.map((p) => ({ timestamp: p.timestamp, drawdown: p.drawdown }))} />
        </Panel>

        <Panel
          title="Model performance is not strategy performance"
          description="Predictive accuracy and traded outcomes are reported separately and can disagree."
        >
          <Table
            head={["Layer", "Metric", "Test value"]}
            rows={[
              ["Model", "RMSE of predicted return", fmtPct(exp.regression.test.rmse, 3)],
              ["Model", "R²", fmtNum(exp.regression.test.r2, 4)],
              ["Model", "Directional accuracy", fmtPct(exp.regression.test.directionalAccuracy)],
              ["Model", "ROC-AUC (sign classifier)", fmtNum(exp.classification.test.rocAuc, 3)],
              ["Strategy", "Cumulative return", fmtPct(exp.strategy.metrics.cumulativeReturn)],
              ["Strategy", "Annualised return", fmtPct(exp.strategy.metrics.annualisedReturn)],
              ["Strategy", "Sharpe", fmtNum(exp.strategy.metrics.sharpe)],
              ["Strategy", "Costs paid", fmtMoney(exp.strategy.metrics.totalCosts)],
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            An R² near or below zero means the model does not explain next-bar returns on this simulated series. That is
            the expected outcome for a near-random process and is reported as measured.
          </p>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Baseline comparison"
        description="An ML strategy only earns credit for what a simpler rule could not achieve over the same window with the same costs."
        action={<Provenance kind="backtest" />}
      >
        <Table
          head={["Strategy", "Cumulative", "Annualised", "Volatility", "Sharpe", "Max DD", "Turnover / yr"]}
          rows={[
            [
              "ML signal (ridge)",
              fmtPct(exp.strategy.metrics.cumulativeReturn),
              fmtPct(exp.strategy.metrics.annualisedReturn),
              fmtPct(exp.strategy.metrics.annualisedVolatility),
              fmtNum(exp.strategy.metrics.sharpe),
              fmtPct(exp.strategy.metrics.maxDrawdown),
              fmtNum(exp.strategy.metrics.turnover, 1),
            ],
            ...exp.baselines.map((b) => [
              b.name,
              fmtPct(b.result.metrics.cumulativeReturn),
              fmtPct(b.result.metrics.annualisedReturn),
              fmtPct(b.result.metrics.annualisedVolatility),
              fmtNum(b.result.metrics.sharpe),
              fmtPct(b.result.metrics.maxDrawdown),
              fmtNum(b.result.metrics.turnover, 1),
            ]),
          ]}
        />
      </Panel>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/features", title: "Feature Explorer", body: "18 trailing-window features with declared lookbacks." },
          { to: "/models", title: "Model Lab", body: "Split design, walk-forward folds, interpretability." },
          { to: "/backtest", title: "Backtesting", body: "Execution lag, costs, slippage, trade ledger." },
          { to: "/risk", title: "Risk", body: "VaR, CVaR, drawdown, beta, exposure, assumptions." },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="panel block px-4 py-3 transition-colors hover:border-primary/50">
            <div className="text-sm font-semibold text-foreground">{c.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.body}</div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
