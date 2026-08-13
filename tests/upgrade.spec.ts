import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { runUpgrade, mergeWithConflictMarkers } from '../src/cli/upgrade.js';

describe('mergeWithConflictMarkers', () => {
  it('returns unchanged content when lines match', () => {
    const result = mergeWithConflictMarkers('a\nb\nc', 'a\nb\nc');
    expect(result).toBe('a\nb\nc');
  });

  it('adds conflict markers when lines differ', () => {
    const result = mergeWithConflictMarkers('old line\nb', 'new line\nb');
    expect(result).toContain('<<<<<<< ideal-guacamole');
    expect(result).toContain('=======');
    expect(result).toContain('>>>>>>> user');
    expect(result).toContain('new line');
    expect(result).toContain('old line');
  });
});

describe('runUpgrade', () => {
  let sandbox: string;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'ig-upgrade-'));
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it('creates new files that do not exist', () => {
    const result = runUpgrade({ cwd: sandbox });
    expect(result.created.length).toBeGreaterThan(0);
    expect(existsSync(join(sandbox, 'AGENTS.md'))).toBe(true);
  });

  it('reports unchanged for identical existing files', () => {
    runUpgrade({ cwd: sandbox });
    const result2 = runUpgrade({ cwd: sandbox });
    expect(result2.created).toHaveLength(0);
    expect(result2.unchanged.length).toBeGreaterThan(0);
  });

  it('reports conflict for modified files', () => {
    runUpgrade({ cwd: sandbox });
    const agentsPath = join(sandbox, 'AGENTS.md');
    writeFileSync(agentsPath, '# Custom AGENTS\n\nMy custom content.', 'utf8');
    const result = runUpgrade({ cwd: sandbox });
    expect(result.conflict).toContain('AGENTS.md');
    const content = readFileSync(agentsPath, 'utf8');
    expect(content).toContain('<<<<<<< ideal-guacamole');
    expect(content).toContain('# Custom AGENTS');
  });

  it('overwrites with --force (no merge)', () => {
    runUpgrade({ cwd: sandbox });
    const agentsPath = join(sandbox, 'AGENTS.md');
    writeFileSync(agentsPath, '# Custom', 'utf8');
    const result = runUpgrade({ cwd: sandbox, force: true });
    expect(result.updated).toContain('AGENTS.md');
    const content = readFileSync(agentsPath, 'utf8');
    expect(content).not.toContain('# Custom');
  });

  it('dry-run does not write files', () => {
    const result = runUpgrade({ cwd: sandbox, dryRun: true });
    expect(result.created.length).toBeGreaterThan(0);
    expect(existsSync(join(sandbox, 'AGENTS.md'))).toBe(false);
  });
});
