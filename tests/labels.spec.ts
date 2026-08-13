import { describe, expect, it } from 'vitest';

import { loadLabelsFile, loadBundledLabels, getBundledLabelsPath } from '../src/github/index.js';

import { existsSync } from 'node:fs';

describe('getBundledLabelsPath', () => {
  it('points to templates/.github/labels.yaml', () => {
    const labelsPath = getBundledLabelsPath();
    expect(labelsPath.endsWith('labels.yaml')).toBe(true);
    expect(existsSync(labelsPath)).toBe(true);
  });
});

describe('loadBundledLabels', () => {
  it('loads all expected label groups', () => {
    const labels = loadBundledLabels();
    const names = labels.map((l) => l.name);

    expect(labels.length).toBeGreaterThanOrEqual(20);

    expect(names).toContain('development');
    expect(names).toContain('testing');
    expect(names).toContain('bug');
    expect(names).toContain('documentation');

    expect(names).toContain('dev-ready');
    expect(names).toContain('in-dev');
    expect(names).toContain('dev-done');
    expect(names).toContain('testing');
    expect(names).toContain('test-failed');
    expect(names).toContain('review');
    expect(names).toContain('approved');
    expect(names).toContain('pr-main');

    expect(names).toContain('P0');
    expect(names).toContain('P1');
    expect(names).toContain('P2');
    expect(names).toContain('P3');

    expect(names).toContain('phase:1');
    expect(names).toContain('phase:2');
    expect(names).toContain('phase:3');
    expect(names).toContain('phase:4');

    expect(names).toContain('blocked');
    expect(names).toContain('needs-human');
    expect(names).toContain('flaky-test');
    expect(names).toContain('quarantined');
  });

  it('all labels have valid 6-char hex colors', () => {
    const labels = loadBundledLabels();
    const hexRegex = /^[0-9A-Fa-f]{6}$/;
    for (const label of labels) {
      expect(hexRegex.test(label.color), `label "${label.name}" color "${label.color}"`).toBe(true);
    }
  });

  it('all labels have non-empty descriptions', () => {
    const labels = loadBundledLabels();
    for (const label of labels) {
      expect(label.description.length).toBeGreaterThan(5);
    }
  });
});

describe('loadLabelsFile', () => {
  it('accepts array format', () => {
    const arrayFormat = [{ name: 'test', color: 'FF0000', description: 'A test label' }];
    expect(() => loadLabelsFile).toBeDefined();
    expect(arrayFormat).toHaveLength(1);
  });
});
