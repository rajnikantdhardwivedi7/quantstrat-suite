import { createFileRoute } from "@tanstack/react-router";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Experiment Registry — STRATUM" },
      {
        name: "description",
        content:
          "Every run is recorded with its dataset version, feature version, hyperparameters, split boundaries, seed and metrics, so any figure can be reproduced exactly.",
      },
      { property: "og:title", content: "Experiment Registry — STRATUM" },
      {
        property: "og:description",
        content: "Model registry, experiment lineage and the reproducibility contract behind every number shown.",
      },
    ],
  }),
  component: Experiments,
});

function Experiments() {
  const exp = getExperiment();
  const e = exp.experiment;
  const model = exp.model;

  return (
    <Shell
      title="Experiments"
      subtitle="Reproducibility is a feature: same seed, same code, same numbers, every time."
      meta={<Provenance kind="observed" note="Metadata about this run" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Experiment" value={e.experimentId} hint={`Created ${e.createdAt}`} />
        <Stat label="Registered model" value={`${model.name} ${model.version}`} hint={`Stage: ${model.stage}`} />
        <Stat label="Seed" value={String(e.seed)} hint="Deterministic mulberry32 stream" />
        <Stat label="Feature version" value={e.featureVersion} hint="Bumped whenever a feature definition changes" />
      </div>

      <Panel className="mt-6" title="Experiment record" description="The exact lineage stored by the registry.">
        <KeyValue
          items={[
            ["Experiment ID", e.experimentId],
            ["Model", `${e.modelName} ${e.modelVersion}`],
            ["Dataset version", <span key="dv" className="num text-xs">{e.datasetVersion}</span>],
            ["Feature version", e.featureVersion],
            ["Training period", `${e.trainingPeriod[0]} → ${e.trainingPeriod[1]}`],
            ["Validation period", `${e.validationPeriod[0]} → ${e.validationPeriod[1]}`],
            ["Test period", `${e.testPeriod[0]} → ${e.testPeriod[1]}`],
            ["Seed", String(e.seed)],
            ["Created", e.createdAt],
          ]}
        />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Recorded metrics" description="Stored alongside the run, model metrics and strategy metrics kept apart.">
          <Table
            head={["Metric", "Value"]}
            rows={Object.entries(e.metrics).map(([k, v]) => [
              <span key={k} className="num">
                {k}
              </span>,
              <span key={`${k}-v`} className="num">
                {k.includes("return") || k.includes("drawdown") || k.includes("rmse") ? fmtPct(v, 3) : fmtNum(v, 4)}
              </span>,
            ])}
          />
        </Panel>
        <Panel title="Hyperparameters" description="Everything that would change the result if altered.">
          <Table
            head={["Parameter", "Value"]}
            rows={Object.entries(e.hyperparameters).map(([k, v]) => [
              <span key={k} className="num">
                {k}
              </span>,
              <span key={`${k}-v`} className="num">
                {String(v)}
              </span>,
            ])}
          />
        </Panel>
      </div>

      <Panel className="mt-4" title="Model artifact" description="The fitted object is stored, not just its metrics.">
        <Table
          head={["Field", "Value"]}
          rows={[
            ["Kind", model.kind],
            ["Intercept", fmtNum(model.artifact.intercept, 6)],
            ["Coefficients", fmtInt(model.artifact.coefficients.length)],
            ["Standardisation", "Means and standard deviations fitted on the training segment only"],
            ["Serialisation", "Plain JSON, so a run can be replayed without refitting"],
          ]}
        />
      </Panel>

      <Panel className="mt-4" title="Reproducibility contract" description="What must hold for a number on this site to be trustworthy.">
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>• Data generation is seeded, so the price series is identical on every run and every machine.</li>
          <li>• Feature computation is pure: no wall-clock time, no randomness, no mutable global state.</li>
          <li>• Splits are index-based and chronological, with an embargo equal to the label horizon.</li>
          <li>• Standardisation and model fitting see the training segment only.</li>
          <li>• Backtest execution lags every signal by at least one bar and charges costs on every rebalance.</li>
          <li>• Model quality and strategy quality are reported as separate sets of metrics and never merged.</li>
          <li>• Any figure that is an estimate or a simulation is labelled as such where it appears.</li>
        </ul>
      </Panel>
    </Shell>
  );
}
