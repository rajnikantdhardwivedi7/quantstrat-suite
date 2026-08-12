import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; group: string }[] = [
  { to: "/", label: "Overview", group: "Research" },
  { to: "/market", label: "Market Data", group: "Research" },
  { to: "/features", label: "Feature Explorer", group: "Research" },
  { to: "/models", label: "Model Lab", group: "Modelling" },
  { to: "/predictions", label: "Predictions", group: "Modelling" },
  { to: "/signals", label: "Signals", group: "Modelling" },
  { to: "/backtest", label: "Backtesting", group: "Execution" },
  { to: "/portfolio", label: "Portfolio", group: "Execution" },
  { to: "/risk", label: "Risk", group: "Execution" },
  { to: "/experiments", label: "Experiments", group: "Platform" },
  { to: "/system", label: "System Health", group: "Platform" },
];

const GROUPS = ["Research", "Modelling", "Execution", "Platform"];

export function Shell({
  title,
  subtitle,
  children,
  meta,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          <div className="border-b border-sidebar-border px-5 py-5">
            <Link to="/" className="block">
              <div className="font-mono text-base font-semibold tracking-[0.2em] text-foreground">STRATUM</div>
              <div className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Layered Intelligence for Quantitative Decision Systems
              </div>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {GROUPS.map((group) => (
              <div key={group} className="mb-5">
                <div className="label-caps px-2 pb-2">{group}</div>
                {NAV.filter((n) => n.group === group).map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    activeOptions={{ exact: n.to === "/" }}
                    className="block rounded-sm px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                    activeProps={{ className: "bg-sidebar-accent text-primary" }}
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="border-t border-sidebar-border px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
            Research and educational system. Outputs are not financial advice.
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="grid-backdrop border-b border-border bg-surface/60">
            <div className="px-5 py-6 lg:px-8">
              <div className="lg:hidden">
                <div className="font-mono text-sm font-semibold tracking-[0.2em]">STRATUM</div>
              </div>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4 lg:mt-0">
                <div>
                  <h1 className="text-xl font-semibold text-foreground lg:text-2xl">{title}</h1>
                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
                </div>
                {meta}
              </div>
            </div>
          </header>
          <div className="px-5 py-6 lg:px-8">{children}</div>
          <nav className="border-t border-border px-5 py-4 lg:hidden">
            <div className="flex flex-wrap gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground"
                  activeProps={{ className: "border-primary text-primary" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
          <footer className="border-t border-border px-5 py-6 text-xs leading-relaxed text-muted-foreground lg:px-8">
            STRATUM is a research and educational quantitative-finance system. All figures on this site are computed
            at page load from a labelled synthetic price simulation. No real market data, no measured live performance,
            no investment advice.
          </footer>
        </main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("panel", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "estimate";
}) {
  const toneClass =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : tone === "estimate"
          ? "text-estimate"
          : "text-foreground";
  return (
    <div className="panel px-4 py-3">
      <div className="label-caps">{label}</div>
      <div className={cn("num mt-2 text-lg", toneClass)}>{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export type ProvenanceKind = "observed" | "simulated" | "prediction" | "backtest" | "estimate";

const PROVENANCE: Record<ProvenanceKind, { label: string; className: string }> = {
  observed: { label: "Observed data", className: "border-border-strong text-foreground" },
  simulated: { label: "Synthetic development data", className: "border-synthetic/60 text-synthetic" },
  prediction: { label: "Model prediction", className: "border-estimate/60 text-estimate" },
  backtest: { label: "Backtested result", className: "border-primary/60 text-primary" },
  estimate: { label: "Estimated quantity", className: "border-estimate/60 text-estimate" },
};

export function Provenance({ kind, note }: { kind: ProvenanceKind; note?: string }) {
  const p = PROVENANCE[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border bg-surface-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        p.className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {note ?? p.label}
    </span>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border-strong">
            {head.map((h) => (
              <th key={h} className="label-caps px-2 py-2 text-left font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={cn("px-2 py-1.5", j === 0 ? "" : "num")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1.5">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="num text-right text-[13px]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
