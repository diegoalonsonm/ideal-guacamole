import { describe, expect, it } from 'vitest';

import {
  renderIssueBody,
  buildIssueLabels,
  renderDependencyGraph,
  type IssueBody,
  type CreateIssueInput,
  type DependencyGraph,
} from '../src/github/index.js';

describe('renderIssueBody', () => {
  it('renders a complete development issue', () => {
    const body: IssueBody = {
      objective: 'Implement user login',
      context: 'Part of the auth module.',
      dependsOn: [1],
      blockedBy: [2],
      acceptanceCriteria: ['Login form renders', 'Valid credentials redirect to dashboard'],
      expectedBehavior:
        'Given a registered user\nWhen they submit valid credentials\nThen they are redirected to the dashboard',
    };

    const rendered = renderIssueBody(body);

    expect(rendered).toContain('## Objetivo / Objective');
    expect(rendered).toContain('Implement user login');
    expect(rendered).toContain('**Depends on**: #1');
    expect(rendered).toContain('**Blocked by**: #2');
    expect(rendered).toContain('- [ ] Login form renders');
    expect(rendered).toContain('```gherkin');
    expect(rendered).toContain('Given a registered user');
  });

  it('renders "none" when no dependencies', () => {
    const body: IssueBody = {
      objective: 'Set up CI',
      acceptanceCriteria: ['CI runs lint', 'CI runs tests'],
    };

    const rendered = renderIssueBody(body);

    expect(rendered).toContain('**Depends on**: none');
    expect(rendered).toContain('**Blocked by**: none');
  });

  it('renders linked tests as comment placeholder', () => {
    const body: IssueBody = {
      objective: 'Test login flow',
      acceptanceCriteria: ['Test passes'],
      linkedTests: [5, 6],
    };

    const rendered = renderIssueBody(body);
    expect(rendered).toContain('<!-- tests: #5, #6 -->');
  });

  it('renders Closes as comment placeholder', () => {
    const body: IssueBody = {
      objective: 'Fix login bug',
      acceptanceCriteria: ['Bug is fixed'],
      closesIssue: 10,
    };

    const rendered = renderIssueBody(body);
    expect(rendered).toContain('<!-- Closes #10 -->');
  });

  it('omits expected behavior section when not provided', () => {
    const body: IssueBody = {
      objective: 'Update docs',
      acceptanceCriteria: ['Docs updated'],
    };

    const rendered = renderIssueBody(body);
    expect(rendered).not.toContain('## Expected behavior');
  });
});

describe('buildIssueLabels', () => {
  it('builds labels with category, priority, and phase', () => {
    const input: CreateIssueInput = {
      owner: 'test',
      repo: 'test',
      title: 'Test issue',
      body: { objective: 'Test', acceptanceCriteria: [] },
      category: 'development',
      priority: 'P1',
      phase: 'phase:2',
    };

    const labels = buildIssueLabels(input);
    expect(labels).toContain('development');
    expect(labels).toContain('P1');
    expect(labels).toContain('phase:2');
    expect(labels).toHaveLength(3);
  });

  it('includes additional labels', () => {
    const input: CreateIssueInput = {
      owner: 'test',
      repo: 'test',
      title: 'Test issue',
      body: { objective: 'Test', acceptanceCriteria: [] },
      category: 'bug',
      additionalLabels: ['blocked', 'needs-human'],
    };

    const labels = buildIssueLabels(input);
    expect(labels).toContain('bug');
    expect(labels).toContain('blocked');
    expect(labels).toContain('needs-human');
  });

  it('works with only category (no priority or phase)', () => {
    const input: CreateIssueInput = {
      owner: 'test',
      repo: 'test',
      title: 'Test issue',
      body: { objective: 'Test', acceptanceCriteria: [] },
      category: 'documentation',
    };

    const labels = buildIssueLabels(input);
    expect(labels).toEqual(['documentation']);
  });

  it('deduplicates labels', () => {
    const input: CreateIssueInput = {
      owner: 'test',
      repo: 'test',
      title: 'Test issue',
      body: { objective: 'Test', acceptanceCriteria: [] },
      category: 'development',
      additionalLabels: ['development', 'P1'],
    };

    const labels = buildIssueLabels(input);
    const unique = new Set(labels);
    expect(labels.length).toBe(unique.size);
  });
});

describe('renderDependencyGraph', () => {
  it('renders the graph as a markdown table + edge list', () => {
    const graph: DependencyGraph = {
      nodes: [
        { number: 1, title: 'Set up scaffold', category: 'development' },
        { number: 2, title: 'Implement auth', category: 'development' },
        { number: 3, title: 'Test auth E2E', category: 'testing' },
      ],
      edges: [
        { from: 2, to: 1, type: 'blocked-by' },
        { from: 3, to: 2, type: 'depends-on' },
      ],
    };

    const rendered = renderDependencyGraph(graph);

    expect(rendered).toContain('# Dependency Graph');
    expect(rendered).toContain('| #1 | Set up scaffold | development |');
    expect(rendered).toContain('#2 ← blocked by #1');
    expect(rendered).toContain('#3 ← depends on #2');
  });

  it('handles empty graph gracefully', () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };

    const rendered = renderDependencyGraph(graph);
    expect(rendered).toContain('# Dependency Graph');
    expect(rendered).toContain('## Issues');
    expect(rendered).toContain('## Dependencies');
  });
});
