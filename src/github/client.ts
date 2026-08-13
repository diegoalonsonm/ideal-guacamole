import { execFileSync, execSync } from 'node:child_process';

import { Octokit } from '@octokit/rest';

export interface CreateOctokitOptions {
  token?: string | undefined;
  owner?: string | undefined;
  repo?: string | undefined;
}

export class GitHubAuthError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'GitHubAuthError';
  }
}

interface TokenCache {
  ghToken: string | undefined;
}

const cache: TokenCache = { ghToken: undefined };

export function isGhAvailable(): boolean {
  try {
    execSync('gh --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function getGhToken(): string {
  if (cache.ghToken !== undefined) return cache.ghToken;

  const token = execFileSync('gh', ['auth', 'token'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 10_000,
    encoding: 'utf8',
  }).trim();

  if (!token) {
    throw new GitHubAuthError(
      '`gh auth token` returned an empty string. Run `gh auth login` to authenticate.',
    );
  }

  cache.ghToken = token;
  return token;
}

export function resolveToken(options?: CreateOctokitOptions): string {
  const envToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '';
  const token = options?.token ?? envToken;

  if (token) return token;

  if (isGhAvailable()) {
    return getGhToken();
  }

  throw new GitHubAuthError(
    'No GitHub token found. Set the GITHUB_TOKEN environment variable, run `gh auth login`, or pass --github-token.',
  );
}

export function createOctokit(options?: CreateOctokitOptions): Octokit {
  const token = resolveToken(options);
  return new Octokit({
    auth: token,
    ...(options?.owner && { owner: options.owner }),
    ...(options?.repo && { repo: options.repo }),
  });
}

export function clearGhTokenCache(): void {
  cache.ghToken = undefined;
}
