import type { PipelineState } from './state-machine.js';
import { isPipelineState } from './state-machine.js';

export type AgentName =
  | 'orchestrator'
  | 'product'
  | 'qa-spec'
  | 'qa-run'
  | 'developer'
  | 'reviewer'
  | 'gatekeeper'
  | 'docs'
  | 'deploy';

export type EventSource = 'manual' | 'ci' | 'webhook' | 'scheduled';

export interface PipelineEvent {
  type: string;
  source: EventSource;
  issueNumber?: number | undefined;
  prNumber?: number | undefined;
  agent?: AgentName | undefined;
  payload?: Record<string, unknown> | undefined;
  timestamp?: string | undefined;
}

export type DispatchHandler = (event: PipelineEvent) => Promise<void>;

export interface DispatchRoute {
  match: (event: PipelineEvent) => boolean;
  agent: AgentName;
  description: string;
}

export const DISPATCH_ROUTES: readonly DispatchRoute[] = [
  {
    match: (event) => event.type === 'requirement:added',
    agent: 'product',
    description: 'New requirement → Product agent generates issues',
  },
  {
    match: (event) => event.type === 'issue:created' && event.payload?.label === 'development',
    agent: 'qa-spec',
    description: 'Development issue created → QA-Spec derives test specs',
  },
  {
    match: (event) => event.type === 'issue:dev-ready',
    agent: 'developer',
    description: 'Issue dev-ready → Developer implements',
  },
  {
    match: (event) => event.type === 'pr:opened' && event.payload?.targetBranch === 'dev',
    agent: 'reviewer',
    description: 'PR to dev → Reviewer reviews code',
  },
  {
    match: (event) => event.type === 'pr:opened' && event.payload?.targetBranch === 'testing',
    agent: 'qa-run',
    description: 'PR to testing → QA-Run executes E2E tests',
  },
  {
    match: (event) => event.type === 'qa-run:pass',
    agent: 'gatekeeper',
    description: 'Tests pass → Gatekeeper generates release report',
  },
  {
    match: (event) => event.type === 'human:approve-main',
    agent: 'deploy',
    description: 'Human approves → Deploy executes deployment',
  },
  {
    match: (event) => event.type === 'merge:to-dev',
    agent: 'docs',
    description: 'Merge to dev → Docs regenerates documentation',
  },
  {
    match: (event) => event.type === 'bug:closed',
    agent: 'docs',
    description: 'Bug closed → Docs records root-cause',
  },
  {
    match: (event) => event.type === 'pr:approved',
    agent: 'gatekeeper',
    description: 'PR approved → Gatekeeper merges dev→testing',
  },
];

export class Dispatcher {
  private readonly handlers: Map<AgentName, DispatchHandler> = new Map<
    AgentName,
    DispatchHandler
  >();
  private readonly routes: readonly DispatchRoute[];
  private readonly log: PipelineEvent[] = [];

  public constructor(routes: readonly DispatchRoute[] = DISPATCH_ROUTES) {
    this.routes = routes;
  }

  public registerHandler(agent: AgentName, handler: DispatchHandler): void {
    this.handlers.set(agent, handler);
  }

  public resolve(event: PipelineEvent): AgentName | undefined {
    for (const route of this.routes) {
      if (route.match(event)) {
        this.log.push(event);
        return route.agent;
      }
    }
    this.log.push(event);
    return undefined;
  }

  public async dispatch(
    event: PipelineEvent,
  ): Promise<{ agent: AgentName | undefined; dispatched: boolean }> {
    const agent = this.resolve(event);
    if (!agent) {
      return { agent: undefined, dispatched: false };
    }
    const handler = this.handlers.get(agent);
    if (!handler) {
      return { agent, dispatched: false };
    }
    await handler(event);
    return { agent, dispatched: true };
  }

  public getLog(): readonly PipelineEvent[] {
    return [...this.log];
  }

  public clearLog(): void {
    this.log.length = 0;
  }
}

export function createEvent(
  type: string,
  source: EventSource,
  overrides?: Partial<Omit<PipelineEvent, 'type' | 'source'>>,
): PipelineEvent {
  return {
    type,
    source,
    ...overrides,
    timestamp: overrides?.timestamp ?? new Date().toISOString(),
  };
}

export function stateToEvent(state: PipelineState): string {
  if (!isPipelineState(state)) {
    return 'unknown';
  }
  return `state:${state}`;
}
