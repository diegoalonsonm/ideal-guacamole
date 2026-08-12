#!/usr/bin/env node
/**
 * `ideal-guacamole` CLI entrypoint (bin: `ideal-guacamole` and `ig`).
 *
 * Phase 0: emits framework metadata + a friendly banner so the binary is
 * invokable and `npx ideal-guacamole --version` resolves. Subcommands `init`
 * and `upgrade` will be wired in Phase 1 and Phase 7 respectively.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { getFrameworkInfo } from '../index.js';

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

const HELP_TEXT = `ideal-guacamole — Agentic development pipeline framework

USAGE
  ideal-guacamole <command> [options]
  ig <command> [options]

COMMANDS
  init        Scaffold a project with templates and labels (Phase 1)
  upgrade     Non-destructive upgrade of installed templates (Phase 7)
  info        Print framework metadata
  help        Print this help

OPTIONS
  --version   Print framework version
  --help      Alias for \`help\`
`;

const KNOWN_NOOP_COMMANDS = new Set(['init', 'upgrade']);

const HELP_COMMANDS = new Set([undefined, 'help', '--help', '-h']);

function main(): number {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (HELP_COMMANDS.has(command)) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }

  if (command === '--version' || command === '-v') {
    process.stdout.write(`${readPackageVersion()}\n`);
    return 0;
  }

  if (command === 'info') {
    const info = getFrameworkInfo();
    process.stdout.write(`name:    ${info.name}\n`);
    process.stdout.write(`version: ${readPackageVersion()}\n`);
    process.stdout.write(`phase:   0 (scaffolding)\n`);
    return 0;
  }

  if (command !== undefined && KNOWN_NOOP_COMMANDS.has(command)) {
    const cmd = command as 'init' | 'upgrade';
    const phase = cmd === 'init' ? 'Phase 1' : 'Phase 7';
    process.stderr.write(
      `ideal-guacamole: '${cmd}' is not implemented yet (${phase}).\n` +
        `Run 'ideal-guacamole help' to see available commands.\n`,
    );
    return 2;
  }

  const unknown = command ?? 'unknown';
  process.stderr.write(`ideal-guacamole: unknown command '${unknown}'.\n`);
  process.stderr.write(`Run 'ideal-guacamole help' for usage.\n`);
  return 2;
}

const exitCode = main();
process.exit(exitCode);
