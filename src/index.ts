/**
 * Public entrypoint for the `ideal-guacamole` package.
 *
 * Re-exports all framework modules: config, orchestrator, github, qa,
 * reports, traceability, and design-system. Each can also be imported
 * directly via its subpath export (e.g. `ideal-guacamole/qa`).
 */

export const FRAMEWORK_NAME = 'ideal-guacamole' as const;

export const FRAMEWORK_VERSION = '0.0.0-development' as const;

export interface FrameworkInfo {
  readonly name: typeof FRAMEWORK_NAME;
  readonly version: typeof FRAMEWORK_VERSION;
}

export function getFrameworkInfo(): FrameworkInfo {
  return { name: FRAMEWORK_NAME, version: FRAMEWORK_VERSION } as const;
}

export * from './config/index.js';
export * from './orchestrator/index.js';
export * from './github/index.js';
export * from './qa/index.js';
export * from './reports/index.js';
export * from './traceability/index.js';
export * from './design-system/index.js';
