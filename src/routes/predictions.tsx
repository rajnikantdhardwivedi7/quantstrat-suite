import { createFileRoute } from "@tanstack/react-router";
import { LineSeriesChart, PredictionScatter } from "@/components/stratum/charts";
import { Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Predictions — STRATUM" },
      {
        name: "description",
        content:
          "Held-out predictions of the next-bar return plotted against realised outcomes, with residual diagnostics and explicit uncertainty.",
      },
      { property: "og:title", content: "Predictions — STRATUM" },
      {
        property: "og:description",
        content: "Predicted versus realised returns on the test segment, labelled as estimates rather than facts.",
      },
    ],
  }),
  component: Predictions,
});

function Predictions() {
  const exp = getExperiment();
  const preds = exp.predictions;
  const recent = preds.slice(-250).map((p) => ({
    timestamp: p.timestamp,
    prediction: p.prediction,
    realised: p.realised,
  }));
  const residuals = preds.slice(-250).map((p) => ({ timestamp: p.timestamp, residual: p.realised - p.prediction }));
  const scatter = preds.map((p) => ({ prediction: p.prediction, realised: p.realised }));
  const rmse = exp.regression.test.rmse;
  const last = preds[preds.length - 1]!;

  return (
    <Shell
      title="Predictions"
      subtitle="Point forecasts of the next-bar return on data the model never saw during fitting."
      meta={<Provenance kind="prediction" note="Model output, not an observation" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Latest prediction" value={fmtPct(last.prediction, 3)} tone="estimate" hint={`For the bar after ${last.timestamp}`} />
        <Stat label="Typical error (RMSE)" value={fmtPct(rmse, 3)} hint="The prediction above is far smaller than this error" />
        <Stat label="Held-out predictions" value={fmtInt(preds.length)} hint="Test segment only" />
        <Stat label="Directional accuracy" value={fmtPct(exp.regression.test.directionalAccuracy)} hint="Sign agreement with the realised return" />
      </div>

      <div className="panel mt-6 border-estimate/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-estimate">Uncertainty is larger than the signal.</strong> The RMSE of{" "}
        {fmtPct(rmse, 3)} exceeds the magnitude of a typical prediction, so any single forecast should be treated as
        noise around zero. That is a property of the data-generating process, and it is reported rather than hidden.
      </div>

      <Panel className="mt-4" title="Predicted vs realised return" description="Last 250 held-out bars.">
        <LineSeriesChart
          data={recent}
          xKey="timestamp"
          series={[
            { key: "realised", label: "Realised", color: "var(--color-muted-foreground)" },
            { key: "prediction", label: "Predicted", color: "var(--color-primary)" },
          ]}
          yTickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
          height={260}
        />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Calibration scatter" description="Perfect prediction would fall on the 45° line; a shapeless cloud means no edge.">
          <PredictionScatter data={scatter} />
        </Panel>
        <Panel title="Residuals" description="Realised minus predicted. Structure here would indicate an unmodelled effect.">
          <LineSeriesChart
            data={residuals}
            xKey="timestamp"
            series={[{ key: "residual", label: "Residual", color: "var(--color-chart-4)" }]}
            yTickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
            height={280}
          />
        </Panel>
      </div>

      <Panel className="mt-4" title="Most recent held-out predictions" description="Each row pairs the forecast with the outcome that followed it.">
        <Table
          head={["Timestamp", "Predicted", "Realised", "Error", "Sign", "Confidence"]}
          rows={preds
            .slice(-15)
            .reverse()
            .map((p) => [
              p.timestamp,
              <span key={`${p.timestamp}-p`} className="num text-estimate">
                {fmtPct(p.prediction, 3)}
              </span>,
              <span key={`${p.timestamp}-r`} className={p.realised >= 0 ? "text-positive" : "text-negative"}>
                {fmtPct(p.realised, 3)}
              </span>,
              fmtPct(p.realised - p.prediction, 3),
              <span
                key={`${p.timestamp}-s`}
                className={Math.sign(p.prediction) === Math.sign(p.realised) ? "text-positive" : "text-negative"}
              >
                {Math.sign(p.prediction) === Math.sign(p.realised) ? "correct" : "wrong"}
              </span>,
              fmtNum(p.confidence, 3),
            ])}
        />
      </Panel>
    </Shell>
  );
}
