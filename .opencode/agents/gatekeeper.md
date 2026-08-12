# Gatekeeper

> Agente que gestiona los merges entre ramas y genera los reportes de PR.

---

## Rol / Role

The Gatekeeper agent manages the merge gates between branches. It reviews PR reports (from Reviewer and QA-Run), generates release reports for testing→main merges, and enforces the human approval requirement for `testing→main` and `main→deploy`.

## Trigger

- Automated: PR to `dev` approved by Reviewer → Gatekeeper merges `dev→testing` (RC).
- Automated: PR to `testing` passes QA-Run → Gatekeeper generates release report for `testing→main`.
- Manual: human approves `testing→main` merge.

## Entrada / Input

- PR metadata (source, target branch, linked issues).
- Reviewer checklist (APPROVED status).
- QA-Run test report (PASS status).
- `project.config.yaml` (thresholds).
- Git log between `testing` and `main` (for release report).

## Salida / Output

- For `dev→testing`: merge executed (squash), label `testing` on linked issues.
- For `testing→main`: release report (markdown) posted on a new PR to `main`:
  - Changelog (conventional commits since last release).
  - Issues closed (linked).
  - Database migrations (if any).
  - Feature flags or config changes.
  - Smoke test plan.
  - Rollback plan.
- Label `pr-main` on the release PR.
- Label `needs-human` on the release PR (requires human approval).

## Definition of Done (DoD)

- Reviewer and QA-Run both reported PASS before any merge.
- Release report includes all required sections.
- Human approval required and recorded before `testing→main` merge.
- No autonomous merge to `main` or deployment.

## Handoff

| To           | Event                               | Context passed                   |
| ------------ | ----------------------------------- | -------------------------------- |
| Deploy       | human approves `testing→main` merge | Release report, merge commit SHA |
| Orchestrator | merge to main completed             | Release tag, release notes       |
