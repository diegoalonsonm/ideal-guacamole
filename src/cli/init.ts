import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLabelsInRepo, type CreateLabelsResult } from '../github/labels.js';

export interface InitOptions {
  cwd: string;
  force?: boolean | undefined;
  dryRun?: boolean | undefined;
  name?: string | undefined;
  githubToken?: string | undefined;
  owner?: string | undefined;
  repo?: string | undefined;
}

export interface InitResult {
  created: string[];
  skipped: string[];
  overwritten: string[];
  labelsResult?: CreateLabelsResult | undefined;
}

const TEMPLATE_REPLACEMENTS = new Map<string, string>([
  ['AGENTS.md.template', 'AGENTS.md'],
  ['project.config.example.yaml', 'project.config.yaml'],
]);

function getTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'templates');
}

function getProjectName(options: InitOptions): string {
  if (options.name) return options.name;
  try {
    const pkgPath = join(options.cwd, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
    return pkg.name ?? 'my-project';
  } catch {
    return 'my-project';
  }
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

function getOutputFilename(relPath: string): string {
  const parts = relPath.split('/');
  const filename = parts.at(-1) ?? relPath;
  const replacement = TEMPLATE_REPLACEMENTS.get(filename);
  if (replacement) {
    parts[parts.length - 1] = replacement;
  }
  return parts.join('/');
}

function applyTemplate(content: string, name: string): string {
  return content.replaceAll('{{PROJECT_NAME}}', () => name);
}

export async function runInit(options: InitOptions): Promise<InitResult> {
  const templatesDir = getTemplatesDir();
  const projectName = getProjectName(options);

  const created: string[] = [];
  const skipped: string[] = [];
  const overwritten: string[] = [];

  const allFiles = walkDir(templatesDir);

  for (const srcPath of allFiles) {
    const relPath = relative(templatesDir, srcPath);
    const outputRel = getOutputFilename(relPath);
    const destPath = join(options.cwd, outputRel);

    const isExisting = existsSync(destPath);

    if (isExisting && !options.force) {
      skipped.push(outputRel);
      continue;
    }

    if (!options.dryRun) {
      const destDir = dirname(destPath);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      const content = readFileSync(srcPath, 'utf8');
      const processed = applyTemplate(content, projectName);
      writeFileSync(destPath, processed, 'utf8');
    }

    if (isExisting && options.force) {
      overwritten.push(outputRel);
    } else {
      created.push(outputRel);
    }
  }

  let labelsResult: CreateLabelsResult | undefined;

  if (options.githubToken && options.owner && options.repo) {
    labelsResult = await createLabelsInRepo({
      owner: options.owner,
      repo: options.repo,
      token: options.githubToken,
      dryRun: options.dryRun,
    });
  }

  return { created, skipped, overwritten, labelsResult };
}
