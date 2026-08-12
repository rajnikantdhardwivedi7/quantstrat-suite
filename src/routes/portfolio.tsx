import { createFileRoute } from "@tanstack/react-router";
import { CorrelationHeatmap, WeightsChart } from "@/components/stratum/charts";
import { KeyValue, Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtNum, fmtPct } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio Optimisation — STRATUM" },
      {
        name: "description",
        content:
          "Mean-variance, minimum-variance and risk-aware allocations over a six-asset synthetic universe, solved by projected gradient descent under explicit constraints.",
      },
      { property: "og:title", content: "Portfolio Optimisation — STRATUM" },
      {
        property: "og:description",
        content: "Optimised weights, expected risk and return, correlation structure and the estimation caveats.",
      },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const exp = getExperiment();
  const opts = exp.optimisations;
  const minVar = opts.find((o) => o.objective === "min_variance") ?? opts[0]!;
  const maxSharpe = opts.find((o) => o.objective === "max_sharpe") ?? opts[0]!;
  const equal = opts.find((o) => o.objective === "equal_weight") ?? opts[0]!;

  return (
    <Shell
      title="Portfolio"
      subtitle="Cross-sectional allocation over the synthetic universe, with every input estimated from the same sample."
      meta={<Provenance kind="estimate" note="Optimiser output on sample moments" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Assets" value={String(exp.universe.length)} hint="Shared market factor plus idiosyncratic noise" />
        <Stat label="Min-variance vol" value={fmtPct(minVar.expectedVolatility)} tone="estimate" hint="Annualised, from the sample covariance matrix" />
        <Stat label="Equal-weight vol" value={fmtPct(equal.expectedVolatility)} tone="estimate" hint="Naive 1/N benchmark" />
        <Stat label="Max-Sharpe estimate" value={fmtNum(maxSharpe.expectedSharpe)} tone="estimate" hint="In-sample; expect decay out of sample" />
      </div>

      <div className="panel mt-6 border-estimate/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-estimate">These are estimates, not forecasts.</strong> Expected returns come from
        sample means, which are notoriously unstable; the covariance matrix is better estimated but still noisy. The
        minimum-variance and equal-weight solutions depend far less on the mean vector and are therefore more robust
        than the maximum-Sharpe solution shown alongside them.
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {opts.map((o) => (
          <Panel
            key={o.objective}
            title={o.objective.replace(/_/g, " ")}
            description={`Expected return ${fmtPct(o.expectedReturn)} · volatility ${fmtPct(o.expectedVolatility)} · Sharpe ${fmtNum(o.expectedSharpe)} · ${o.iterations} iterations`}
          >
            <WeightsChart data={o.symbols.map((s, i) => ({ label: s, value: o.weights[i]! }))} height={220} />
          </Panel>
        ))}
      </div>

      <Panel className="mt-4" title="Objective comparison" description="Same inputs and constraints, four objectives.">
        <Table
          head={["Objective", "Expected return", "Expected vol", "Expected Sharpe", "Largest weight", "Iterations"]}
          rows={opts.map((o) => [
            <span key={o.objective} className="num">
              {o.objective}
            </span>,
            fmtPct(o.expectedReturn),
            fmtPct(o.expectedVolatility),
            fmtNum(o.expectedSharpe),
            `${o.symbols[o.weights.indexOf(Math.max(...o.weights))]} · ${fmtPct(Math.max(...o.weights))}`,
            String(o.iterations),
          ])}
        />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Correlation matrix" description="Pearson correlation of daily log returns across the universe.">
          <CorrelationHeatmap symbols={exp.correlation.symbols} matrix={exp.correlation.matrix} />
        </Panel>
        <Panel title="Constraints and method" description="What the solver is allowed to do.">
          <KeyValue
            items={[
              ["Solver", "Projected gradient descent onto the constraint set"],
              ["Long only", minVar.constraints.longOnly ? "Yes" : "No"],
              ["Weights sum to", fmtNum(minVar.constraints.sumTo, 2)],
              ["Max weight", fmtPct(minVar.constraints.maxWeight)],
              ["Min weight", fmtPct(minVar.constraints.minWeight)],
              ["Risk aversion", fmtNum(minVar.constraints.riskAversion, 2)],
              ["Covariance estimator", "Sample covariance of daily log returns, annualised by 252"],
              ["Expected returns", "Sample mean of daily log returns, annualised by 252"],
              ["Not modelled", "Transaction costs of rebalancing to these weights, borrow limits, factor exposures"],
            ]}
          />
        </Panel>
      </div>

      <Panel className="mt-4" title="Universe statistics" description="Per-asset inputs behind the optimisation.">
        <Table
          head={["Symbol", "Name", "Class", "Last", "Ann. vol", "Min-var weight", "Max-Sharpe weight"]}
          rows={exp.universe.map((u) => {
            const i = minVar.symbols.indexOf(u.symbol);
            return [
              <span key={u.symbol} className="num">
                {u.symbol}
              </span>,
              u.name,
              <span key={`${u.symbol}-c`} className="text-xs text-muted-foreground">
                {u.assetClass}
              </span>,
              fmtNum(u.lastClose),
              fmtPct(u.annualVol),
              fmtPct(minVar.weights[i] ?? 0),
              fmtPct(maxSharpe.weights[i] ?? 0),
            ];
          })}
        />
      </Panel>
    </Shell>
  );
}
