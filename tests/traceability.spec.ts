import { describe, expect, it } from 'vitest';

import {
  parseTraceabilityRefs,
  buildTraceabilityGraph,
  renderTraceabilityGraph,
} from '../src/traceability/index.js';

describe('parseTraceabilityRefs', () => {
  it('extracts closes, tests, and bug references', () => {
    const body = [
      '## Description',
      'Some work',
      '',
      '<!-- tests: #5, #6 -->',
      'Closes #12',
      '<!-- bug: #3 -->',
    ].join('\n');

    const refs = parseTraceabilityRefs(body);
    expect(refs.closes).toEqual([12]);
    expect(refs.tests).toEqual([5, 6]);
    expect(refs.bug).toEqual([3]);
  });

  it('returns empty arrays for body without refs', () => {
    const refs = parseTraceabilityRefs('No refs here');
    expect(refs.closes).toEqual([]);
    expect(refs.tests).toEqual([]);
    expect(refs.bug).toEqual([]);
  });
});

describe('buildTraceabilityGraph', () => {
  it('builds nodes and edges from issues', () => {
    const issues = [
      {
        number: 1,
        title: 'Set up project',
        body: null,
        labels: ['development'],
      },
      {
        number: 2,
        title: 'Test issue 1',
        body: '<!-- tests: #1 -->',
        labels: ['testing'],
      },
      {
        number: 3,
        title: 'Bug in login',
        body: '<!-- bug: #3 --> Closes #1',
        labels: ['bug'],
      },
    ];

    const graph = buildTraceabilityGraph(issues);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
    expect(graph.edges.length).toBeGreaterThan(0);

    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain('issue');
    expect(nodeTypes).toContain('test');
    expect(nodeTypes).toContain('bug');
  });
});

describe('renderTraceabilityGraph', () => {
  it('renders markdown with nodes and links', () => {
    const graph = {
      nodes: [
        { number: 1, type: 'issue' as const, title: 'Issue 1' },
        { number: 2, type: 'test' as const, title: 'Test 2' },
      ],
      edges: [{ from: 2, to: 1, label: 'tests' as const }],
    };

    const rendered = renderTraceabilityGraph(graph);
    expect(rendered).toContain('# Traceability');
    expect(rendered).toContain('| # | Type | Title |');
    expect(rendered).toContain('Issue 1');
    expect(rendered).toContain('→ tests →');
  });
});
