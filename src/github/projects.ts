import type { Octokit as OctokitType } from '@octokit/rest';

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

export interface ProjectItem {
  id: string;
  content: {
    number: number;
    title: string;
  };
  columnId: string;
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

export async function getProject(
  octokit: OctokitType,
  options: { owner: string; projectNumber: number },
): Promise<ProjectInfo> {
  const query = `
    query getProject($owner: String!, $number: Int!) {
      user(login: $owner) {
        projectV2(number: $number) {
          id
          title
          url
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
      organization(login: $owner) {
        projectV2(number: $number) {
          id
          title
          url
        }
      }
    }
  `;

  const response = await octokit.graphql(query, {
    owner: options.owner,
    number: options.projectNumber,
  });

  const data = response as {
    user?: { projectV2?: { id: string; title: string; url: string } };
    organization?: { projectV2?: { id: string; title: string; url: string } };
  };

  const project = data.user?.projectV2 ?? data.organization?.projectV2;
  if (!project) {
    throw new ProjectsError(
      `Project #${String(options.projectNumber)} not found for ${options.owner}`,
    );
  }

  return {
    id: project.id,
    title: project.title,
    url: project.url,
    columns: [],
  };
}

export async function addIssueToProject(
  octokit: OctokitType,
  options: {
    projectId: string;
    contentId: string;
  },
): Promise<{ itemId: string }> {
  const mutation = `
    mutation addIssueToProject($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item {
          id
        }
      }
    }
  `;

  const response = await octokit.graphql(mutation, {
    projectId: options.projectId,
    contentId: options.contentId,
  });

  const data = response as {
    addProjectV2ItemById?: { item: { id: string } };
  };

  if (!data.addProjectV2ItemById?.item.id) {
    throw new ProjectsError('Failed to add issue to project');
  }

  return { itemId: data.addProjectV2ItemById.item.id };
}

export async function updateItemStatusField(
  octokit: OctokitType,
  options: {
    projectId: string;
    itemId: string;
    statusFieldId: string;
    optionId: string;
  },
): Promise<void> {
  const mutation = `
    mutation updateProjectItem($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;

  await octokit.graphql(mutation, {
    projectId: options.projectId,
    itemId: options.itemId,
    fieldId: options.statusFieldId,
    optionId: options.optionId,
  });
}

export async function moveIssueToStateColumn(
  octokit: OctokitType,
  options: {
    owner: string;
    projectNumber: number;
    issueNodeId: string;
    state: string;
  },
): Promise<{ projectInfo: ProjectInfo; moved: boolean }> {
  const projectName = getColumnForState(options.state);
  if (!projectName) {
    throw new ProjectsError(`Unknown pipeline state: ${options.state}`);
  }

  const projectInfo = await getProject(octokit, {
    owner: options.owner,
    projectNumber: options.projectNumber,
  });

  await addIssueToProject(octokit, {
    projectId: projectInfo.id,
    contentId: options.issueNodeId,
  });

  return { projectInfo, moved: true };
}

export function mapStateToColumn(state: string): string {
  const column = getColumnForState(state);
  if (!column) {
    throw new ProjectsError(`No column mapping for state: ${state}`);
  }
  return column;
}
