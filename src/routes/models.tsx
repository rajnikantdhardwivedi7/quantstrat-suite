import { createFileRoute } from "@tanstack/react-router";
import { HorizontalBarChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Model Lab — STRATUM" },
      {
        name: "description",
        content:
          "Ridge and logistic models fitted on the training segment only, evaluated on an embargoed test split and across five expanding walk-forward folds.",
      },
      { property: "og:title", content: "Model Lab — STRATUM" },
      {
        property: "og:description",
        content: "Split design, walk-forward stability, coefficient and permutation importance, honest error metrics.",
      },
    ],
  }),
  component: ModelLab,
});

function ModelLab() {
  const exp = getExperiment();
  const perm = exp.permutationImportance.slice(0, 12).map((p) => ({ label: p.feature, value: p.importance }));
  const coef = exp.coefficientImportance.slice(0, 12).map((p) => ({ label: p.feature, value: p.importance }));

  return (
    <Shell
      title="Model Lab"
      subtitle="Two models from first principles: ridge regression on the forward return, logistic regression on its sign."
      meta={<Provenance kind="prediction" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Model" value={exp.model.name} hint={`${exp.model.version} · stage ${exp.model.stage}`} />
        <Stat label="Test R²" value={fmtNum(exp.regression.test.r2, 4)} hint={`${fmtInt(exp.regression.test.n)} held-out rows`} />
        <Stat label="Test RMSE" value={fmtPct(exp.regression.test.rmse, 3)} hint="Root mean squared error of predicted return" />
        <Stat
          label="Directional accuracy"
          value={fmtPct(exp.regression.test.directionalAccuracy)}
          hint="Baseline for a coin flip is 50%"
        />
      </div>

      <Panel
        className="mt-6"
        title="How to read these numbers"
        description="Reported as measured, including when they are unflattering."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          The target is the next-{exp.config.horizon}-bar return of a stochastic simulation with no exploitable
          structure beyond volatility clustering, so an R² close to zero — or negative, meaning worse than predicting
          the training mean — is the honest expected result. Directional accuracy within a couple of points of 50% and
          an ROC-AUC near 0.5 say the same thing. These pages exist to show that the measurement machinery is correct,
          not to claim predictive power.
        </p>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Split design" description={`Chronological, with a ${exp.config.horizon}-bar embargo between segments.`}>
          <Table
            head={["Segment", "Rows", "Start", "End"]}
            rows={[
              ["Train", fmtInt(exp.split.counts[0]), exp.split.train[0], exp.split.train[1]],
              ["Validation", fmtInt(exp.split.counts[1]), exp.split.validation[0], exp.split.validation[1]],
              ["Test", fmtInt(exp.split.counts[2]), exp.split.test[0], exp.split.test[1]],
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            No shuffling and no k-fold: rows are ordered in time, and the embargo removes the rows whose label window
            would otherwise straddle a boundary.
          </p>
        </Panel>

        <Panel title="Metrics by segment" description="Validation guided the hyperparameters; test was touched once.">
          <Table
            head={["Metric", "Validation", "Test"]}
            rows={[
              ["MAE", fmtPct(exp.regression.validation.mae, 3), fmtPct(exp.regression.test.mae, 3)],
              ["RMSE", fmtPct(exp.regression.validation.rmse, 3), fmtPct(exp.regression.test.rmse, 3)],
              ["R²", fmtNum(exp.regression.validation.r2, 4), fmtNum(exp.regression.test.r2, 4)],
              [
                "Directional accuracy",
                fmtPct(exp.regression.validation.directionalAccuracy),
                fmtPct(exp.regression.test.directionalAccuracy),
              ],
              ["Accuracy (sign)", fmtPct(exp.classification.validation.accuracy), fmtPct(exp.classification.test.accuracy)],
              ["Precision", fmtPct(exp.classification.validation.precision), fmtPct(exp.classification.test.precision)],
              ["Recall", fmtPct(exp.classification.validation.recall), fmtPct(exp.classification.test.recall)],
              ["F1", fmtNum(exp.classification.validation.f1, 3), fmtNum(exp.classification.test.f1, 3)],
              ["ROC-AUC", fmtNum(exp.classification.validation.rocAuc, 3), fmtNum(exp.classification.test.rocAuc, 3)],
            ]}
          />
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Walk-forward validation"
        description="Five expanding-window folds, each refitted from scratch and traded with the same costs."
        action={<Provenance kind="backtest" />}
      >
        <Table
          head={["Fold", "Train ends", "Test start", "Test end", "RMSE", "Directional acc.", "Fold Sharpe"]}
          rows={exp.walkForward.map((f) => [
            String(f.fold),
            f.trainEnd,
            f.testStart,
            f.testEnd,
            fmtPct(f.rmse, 3),
            fmtPct(f.directionalAccuracy),
            fmtNum(f.sharpe),
          ])}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Dispersion across folds is the interesting quantity: a single flattering fold is not evidence of an edge.
        </p>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Permutation importance" description="Increase in test RMSE when a single feature is shuffled.">
          <HorizontalBarChart data={perm} color="var(--color-chart-2)" />
        </Panel>
        <Panel title="Standardised coefficient magnitude" description="Absolute ridge weights on standardised inputs, normalised to sum to 1.">
          <HorizontalBarChart data={coef} />
        </Panel>
      </div>

      <Panel className="mt-4" title="Model card" description="What was fitted, on what, with which hyperparameters.">
        <KeyValue
          items={[
            ["Estimator", `${exp.model.name} (closed-form ridge, Gaussian elimination)`],
            ["Companion", "Logistic regression on the sign of the forward return (gradient descent)"],
            ["Model version", exp.model.version],
            ["Feature version", exp.model.featureVersion],
            ["Dataset version", <span key="dv" className="num text-xs">{exp.model.datasetVersion}</span>],
            ["Registered", exp.model.createdAt],
            ...Object.entries(exp.model.hyperparameters).map(
              ([k, v]) => [k, <span key={k} className="num">{String(v)}</span>] as [string, React.ReactNode],
            ),
            ["Intended use", "Research demonstration on synthetic data"],
            ["Out of scope", "Live trading, real-capital allocation, advice"],
          ]}
        />
      </Panel>
    </Shell>
  );
}
