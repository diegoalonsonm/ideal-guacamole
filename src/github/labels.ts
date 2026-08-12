import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load as yamlLoad } from 'js-yaml';
import { Octokit } from '@octokit/rest';

export interface LabelDefinition {
  name: string;
  color: string;
  description: string;
}

export interface LabelsFile {
  labels: LabelDefinition[];
}

export function loadLabelsFile(labelsPath: string): LabelDefinition[] {
  const raw = yamlLoad(readFileSync(labelsPath, 'utf8'));

  if (Array.isArray(raw)) {
    return raw as LabelDefinition[];
  }

  if (raw && typeof raw === 'object' && 'labels' in raw) {
    return (raw as LabelsFile).labels;
  }

  throw new Error(`Invalid labels file at ${labelsPath}: expected an array or { labels: [...] }`);
}

export function getBundledLabelsPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'templates', '.github', 'labels.yaml');
}

export function loadBundledLabels(): LabelDefinition[] {
  return loadLabelsFile(getBundledLabelsPath());
}

export interface CreateLabelsOptions {
  owner: string;
  repo: string;
  token: string;
  labelsPath?: string | undefined;
  dryRun?: boolean | undefined;
}

export interface CreateLabelsResult {
  created: string[];
  updated: string[];
  skipped: string[];
  errors: readonly (readonly [string, string])[];
}

export async function createLabelsInRepo(
  options: CreateLabelsOptions,
): Promise<CreateLabelsResult> {
  const labels = options.labelsPath ? loadLabelsFile(options.labelsPath) : loadBundledLabels();

  if (options.dryRun) {
    return {
      created: labels.map((l) => l.name),
      updated: [],
      skipped: [],
      errors: [],
    };
  }

  const octokit = new Octokit({ auth: options.token });

  const existing = new Map<string, LabelDefinition>();
  try {
    const { data } = await octokit.rest.issues.listLabelsForRepo({
      owner: options.owner,
      repo: options.repo,
      per_page: 100,
    });
    for (const label of data) {
      existing.set(label.name, {
        name: label.name,
        color: label.color,
        description: label.description ?? '',
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to list existing labels: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const errors: [string, string][] = [];

  for (const label of labels) {
    try {
      if (existing.has(label.name)) {
        await octokit.rest.issues.updateLabel({
          owner: options.owner,
          repo: options.repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
        updated.push(label.name);
      } else {
        await octokit.rest.issues.createLabel({
          owner: options.owner,
          repo: options.repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
        created.push(label.name);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push([label.name, msg]);
      skipped.push(label.name);
    }
  }

  return { created, updated, skipped, errors };
}
