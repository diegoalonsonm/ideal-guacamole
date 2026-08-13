export interface PRReportIssue {
  number: number;
  title: string;
  category: string;
}

export interface PRReportInput {
  prNumber: number;
  sourceBranch: string;
  targetBranch: string;
  issues: PRReportIssue[];
  testSummary: {
    passed: number;
    failed: number;
    flaky: number;
    total: number;
    verdict: string;
  };
  reviewVerdict: string;
  risks?: string[] | undefined;
}

export function buildPRReport(input: PRReportInput): string {
  const lines: string[] = [
    `## PR Report — PR #${String(input.prNumber)}`,
    '',
    `**Branch:** ${input.sourceBranch} → ${input.targetBranch}`,
    '',
    '### Issues closed',
    '',
    '| # | Title | Category |',
    '|---|-------|----------|',
    ...input.issues.map(
      (issue) => `| #${String(issue.number)} | ${issue.title} | ${issue.category} |`,
    ),
    '',
    '### Test status',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Passed | ${String(input.testSummary.passed)} |`,
    `| Failed | ${String(input.testSummary.failed)} |`,
    `| Flaky  | ${String(input.testSummary.flaky)} |`,
    `| Total  | ${String(input.testSummary.total)} |`,
    `| Verdict | ${input.testSummary.verdict} |`,
    '',
    `### Review verdict: ${input.reviewVerdict}`,
    '',
  ];

  if (input.risks?.length) {
    lines.push('### Risks', '');
    for (const risk of input.risks) {
      lines.push(`- ${risk}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export interface ReleaseReportInput {
  version: string;
  fromTag: string;
  toRef: string;
  issues: PRReportIssue[];
  migrations: string[];
  featureFlags: string[];
  smokeTestPlan: string[];
  rollbackPlan: string[];
  changelog: string;
}

export function buildReleaseReport(input: ReleaseReportInput): string {
  const lines: string[] = [
    `## Release Report — v${input.version}`,
    '',
    `**From:** ${input.fromTag}`,
    `**To:** ${input.toRef}`,
    '',
    '### Changelog',
    '',
    input.changelog,
    '',
    '### Issues in this release',
    '',
    '| # | Title | Category |',
    '|---|-------|----------|',
    ...input.issues.map(
      (issue) => `| #${String(issue.number)} | ${issue.title} | ${issue.category} |`,
    ),
    '',
    '### Database migrations',
    '',
    ...(input.migrations.length > 0 ? input.migrations.map((m) => `- ${m}`) : ['- None']),
    '',
    '### Feature flags',
    '',
    ...(input.featureFlags.length > 0 ? input.featureFlags.map((f) => `- ${f}`) : ['- None']),
    '',
    '### Smoke test plan',
    '',
    ...(input.smokeTestPlan.length > 0
      ? input.smokeTestPlan.map((s) => `- [ ] ${s}`)
      : ['- [ ] Health check endpoint responds 200']),
    '',
    '### Rollback plan',
    '',
    ...(input.rollbackPlan.length > 0
      ? input.rollbackPlan.map((r) => `- ${r}`)
      : ['- Revert to previous tag and redeploy']),
    '',
    '---',
    '',
    '> ⚠️ **Human approval required** before merge to `main` and deployment.',
  ];

  return lines.join('\n');
}
