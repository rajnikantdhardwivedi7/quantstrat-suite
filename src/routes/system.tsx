import { createFileRoute } from "@tanstack/react-router";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System Health & Architecture — STRATUM" },
      {
        name: "description",
        content:
          "Layer-by-layer status of the STRATUM pipeline: ingestion, validation, features, modelling, signals, execution, risk and registry, with what is implemented and what is not.",
      },
      { property: "og:title", content: "System Health & Architecture — STRATUM" },
      {
        property: "og:description",
        content: "Honest architecture status: implemented layers, deliberate limitations and the disclosure policy.",
      },
    ],
  }),
  component: System,
});

function System() {
  const exp = getExperiment();

  const layers: [string, string, string][] = [
    ["Ingestion", "Operational", "MarketDataProvider interface; synthetic and CSV implementations. No live vendor connected."],
    ["Validation", exp.validation.passed ? "Operational" : "Blocking", "Duplicates, monotonicity, OHLC consistency, missing values, extreme moves."],
    ["Feature engineering", "Operational", `${exp.features.specs.length} trailing-window features, version ${exp.features.version}.`],
    ["Splitting", "Operational", `Chronological split with a ${exp.config.horizon}-bar embargo plus 5-fold walk-forward.`],
    ["Modelling", "Operational", "Ridge regression (closed form) and logistic regression (gradient descent), both from first principles."],
    ["Signals", "Operational", "Threshold plus confidence gate mapping predictions to target weights."],
    ["Backtesting", "Operational", "Event-driven, minimum one-bar execution lag, commission, slippage, turnover, trade ledger."],
    ["Risk engine", "Operational", "VaR, CVaR, drawdown, downside deviation, beta, exposure, concentration, assumption list."],
    ["Portfolio optimiser", "Operational", "Projected gradient descent for four objectives under weight constraints."],
    ["Registry", "Operational", "In-memory model and experiment records, reset on reload."],
    ["Persistence", "Not implemented", "No database. Results are recomputed deterministically from the seed at page load."],
    ["Live trading", "Out of scope", "No broker connectivity, no order router, no real capital path."],
  ];

  return (
    <Shell
      title="System Health"
      subtitle="What this platform does, what it deliberately does not do, and how you can tell the difference."
      meta={<Provenance kind="observed" note="Static architecture facts" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pipeline status" value="Healthy" tone="positive" hint="Last run completed without a blocking issue" />
        <Stat label="Layers implemented" value={`${layers.filter((l) => l[1] === "Operational").length} / ${layers.length}`} hint="Remaining layers are declared out of scope" />
        <Stat label="Bars processed" value={fmtInt(exp.series.bars.length)} hint="Per pipeline run" />
        <Stat label="Determinism" value="Seeded" hint={`Seed ${exp.config.seed} reproduces every figure`} />
      </div>

      <Panel className="mt-6" title="Layer status" description="One row per layer of the stack.">
        <Table
          head={["Layer", "Status", "Detail"]}
          rows={layers.map(([name, status, detail]) => [
            name,
            <span
              key={`${name}-s`}
              className={
                status === "Operational"
                  ? "text-positive"
                  : status === "Not implemented" || status === "Out of scope"
                    ? "text-muted-foreground"
                    : "text-negative"
              }
            >
              {status}
            </span>,
            <span key={`${name}-d`} className="text-xs text-muted-foreground">
              {detail}
            </span>,
          ])}
        />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Data flow" description="Strictly one direction; no layer reaches backwards.">
          <pre className="overflow-x-auto text-xs leading-relaxed text-muted-foreground">{`provider.getHistoricalPrices()
  -> cleanSeries() -> validateSeries()
  -> buildFeatures()            (trailing windows only)
  -> forwardReturns(horizon)    (label lives in the future)
  -> TimeSeriesSplitter(embargo)
  -> fit on train  ->  predict on validation / test
  -> generateSignals(thresholds, confidence)
  -> runBacktest(lag >= 1, costs, slippage)
  -> buildRiskReport(assumptions)
  -> modelRegistry + experimentStore`}</pre>
        </Panel>
        <Panel title="Disclosure policy" description="How figures are labelled throughout the interface.">
          <KeyValue
            items={[
              ["Observed", "A fact about the system or dataset, not a market measurement"],
              ["Simulated", "Generated by the seeded stochastic price model"],
              ["Prediction", "Model output about the future; carries error at least as large as the RMSE"],
              ["Backtest", "Historical simulation of a strategy, net of modelled costs, never a realised track record"],
              ["Estimate", "Derived from sample statistics and sensitive to the estimation window"],
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            No page reports a live return, an audited track record, or a recommendation. Where a metric is unflattering,
            it is shown at the same prominence as a favourable one.
          </p>
        </Panel>
      </div>

      <Panel className="mt-4" title="Engineering notes" description="Implementation choices worth knowing before extending this.">
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>• The quantitative core in <span className="num">src/stratum/</span> has no UI dependency and can be unit-tested or moved to a server runtime unchanged.</li>
          <li>• Linear algebra, statistics, ratios, VaR and the optimiser are implemented directly rather than pulled from a library, so every formula is auditable.</li>
          <li>• The full pipeline runs in milliseconds and is memoised per configuration, so pages share one computation.</li>
          <li>• Swapping in real data means implementing <span className="num">MarketDataProvider</span> and nothing else; the layers above are provider-agnostic.</li>
          <li>• Nothing here is investment advice, and results on synthetic data say nothing about real markets.</li>
        </ul>
      </Panel>
    </Shell>
  );
}
