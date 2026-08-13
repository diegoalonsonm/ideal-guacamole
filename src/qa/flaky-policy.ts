export type TestStatus = 'pass' | 'fail' | 'flaky' | 'skipped';

export type TestVerdict = 'PASS' | 'FAIL' | 'FLAKY' | 'NO_TESTS';

export interface RetryResult {
  attempt: number;
  duration: number;
  passed: boolean;
}

export interface TestCaseResult {
  name: string;
  status: TestStatus;
  duration: number;
  retries: number;
  attempts: RetryResult[];
  error?: string | undefined;
}

export interface DatedRun {
  passed: number;
  failed: number;
  total: number;
  flakinessRate: number;
}

export interface QuarantineDecision {
  shouldQuarantine: boolean;
  reason: string;
}

export const DEFAULT_FLAKY_CONFIG = {
  maxRetries: 3,
  flakyThreshold: 2,
  flakinessWindowRuns: 10,
  quarantineFlakinessThreshold: 0.2,
} as const;

export const LABEL_FLAKY_TEST = 'flaky-test';
export const LABEL_QUARANTINED = 'quarantined';

export interface FlakyPolicyConfig {
  maxRetries: number;
  flakyThreshold: number;
  flakinessWindowRuns: number;
  quarantineFlakinessThreshold: number;
}

export function determineTestStatus(
  attempts: RetryResult[],
  config: FlakyPolicyConfig,
): TestStatus {
  const passed = attempts.filter((attempt) => attempt.passed).length;
  const total = attempts.length;

  if (total === 0) {
    return 'skipped';
  }

  if (passed === total) {
    return 'pass';
  }

  if (passed === 0) {
    return 'fail';
  }

  if (passed >= config.flakyThreshold) {
    return 'flaky';
  }

  return 'fail';
}

export function computeVerdict(results: TestCaseResult[]): TestVerdict {
  if (results.length === 0) {
    return 'NO_TESTS';
  }

  const hasFail = results.some((result) => result.status === 'fail');
  if (hasFail) {
    return 'FAIL';
  }

  const hasFlaky = results.some((result) => result.status === 'flaky');
  if (hasFlaky) {
    return 'FLAKY';
  }

  return 'PASS';
}

export function calculateFlakinessRate(historicalRuns: DatedRun[], windowSize: number): number {
  if (historicalRuns.length === 0) {
    return 0;
  }

  const window = historicalRuns.slice(-windowSize);
  const flakyRuns = window.filter((run) => run.passed > 0 && run.failed > 0).length;

  return flakyRuns / window.length;
}

export function checkQuarantine(
  testName: string,
  historicalRuns: DatedRun[],
  config: FlakyPolicyConfig,
): QuarantineDecision {
  const rate = calculateFlakinessRate(historicalRuns, config.flakinessWindowRuns);

  if (rate > config.quarantineFlakinessThreshold) {
    return {
      shouldQuarantine: true,
      reason: `Test "${testName}" has ${(rate * 100).toFixed(1)}% flakiness over last ${String(config.flakinessWindowRuns)} runs (threshold: ${(config.quarantineFlakinessThreshold * 100).toFixed(1)}%)`,
    };
  }

  return { shouldQuarantine: false, reason: 'Flakiness below quarantine threshold' };
}

export interface BuildResultInput {
  name: string;
  attempts: RetryResult[];
  error?: string | undefined;
}

export function buildTestCaseResult(
  input: BuildResultInput,
  config: FlakyPolicyConfig,
): TestCaseResult {
  const status = determineTestStatus(input.attempts, config);
  const totalDuration = input.attempts.reduce((sum, attempt) => sum + attempt.duration, 0);

  return {
    name: input.name,
    status,
    duration: totalDuration,
    retries: input.attempts.length - 1,
    attempts: input.attempts,
    ...(input.error && { error: input.error }),
  };
}

export function buildReportSummary(results: TestCaseResult[]): {
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  total: number;
  verdict: TestVerdict;
} {
  const passed = results.filter((result) => result.status === 'pass').length;
  const failed = results.filter((result) => result.status === 'fail').length;
  const flaky = results.filter((result) => result.status === 'flaky').length;
  const skipped = results.filter((result) => result.status === 'skipped').length;
  const verdict = computeVerdict(results);

  return {
    passed,
    failed,
    flaky,
    skipped,
    total: results.length,
    verdict,
  };
}

export function renderTestReport(results: TestCaseResult[], prNumber: number): string {
  const summary = buildReportSummary(results);

  const lines: string[] = [
    `## QA-Run Report — PR #${String(prNumber)}`,
    '',
    `**Verdict:** ${summary.verdict}`,
    '',
    '| Test | Status | Duration | Retries |',
    '|------|--------|----------|---------|',
    ...results.map((result) => {
      const emoji =
        result.status === 'pass'
          ? '✅'
          : result.status === 'fail'
            ? '❌'
            : result.status === 'flaky'
              ? '⚠️'
              : '⏭️';
      return `| ${emoji} ${result.name} | ${result.status} | ${String(result.duration)}ms | ${String(result.retries)} |`;
    }),
    '',
    `**Summary:** ${String(summary.passed)} passed, ${String(summary.failed)} failed, ${String(summary.flaky)} flaky, ${String(summary.skipped)} skipped (${String(summary.total)} total)`,
    '',
  ];

  const verdictMessage: Record<TestVerdict, string[] | null> = {
    PASS: ['> ✅ All tests **passed**. Gatekeeper can proceed with release report.', ''],
    FAIL: ['> ❌ Tests **failed** — feedback sent to developer. Issue labelled `test-failed`.', ''],
    FLAKY: [
      '> ⚠️ Some tests are **flaky** (2/3 passing). They do **not** block the PR. Issues created for investigation.',
      '',
    ],
    NO_TESTS: null,
  };

  const message = verdictMessage[summary.verdict];
  if (message) {
    lines.push(...message);
  }

  return lines.join('\n');
}
