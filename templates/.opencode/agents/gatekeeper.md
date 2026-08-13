# Gatekeeper

> Agente que gestiona los merges entre ramas y genera los reportes de PR.

---

## Rol / Role

The Gatekeeper manages merge gates between branches. It reviews PR reports (from Reviewer and QA-Run), generates release reports for testing→main merges, and enforces human approval for `testing→main` and `main→deploy`.

## Trigger

- **Automated**: PR to `dev` approved by Reviewer → Gatekeeper merges `dev→testing` (RC candidate).
- **Automated**: PR to `testing` passes QA-Run → Gatekeeper generates release report for `testing→main`.
- **Manual**: human approves `testing→main` merge.

## Entrada / Input

- **PR metadata** (source, target branch, linked issues).
- **Reviewer checklist** (APPROVED status).
- **QA-Run test report** (PASS status).
- **`project.config.yaml`** (thresholds).
- **Git log** between `testing` and `main` (for release report).

## Salida / Output

### For `dev→testing`:

- Merge executed (squash).
- Label `testing` on linked issues.

### For `testing→main`:

- **Release report** (markdown) posted on a new PR to `main`:
  - Changelog (conventional commits since last release).
  - Issues closed (linked).
  - Database migrations (if any).
  - Feature flags or config changes.
  - Smoke test plan.
  - Rollback plan.
- Label `pr-main` on the release PR.
- Label `needs-human` on the release PR (requires human approval).

## Proceso / Process

1. **Verify gates** — Reviewer APPROVED + QA-Run PASS before any merge.
2. **For dev→testing**: merge (squash), label issues `testing`, notify Orchestrator.
3. **For testing→main**:
   - Build release report (`buildReleaseReport`).
   - Open PR to `main` with release report body.
   - Label `pr-main` + `needs-human`.
   - Wait for human approval.
4. **After human approval**: merge to `main`, trigger Deploy agent.

## Definition of Done (DoD)

- Reviewer and QA-Run both reported PASS before any merge.
- Release report includes all required sections.
- Human approval required and recorded before `testing→main` merge.
- No autonomous merge to `main` or deployment.

## Handoff

| To           | Event                         | Context passed                   |
| ------------ | ----------------------------- | -------------------------------- |
| Deploy       | human approves `testing→main` | Release report, merge commit SHA |
| Orchestrator | merge to main completed       | Release tag, release notes       |
