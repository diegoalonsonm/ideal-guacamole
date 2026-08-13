import { describe, expect, it } from 'vitest';

import {
  determineTestStatus,
  computeVerdict,
  calculateFlakinessRate,
  checkQuarantine,
  buildTestCaseResult,
  buildReportSummary,
  renderTestReport,
  DEFAULT_FLAKY_CONFIG,
  LABEL_FLAKY_TEST,
  LABEL_QUARANTINED,
  type RetryResult,
  type TestCaseResult,
  type DatedRun,
} from '../src/qa/index.js';

const CONFIG = {
  maxRetries: 3,
  flakyThreshold: 2,
  flakinessWindowRuns: 10,
  quarantineFlakinessThreshold: 0.2,
};

const pass: RetryResult = { attempt: 1, duration: 100, passed: true };
const fail: RetryResult = { attempt: 1, duration: 100, passed: false };

describe('determineTestStatus', () => {
  it('returns pass when all attempts passed', () => {
    expect(determineTestStatus([pass, pass, pass], CONFIG)).toBe('pass');
  });

  it('returns fail when all attempts failed', () => {
    expect(determineTestStatus([fail, fail, fail], CONFIG)).toBe('fail');
  });

  it('returns flaky when 2/3 passed', () => {
    expect(determineTestStatus([pass, pass, fail], CONFIG)).toBe('flaky');
  });

  it('returns fail when 1/3 passed (below threshold)', () => {
    expect(determineTestStatus([pass, fail, fail], CONFIG)).toBe('fail');
  });

  it('returns skipped when no attempts', () => {
    expect(determineTestStatus([], CONFIG)).toBe('skipped');
  });
});

describe('computeVerdict', () => {
  it('returns PASS when all pass', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'pass', duration: 1, retries: 0, attempts: [] },
      { name: 'b', status: 'pass', duration: 1, retries: 0, attempts: [] },
    ];
    expect(computeVerdict(results)).toBe('PASS');
  });

  it('returns FAIL when any fail', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'pass', duration: 1, retries: 0, attempts: [] },
      { name: 'b', status: 'fail', duration: 1, retries: 0, attempts: [] },
    ];
    expect(computeVerdict(results)).toBe('FAIL');
  });

  it('returns FLAKY when no fail but some flaky', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'pass', duration: 1, retries: 0, attempts: [] },
      { name: 'b', status: 'flaky', duration: 1, retries: 1, attempts: [] },
    ];
    expect(computeVerdict(results)).toBe('FLAKY');
  });

  it('returns FAIL over FLAKY (fail is worse)', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'flaky', duration: 1, retries: 1, attempts: [] },
      { name: 'b', status: 'fail', duration: 1, retries: 0, attempts: [] },
    ];
    expect(computeVerdict(results)).toBe('FAIL');
  });

  it('returns NO_TESTS for empty results', () => {
    expect(computeVerdict([])).toBe('NO_TESTS');
  });
});

describe('calculateFlakinessRate', () => {
  it('returns 0 for empty history', () => {
    expect(calculateFlakinessRate([], 10)).toBe(0);
  });

  it('counts flaky runs (passed > 0 and failed > 0)', () => {
    const runs: DatedRun[] = [
      { passed: 3, failed: 0, total: 3, flakinessRate: 0 },
      { passed: 2, failed: 1, total: 3, flakinessRate: 0.33 },
    ];
    expect(calculateFlakinessRate(runs, 10)).toBe(0.5);
  });

  it('respects window size', () => {
    const runs: DatedRun[] = [
      { passed: 3, failed: 0, total: 3, flakinessRate: 0 },
      { passed: 3, failed: 0, total: 3, flakinessRate: 0 },
      { passed: 2, failed: 1, total: 3, flakinessRate: 0.33 },
    ];
    // window of 2 → only last 2 runs count
    expect(calculateFlakinessRate(runs, 2)).toBe(0.5);
  });
});

describe('shouldQuarantine', () => {
  it('returns true when flakiness exceeds threshold', () => {
    const runs: DatedRun[] = Array.from({ length: 10 }, () => ({
      passed: 2,
      failed: 1,
      total: 3,
      flakinessRate: 0.33,
    }));
    const decision = checkQuarantine('test-x', runs, CONFIG);
    expect(decision.shouldQuarantine).toBe(true);
    expect(decision.reason).toContain('test-x');
  });

  it('returns false when flakiness is below threshold', () => {
    const runs: DatedRun[] = [
      { passed: 3, failed: 0, total: 3, flakinessRate: 0 },
      { passed: 3, failed: 0, total: 3, flakinessRate: 0 },
    ];
    const decision = checkQuarantine('test-y', runs, CONFIG);
    expect(decision.shouldQuarantine).toBe(false);
  });
});

describe('buildTestCaseResult', () => {
  it('builds a pass result', () => {
    const result = buildTestCaseResult(
      { name: 'login flow', attempts: [pass, pass, pass] },
      CONFIG,
    );
    expect(result.status).toBe('pass');
    expect(result.retries).toBe(2);
    expect(result.duration).toBe(300);
  });

  it('builds a flaky result with error preserved', () => {
    const result = buildTestCaseResult(
      { name: 'search', attempts: [pass, pass, fail], error: 'Timeout 5000ms' },
      CONFIG,
    );
    expect(result.status).toBe('flaky');
    expect(result.error).toBe('Timeout 5000ms');
  });
});

describe('buildReportSummary', () => {
  it('summarizes counts correctly', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'pass', duration: 1, retries: 0, attempts: [] },
      { name: 'b', status: 'fail', duration: 1, retries: 0, attempts: [] },
      { name: 'c', status: 'flaky', duration: 1, retries: 1, attempts: [] },
      { name: 'd', status: 'skipped', duration: 0, retries: 0, attempts: [] },
    ];
    const summary = buildReportSummary(results);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.flaky).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.total).toBe(4);
    expect(summary.verdict).toBe('FAIL');
  });
});

describe('renderTestReport', () => {
  it('renders markdown with PR number, table, and verdict', () => {
    const results: TestCaseResult[] = [
      { name: 'login', status: 'pass', duration: 100, retries: 0, attempts: [] },
      { name: 'checkout', status: 'fail', duration: 200, retries: 2, attempts: [] },
    ];
    const report = renderTestReport(results, 42);

    expect(report).toContain('PR #42');
    expect(report).toContain('| Test | Status | Duration | Retries |');
    expect(report).toContain('login');
    expect(report).toContain('checkout');
    expect(report).toContain('FAIL');
    expect(report).toContain('feedback sent to developer');
  });

  it('renders PASS verdict for all-pass results', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'pass', duration: 10, retries: 0, attempts: [] },
    ];
    const report = renderTestReport(results, 7);
    expect(report).toContain('PASS');
    expect(report).toContain('Gatekeeper can proceed');
  });

  it('renders FLAKY verdict with warning', () => {
    const results: TestCaseResult[] = [
      { name: 'a', status: 'flaky', duration: 10, retries: 1, attempts: [] },
    ];
    const report = renderTestReport(results, 15);
    expect(report).toContain('FLAKY');
    expect(report).toContain('do **not** block');
  });
});

describe('constants', () => {
  it('exports correct label names', () => {
    expect(LABEL_FLAKY_TEST).toBe('flaky-test');
    expect(LABEL_QUARANTINED).toBe('quarantined');
  });

  it('exports default config with correct values', () => {
    expect(DEFAULT_FLAKY_CONFIG.maxRetries).toBe(3);
    expect(DEFAULT_FLAKY_CONFIG.flakyThreshold).toBe(2);
    expect(DEFAULT_FLAKY_CONFIG.quarantineFlakinessThreshold).toBe(0.2);
  });
});
