import { createFileRoute } from "@tanstack/react-router";
import { LineSeriesChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Data & Validation — STRATUM" },
      {
        name: "description",
        content:
          "Synthetic OHLCV ingestion through a provider abstraction, with duplicate, OHLC-consistency, missing-value and extreme-move validation.",
      },
      { property: "og:title", content: "Market Data & Validation — STRATUM" },
      {
        property: "og:description",
        content: "Provider-agnostic ingestion and a full data-quality report before any feature is computed.",
      },
    ],
  }),
  component: MarketData,
});

function MarketData() {
  const exp = getExperiment();
  const bars = exp.series.bars;
  const priceData = bars.slice(-500).map((b) => ({ timestamp: b.timestamp, close: b.adjClose, volume: b.volume }));
  const returns = bars.slice(-500).map((b, i, arr) => ({
    timestamp: b.timestamp,
    ret: i === 0 ? 0 : b.adjClose / arr[i - 1]!.adjClose - 1,
  }));

  return (
    <Shell
      title="Market Data"
      subtitle="Ingestion runs through the MarketDataProvider interface. The synthetic provider is the default so the system needs no API key."
      meta={<Provenance kind="simulated" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Provider" value={exp.provider.id} hint={exp.provider.label} />
        <Stat label="Bars ingested" value={fmtInt(bars.length)} hint="After cleaning" />
        <Stat label="Period" value={`${exp.validation.periodStart}`} hint={`through ${exp.validation.periodEnd}`} />
        <Stat
          label="Validation"
          value={exp.validation.passed ? "PASSED" : "FAILED"}
          tone={exp.validation.passed ? "positive" : "negative"}
          hint={`${exp.validation.issues.length} issue type(s) flagged`}
        />
      </div>

      <Panel className="mt-6" title={`${exp.config.symbol} adjusted close`} description="Simulated log-price process with volatility clustering and a shared market factor.">
        <LineSeriesChart
          data={priceData}
          xKey="timestamp"
          areaFirst
          series={[{ key: "close", label: "Adjusted close", color: "var(--color-primary)" }]}
          yTickFormatter={(v) => v.toFixed(0)}
          height={260}
        />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Daily simple returns" description="Last 500 simulated bars.">
          <LineSeriesChart
            data={returns}
            xKey="timestamp"
            series={[{ key: "ret", label: "Return", color: "var(--color-chart-2)" }]}
            yTickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
            height={220}
          />
        </Panel>
        <Panel title="Volume" description="Simulated volume scales with the absolute return of the bar.">
          <LineSeriesChart
            data={priceData}
            xKey="timestamp"
            series={[{ key: "volume", label: "Volume", color: "var(--color-chart-4)" }]}
            yTickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
            height={220}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Data validation report" description="Errors block the pipeline; warnings are surfaced and the rows are kept.">
          {exp.validation.issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues detected across {fmtInt(bars.length)} bars.</p>
          ) : (
            <Table
              head={["Check", "Severity", "Rows", "Detail"]}
              rows={exp.validation.issues.map((i) => [
                i.code,
                <span key={i.code} className={i.severity === "error" ? "text-negative" : "text-estimate"}>
                  {i.severity}
                </span>,
                fmtInt(i.count),
                <span key={`${i.code}-m`} className="text-xs text-muted-foreground">
                  {i.message}
                </span>,
              ])}
            />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Checks performed: duplicate timestamps, strict monotonicity, missing or non-finite values, OHLC consistency
            (high ≥ max(open, close) ≥ min(open, close) ≥ low), non-positive prices, and extreme single-bar moves.
          </p>
        </Panel>

        <Panel title="Universe" description="Six synthetic assets sharing one market factor, so covariances are non-trivial.">
          <Table
            head={["Symbol", "Class", "Last", "Daily", "Ann. vol"]}
            rows={exp.universe.map((u) => [
              <span key={u.symbol}>
                <span className="num">{u.symbol}</span>
                <span className="ml-2 text-xs text-muted-foreground">{u.name}</span>
              </span>,
              <span key={`${u.symbol}-c`} className="text-xs text-muted-foreground">
                {u.assetClass}
              </span>,
              fmtNum(u.lastClose),
              <span key={`${u.symbol}-r`} className={u.dailyReturn >= 0 ? "text-positive" : "text-negative"}>
                {fmtPct(u.dailyReturn)}
              </span>,
              fmtPct(u.annualVol),
            ])}
          />
        </Panel>
      </div>

      <Panel className="mt-4" title="Recent bars" description="Raw OHLCV as delivered by the provider.">
        <Table
          head={["Timestamp", "Open", "High", "Low", "Close", "Adj close", "Volume"]}
          rows={bars
            .slice(-12)
            .reverse()
            .map((b) => [
              b.timestamp,
              fmtNum(b.open),
              fmtNum(b.high),
              fmtNum(b.low),
              fmtNum(b.close),
              fmtNum(b.adjClose),
              fmtInt(b.volume),
            ])}
        />
      </Panel>

      <Panel className="mt-4" title="Provider contract" description="No layer above ingestion knows which provider produced the data.">
        <KeyValue
          items={[
            ["Interface", "MarketDataProvider"],
            ["Methods", "getHistoricalPrices, getLatestPrices, getVolume, getAssetMetadata"],
            ["Implementations", "SyntheticDataProvider, CsvDataProvider"],
            ["Adjusted close", "Equals close for synthetic data (no corporate actions modelled)"],
            ["Timezone", "All timestamps are UTC calendar days"],
            ["Survivorship bias", "Not applicable to a fixed synthetic universe; would need a delisting-aware source"],
          ]}
        />
      </Panel>
    </Shell>
  );
}
