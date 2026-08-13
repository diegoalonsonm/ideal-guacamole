import { describe, expect, it } from 'vitest';

import {
  validateIsolationConfig,
  getPlaywrightIsolationOptions,
  DEFAULT_ISOLATION_CONFIG,
  type IsolationConfig,
} from '../src/qa/index.js';

describe('DEFAULT_ISOLATION_CONFIG', () => {
  it('enables fresh browser context by default', () => {
    expect(DEFAULT_ISOLATION_CONFIG.freshBrowserContext).toBe(true);
  });

  it('enables deterministic mocks by default', () => {
    expect(DEFAULT_ISOLATION_CONFIG.deterministicMocks).toBe(true);
  });

  it('disables database reset by default', () => {
    expect(DEFAULT_ISOLATION_CONFIG.resetDatabase).toBe(false);
  });
});

describe('validateIsolationConfig', () => {
  it('returns empty array for valid default config', () => {
    const errors = validateIsolationConfig(DEFAULT_ISOLATION_CONFIG);
    expect(errors).toHaveLength(0);
  });

  it('errors when resetDatabase is true but no command provided', () => {
    const errors = validateIsolationConfig({
      ...DEFAULT_ISOLATION_CONFIG,
      resetDatabase: true,
    });
    expect(errors).toContain('resetDatabase is true but no databaseResetCommand provided');
  });

  it('errors when seedDatabase is true but no command provided', () => {
    const errors = validateIsolationConfig({
      ...DEFAULT_ISOLATION_CONFIG,
      seedDatabase: true,
    });
    expect(errors).toContain('seedDatabase is true but no seedCommand provided');
  });

  it('passes when resetDatabase and command are both provided', () => {
    const errors = validateIsolationConfig({
      ...DEFAULT_ISOLATION_CONFIG,
      resetDatabase: true,
      databaseResetCommand: 'npm run db:reset',
    });
    expect(errors).toHaveLength(0);
  });
});

describe('getPlaywrightIsolationOptions', () => {
  it('returns newContext true when freshBrowserContext is true', () => {
    const config: IsolationConfig = {
      ...DEFAULT_ISOLATION_CONFIG,
      freshBrowserContext: true,
    };
    const opts = getPlaywrightIsolationOptions(config);
    expect(opts.newContext).toBe(true);
  });

  it('returns newContext false when freshBrowserContext is false', () => {
    const config: IsolationConfig = {
      ...DEFAULT_ISOLATION_CONFIG,
      freshBrowserContext: false,
    };
    const opts = getPlaywrightIsolationOptions(config);
    expect(opts.newContext).toBe(false);
  });

  it('always returns storageState as undefined', () => {
    const opts = getPlaywrightIsolationOptions(DEFAULT_ISOLATION_CONFIG);
    expect(opts.storageState).toBeUndefined();
  });
});
