import { describe, expect, it } from 'vitest';

import {
  Dispatcher,
  DISPATCH_ROUTES,
  createEvent,
  type PipelineEvent,
  type DispatchHandler,
} from '../src/orchestrator/index.js';

describe('createEvent', () => {
  it('creates an event with type and source', () => {
    const event = createEvent('requirement:added', 'manual');
    expect(event.type).toBe('requirement:added');
    expect(event.source).toBe('manual');
    expect(event.timestamp).toBeDefined();
  });

  it('accepts overrides', () => {
    const event = createEvent('issue:created', 'webhook', {
      issueNumber: 42,
      payload: { label: 'development' },
    });
    expect(event.issueNumber).toBe(42);
    expect(event.payload?.label).toBe('development');
  });
});

describe('DISPATCH_ROUTES', () => {
  it('has routes for key events', () => {
    const descriptions = DISPATCH_ROUTES.map((route) => route.description);
    expect(descriptions.some((d) => d.includes('Product'))).toBe(true);
    expect(descriptions.some((d) => d.includes('QA-Spec'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Developer'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Reviewer'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Gatekeeper'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Deploy'))).toBe(true);
  });
});

describe('Dispatcher.resolve', () => {
  it('routes requirement:added to product agent', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('requirement:added', 'manual');
    expect(dispatcher.resolve(event)).toBe('product');
  });

  it('routes issue:created with label development to qa-spec', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('issue:created', 'webhook', {
      payload: { label: 'development' },
    });
    expect(dispatcher.resolve(event)).toBe('qa-spec');
  });

  it('routes issue:dev-ready to developer', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('issue:dev-ready', 'ci', { issueNumber: 5 });
    expect(dispatcher.resolve(event)).toBe('developer');
  });

  it('routes pr:opened to dev → reviewer', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('pr:opened', 'webhook', {
      prNumber: 12,
      payload: { targetBranch: 'dev' },
    });
    expect(dispatcher.resolve(event)).toBe('reviewer');
  });

  it('routes pr:opened to testing → qa-run', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('pr:opened', 'webhook', {
      prNumber: 13,
      payload: { targetBranch: 'testing' },
    });
    expect(dispatcher.resolve(event)).toBe('qa-run');
  });

  it('routes human:approve-main to deploy', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('human:approve-main', 'manual');
    expect(dispatcher.resolve(event)).toBe('deploy');
  });

  it('returns undefined for unknown event type', () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('unknown:event', 'manual');
    expect(dispatcher.resolve(event)).toBeUndefined();
  });
});

describe('Dispatcher.dispatch', () => {
  it('calls the registered handler for the resolved agent', async () => {
    const calls: PipelineEvent[] = [];
    const handler: DispatchHandler = (event) => {
      calls.push(event);
      return Promise.resolve();
    };
    const dispatcher = new Dispatcher();
    dispatcher.registerHandler('product', handler);

    const event = createEvent('requirement:added', 'manual');
    const result = await dispatcher.dispatch(event);

    expect(result.agent).toBe('product');
    expect(result.dispatched).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.type).toBe('requirement:added');
  });

  it('returns dispatched=false when no handler registered', async () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('requirement:added', 'manual');
    const result = await dispatcher.dispatch(event);
    expect(result.agent).toBe('product');
    expect(result.dispatched).toBe(false);
  });

  it('returns dispatched=false when no route matches', async () => {
    const dispatcher = new Dispatcher();
    const event = createEvent('unknown:event', 'manual');
    const result = await dispatcher.dispatch(event);
    expect(result.agent).toBeUndefined();
    expect(result.dispatched).toBe(false);
  });
});

describe('Dispatcher.log', () => {
  it('records resolved events', () => {
    const dispatcher = new Dispatcher();
    dispatcher.resolve(createEvent('requirement:added', 'manual'));
    dispatcher.resolve(createEvent('issue:dev-ready', 'ci'));
    expect(dispatcher.getLog()).toHaveLength(2);
  });

  it('clears the log', () => {
    const dispatcher = new Dispatcher();
    dispatcher.resolve(createEvent('requirement:added', 'manual'));
    dispatcher.clearLog();
    expect(dispatcher.getLog()).toHaveLength(0);
  });
});
