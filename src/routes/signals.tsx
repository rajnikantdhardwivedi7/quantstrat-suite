import { createFileRoute } from "@tanstack/react-router";
import { LineSeriesChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/signals")({
  head: () => ({
    meta: [
      { title: "Signals — STRATUM" },
      {
        name: "description",
        content:
          "Deterministic mapping from model output to LONG, NEUTRAL or SHORT, with thresholds, confidence gating and the execution lag applied before any fill.",
      },
      { property: "og:title", content: "Signals — STRATUM" },
      {
        property: "og:description",
        content: "Threshold rules, confidence gating and signal stability over the held-out window.",
      },
    ],
  }),
  component: Signals,
});

function Signals() {
  const exp = getExperiment();
  const signals = exp.signals;
  const counts = { LONG: 0, NEUTRAL: 0, SHORT: 0 };
  for (const s of signals) counts[s.signal] += 1;
  let flips = 0;
  for (let i = 1; i < signals.length; i++) if (signals[i]!.signal !== signals[i - 1]!.signal) flips += 1;

  const exposure = signals.slice(-300).map((s) => ({
    timestamp: s.timestamp,
    exposure: s.signal === "LONG" ? 1 : s.signal === "SHORT" ? -1 : 0,
    prediction: s.prediction,
  }));

  return (
    <Shell
      title="Signals"
      subtitle="The rule layer between a continuous prediction and a tradable target weight."
      meta={<Provenance kind="prediction" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Long bars" value={`${fmtPct(counts.LONG / signals.length, 1)}`} tone="positive" hint={`${fmtInt(counts.LONG)} of ${fmtInt(signals.length)}`} />
        <Stat label="Neutral bars" value={`${fmtPct(counts.NEUTRAL / signals.length, 1)}`} hint={`${fmtInt(counts.NEUTRAL)} bars flat`} />
        <Stat label="Short bars" value={`${fmtPct(counts.SHORT / signals.length, 1)}`} tone="negative" hint={`${fmtInt(counts.SHORT)} bars short`} />
        <Stat label="State changes" value={fmtInt(flips)} hint="Each change pays costs and slippage" />
      </div>

      <Panel className="mt-6" title="Decision rule" description="Fully deterministic; the same inputs always give the same signal.">
        <KeyValue
          items={[
            ["LONG when", <span key="l" className="num">prediction &gt; {fmtPct(exp.config.signal.upperThreshold, 3)} and confidence ≥ {fmtNum(exp.config.signal.minConfidence, 2)}</span>],
            ["SHORT when", <span key="s" className="num">prediction &lt; {fmtPct(exp.config.signal.lowerThreshold, 3)} and confidence ≥ {fmtNum(exp.config.signal.minConfidence, 2)}</span>],
            ["NEUTRAL otherwise", "Including whenever confidence is below the gate"],
            ["Shorting", exp.config.signal.allowShort ? "Enabled" : "Disabled"],
            ["Target weight", "LONG → +1, NEUTRAL → 0, SHORT → −1, capped by max gross exposure"],
            ["Execution", `Applied ${exp.config.backtest.executionLag} bar(s) after the signal bar's close`],
            ["Confidence source", "Logistic model probability distance from 0.5, rescaled to [0, 1]"],
          ]}
        />
      </Panel>

      <Panel className="mt-4" title="Exposure and prediction over time" description="Last 300 held-out bars.">
        <LineSeriesChart
          data={exposure}
          xKey="timestamp"
          series={[
            { key: "exposure", label: "Target exposure", color: "var(--color-primary)" },
            { key: "prediction", label: "Prediction", color: "var(--color-chart-4)" },
          ]}
          yTickFormatter={(v) => v.toFixed(2)}
          height={260}
        />
      </Panel>

      <Panel className="mt-4" title="Signal ledger" description="The most recent decisions, with the inputs that produced them.">
        <Table
          head={["Timestamp", "Symbol", "Prediction", "Confidence", "Signal", "Model"]}
          rows={signals
            .slice(-20)
            .reverse()
            .map((s) => [
              s.timestamp,
              <span key={`${s.timestamp}-sym`} className="num">
                {s.symbol}
              </span>,
              <span key={`${s.timestamp}-p`} className="num text-estimate">
                {fmtPct(s.prediction, 3)}
              </span>,
              fmtNum(s.confidence, 3),
              <span
                key={`${s.timestamp}-s`}
                className={s.signal === "LONG" ? "text-positive" : s.signal === "SHORT" ? "text-negative" : "text-muted-foreground"}
              >
                {s.signal}
              </span>,
              <span key={`${s.timestamp}-m`} className="num text-xs text-muted-foreground">
                {s.modelVersion}
              </span>,
            ])}
        />
      </Panel>
    </Shell>
  );
}
