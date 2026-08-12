/**
 * Public entrypoint for the `ideal-guacamole` package.
 *
 * Phase 0 ships a minimal skeleton. Subsequent phases will re-export from
 * `orchestrator`, `github`, `qa`, `reports`, `traceability`, `design-system`,
 * and `config`. Each submodule is implemented incrementally per the roadmap.
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
