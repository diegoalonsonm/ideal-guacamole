import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolveToken,
  isGhAvailable,
  clearGhTokenCache,
  GitHubAuthError,
} from '../src/github/index.js';

const ORIGINAL_ENV = { ...process.env };

describe('resolveToken', () => {
  beforeEach(() => {
    clearGhTokenCache();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('returns token from options when provided', () => {
    const token = resolveToken({ token: 'opt-token' });
    expect(token).toBe('opt-token');
  });

  it('returns token from GITHUB_TOKEN env var', () => {
    process.env.GITHUB_TOKEN = 'env-token';
    const token = resolveToken();
    expect(token).toBe('env-token');
  });

  it('returns token from GH_TOKEN env var (fallback)', () => {
    process.env.GH_TOKEN = 'gh-env-token';
    const token = resolveToken();
    expect(token).toBe('gh-env-token');
  });
});

describe('isGhAvailable', () => {
  it('returns a boolean (does not throw)', () => {
    const isAvailable = isGhAvailable();
    expect(typeof isAvailable).toBe('boolean');
  });
});

describe('clearGhTokenCache', () => {
  it('clears cached gh token without throwing', () => {
    expect(() => {
      clearGhTokenCache();
    }).not.toThrow();
  });
});

describe('GitHubAuthError', () => {
  it('is an Error subclass', () => {
    const error = new GitHubAuthError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GitHubAuthError');
    expect(error.message).toBe('test');
  });
});
