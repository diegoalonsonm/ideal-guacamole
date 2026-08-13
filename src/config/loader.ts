import { readFileSync } from 'node:fs';

import { load as yamlLoad } from 'js-yaml';

import { projectConfigSchema, type ProjectConfig } from './schema.js';

export class ConfigValidationError extends Error {
  public readonly issues: readonly (readonly [string, string])[];

  public constructor(message: string, issues: readonly (readonly [string, string])[]) {
    super(message);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

export function parseConfig(raw: unknown): ProjectConfig {
  const result = projectConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => [issue.path.join('.') || '<root>', issue.message] as const,
    );
    throw new ConfigValidationError('Invalid project.config.yaml', issues);
  }
  return result.data;
}

export function loadConfig(configPath: string): ProjectConfig {
  const raw = yamlLoad(readFileSync(configPath, 'utf8'));
  return parseConfig(raw);
}

export function loadConfigOrThrow(configPath: string): ProjectConfig {
  try {
    return loadConfig(configPath);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      const detail = error.issues.map(([p, m]) => `  ${p}: ${m}`).join('\n');
      throw new Error(`${error.message}:\n${detail}`, { cause: error });
    }
    throw error;
  }
}
