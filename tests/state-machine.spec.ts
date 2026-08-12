import { describe, expect, it } from 'vitest';

import {
  PIPELINE_STATES,
  STATE_TRANSITIONS,
  canTransition,
  getValidTransitions,
  getTransition,
  isTerminalState,
  isPipelineState,
  requiresHumanApproval,
  InvalidTransitionError,
} from '../src/orchestrator/index.js';

describe('PIPELINE_STATES', () => {
  it('contains the expected states in order', () => {
    expect(PIPELINE_STATES).toEqual([
      'created',
      'spec-ready',
      'dev-ready',
      'in-dev',
      'dev-done',
      'testing',
      'test-failed',
      'review',
      'approved',
      'pr-main',
      'deployed',
      'closed',
    ]);
  });
});

describe('canTransition', () => {
  it('allows created → spec-ready', () => {
    expect(canTransition('created', 'spec-ready')).toBe(true);
  });

  it('allows dev-ready → in-dev', () => {
    expect(canTransition('dev-ready', 'in-dev')).toBe(true);
  });

  it('allows testing → test-failed', () => {
    expect(canTransition('testing', 'test-failed')).toBe(true);
  });

  it('allows testing → pr-main (tests pass)', () => {
    expect(canTransition('testing', 'pr-main')).toBe(true);
  });

  it('allows pr-main → deployed (human approves)', () => {
    expect(canTransition('pr-main', 'deployed')).toBe(true);
  });

  it('allows test-failed → in-dev (feedback loop)', () => {
    expect(canTransition('test-failed', 'in-dev')).toBe(true);
  });

  it('disallows closed → created (no backward from terminal)', () => {
    expect(canTransition('closed', 'created')).toBe(false);
  });

  it('disallows created → deployed (too many steps skipped)', () => {
    expect(canTransition('created', 'deployed')).toBe(false);
  });

  it('disallows review → testing (must be approved first)', () => {
    expect(canTransition('review', 'testing')).toBe(false);
  });
});

describe('getValidTransitions', () => {
  it('returns transitions from created', () => {
    const transitions = getValidTransitions('created');
    expect(transitions.length).toBeGreaterThanOrEqual(2);
    expect(transitions.every((t) => t.from === 'created')).toBe(true);
  });

  it('returns transitions from testing', () => {
    const transitions = getValidTransitions('testing');
    expect(transitions.length).toBe(2);
    expect(transitions.some((t) => t.to === 'test-failed')).toBe(true);
    expect(transitions.some((t) => t.to === 'pr-main')).toBe(true);
  });

  it('returns empty array for closed (terminal)', () => {
    expect(getValidTransitions('closed')).toHaveLength(0);
  });
});

describe('isTerminalState', () => {
  it('returns true for closed', () => {
    expect(isTerminalState('closed')).toBe(true);
  });

  it('returns true for deployed', () => {
    expect(isTerminalState('deployed')).toBe(true);
  });

  it('returns false for pr-main (still needs deploy)', () => {
    expect(isTerminalState('pr-main')).toBe(false);
  });
});

describe('requiresHumanApproval', () => {
  it('returns true for pr-main → deployed', () => {
    expect(requiresHumanApproval('pr-main', 'deployed')).toBe(true);
  });

  it('returns false for created → spec-ready (autonomous)', () => {
    expect(requiresHumanApproval('created', 'spec-ready')).toBe(false);
  });

  it('returns false for testing → pr-main (autonomous gatekeeper)', () => {
    expect(requiresHumanApproval('testing', 'pr-main')).toBe(false);
  });
});

describe('getTransition', () => {
  it('returns the transition object for a valid pair', () => {
    const transition = getTransition('created', 'spec-ready');
    expect(transition.from).toBe('created');
    expect(transition.to).toBe('spec-ready');
    expect(transition.agent).toBe('qa-spec');
  });

  it('throws InvalidTransitionError for an invalid pair', () => {
    expect(() => getTransition('closed', 'created')).toThrow(InvalidTransitionError);
  });
});

describe('isPipelineState', () => {
  it('returns true for valid states', () => {
    expect(isPipelineState('created')).toBe(true);
    expect(isPipelineState('deployed')).toBe(true);
  });

  it('returns false for invalid strings', () => {
    expect(isPipelineState('invalid')).toBe(false);
    expect(isPipelineState('')).toBe(false);
  });
});

describe('STATE_TRANSITIONS integrity', () => {
  it('all `from` states are valid pipeline states', () => {
    for (const transition of STATE_TRANSITIONS) {
      expect(isPipelineState(transition.from)).toBe(true);
    }
  });

  it('all `to` states are valid pipeline states', () => {
    for (const transition of STATE_TRANSITIONS) {
      expect(isPipelineState(transition.to)).toBe(true);
    }
  });

  it('every transition has an agent', () => {
    for (const transition of STATE_TRANSITIONS) {
      expect(transition.agent.length).toBeGreaterThan(0);
    }
  });
});
