export interface ProjectColumn {
  id: string;
  name: string;
}

export interface ProjectInfo {
  id: string;
  title: string;
  url: string;
  columns: ProjectColumn[];
}

export class ProjectsError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ProjectsError';
  }
}

const STATE_TO_COLUMN: Readonly<Record<string, string>> = {
  created: 'Backlog',
  'spec-ready': 'Spec Ready',
  'dev-ready': 'Dev Ready',
  'in-dev': 'In Dev',
  'dev-done': 'Dev Done',
  testing: 'Testing',
  'test-failed': 'Test Failed',
  review: 'Review',
  approved: 'Approved',
  'pr-main': 'PR to Main',
  deployed: 'Deployed',
  closed: 'Done',
};

export function getColumnForState(state: string): string | undefined {
  return STATE_TO_COLUMN[state];
}

export const COLUMN_TO_STATE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(STATE_TO_COLUMN).map(([state, column]) => [column, state]),
);

export function mapStateToColumn(state: string): string {
  const column = getColumnForState(state);
  if (!column) {
    throw new ProjectsError(`No column mapping for state: ${state}`);
  }
  return column;
}

export interface GhProjectOptions {
  owner: string;
  projectNumber: number;
  issueNumber: number;
  repo: string;
}

export function buildGhProjectAddCommand(options: GhProjectOptions): string {
  const issueUrl = `https://github.com/${options.owner}/${options.repo}/issues/${String(options.issueNumber)}`;
  return `gh project item-add ${String(options.projectNumber)} --owner ${options.owner} --url ${issueUrl}`;
}

export function buildGhProjectItemEditCommand(
  options: GhProjectOptions & { itemId: string; fieldId: string; optionId: string },
): string {
  return [
    'gh',
    'project',
    'item-edit',
    '--id',
    options.itemId,
    '--field-id',
    options.fieldId,
    '--project-id',
    options.projectNumber,
    '--single-select-option-id',
    options.optionId,
  ].join(' ');
}

export function parseGhProjectOutput(output: string): { itemId: string } | undefined {
  try {
    const parsed = JSON.parse(output) as { id?: string };
    if (parsed.id) {
      return { itemId: parsed.id };
    }
  } catch {
    // gh may output non-JSON on error
  }
  return undefined;
}

export async function moveIssueToStateColumn(options: {
  owner: string;
  projectNumber: number;
  issueNumber: number;
  repo: string;
  state: string;
}): Promise<{ command: string; moved: boolean }> {
  const columnName = getColumnForState(options.state);
  if (!columnName) {
    throw new ProjectsError(`Unknown pipeline state: ${options.state}`);
  }

  const command = buildGhProjectAddCommand({
    owner: options.owner,
    projectNumber: options.projectNumber,
    issueNumber: options.issueNumber,
    repo: options.repo,
  });

  const { exec } = await import('node:child_process');
  await new Promise<void>((resolve) => {
    exec(command, (error) => {
      if (error) {
        throw new ProjectsError(
          `Failed to add issue to project: ${error.message}. Ensure \`gh\` is installed and authenticated.`,
        );
      }
      resolve();
    });
  });

  return { command, moved: true };
}
