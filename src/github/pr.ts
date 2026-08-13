import type { Octokit } from '@octokit/rest';

export interface PRDiff {
  files: string[];
  additions: number;
  deletions: number;
}

export interface PRInfo {
  number: number;
  title: string;
  body: string | null;
  sourceBranch: string;
  targetBranch: string;
  state: 'open' | 'closed' | 'merged';
  mergeable: boolean | null;
}

export async function fetchPR(
  octokit: Octokit,
  options: { owner: string; repo: string; prNumber: number },
): Promise<PRInfo> {
  const { data } = await octokit.rest.pulls.get({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.prNumber,
  });

  return {
    number: data.number,
    title: data.title,
    body: data.body ?? null,
    sourceBranch: data.head.ref,
    targetBranch: data.base.ref,
    state: data.merged ? 'merged' : data.state,
    mergeable: data.mergeable,
  };
}

export async function fetchPRDiff(
  octokit: Octokit,
  options: { owner: string; repo: string; prNumber: number },
): Promise<PRDiff> {
  const { data } = await octokit.rest.pulls.listFiles({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.prNumber,
    per_page: 100,
  });

  const files = data.map((file) => file.filename);
  const additions = data.reduce((sum, file) => sum + file.additions, 0);
  const deletions = data.reduce((sum, file) => sum + file.deletions, 0);

  return { files, additions, deletions };
}

export async function commentOnPR(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    prNumber: number;
    body: string;
    updateExisting?: boolean | undefined;
  },
): Promise<{ commentId: number; updated: boolean }> {
  if (options.updateExisting) {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.prNumber,
      per_page: 100,
    });

    const heading = options.body.split('\n', 1)[0] ?? '';
    const existing = comments.find((comment) => comment.body?.startsWith(heading.slice(0, 50)));

    if (existing) {
      const { data: updated } = await octokit.rest.issues.updateComment({
        owner: options.owner,
        repo: options.repo,
        comment_id: existing.id,
        body: options.body,
      });
      return { commentId: updated.id, updated: true };
    }
  }

  const { data: comment } = await octokit.rest.issues.createComment({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.prNumber,
    body: options.body,
  });

  return { commentId: comment.id, updated: false };
}

export async function mergePR(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    prNumber: number;
    commitTitle?: string | undefined;
    squash?: boolean | undefined;
  },
): Promise<{ merged: boolean; sha: string }> {
  const { data } = await octokit.rest.pulls.merge({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.prNumber,
    ...(options.commitTitle && { commit_title: options.commitTitle }),
    merge_method: options.squash ? 'squash' : 'merge',
  });

  return { merged: data.merged, sha: data.sha };
}

export async function approvePR(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    prNumber: number;
    body: string;
  },
): Promise<void> {
  await octokit.rest.pulls.createReview({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.prNumber,
    event: 'APPROVE',
    body: options.body,
  });
}

export async function requestChanges(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    prNumber: number;
    body: string;
  },
): Promise<void> {
  await octokit.rest.pulls.createReview({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.prNumber,
    event: 'REQUEST_CHANGES',
    body: options.body,
  });
}

export function parseLinkedIssues(prBody: string | null): number[] {
  if (!prBody) return [];
  const matches = prBody.matchAll(/(?:closes?|fixes?|resolves?)\s+#(\d+)/gi);
  return [...matches].map((match) => Number(match[1]));
}
