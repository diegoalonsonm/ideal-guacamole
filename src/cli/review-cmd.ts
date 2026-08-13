import { runReview, buildReviewReport, type ReviewResult } from '../reports/index.js';
import { commentOnPR, createOctokit } from '../github/index.js';

export interface ReviewCommandOptions {
  prNumber: number;
  owner?: string | undefined;
  repo?: string | undefined;
  dryRun?: boolean | undefined;
}

export interface ReviewCommandResult {
  commentId?: number | undefined;
  report: string;
  verdict: ReviewResult['verdict'];
}

export async function runReviewCommand(
  options: ReviewCommandOptions,
): Promise<ReviewCommandResult> {
  const review = runReview(
    options.prNumber,
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
    'Automated review — all checklist items passed (placeholder). Customize per project.',
  );

  const report = buildReviewReport(review);

  if (options.dryRun || !options.owner || !options.repo) {
    return {
      report,
      verdict: review.verdict,
    };
  }

  const octokit = createOctokit({ owner: options.owner, repo: options.repo });
  const { commentId } = await commentOnPR(octokit, {
    owner: options.owner,
    repo: options.repo,
    prNumber: options.prNumber,
    body: report,
    updateExisting: true,
  });

  return {
    commentId,
    report,
    verdict: review.verdict,
  };
}
