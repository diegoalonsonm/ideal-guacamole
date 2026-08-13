import { describe, expect, it } from 'vitest';

import {
  runReview,
  buildReviewReport,
  evaluateChecklist,
  computeReviewVerdict,
  getLabelForVerdict,
  DEFAULT_CHECKLIST,
} from '../src/reports/index.js';

describe('DEFAULT_CHECKLIST', () => {
  it('has 10 items', () => {
    expect(DEFAULT_CHECKLIST).toHaveLength(10);
  });

  it('all items start with isPassed: false', () => {
    for (const item of DEFAULT_CHECKLIST) {
      expect(item.isPassed).toBe(false);
    }
  });
});

describe('evaluateChecklist', () => {
  it('applies overrides for matching ids', () => {
    const items = evaluateChecklist({ lint: true, typecheck: true });
    const lintItem = items.find((i) => i.id === 'lint');
    const typecheckItem = items.find((i) => i.id === 'typecheck');
    const legibilityItem = items.find((i) => i.id === 'legibility');
    expect(lintItem?.isPassed).toBe(true);
    expect(typecheckItem?.isPassed).toBe(true);
    expect(legibilityItem?.isPassed).toBe(false);
  });

  it('all false when no overrides', () => {
    const items = evaluateChecklist({});
    for (const item of items) {
      expect(item.isPassed).toBe(false);
    }
  });
});

describe('computeReviewVerdict', () => {
  it('returns APPROVED when all items pass', () => {
    const items = evaluateChecklist({
      legibility: true,
      understandable: true,
      scalable: true,
      lint: true,
      typecheck: true,
      'unit-tests': true,
      'no-secrets': true,
      'no-build-artifacts': true,
      'conventional-commit': true,
      'linked-issues': true,
    });
    expect(computeReviewVerdict(items)).toBe('APPROVED');
  });

  it('returns CHANGES_REQUESTED when any item fails', () => {
    const items = evaluateChecklist({
      legibility: true,
      lint: true,
      typecheck: true,
    });
    expect(computeReviewVerdict(items)).toBe('CHANGES_REQUESTED');
  });
});

describe('getLabelForVerdict', () => {
  it('returns approved for APPROVED', () => {
    expect(getLabelForVerdict('APPROVED')).toBe('approved');
  });

  it('returns dev-done for CHANGES_REQUESTED', () => {
    expect(getLabelForVerdict('CHANGES_REQUESTED')).toBe('dev-done');
  });
});

describe('runReview', () => {
  it('builds a complete ReviewResult', () => {
    const result = runReview(42, { lint: true, typecheck: true }, 'Good code');
    expect(result.prNumber).toBe(42);
    expect(result.checklist).toHaveLength(10);
    expect(result.verdict).toBe('CHANGES_REQUESTED');
    expect(result.summary).toBe('Good code');
  });
});

describe('buildReviewReport', () => {
  it('renders markdown with verdict and checklist', () => {
    const result = runReview(
      7,
      {
        legibility: true,
        understandable: true,
        scalable: true,
        lint: true,
        typecheck: true,
        'unit-tests': true,
        'no-secrets': true,
        'no-build-artifacts': true,
        'conventional-commit': true,
        'linked-issues': true,
      },
      'All good',
    );
    const report = buildReviewReport(result);

    expect(report).toContain('PR #7');
    expect(report).toContain('APPROVED');
    expect(report).toContain('[x]');
    expect(report).toContain('Gatekeeper can proceed');
  });

  it('renders CHANGES_REQUESTED with warning', () => {
    const result = runReview(3, { lint: true }, 'Lint issues found');
    const report = buildReviewReport(result);

    expect(report).toContain('CHANGES_REQUESTED');
    expect(report).toContain('Changes requested');
  });
});
