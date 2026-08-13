import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { runInit } from '../src/cli/init.js';

describe('runInit (dry run)', () => {
  it('reports all files as created in dry-run mode', async () => {
    const result = await runInit({
      cwd: '/tmp/nonexistent-init-test',
      dryRun: true,
    });

    expect(result.created.length).toBeGreaterThan(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.overwritten).toHaveLength(0);
  });
});

describe('runInit (real copy)', () => {
  let sandbox: string;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'ig-init-'));
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it('creates AGENTS.md from template with project name replaced', async () => {
    await runInit({ cwd: sandbox, name: 'my-cool-project' });

    const agentsPath = join(sandbox, 'AGENTS.md');
    expect(existsSync(agentsPath)).toBe(true);
    const content = readFileSync(agentsPath, 'utf8');
    expect(content).toContain('my-cool-project');
    expect(content).not.toContain('{{PROJECT_NAME}}');
  });

  it('creates project.config.yaml from example', async () => {
    await runInit({ cwd: sandbox });

    const configPath = join(sandbox, 'project.config.yaml');
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf8');
    expect(content).toContain('name: my-project');
  });

  it('creates .github/labels.yaml', async () => {
    await runInit({ cwd: sandbox });

    const labelsPath = join(sandbox, '.github', 'labels.yaml');
    expect(existsSync(labelsPath)).toBe(true);
  });

  it('creates all 4 issue templates', async () => {
    await runInit({ cwd: sandbox });

    const issueTemplateDir = join(sandbox, '.github', 'issue-templates');
    const files = readdirSync(issueTemplateDir);
    expect(files).toContain('development.md');
    expect(files).toContain('testing.md');
    expect(files).toContain('bug.md');
    expect(files).toContain('documentation.md');
  });

  it('creates all 9 agent prompts', async () => {
    await runInit({ cwd: sandbox });

    const agentsDir = join(sandbox, '.opencode', 'agents');
    const files = readdirSync(agentsDir);
    expect(files).toContain('orchestrator.md');
    expect(files).toContain('product.md');
    expect(files).toContain('developer.md');
    expect(files).toContain('qa-spec.md');
    expect(files).toContain('qa-run.md');
    expect(files).toContain('reviewer.md');
    expect(files).toContain('gatekeeper.md');
    expect(files).toContain('docs.md');
    expect(files).toContain('deploy.md');
  });

  it('creates design-system doc template', async () => {
    await runInit({ cwd: sandbox });

    const dsPath = join(sandbox, 'design-system', 'design-system.doc.md');
    expect(existsSync(dsPath)).toBe(true);
  });

  it('is non-destructive on second run (skips existing)', async () => {
    await runInit({ cwd: sandbox });
    const result2 = await runInit({ cwd: sandbox });

    expect(result2.created).toHaveLength(0);
    expect(result2.skipped.length).toBeGreaterThan(0);
    expect(result2.overwritten).toHaveLength(0);
  });

  it('overwrites with --force', async () => {
    await runInit({ cwd: sandbox });
    const result2 = await runInit({ cwd: sandbox, force: true });

    expect(result2.created).toHaveLength(0);
    expect(result2.overwritten.length).toBeGreaterThan(0);
    expect(result2.skipped).toHaveLength(0);
  });
});
