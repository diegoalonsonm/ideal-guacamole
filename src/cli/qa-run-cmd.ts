import { writeFileSync } from 'node:fs';

import { runTests } from '../qa/runner.js';
import { commentOnPR, createOctokit } from '../github/index.js';

export interface QaRunCommandOptions {
  prNumber: number;
  owner?: string | undefined;
  repo?: string | undefined;
  testDir: string;
  outputDir: string;
  dryRun?: boolean | undefined;
}

export interface QaRunCommandResult {
  commentId?: number | undefined;
  report: string;
  verdict: string;
}

export async function runQaRunCommand(options: QaRunCommandOptions): Promise<QaRunCommandResult> {
  const result = await runTests({
    testDir: options.testDir,
    outputDir: options.outputDir,
    prNumber: options.prNumber,
  });

  if (options.dryRun) {
    return {
      report: result.report,
      verdict: result.verdict,
    };
  }

  if (!options.owner || !options.repo) {
    return {
      report: result.report,
      verdict: result.verdict,
    };
  }

  const octokit = createOctokit({ owner: options.owner, repo: options.repo });
  const { commentId } = await commentOnPR(octokit, {
    owner: options.owner,
    repo: options.repo,
    prNumber: options.prNumber,
    body: result.report,
    updateExisting: true,
  });

  writeFileSync(`${options.outputDir}/report.md`, result.report, 'utf8');

  return {
    commentId,
    report: result.report,
    verdict: result.verdict,
  };
}
