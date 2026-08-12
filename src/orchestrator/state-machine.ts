export const PIPELINE_STATES = [
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
] as const;

export type PipelineState = (typeof PIPELINE_STATES)[number];

export interface StateTransition {
  from: PipelineState;
  to: PipelineState;
  triggeredBy: string;
  agent: string;
  requiresHuman?: boolean | undefined;
}

export const STATE_TRANSITIONS: readonly StateTransition[] = [
  {
    from: 'created',
    to: 'spec-ready',
    triggeredBy: 'issue:created+dev',
    agent: 'qa-spec',
  },
  {
    from: 'created',
    to: 'dev-ready',
    triggeredBy: 'issue:created+non-dev',
    agent: 'product',
  },
  {
    from: 'spec-ready',
    to: 'dev-ready',
    triggeredBy: 'specs:attached',
    agent: 'qa-spec',
  },
  {
    from: 'dev-ready',
    to: 'in-dev',
    triggeredBy: 'issue:assigned',
    agent: 'developer',
  },
  {
    from: 'in-dev',
    to: 'dev-done',
    triggeredBy: 'pr:to-dev-opened',
    agent: 'developer',
  },
  {
    from: 'dev-done',
    to: 'review',
    triggeredBy: 'pr:to-dev-opened',
    agent: 'reviewer',
  },
  {
    from: 'review',
    to: 'approved',
    triggeredBy: 'reviewer:approved',
    agent: 'reviewer',
  },
  {
    from: 'review',
    to: 'in-dev',
    triggeredBy: 'reviewer:changes-requested',
    agent: 'developer',
  },
  {
    from: 'approved',
    to: 'testing',
    triggeredBy: 'merge:dev-to-testing',
    agent: 'gatekeeper',
  },
  {
    from: 'testing',
    to: 'test-failed',
    triggeredBy: 'qa-run:fail',
    agent: 'qa-run',
  },
  {
    from: 'testing',
    to: 'pr-main',
    triggeredBy: 'qa-run:pass',
    agent: 'gatekeeper',
  },
  {
    from: 'test-failed',
    to: 'in-dev',
    triggeredBy: 'feedback:to-dev',
    agent: 'developer',
  },
  {
    from: 'pr-main',
    to: 'deployed',
    triggeredBy: 'human:approve-main',
    agent: 'deploy',
    requiresHuman: true,
  },
  {
    from: 'deployed',
    to: 'closed',
    triggeredBy: 'deploy:success',
    agent: 'orchestrator',
  },
  {
    from: 'pr-main',
    to: 'closed',
    triggeredBy: 'human:reject',
    agent: 'orchestrator',
    requiresHuman: true,
  },
];

export class InvalidTransitionError extends Error {
  public readonly from: PipelineState;
  public readonly to: PipelineState;

  public constructor(from: PipelineState, to: PipelineState) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function getValidTransitions(from: PipelineState): readonly StateTransition[] {
  return STATE_TRANSITIONS.filter((transition) => transition.from === from);
}

export function canTransition(from: PipelineState, to: PipelineState): boolean {
  return STATE_TRANSITIONS.some((transition) => transition.from === from && transition.to === to);
}

export function isTerminalState(state: PipelineState): boolean {
  return state === 'closed' || state === 'deployed';
}

export function requiresHumanApproval(from: PipelineState, to: PipelineState): boolean {
  const transition = STATE_TRANSITIONS.find(
    (transition_) => transition_.from === from && transition_.to === to,
  );
  return transition?.requiresHuman ?? false;
}

export function getTransition(from: PipelineState, to: PipelineState): StateTransition {
  const transition = STATE_TRANSITIONS.find(
    (transition_) => transition_.from === from && transition_.to === to,
  );
  if (!transition) {
    throw new InvalidTransitionError(from, to);
  }
  return transition;
}

export function isPipelineState(value: string): value is PipelineState {
  return (PIPELINE_STATES as readonly string[]).includes(value);
}
