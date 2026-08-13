import { describe, expect, it } from 'vitest';

import {
  extractExpectedBehaviorSection,
  parseGherkinScenarios,
  generatePlaywrightSkeleton,
  parseIssueToSkeleton,
  getTestFilePath,
  SpecParseError,
} from '../src/qa/index.js';

const ISSUE_BODY_WITH_GHERKIN = `## Objetivo / Objective

Implement user login.

## Contexto / Context

Part of the auth module.

**Depends on**: none
**Blocked by**: none

## Criterios de aceptación / Acceptance criteria

- [ ] Login form renders
- [ ] Valid credentials redirect to dashboard

## Expected behavior / Comportamiento esperado

\`\`\`gherkin
Scenario: Successful login with valid credentials
  Given a registered user on the login page
  When they enter valid credentials
  Then they are redirected to the dashboard
  And they see a welcome message

Scenario: Failed login with invalid credentials
  Given a user on the login page
  When they enter invalid credentials
  Then they see an error message
\`\`\`

## Tests vinculados / Linked tests

<!-- tests: none -->
`;

const ISSUE_BODY_NO_SECTION = `## Objetivo / Objective

Some issue without expected behavior.

## Criterios de aceptación / Acceptance criteria

- [ ] Do something
`;

const ISSUE_BODY_INLINE_STEPS = `## Objetivo / Objective

Inline steps.

## Expected behavior / Comportamiento esperado

Given a user on the home page
When they click the logout button
Then they are redirected to the login page
`;

describe('extractExpectedBehaviorSection', () => {
  it('extracts the section between ## Expected behavior and the next ## section', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_WITH_GHERKIN);
    expect(section).toContain('```gherkin');
    expect(section).toContain('Scenario: Successful login');
    expect(section).toContain('Scenario: Failed login');
  });

  it('throws SpecParseError when section is missing', () => {
    expect(() => extractExpectedBehaviorSection(ISSUE_BODY_NO_SECTION)).toThrow(SpecParseError);
  });
});

describe('parseGherkinScenarios', () => {
  it('parses named scenarios with their steps', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_WITH_GHERKIN);
    const spec = parseGherkinScenarios(section);

    expect(spec.scenarios).toHaveLength(2);

    const first = spec.scenarios[0];
    expect(first?.name).toBe('Successful login with valid credentials');
    expect(first?.steps).toHaveLength(4);
    expect(first?.steps[0]?.keyword).toBe('Given');
    expect(first?.steps[0]?.text).toBe('a registered user on the login page');
    expect(first?.steps[2]?.keyword).toBe('Then');
    expect(first?.steps[3]?.keyword).toBe('And');
  });

  it('parses inline steps (no Scenario: prefix) as default scenario', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_INLINE_STEPS);
    const spec = parseGherkinScenarios(section);

    expect(spec.scenarios).toHaveLength(1);
    const scenario = spec.scenarios[0];
    expect(scenario?.steps).toHaveLength(3);
    expect(scenario?.steps[0]?.keyword).toBe('Given');
    expect(scenario?.steps[1]?.keyword).toBe('When');
    expect(scenario?.steps[2]?.keyword).toBe('Then');
  });

  it('throws SpecParseError when no steps found', () => {
    expect(() => parseGherkinScenarios('Some text without any Gherkin steps')).toThrow(
      SpecParseError,
    );
  });
});

describe('generatePlaywrightSkeleton', () => {
  it('generates a valid Playwright test file with imports and test blocks', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_WITH_GHERKIN);
    const spec = parseGherkinScenarios(section);
    const skeleton = generatePlaywrightSkeleton(spec, { issueNumber: 42 });

    expect(skeleton).toContain("import { test, expect } from '@playwright/test'");
    expect(skeleton).toContain("test('Successful login with valid credentials'");
    expect(skeleton).toContain("test('Failed login with invalid credentials'");
    expect(skeleton).toContain('// GIVEN: a registered user on the login page');
    expect(skeleton).toContain('// WHEN: they enter valid credentials');
    expect(skeleton).toContain('// THEN: they are redirected to the dashboard');
    expect(skeleton).toContain('// AND: they see a welcome message');
    expect(skeleton).toContain('async ({ page })');
  });

  it('includes issue number in header comment', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_WITH_GHERKIN);
    const spec = parseGherkinScenarios(section);
    const skeleton = generatePlaywrightSkeleton(spec, { issueNumber: 7 });

    expect(skeleton).toContain('Issue: #7');
    expect(skeleton).toContain('issue-7.spec.ts');
  });

  it('uses custom feature name when provided', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_WITH_GHERKIN);
    const spec = parseGherkinScenarios(section);
    const skeleton = generatePlaywrightSkeleton(spec, {
      issueNumber: 1,
      featureName: 'User Authentication',
    });

    expect(skeleton).toContain('Feature: User Authentication');
  });

  it('uses custom import path when provided', () => {
    const section = extractExpectedBehaviorSection(ISSUE_BODY_WITH_GHERKIN);
    const spec = parseGherkinScenarios(section);
    const skeleton = generatePlaywrightSkeleton(spec, {
      issueNumber: 1,
      importPath: '@fixtures/test',
    });

    expect(skeleton).toContain("import { test, expect } from '@fixtures/test'");
  });
});

describe('parseIssueToSkeleton', () => {
  it('end-to-end: issue body → skeleton', () => {
    const result = parseIssueToSkeleton(ISSUE_BODY_WITH_GHERKIN, { issueNumber: 99 });

    expect(result.spec.scenarios).toHaveLength(2);
    expect(result.skeleton).toContain("test('Successful login");
    expect(result.skeleton).toContain('Issue: #99');
  });

  it('throws when issue body has no expected behavior section', () => {
    expect(() => parseIssueToSkeleton(ISSUE_BODY_NO_SECTION, { issueNumber: 1 })).toThrow(
      SpecParseError,
    );
  });
});

describe('getTestFilePath', () => {
  it('returns the path with issue number', () => {
    expect(getTestFilePath(42)).toBe('tests/e2e/issue-42.spec.ts');
  });

  it('uses custom base path', () => {
    expect(getTestFilePath(10, 'custom-tests')).toBe('custom-tests/e2e/issue-10.spec.ts');
  });
});
