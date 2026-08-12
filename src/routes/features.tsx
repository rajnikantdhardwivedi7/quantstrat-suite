import { createFileRoute } from "@tanstack/react-router";
import { LineSeriesChart } from "@/components/stratum/charts";
import { Panel, Provenance, Shell, Stat, Table } from "@/components/stratum/shell";
import { fmtInt, fmtNum } from "@/lib/format";
import { getExperiment } from "@/stratum/store";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Feature Explorer — STRATUM" },
      {
        name: "description",
        content:
          "Eighteen trailing-window features with declared lookbacks, source columns and versioning, built so that row t uses only information available at or before t.",
      },
      { property: "og:title", content: "Feature Explorer — STRATUM" },
      {
        property: "og:description",
        content: "Feature metadata, warm-up handling and the causality invariant that prevents look-ahead bias.",
      },
    ],
  }),
  component: FeatureExplorer;
});

function FeatureExplorer() {
  return null;
}
