import { createFileRoute } from "@tanstack/react-router";
import { LineSeriesChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Feature Explorer — STRATUM" },
      {
        name: "description",
        content:
          "Trailing-window features with declared lookbacks, source columns and a version tag, built so row t uses only information available at or before t.",
      },
      { property: "og:title", content: "Feature Explorer — STRATUM" },
      {
        property: "og:description",
        content: "Feature metadata, warm-up handling and the causality invariant that prevents look-ahead bias.",
      },
    ],
  }),
  component: FeatureExplorer,
});

function FeatureExplorer() {
  const exp = getExperiment();
  const { specs, rows, timestamps } = exp.features;
  const maxLookback = Math.max(...specs.map((s) => s.lookback));

  const trace = (names: string[]) =>
    timestamps.slice(-400).map((t, k) => {
      const rowIndex = timestamps.length - 400 + k;
      const row = rows[rowIndex]!;
      const point: Record<string, string | number> = { timestamp: t };
      for (const n of names) point[n] = row[specs.findIndex((s) => s.name === n)] ?? 0;
      return point;
    });

  const groups = Array.from(new Set(specs.map((s) => s.group)));

  return (
    <Shell
      title="Feature Explorer"
      subtitle="Every feature declares its lookback so the pipeline can prove it never reads a future bar."
      meta={<Provenance kind="simulated" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Features" value={fmtInt(specs.length)} hint={`Version ${exp.features.version}`} />
        <Stat label="Feature groups" value={fmtInt(groups.length)} hint={groups.join(", ")} />
        <Stat label="Max lookback" value={`${maxLookback} bars`} hint="Longest trailing window required" />
        <Stat label="Warm-up rows dropped" value={fmtInt(exp.droppedRows)} hint="Rows with an incomplete window are removed, not imputed" />
      </div>

      <Panel
        className="mt-6"
        title="Causality invariant"
        description="The rule the whole platform depends on."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Feature row <span className="num">t</span> is computed from bars{" "}
          <span className="num">t - lookback + 1 … t</span> only. The label is the forward return over{" "}
          <span className="num">{exp.config.horizon}</span> bar(s), so it lives strictly in the future relative to its
          features. Rows whose forward window is incomplete are dropped, and signals are executed with a{" "}
          <span className="num">{exp.config.backtest.executionLag}</span>-bar lag. Standardisation statistics are fitted
          on the training segment only and reused unchanged for validation and test, so no test-set information reaches
          the fit.
        </p>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Trend and momentum features" description="Standardised at model time; shown here in raw units.">
          <LineSeriesChart
            data={trace(["mom_21", "mom_63"])}
            xKey="timestamp"
            series={[
              { key: "mom_21", label: "21-bar momentum", color: "var(--color-chart-1)" },
              { key: "mom_63", label: "63-bar momentum", color: "var(--color-chart-3)" },
            ]}
            yTickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            height={220}
          />
        </Panel>
        <Panel title="Volatility features" description="Realised volatility over two horizons.">
          <LineSeriesChart
            data={trace(["vol_21", "vol_63"])}
            xKey="timestamp"
            series={[
              { key: "vol_21", label: "21-bar vol", color: "var(--color-chart-2)" },
              { key: "vol_63", label: "63-bar vol", color: "var(--color-chart-4)" },
            ]}
            yTickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            height={220}
          />
        </Panel>
        <Panel title="RSI (14)" description="Bounded oscillator; 30/70 are the conventional reference levels.">
          <LineSeriesChart
            data={trace(["rsi_14"])}
            xKey="timestamp"
            series={[{ key: "rsi_14", label: "RSI 14", color: "var(--color-primary)" }]}
            yTickFormatter={(v) => v.toFixed(0)}
            height={220}
          />
        </Panel>
        <Panel title="Bollinger %B and z-score" description="Position of price within its trailing distribution.">
          <LineSeriesChart
            data={trace(["bollinger_pctb", "zscore_20"])}
            xKey="timestamp"
            series={[
              { key: "bollinger_pctb", label: "%B", color: "var(--color-chart-5)" },
              { key: "zscore_20", label: "z-score 20", color: "var(--color-chart-2)" },
            ]}
            yTickFormatter={(v) => v.toFixed(1)}
            height={220}
          />
        </Panel>
      </div>

      <Panel className="mt-4" title="Feature dictionary" description="Machine-readable metadata; the same list drives the model input order.">
        <Table
          head={["Feature", "Group", "Lookback", "Sources", "Definition"]}
          rows={specs.map((s) => [
            <span key={s.name} className="num text-foreground">
              {s.name}
            </span>,
            <span key={`${s.name}-g`} className="text-xs text-muted-foreground">
              {s.group}
            </span>,
            <span key={`${s.name}-l`} className="num">
              {s.lookback}
            </span>,
            <span key={`${s.name}-s`} className="num text-xs text-muted-foreground">
              {s.sourceColumns.join(", ")}
            </span>,
            <span key={`${s.name}-d`} className="text-xs text-muted-foreground">
              {s.description}
            </span>,
          ])}
        />
      </Panel>

      <Panel className="mt-4" title="Latest feature vector" description={`Computed on ${timestamps[timestamps.length - 1]}.`}>
        <KeyValue
          items={specs.map((s, i) => [s.name, <span key={s.name} className="num">{fmtNum(rows[rows.length - 1]![i]!, 4)}</span>])}
        />
      </Panel>
    </Shell>
  );
}
