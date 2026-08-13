import { describe, expect, it } from 'vitest';

import { parseConfig, ConfigValidationError } from '../src/config/index.js';
import { projectConfigSchema } from '../src/config/schema.js';

const VALID_CONFIG = {
  name: 'test-project',
  stack: { frontend: 'next', backend: 'express' },
  deployTarget: 'vercel',
  thresholds: { passCritical: 1, passTotal: 0.9, maxIter: 2 },
  paths: { frontend: './web', backend: './api' },
};

describe('projectConfigSchema', () => {
  it('accepts a fully-specified valid config', () => {
    const result = projectConfigSchema.parse(VALID_CONFIG);
    expect(result.name).toBe('test-project');
    expect(result.deployTarget).toBe('vercel');
    expect(result.thresholds.passCritical).toBe(1);
    expect(result.thresholds.maxIter).toBe(2);
    expect(result.paths.frontend).toBe('./web');
  });

  it('applies defaults for missing optional fields', () => {
    const result = projectConfigSchema.parse({ name: 'minimal-project' });
    expect(result.deployTarget).toBe('custom');
    expect(result.thresholds.passCritical).toBe(1);
    expect(result.thresholds.passTotal).toBe(0.95);
    expect(result.thresholds.maxIter).toBe(3);
    expect(result.paths.tests).toBe('./tests');
    expect(result.paths.docs).toBe('./documentacion');
  });

  it('rejects empty name', () => {
    const result = projectConfigSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 214 chars', () => {
    const result = projectConfigSchema.safeParse({ name: 'x'.repeat(215) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid deployTarget', () => {
    const result = projectConfigSchema.safeParse({
      name: 'test',
      deployTarget: 'cloudflare-pages',
    });
    expect(result.success).toBe(false);
  });

  it('rejects thresholds.passCritical outside 0–1', () => {
    const result = projectConfigSchema.safeParse({
      name: 'test',
      thresholds: { passCritical: 1.5 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects maxIter below 1', () => {
    const result = projectConfigSchema.safeParse({
      name: 'test',
      thresholds: { maxIter: 0 },
    });
    expect(result.success).toBe(false);
  });
});

describe('parseConfig', () => {
  it('parses a valid config object', () => {
    const config = parseConfig(VALID_CONFIG);
    expect(config.name).toBe('test-project');
  });

  it('throws ConfigValidationError on invalid input', () => {
    expect(() => parseConfig({ name: 123 })).toThrow(ConfigValidationError);
  });

  it('includes issue details in ConfigValidationError', () => {
    try {
      parseConfig({ name: '' });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      const e = error as ConfigValidationError;
      expect(e.issues.length).toBeGreaterThan(0);
    }
  });
});
