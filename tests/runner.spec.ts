import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { parsePlaywrightJson, writeReport, type PlaywrightRawResult } from '../src/qa/index.js';

describe('parsePlaywrightJson', () => {
  it('parses a Playwright JSON report with passing tests', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'qa-runner-'));
    try {
      const jsonPath = join(sandbox, 'results.json');
      const raw: PlaywrightRawResult = {
        suites: [
          {
            title: 'issue-1.spec.ts',
            spec: [
              {
                title: 'Successful login',
                tests: [
                  {
                    timeout: 30_000,
                    annotations: [],
                    expectedStatus: 'passed',
                    results: [{ status: 'passed', duration: 1200 }],
                  },
                ],
              },
            ],
          },
        ],
      };
      writeFileSync(jsonPath, JSON.stringify(raw), 'utf8');

      const results = parsePlaywrightJson(jsonPath);
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('Successful login');
      expect(results[0]?.status).toBe('pass');
      expect(results[0]?.duration).toBe(1200);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('parses a failing test with error message', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'qa-runner-'));
    try {
      const jsonPath = join(sandbox, 'results.json');
      const raw: PlaywrightRawResult = {
        suites: [
          {
            title: 'issue-2.spec.ts',
            spec: [
              {
                title: 'Checkout flow',
                tests: [
                  {
                    timeout: 30_000,
                    annotations: [],
                    expectedStatus: 'passed',
                    results: [
                      { status: 'failed', duration: 1000, error: { message: 'Timeout 5000ms' } },
                      { status: 'failed', duration: 1100, error: { message: 'Timeout 5000ms' } },
                      { status: 'failed', duration: 1200, error: { message: 'Timeout 5000ms' } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      writeFileSync(jsonPath, JSON.stringify(raw), 'utf8');

      const results = parsePlaywrightJson(jsonPath);
      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe('fail');
      expect(results[0]?.error).toBe('Timeout 5000ms');
      expect(results[0]?.retries).toBe(2);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('parses a flaky test (2/3 passed)', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'qa-runner-'));
    try {
      const jsonPath = join(sandbox, 'results.json');
      const raw: PlaywrightRawResult = {
        suites: [
          {
            title: 'issue-3.spec.ts',
            spec: [
              {
                title: 'Search',
                tests: [
                  {
                    timeout: 30_000,
                    annotations: [],
                    expectedStatus: 'passed',
                    results: [
                      { status: 'passed', duration: 500 },
                      { status: 'failed', duration: 600, error: { message: 'Element not found' } },
                      { status: 'passed', duration: 550 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      writeFileSync(jsonPath, JSON.stringify(raw), 'utf8');

      const results = parsePlaywrightJson(jsonPath);
      expect(results[0]?.status).toBe('flaky');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('throws RunnerError when file does not exist', () => {
    expect(() => parsePlaywrightJson('/nonexistent/path.json')).toThrow();
  });

  it('handles empty suites gracefully', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'qa-runner-'));
    try {
      const jsonPath = join(sandbox, 'results.json');
      const raw: PlaywrightRawResult = { suites: [] };
      writeFileSync(jsonPath, JSON.stringify(raw), 'utf8');

      const results = parsePlaywrightJson(jsonPath);
      expect(results).toHaveLength(0);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});

describe('writeReport', () => {
  it('writes report to a file creating parent directories', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'qa-report-'));
    try {
      const outputPath = join(sandbox, 'reports', 'qa-run.md');
      writeReport('# QA-Run Report\n\nAll good.', outputPath);
      expect(existsSync(outputPath)).toBe(true);
      const content = readFileSync(outputPath, 'utf8');
      expect(content).toContain('# QA-Run Report');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
