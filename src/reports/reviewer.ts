export interface ReviewChecklistItem {
  id: string;
  label: string;
  isPassed: boolean;
  details?: string | undefined;
}

export interface ReviewResult {
  verdict: 'APPROVED' | 'CHANGES_REQUESTED';
  checklist: ReviewChecklistItem[];
  summary: string;
  prNumber: number;
}

export const DEFAULT_CHECKLIST: readonly ReviewChecklistItem[] = [
  { id: 'legibility', label: 'Code is legible and follows project conventions', isPassed: false },
  {
    id: 'understandable',
    label: 'Code is understandable (no overly clever constructs)',
    isPassed: false,
  },
  {
    id: 'scalable',
    label: 'Code is scalable (no hard-coded limits, no tight coupling)',
    isPassed: false,
  },
  { id: 'lint', label: 'Lint passes without errors', isPassed: false },
  { id: 'typecheck', label: 'Typecheck passes without errors', isPassed: false },
  { id: 'unit-tests', label: 'Unit tests pass with coverage >= threshold', isPassed: false },
  { id: 'no-secrets', label: 'No secrets or sensitive data committed', isPassed: false },
  { id: 'no-build-artifacts', label: 'No dist/coverage/node_modules committed', isPassed: false },
  { id: 'conventional-commit', label: 'PR follows conventional commit format', isPassed: false },
  { id: 'linked-issues', label: 'Linked issues have Closes #N', isPassed: false },
];

export function evaluateChecklist(
  overrides: Partial<Record<string, boolean>>,
): ReviewChecklistItem[] {
  return DEFAULT_CHECKLIST.map((item) => {
    const isPassed = overrides[item.id] ?? false;
    return { ...item, isPassed };
  });
}

export function computeReviewVerdict(
  checklist: ReviewChecklistItem[],
): 'APPROVED' | 'CHANGES_REQUESTED' {
  const isAllPassed = checklist.every((item) => item.isPassed);
  return isAllPassed ? 'APPROVED' : 'CHANGES_REQUESTED';
}

const REVIEW_LABELS: Record<ReviewResult['verdict'], string> = {
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'dev-done',
} as const;

export function getLabelForVerdict(verdict: ReviewResult['verdict']): string {
  return REVIEW_LABELS[verdict];
}

export function buildReviewReport(result: ReviewResult): string {
  const lines: string[] = [
    `## Reviewer Report — PR #${String(result.prNumber)}`,
    '',
    `**Verdict:** ${result.verdict}`,
    '',
    '### Checklist',
    '',
  ];

  for (const item of result.checklist) {
    const emoji = item.isPassed ? '✅' : '❌';
    lines.push(`- [${item.isPassed ? 'x' : ' '}] ${emoji} ${item.label}`);
  }

  lines.push('', '### Summary', '', result.summary, '');

  if (result.verdict === 'APPROVED') {
    lines.push('> ✅ **Approved** — Gatekeeper can proceed with merge dev→testing.');
  } else {
    lines.push('> ❌ **Changes requested** — Developer should address failed items and re-push.');
  }

  return lines.join('\n');
}

export function runReview(
  prNumber: number,
  overrides: Partial<Record<string, boolean>>,
  summary: string,
): ReviewResult {
  const checklist = evaluateChecklist(overrides);
  const verdict = computeReviewVerdict(checklist);
  return {
    verdict,
    checklist,
    summary,
    prNumber,
  };
}
