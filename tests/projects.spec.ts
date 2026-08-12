import { describe, expect, it } from 'vitest';

import {
  getColumnForState,
  mapStateToColumn,
  COLUMN_TO_STATE,
  ProjectsError,
} from '../src/github/index.js';

describe('getColumnForState', () => {
  it('maps all 12 pipeline states to column names', () => {
    expect(getColumnForState('created')).toBe('Backlog');
    expect(getColumnForState('spec-ready')).toBe('Spec Ready');
    expect(getColumnForState('dev-ready')).toBe('Dev Ready');
    expect(getColumnForState('in-dev')).toBe('In Dev');
    expect(getColumnForState('dev-done')).toBe('Dev Done');
    expect(getColumnForState('testing')).toBe('Testing');
    expect(getColumnForState('test-failed')).toBe('Test Failed');
    expect(getColumnForState('review')).toBe('Review');
    expect(getColumnForState('approved')).toBe('Approved');
    expect(getColumnForState('pr-main')).toBe('PR to Main');
    expect(getColumnForState('deployed')).toBe('Deployed');
    expect(getColumnForState('closed')).toBe('Done');
  });

  it('returns undefined for unknown state', () => {
    expect(getColumnForState('unknown')).toBeUndefined();
  });
});

describe('COLUMN_TO_STATE', () => {
  it('is the reverse mapping of state → column', () => {
    expect(COLUMN_TO_STATE.Backlog).toBe('created');
    expect((COLUMN_TO_STATE as Record<string, string>)['Dev Ready']).toBe('dev-ready');
    expect((COLUMN_TO_STATE as Record<string, string>).Testing).toBe('testing');
    expect(COLUMN_TO_STATE.Done).toBe('closed');
  });
});

describe('mapStateToColumn', () => {
  it('returns the column name for valid state', () => {
    expect(mapStateToColumn('dev-ready')).toBe('Dev Ready');
    expect(mapStateToColumn('testing')).toBe('Testing');
  });

  it('throws ProjectsError for unknown state', () => {
    expect(() => mapStateToColumn('invalid')).toThrow(ProjectsError);
  });
});
