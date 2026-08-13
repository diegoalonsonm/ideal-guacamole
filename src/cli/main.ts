#!/usr/bin/env node
/**
 * `ideal-guacamole` CLI entrypoint (bin: `ideal-guacamole` and `ig`).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { Command } from 'commander';

import { getFrameworkInfo } from '../index.js';
import { runInit } from './init.js';
import { runUpgrade } from './upgrade.js';

function readPackageVersion(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packagePath = path.join(here, '..', '..', 'package.json');
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string };
    return packageJson.version ?? '0.0.0-development';
  } catch {
    return '0.0.0-development';
  }
}

async function action(): Promise<void> {
  const program = new Command();

  program
    .name('ideal-guacamole')
    .description('Agentic development pipeline framework')
    .version(readPackageVersion());

  program
    .command('info')
    .description('Print framework metadata')
    .action(() => {
      const info = getFrameworkInfo();
      process.stdout.write(`name:    ${info.name}\n`);
      process.stdout.write(`version: ${readPackageVersion()}\n`);
      process.stdout.write(`phase:   1 (init CLI)\n`);
    });

  program
    .command('init')
    .description('Scaffold a project with templates and labels')
    .option('--cwd <path>', 'Target directory', process.cwd())
    .option('--force', 'Overwrite existing files', false)
    .option('--dry-run', 'Preview without writing', false)
    .option('--name <name>', 'Project name (defaults to package.json name)')
    .option('--github-token <token>', 'GitHub token to create labels')
    .option('--owner <owner>', 'GitHub repo owner (requires --github-token)')
    .option('--repo <repo>', 'GitHub repo name (requires --github-token)')
    .action(async (opts: Record<string, string | boolean | undefined>) => {
      const result = await runInit({
        cwd: typeof opts.cwd === 'string' ? opts.cwd : process.cwd(),
        force: opts.force === true,
        dryRun: opts.dryRun === true,
        name: typeof opts.name === 'string' ? opts.name : undefined,
        githubToken: typeof opts.githubToken === 'string' ? opts.githubToken : undefined,
        owner: typeof opts.owner === 'string' ? opts.owner : undefined,
        repo: typeof opts.repo === 'string' ? opts.repo : undefined,
      });

      if (result.created.length > 0) {
        process.stdout.write(`\nCreated (${String(result.created.length)}):\n`);
        for (const f of result.created) {
          process.stdout.write(`  + ${f}\n`);
        }
      }

      if (result.overwritten.length > 0) {
        process.stdout.write(`\nOverwritten (${String(result.overwritten.length)}):\n`);
        for (const f of result.overwritten) {
          process.stdout.write(`  ~ ${f}\n`);
        }
      }

      if (result.skipped.length > 0) {
        process.stdout.write(`\nSkipped (${String(result.skipped.length)}):\n`);
        for (const f of result.skipped) {
          process.stdout.write(`  = ${f}\n`);
        }
      }

      if (result.labelsResult) {
        const lr = result.labelsResult;
        process.stdout.write(`\nLabels:\n`);
        process.stdout.write(`  created: ${String(lr.created.length)}\n`);
        process.stdout.write(`  updated: ${String(lr.updated.length)}\n`);
        process.stdout.write(`  skipped: ${String(lr.skipped.length)}\n`);
        if (lr.errors.length > 0) {
          process.stdout.write(`  errors:\n`);
          for (const [name, msg] of lr.errors) {
            process.stdout.write(`    ${name}: ${msg}\n`);
          }
        }
      }

      process.stdout.write('\nDone.\n');
    });

  program
    .command('upgrade')
    .description('Non-destructive upgrade of installed templates with conflict markers')
    .option('--cwd <path>', 'Target directory', process.cwd())
    .option('--dry-run', 'Preview without writing', false)
    .option('--force', 'Overwrite existing files (no merge)', false)
    .action((opts: Record<string, string | boolean | undefined>) => {
      const result = runUpgrade({
        cwd: typeof opts.cwd === 'string' ? opts.cwd : process.cwd(),
        dryRun: opts.dryRun === true,
        force: opts.force === true,
      });

      if (result.created.length > 0) {
        process.stdout.write(`\nNew files (${String(result.created.length)}):\n`);
        for (const f of result.created) {
          process.stdout.write(`  + ${f}\n`);
        }
      }

      if (result.updated.length > 0) {
        process.stdout.write(`\nOverwritten (${String(result.updated.length)}):\n`);
        for (const f of result.updated) {
          process.stdout.write(`  ~ ${f}\n`);
        }
      }

      if (result.conflict.length > 0) {
        process.stdout.write(
          `\nConflicts (merged with markers) (${String(result.conflict.length)}):\n`,
        );
        for (const f of result.conflict) {
          process.stdout.write(`  ! ${f}\n`);
        }
      }

      if (result.unchanged.length > 0) {
        process.stdout.write(`\nUnchanged (${String(result.unchanged.length)}):\n`);
        for (const f of result.unchanged) {
          process.stdout.write(`  = ${f}\n`);
        }
      }

      process.stdout.write('\nDone.\n');
    });

  try {
    await program.parseAsync();
  } catch (error: unknown) {
    process.stderr.write(
      `ideal-guacamole: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }
}

void action();
