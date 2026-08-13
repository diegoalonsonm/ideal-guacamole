import type { Octokit } from '@octokit/rest';

export type IssueCategory = 'development' | 'testing' | 'bug' | 'documentation';
export type IssuePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type IssuePhase = 'phase:1' | 'phase:2' | 'phase:3' | 'phase:4';

export interface IssueBody {
  objective: string;
  context?: string | undefined;
  dependsOn?: readonly number[] | undefined;
  blockedBy?: readonly number[] | undefined;
  acceptanceCriteria: readonly string[];
  expectedBehavior?: string | undefined;
  linkedTests?: readonly number[] | undefined;
  closesIssue?: number | undefined;
}

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body: IssueBody;
  category: IssueCategory;
  priority?: IssuePriority | undefined;
  phase?: IssuePhase | undefined;
  additionalLabels?: readonly string[] | undefined;
  assignees?: readonly string[] | undefined;
}

export interface CreateIssueResult {
  number: number;
  url: string;
  labels: string[];
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  state: 'open' | 'closed';
}

export function renderIssueBody(body: IssueBody): string {
  const sections: string[] = [];

  const dependsOnStr = body.dependsOn?.length
    ? body.dependsOn.map((n) => `#${String(n)}`).join(', ')
    : 'none';
  const blockedByStr = body.blockedBy?.length
    ? body.blockedBy.map((n) => `#${String(n)}`).join(', ')
    : 'none';

  const criteriaLines = body.acceptanceCriteria.map((c) => `- [ ] ${c}`);

  const expectedBehaviorBlock = body.expectedBehavior
    ? [
        '## Expected behavior / Comportamiento esperado',
        '',
        '```gherkin',
        body.expectedBehavior,
        '```',
        '',
      ]
    : [];

  const linkedTestsBlock = body.linkedTests?.length
    ? [
        '## Tests vinculados / Linked tests',
        '',
        `<!-- tests: ${body.linkedTests.map((n) => `#${String(n)}`).join(', ')} -->`,
        '',
      ]
    : [];

  const closesBlock =
    body.closesIssue === undefined
      ? []
      : ['## PR / Closes', '', `<!-- Closes #${String(body.closesIssue)} -->`, ''];

  sections.push(
    '## Objetivo / Objective',
    '',
    body.objective,
    '',
    '## Contexto / Context',
    '',
    body.context ?? '_No additional context._',
    '',
    `**Depends on**: ${dependsOnStr}`,
    `**Blocked by**: ${blockedByStr}`,
    '',
    '## Criterios de aceptación / Acceptance criteria',
    '',
    ...criteriaLines,
    '',
    ...expectedBehaviorBlock,
    ...linkedTestsBlock,
    ...closesBlock,
  );

  return sections.join('\n');
}

export function buildIssueLabels(input: CreateIssueInput): string[] {
  const labels = new Set<string>([input.category]);
  if (input.priority) labels.add(input.priority);
  if (input.phase) labels.add(input.phase);
  if (input.additionalLabels) {
    for (const label of input.additionalLabels) {
      labels.add(label);
    }
  }
  return [...labels];
}

export async function createIssue(
  octokit: Octokit,
  input: CreateIssueInput,
): Promise<CreateIssueResult> {
  const labels = buildIssueLabels(input);
  const bodyMarkdown = renderIssueBody(input.body);

  const assigneesSpread = input.assignees ? { assignees: [...input.assignees] } : {};

  const { data } = await octokit.rest.issues.create({
    owner: input.owner,
    repo: input.repo,
    title: input.title,
    body: bodyMarkdown,
    labels,
    ...assigneesSpread,
  });

  return {
    number: data.number,
    url: data.html_url,
    labels,
  };
}

export async function createIssueWithDependencies(
  octokit: Octokit,
  input: CreateIssueInput,
): Promise<CreateIssueResult> {
  const result = await createIssue(octokit, input);

  if (input.body.blockedBy?.length) {
    await linkBlockedBy(octokit, {
      owner: input.owner,
      repo: input.repo,
      issueNumber: result.number,
      blockedBy: input.body.blockedBy,
    });
  }

  return result;
}

export async function linkBlockedBy(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    issueNumber: number;
    blockedBy: readonly number[];
  },
): Promise<void> {
  const lines = [
    '## Dependencias / Dependencies',
    '',
    ...options.blockedBy.map((n) => `- Blocked by #${String(n)}`),
    '',
    '> Linked automatically by ideal-guacamole.',
  ];

  await octokit.rest.issues.createComment({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
    body: lines.join('\n'),
  });
}

export async function addLabels(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    issueNumber: number;
    labels: readonly string[];
  },
): Promise<void> {
  await octokit.rest.issues.addLabels({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
    labels: [...options.labels],
  });
}

export async function removeLabel(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    issueNumber: number;
    label: string;
  },
): Promise<void> {
  await octokit.rest.issues.removeLabel({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
    name: options.label,
  });
}

export async function transitionIssueState(
  octokit: Octokit,
  options: {
    owner: string;
    repo: string;
    issueNumber: number;
    removeLabels?: readonly string[] | undefined;
    addLabels?: readonly string[] | undefined;
  },
): Promise<void> {
  const remove = options.removeLabels ?? [];
  for (const label of remove) {
    try {
      await removeLabel(octokit, {
        owner: options.owner,
        repo: options.repo,
        issueNumber: options.issueNumber,
        label,
      });
    } catch {
      // Label may not exist on the issue — safe to skip.
    }
  }

  if (options.addLabels && options.addLabels.length > 0) {
    await addLabels(octokit, {
      owner: options.owner,
      repo: options.repo,
      issueNumber: options.issueNumber,
      labels: options.addLabels,
    });
  }
}

export async function fetchIssue(
  octokit: Octokit,
  options: { owner: string; repo: string; issueNumber: number },
): Promise<GitHubIssue> {
  const { data } = await octokit.rest.issues.get({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
  });

  return {
    number: data.number,
    title: data.title,
    body: data.body ?? null,
    labels: data.labels.map((label) => (typeof label === 'string' ? label : (label.name ?? ''))),
    state: data.state as 'open' | 'closed',
  };
}

export interface DependencyGraph {
  nodes: readonly { number: number; title: string; category: IssueCategory }[];
  edges: readonly { from: number; to: number; type: 'blocked-by' | 'depends-on' }[];
}

export function renderDependencyGraph(graph: DependencyGraph): string {
  const nodeRows = graph.nodes.map(
    (node) => `| #${String(node.number)} | ${node.title} | ${node.category} |`,
  );

  const edgeRows = graph.edges.map((edge) => {
    const arrow = edge.type === 'blocked-by' ? '← blocked by' : '← depends on';
    return `- #${String(edge.from)} ${arrow} #${String(edge.to)}`;
  });

  return [
    '# Dependency Graph / Grafo de dependencias',
    '',
    '> Generated by ideal-guacamole Product agent.',
    '',
    '## Issues',
    '',
    '| # | Title | Category |',
    '|---|-------|----------|',
    ...nodeRows,
    '',
    '## Dependencies',
    '',
    ...edgeRows,
    '',
  ].join('\n');
}
