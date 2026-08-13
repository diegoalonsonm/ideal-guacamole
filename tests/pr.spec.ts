import { describe, expect, it } from 'vitest';

import { parseLinkedIssues } from '../src/github/index.js';

describe('parseLinkedIssues', () => {
  it('extracts issue numbers from Closes #N', () => {
    const body = 'This PR implements login.\n\nCloses #12';
    expect(parseLinkedIssues(body)).toEqual([12]);
  });

  it('extracts from multiple closes/fixes/resolves', () => {
    const body = 'Closes #1, fixes #2 and resolves #3';
    const result = parseLinkedIssues(body);
    expect(result).toEqual([1, 2, 3]);
  });

  it('is case insensitive', () => {
    const body = 'closes #5 and FIXES #10';
    expect(parseLinkedIssues(body)).toEqual([5, 10]);
  });

  it('returns empty array for null body', () => {
    expect(parseLinkedIssues(null)).toEqual([]);
  });

  it('returns empty array when no matches', () => {
    expect(parseLinkedIssues('No linked issues here')).toEqual([]);
  });
});
