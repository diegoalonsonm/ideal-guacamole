import { describe, expect, it } from 'vitest';

import { FRAMEWORK_NAME, FRAMEWORK_VERSION, getFrameworkInfo } from '../src/index.js';

describe('framework metadata (Phase 0)', () => {
  it('exposes the canonical framework name', () => {
    expect(FRAMEWORK_NAME).toBe('ideal-guacamole');
  });

  it('exposes a development sentinel version', () => {
    expect(FRAMEWORK_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('getFrameworkInfo returns name and version', () => {
    const info = getFrameworkInfo();
    expect(info.name).toBe(FRAMEWORK_NAME);
    expect(info.version).toBe(FRAMEWORK_VERSION);
  });
});
