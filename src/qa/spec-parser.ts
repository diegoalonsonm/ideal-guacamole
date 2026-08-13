export interface GherkinStep {
  keyword: 'Given' | 'When' | 'Then' | 'And';
  text: string;
}

export interface GherkinScenario {
  name: string;
  steps: GherkinStep[];
}

export interface ParsedSpec {
  scenarios: GherkinScenario[];
  rawSection: string;
}

export interface TestSkeletonOptions {
  issueNumber: number;
  featureName?: string | undefined;
  importPath?: string | undefined;
}

export class SpecParseError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'SpecParseError';
  }
}

const STEP_KEYWORDS = new Set(['Given', 'When', 'Then', 'And']);

const EXPECTED_BEHAVIOR_HEADERS = new Set([
  '## Expected behavior / Comportamiento esperado',
  '## Expected behavior',
]);

function parseFirstWord(line: string): string {
  const parts = line.split(/\s+/, 2);
  return parts[0] ?? '';
}

export function extractExpectedBehaviorSection(issueBody: string): string {
  const lines = issueBody.split('\n');
  let startIndex = -1;

  for (const [index, line] of lines.entries()) {
    if (EXPECTED_BEHAVIOR_HEADERS.has(line.trim())) {
      startIndex = index + 1;
      break;
    }
  }

  if (startIndex === -1) {
    throw new SpecParseError('No "## Expected behavior" section found in issue body');
  }

  let endIndex = lines.length;
  for (let i = startIndex; i < lines.length; i++) {
    const trimmed = lines[i]?.trim() ?? '';
    if (trimmed.startsWith('## ') || trimmed.startsWith('<!-- ')) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n').trim();
}

export function parseGherkinScenarios(rawSection: string): ParsedSpec {
  const lines = rawSection.split('\n');
  const scenarios: GherkinScenario[] = [];
  let currentScenario: GherkinScenario | null = null;
  let isInFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      isInFence = !isInFence;
      continue;
    }

    if (isInFence) {
      if (trimmed.toLowerCase().startsWith('scenario:')) {
        const name = trimmed.slice('scenario:'.length).trim();
        currentScenario = { name, steps: [] };
        scenarios.push(currentScenario);
        continue;
      }

      const firstWord = parseFirstWord(trimmed);
      if (STEP_KEYWORDS.has(firstWord)) {
        const keyword = firstWord as GherkinStep['keyword'];
        const text = trimmed.slice(keyword.length).trim();
        const scenario: GherkinScenario = currentScenario ?? { name: 'Scenario', steps: [] };
        scenario.steps.push({ keyword, text });
        if (!currentScenario) {
          currentScenario = scenario;
          scenarios.push(scenario);
        }
      }
      continue;
    }

    if (trimmed.toLowerCase().startsWith('scenario:')) {
      const name = trimmed.slice('scenario:'.length).trim();
      currentScenario = { name, steps: [] };
      scenarios.push(currentScenario);
    }
  }

  if (scenarios.length === 0) {
    const inlineSteps = extractInlineSteps(rawSection);
    if (inlineSteps.length > 0) {
      scenarios.push({ name: 'Default scenario', steps: inlineSteps });
    }
  }

  if (scenarios.length === 0) {
    throw new SpecParseError('No Given/When/Then steps found in expected behavior section');
  }

  return { scenarios, rawSection };
}

function extractInlineSteps(rawSection: string): GherkinStep[] {
  const steps: GherkinStep[] = [];
  const lines = rawSection.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const firstWord = parseFirstWord(trimmed);
    if (STEP_KEYWORDS.has(firstWord)) {
      const keyword = firstWord as GherkinStep['keyword'];
      const text = trimmed.slice(keyword.length).trim();
      steps.push({ keyword, text });
    }
  }

  return steps;
}

function generateStepCode(step: GherkinStep): string {
  const text = step.text;

  switch (step.keyword) {
    case 'Given': {
      return `  // GIVEN: ${text}\n  // TODO: Set up initial context\n  await page.goto('/');`;
    }
    case 'When': {
      return `  // WHEN: ${text}\n  // TODO: Perform action\n  await page.click('button');`;
    }
    case 'Then': {
      return `  // THEN: ${text}\n  // TODO: Assert expected outcome\n  await expect(page.locator('body')).toBeVisible();`;
    }
    case 'And': {
      const escaped = text.replaceAll("'", String.raw`\'`);
      return `  // AND: ${text}\n  // TODO: Additional step\n  await page.fill('input', '${escaped}');`;
    }
  }
}

export function generatePlaywrightSkeleton(spec: ParsedSpec, options: TestSkeletonOptions): string {
  const featureName = options.featureName ?? `Issue #${String(options.issueNumber)}`;
  const importPath = options.importPath ?? '@playwright/test';
  const testFile = `tests/e2e/issue-${String(options.issueNumber)}.spec.ts`;

  const testBlocks: string[] = [];

  for (const [index, scenario] of spec.scenarios.entries()) {
    const testName = scenario.name || `scenario ${String(index + 1)}`;
    const stepLines = scenario.steps.map((step) => generateStepCode(step));

    testBlocks.push(`test('${testName}', async ({ page }) => {\n${stepLines.join('\n\n')}\n});`);
  }

  return [
    `/**`,
    ` * ${testFile}`,
    ` * Generated by ideal-guacamole QA-Spec agent.`,
    ` * Feature: ${featureName}`,
    ` * Issue: #${String(options.issueNumber)}`,
    ` *`,
    ` * This is a SKELETON — the developer must fill in the TODOs`,
    ` * to make these tests pass. The assertions here are placeholders.`,
    ` */`,
    `import { test, expect } from '${importPath}';`,
    '',
    ...testBlocks,
    '',
  ].join('\n');
}

export function parseIssueToSkeleton(
  issueBody: string,
  options: TestSkeletonOptions,
): { skeleton: string; spec: ParsedSpec } {
  const section = extractExpectedBehaviorSection(issueBody);
  const spec = parseGherkinScenarios(section);
  const skeleton = generatePlaywrightSkeleton(spec, options);
  return { skeleton, spec };
}

export function getTestFilePath(issueNumber: number, basePath = 'tests'): string {
  return `${basePath}/e2e/issue-${String(issueNumber)}.spec.ts`;
}
