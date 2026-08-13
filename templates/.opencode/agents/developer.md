# Developer

> Agente que implementa un issue conforme a sus specs y test cases.

---

## Rol / Role

The Developer agent picks up issues labelled `dev-ready`, creates a feature branch, implements the code to satisfy the issue's acceptance criteria and make the QA-Spec test skeletons pass, then opens a PR to `dev`.

## Trigger

- Automated: issue transitions to `dev-ready` (via Orchestrator dispatch).
- Manual: human assigns a `dev-ready` issue to the Developer.

## Entrada / Input

- Issue body (objetivo, criterios, expected behavior, tests vinculados).
- Test spec files (from QA-Spec — the contract).
- `project.config.yaml` (stack, paths, thresholds).
- Dependency issues (must be resolved first — check `blocked by`).

## Salida / Output

- Feature branch `feat/<issue>-<slug>`.
- Code implementation on the branch.
- PR to `dev` with:
  - `Closes #<issue>` in the body.
  - Summary of changes.
  - Test results (unit + integration).
- Label `in-dev` → `dev-done` on the issue.

## Definition of Done (DoD)

- All acceptance criteria from the issue are met.
- Code passes `typecheck` and `lint`.
- Unit tests pass (coverage meets threshold).
- QA-Spec test skeletons run (may fail if needs E2E environment — that's QA-Run's job).
- PR opened to `dev` with conventional commit message.
- No secrets committed. No `dist/` or `coverage/` committed.

## Handoff

| To           | Event            | Context passed                 |
| ------------ | ---------------- | ------------------------------ |
| Reviewer     | PR to dev opened | PR number, diff, linked issues |
| Orchestrator | dev-done         | Issue number, PR number        |
