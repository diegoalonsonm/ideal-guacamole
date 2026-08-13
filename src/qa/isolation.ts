export interface IsolationConfig {
  resetDatabase: boolean;
  databaseResetCommand?: string | undefined;
  freshBrowserContext: boolean;
  deterministicMocks: boolean;
  mockFilePath?: string | undefined;
  clearCookies: boolean;
  clearLocalStorage: boolean;
  seedDatabase: boolean;
  seedCommand?: string | undefined;
}

export const DEFAULT_ISOLATION_CONFIG: IsolationConfig = {
  resetDatabase: false,
  freshBrowserContext: true,
  deterministicMocks: true,
  clearCookies: true,
  clearLocalStorage: true,
  seedDatabase: false,
};

export class IsolationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'IsolationError';
  }
}

export interface IsolationStep {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string | undefined;
}

export interface IsolationResult {
  steps: IsolationStep[];
  isAllSucceeded: boolean;
}

async function runCommandStep(
  stepName: string,
  command: string | undefined,
): Promise<IsolationStep> {
  if (!command) {
    return {
      name: stepName,
      status: 'skipped',
      error: `No command provided for ${stepName}`,
    };
  }
  const result = await executeIsolationCommand(command);
  return {
    name: stepName,
    status: result.succeeded ? 'success' : 'failed',
    ...(result.error && { error: result.error }),
  };
}

function booleanStep(stepName: string, isEnabled: boolean): IsolationStep {
  return {
    name: stepName,
    status: isEnabled ? 'success' : 'skipped',
  };
}

export async function executeIsolationCommand(
  command: string,
): Promise<{ succeeded: boolean; error?: string | undefined }> {
  const { exec } = await import('node:child_process');
  return new Promise((resolve) => {
    exec(command, (error) => {
      if (error) {
        resolve({ succeeded: false, error: error.message });
        return;
      }
      resolve({ succeeded: true });
    });
  });
}

export async function runIsolation(config: IsolationConfig): Promise<IsolationResult> {
  const steps: IsolationStep[] = [];

  if (config.resetDatabase) {
    steps.push(await runCommandStep('reset-database', config.databaseResetCommand));
  }

  if (config.seedDatabase) {
    steps.push(await runCommandStep('seed-database', config.seedCommand));
  }

  steps.push(
    booleanStep('fresh-browser-context', config.freshBrowserContext),
    booleanStep('deterministic-mocks', config.deterministicMocks),
    booleanStep('clear-cookies', config.clearCookies),
    booleanStep('clear-local-storage', config.clearLocalStorage),
  );

  const isAllSucceeded = steps.every(
    (step) => step.status === 'success' || step.status === 'skipped',
  );

  return { steps, isAllSucceeded };
}

export function validateIsolationConfig(config: IsolationConfig): string[] {
  const errors: string[] = [];

  if (config.resetDatabase && !config.databaseResetCommand) {
    errors.push('resetDatabase is true but no databaseResetCommand provided');
  }

  if (config.seedDatabase && !config.seedCommand) {
    errors.push('seedDatabase is true but no seedCommand provided');
  }

  return errors;
}

export function getPlaywrightIsolationOptions(config: IsolationConfig): {
  storageState: undefined;
  newContext: boolean;
} {
  return {
    storageState: undefined,
    newContext: config.freshBrowserContext,
  };
}
