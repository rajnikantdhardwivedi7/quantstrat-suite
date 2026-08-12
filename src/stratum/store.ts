/** Single memoised experiment run shared by every dashboard page. */

import { DEFAULT_PIPELINE_CONFIG, runExperiment, type ExperimentOutput, type PipelineConfig } from "./pipeline";

let cache: { key: string; output: ExperimentOutput } | null = null;

export function getExperiment(config: PipelineConfig = DEFAULT_PIPELINE_CONFIG): ExperimentOutput {
  const key = JSON.stringify(config);
  if (cache && cache.key === key) return cache.output;
  const output = runExperiment(config);
  cache = { key, output };
  return output;
}
