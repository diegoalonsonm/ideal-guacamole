import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface UpgradeOptions {
  cwd: string;
  dryRun?: boolean | undefined;
  force?: boolean | undefined;
}

export interface UpgradeResult {
  created: string[];
  updated: string[];
  conflict: string[];
  unchanged: string[];
}

const CONFLICT_MARKER_START = '<<<<<<< ideal-guacamole';
const CONFLICT_MARKER_SEPARATOR = '=======';
const CONFLICT_MARKER_END = '>>>>>>> user';

function getTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'templates');
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const TEMPLATE_REPLACEMENTS = new Map<string, string>([
  ['AGENTS.md.template', 'AGENTS.md'],
  ['project.config.example.yaml', 'project.config.yaml'],
]);

function getOutputFilename(relPath: string): string {
  const parts = relPath.split('/');
  const filename = parts.at(-1) ?? relPath;
  const replacement = TEMPLATE_REPLACEMENTS.get(filename);
  if (replacement) {
    parts[parts.length - 1] = replacement;
  }
  return parts.join('/');
}

export function mergeWithConflictMarkers(existing: string, incoming: string): string {
  if (existing === incoming) return existing;

  return [
    CONFLICT_MARKER_START,
    ...incoming.split('\n'),
    CONFLICT_MARKER_SEPARATOR,
    ...existing.split('\n'),
    CONFLICT_MARKER_END,
  ].join('\n');
}

export function runUpgrade(options: UpgradeOptions): UpgradeResult {
  const templatesDir = getTemplatesDir();

  const created: string[] = [];
  const updated: string[] = [];
  const conflict: string[] = [];
  const unchanged: string[] = [];

  const allFiles = walkDir(templatesDir);

  for (const srcPath of allFiles) {
    const relPath = relative(templatesDir, srcPath);
    const outputRel = getOutputFilename(relPath);
    const destPath = join(options.cwd, outputRel);

    const incomingContent = readFileSync(srcPath, 'utf8');

    if (!existsSync(destPath)) {
      if (!options.dryRun) {
        const destDir = dirname(destPath);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        writeFileSync(destPath, incomingContent, 'utf8');
      }
      created.push(outputRel);
      continue;
    }

    const existingContent = readFileSync(destPath, 'utf8');

    if (options.force) {
      if (!options.dryRun) {
        writeFileSync(destPath, incomingContent, 'utf8');
      }
      updated.push(outputRel);
      continue;
    }

    if (existingContent === incomingContent) {
      unchanged.push(outputRel);
      continue;
    }

    const mergedContent = mergeWithConflictMarkers(existingContent, incomingContent);
    if (!options.dryRun) {
      writeFileSync(destPath, mergedContent, 'utf8');
    }
    conflict.push(outputRel);
  }

  return { created, updated, conflict, unchanged };
}
