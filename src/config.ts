import path from 'path';
import fs from 'fs';

export interface WorkflowConfig {
  research: boolean;
  plan_check: boolean;
  verifier: boolean;
  nyquist_validation?: boolean;
  auto_advance?: boolean;
}

export interface FmsConfig {
  mode: 'yolo' | 'interactive';
  granularity: 'coarse' | 'standard' | 'fine';
  parallelization: boolean;
  commit_docs: boolean;
  model_profile?: 'quality' | 'balanced' | 'budget';
  workflow: WorkflowConfig;
}

const DEFAULT_CONFIG: FmsConfig = {
  mode: 'yolo',
  granularity: 'standard',
  parallelization: true,
  commit_docs: true,
  model_profile: 'balanced',
  workflow: {
    research: true,
    plan_check: true,
    verifier: true,
    nyquist_validation: true,
    auto_advance: true,
  },
};

/**
 * Load config from fms root. Returns defaults if config.json is missing or invalid.
 * Does not throw.
 */
export function loadConfig(fmsRoot: string): FmsConfig {
  const configPath = path.join(fmsRoot, 'config.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(stripJsonComments(raw)) as Partial<FmsConfig>;
    return deepMerge(DEFAULT_CONFIG, parsed);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function stripJsonComments(str: string): string {
  return str
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
}

function deepMerge<T extends object>(base: T, override: Partial<T> | undefined): T {
  if (override == null) return base;
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const b = (base as Record<keyof T, unknown>)[key];
    const o = (override as Record<keyof T, unknown>)[key];
    if (o != null && typeof o === 'object' && !Array.isArray(o) && typeof b === 'object' && b != null && !Array.isArray(b)) {
      (result as Record<keyof T, unknown>)[key] = deepMerge(b as object, o as Record<string, unknown>) as T[keyof T];
    } else if (o !== undefined) {
      (result as Record<keyof T, unknown>)[key] = o;
    }
  }
  return result;
}
