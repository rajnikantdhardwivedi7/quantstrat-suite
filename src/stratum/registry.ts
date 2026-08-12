/**
 * Model registry and experiment tracking.
 *
 * Artifacts live in memory for this in-browser build (no filesystem or object
 * store available). The interface mirrors a real registry so that a persistent
 * backend can be substituted without touching callers.
 */

import type { TrainedStats } from "./models";

export class ModelNotFoundError extends Error {
  constructor(id: string) {
    super(`Model not found: ${id}`);
    this.name = "ModelNotFoundError";
  }
}

export type ModelStage = "staging" | "production" | "archived";

export interface ModelRecord {
  id: string;
  name: string;
  version: string;
  kind: "regression" | "classification";
  stage: ModelStage;
  createdAt: string;
  featureVersion: string;
  datasetVersion: string;
  hyperparameters: Record<string, number | string | boolean>;
  metrics: Record<string, number>;
  artifact: TrainedStats;
}

export interface ExperimentRecord {
  experimentId: string;
  modelName: string;
  modelVersion: string;
  datasetVersion: string;
  featureVersion: string;
  hyperparameters: Record<string, number | string | boolean>;
  trainingPeriod: [string, string];
  validationPeriod: [string, string];
  testPeriod: [string, string];
  metrics: Record<string, number>;
  seed: number;
  createdAt: string;
}

export class ModelRegistry {
  private records = new Map<string, ModelRecord>();

  registerModel(record: Omit<ModelRecord, "id" | "stage" | "createdAt">, stage: ModelStage = "staging"): ModelRecord {
    const id = `${record.name.toLowerCase().replace(/\s+/g, "-")}:${record.version}`;
    const full: ModelRecord = { ...record, id, stage, createdAt: new Date().toISOString() };
    this.records.set(id, full);
    return full;
  }

  loadModel(id: string): ModelRecord {
    const rec = this.records.get(id);
    if (!rec) throw new ModelNotFoundError(id);
    return rec;
  }

  listModels(): ModelRecord[] {
    return [...this.records.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  promoteModel(id: string): ModelRecord {
    const rec = this.loadModel(id);
    for (const other of this.records.values()) {
      if (other.stage === "production" && other.id !== id) other.stage = "archived";
    }
    rec.stage = "production";
    return rec;
  }

  archiveModel(id: string): ModelRecord {
    const rec = this.loadModel(id);
    rec.stage = "archived";
    return rec;
  }
}

export class ExperimentStore {
  private experiments: ExperimentRecord[] = [];

  save(record: ExperimentRecord): ExperimentRecord {
    this.experiments = [record, ...this.experiments.filter((e) => e.experimentId !== record.experimentId)];
    return record;
  }

  list(): ExperimentRecord[] {
    return this.experiments;
  }

  get(id: string): ExperimentRecord | undefined {
    return this.experiments.find((e) => e.experimentId === id);
  }
}

export const modelRegistry = new ModelRegistry();
export const experimentStore = new ExperimentStore();
