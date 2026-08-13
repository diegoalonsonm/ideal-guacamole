import { describe, expect, it } from 'vitest';

import {
  buildPRReport,
  buildReleaseReport,
  type PRReportInput,
  type ReleaseReportInput,
} from '../src/reports/index.js';

describe('buildPRReport', () => {
  it('renders a PR report with issues and test summary', () => {
    const input: PRReportInput = {
      prNumber: 15,
      sourceBranch: 'feat/12-login',
      targetBranch: 'dev',
      issues: [{ number: 12, title: 'Implement login', category: 'development' }],
      testSummary: { passed: 5, failed: 0, flaky: 1, total: 6, verdict: 'FLAKY' },
      reviewVerdict: 'APPROVED',
    };

    const report = buildPRReport(input);

    expect(report).toContain('PR #15');
    expect(report).toContain('feat/12-login → dev');
    expect(report).toContain('#12');
    expect(report).toContain('Implement login');
    expect(report).toContain('Passed | 5');
    expect(report).toContain('APPROVED');
  });

  it('includes risks when provided', () => {
    const input: PRReportInput = {
      prNumber: 20,
      sourceBranch: 'feat/20-refactor',
      targetBranch: 'dev',
      issues: [],
      testSummary: { passed: 0, failed: 0, flaky: 0, total: 0, verdict: 'NO_TESTS' },
      reviewVerdict: 'CHANGES_REQUESTED',
      risks: ['DB migration not tested', 'Breaking API change'],
    };

    const report = buildPRReport(input);

    expect(report).toContain('### Risks');
    expect(report).toContain('DB migration not tested');
    expect(report).toContain('Breaking API change');
  });
});

describe('buildReleaseReport', () => {
  it('renders a complete release report', () => {
    const input: ReleaseReportInput = {
      version: '1.2.0',
      fromTag: 'v1.1.0',
      toRef: 'testing',
      issues: [
        { number: 10, title: 'Add auth', category: 'development' },
        { number: 11, title: 'Auth E2E tests', category: 'testing' },
      ],
      migrations: ['Add `email_verified` column to users'],
      featureFlags: ['ENABLE_OAUTH'],
      smokeTestPlan: ['Health check 200', 'Login flow works'],
      rollbackPlan: ['Revert to v1.1.0', 'Run npm run db:rollback'],
      changelog: '## [1.2.0]\n\n### Features\n- Add OAuth login',
    };

    const report = buildReleaseReport(input);

    expect(report).toContain('v1.2.0');
    expect(report).toContain('v1.1.0');
    expect(report).toContain('#10');
    expect(report).toContain('Add auth');
    expect(report).toContain('email_verified');
    expect(report).toContain('ENABLE_OAUTH');
    expect(report).toContain('[ ] Health check 200');
    expect(report).toContain('Revert to v1.1.0');
    expect(report).toContain('Human approval required');
  });

  it('uses defaults for empty optional fields', () => {
    const input: ReleaseReportInput = {
      version: '1.0.0',
      fromTag: 'v0.9.0',
      toRef: 'main',
      issues: [],
      migrations: [],
      featureFlags: [],
      smokeTestPlan: [],
      rollbackPlan: [],
      changelog: 'Initial release',
    };

    const report = buildReleaseReport(input);

    expect(report).toContain('- None');
    expect(report).toContain('Health check endpoint responds 200');
    expect(report).toContain('Revert to previous tag');
  });
});
