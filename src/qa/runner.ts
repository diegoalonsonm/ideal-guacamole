import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { IsolationConfig } from './isolation.js';
import { DEFAULT_ISOLATION_CONFIG, runIsolation } from './isolation.js';
import type { FlakyPolicyConfig } from './flaky-policy.js';
import {
  DEFAULT_FLAKY_CONFIG,
  buildTestCaseResult,
  buildReportSummary,
  renderTestReport,
  type RetryResult,
  type TestCaseResult,
  type TestVerdict,
} from './flaky-policy.js';

export interface RunnerOptions {
  testDir: string;
  testFilePattern?: string | undefined;
  isolationConfig?: IsolationConfig | undefined;
  flakyConfig?: FlakyPolicyConfig | undefined;
  reporterPath?: string | undefined;
  outputDir?: string | undefined;
  prNumber?: number | undefined;
}

export interface RunnerResult {
  results: TestCaseResult[];
  verdict: TestVerdict;
  report: string;
  isolationSucceeded: boolean;
  rawJsonPath: string | undefined;
}

export class RunnerError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RunnerError';
  }
}

export interface PlaywrightRawResult {
  suites?: {
    title: string;
    spec?: {
      title: string;
      tests?: {
        timeout: number;
        annotations: unknown[];
        expectedStatus: string;
        results?: {
          status: string;
          duration: number;
          error?: { message?: string | undefined } | undefined;
        }[];
      }[];
    }[];
  }[];
}

export function parsePlaywrightJson(
  jsonPath: string,
  flakyConfig: FlakyPolicyConfig = DEFAULT_FLAKY_CONFIG,
): TestCaseResult[] {
  if (!existsSync(jsonPath)) {
    throw new RunnerError(`Playwright JSON report not found: ${jsonPath}`);
  }

  const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as PlaywrightRawResult;
  const results: TestCaseResult[] = [];

  const suites = raw.suites ?? [];
  for (const suite of suites) {
    const specs = suite.spec ?? [];
    for (const spec of specs) {
      const tests = spec.tests ?? [];
      for (const test of tests) {
        const testResults = test.results ?? [];
        const attempts: RetryResult[] = testResults.map((result, index) => ({
          attempt: index + 1,
          duration: result.duration,
          passed: result.status === 'passed' || result.status === 'pass',
        }));

        const failedResult = testResults.find(
          (result) => result.status !== 'passed' && result.status !== 'pass',
        );
        const errorMsg = failedResult?.error?.message;

        const testResult = buildTestCaseResult(
          {
            name: spec.title,
            attempts,
            ...(errorMsg && { error: errorMsg }),
          },
          flakyConfig,
        );

        results.push(testResult);
      }
    }
  }

  return results;
}

export async function runTests(options: RunnerOptions): Promise<RunnerResult> {
  const isolationConfig = options.isolationConfig ?? DEFAULT_ISOLATION_CONFIG;
  const flakyConfig: FlakyPolicyConfig = {
    ...DEFAULT_FLAKY_CONFIG,
    ...options.flakyConfig,
  };

  const isolationResult = await runIsolation(isolationConfig);

  if (!isolationResult.isAllSucceeded) {
    const failedSteps = isolationResult.steps.filter((step) => step.status === 'failed');
    throw new RunnerError(`Isolation failed: ${failedSteps.map((step) => step.name).join(', ')}`);
  }

  const outputDir = options.outputDir ?? '.qa-output';
  const jsonPath = join(outputDir, 'results.json');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const args = [
    'npx',
    'playwright',
    'test',
    options.testDir,
    '--reporter=json',
    `--output=${jsonPath}`,
  ];

  if (options.testFilePattern) {
    args.push(options.testFilePattern);
  }

  const { exec } = await import('node:child_process');
  const command = args.join(' ');

  await new Promise<void>((resolve) => {
    exec(command, () => {
      resolve();
    });
  });

  if (!existsSync(jsonPath)) {
    return {
      results: [],
      verdict: 'NO_TESTS',
      report: renderTestReport([], options.prNumber ?? 0),
      isolationSucceeded: true,
      rawJsonPath: undefined,
    };
  }

  const results = parsePlaywrightJson(jsonPath, flakyConfig);
  const summary = buildReportSummary(results);
  const report = renderTestReport(results, options.prNumber ?? 0);

  rmSync(jsonPath);

  return {
    results,
    verdict: summary.verdict,
    report,
    isolationSucceeded: true,
    rawJsonPath: jsonPath,
  };
}

export function writeReport(report: string, outputPath: string): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, report, 'utf8');
}

export { renderTestReport } from './flaky-policy.js';
