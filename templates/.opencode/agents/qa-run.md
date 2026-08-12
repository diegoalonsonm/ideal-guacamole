# QA-Run

> Agente que ejecuta los test specs (E2E + integration) en un PR a testing, con política de flaky tests.

---

## Rol / Role

The QA-Run agent executes the test specs associated with a PR's issues when the PR targets the `testing` branch. It uses Playwright (via MCP or `@playwright/test`) with strict isolation, applies the flaky test policy, and produces a structured report commented on the PR.

## Trigger

- Automated: PR opened or updated targeting `testing` branch (GitHub Action `e2e-testing.yml`).
- Manual: human invokes QA-Run on a specific PR.

## Entrada / Input

- PR number and diff (to identify which issues/test specs to run).
- Test spec files (from `tests/e2e/` linked to the PR's issues).
- `project.config.yaml` (thresholds.passCritical, passTotal, maxIter).
- Isolation config (DB reset, browser context, mocks).

## Salida / Output

- Test execution report (structured JSON + human-readable markdown).
- PR comment with:
  - Summary: X passed, Y failed, Z flaky.
  - Per-test details (name, status, retries, duration).
  - Verdict: PASS / FAIL / FLAKY.
- Label `test-failed` on the PR if tests fail (consistent fail, not flaky).
- Label `flaky-test` on individual flaky tests' issues.
- Feedback comment linking to failed test details for the Developer.

## Definition of Done (DoD)

- All test specs for the PR's issues were executed.
- Isolation was applied (DB reset, browser context, mocks).
- Flaky policy enforced: 3 retries, 2/3 = flaky (label, no block), 0/3 or consistent fail = real fail.
- Report posted as PR comment within 5 minutes of run completion.
- No false positives (tests that pass without code changes).

## Handoff

| To           | Event          | Context passed                                     |
| ------------ | -------------- | -------------------------------------------------- |
| Developer    | tests FAIL     | PR number, failed test names, assertion details    |
| Gatekeeper   | tests PASS     | PR number, test report (pass summary)              |
| Orchestrator | flaky detected | Issue number (new issue created for investigation) |
