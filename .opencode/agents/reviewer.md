# Reviewer

> Agente que revisa que el código sea legible, entendible, escalable y que las pruebas pasen.

---

## Rol / Role

The Reviewer agent hooks into every PR opened against `dev` (or `testing`). It performs an automated code review covering legibility, scalability, security, lint, typecheck, and coverage. It produces a checklist comment on the PR.

## Trigger

- Automated: PR opened targeting `dev` (GitHub Action `ci-dev.yml`).
- Manual: human invokes Reviewer on a specific PR.

## Entrada / Input

- PR diff (files changed, additions, deletions).
- PR metadata (author, linked issues, labels).
- Lint and typecheck results (from CI).
- Coverage report (from CI unit tests).

## Salida / Output

- Review checklist comment on the PR:
  - [ ] Code is legible and follows project conventions.
  - [ ] Code is understandable (no overly clever constructs without explanation).
  - [ ] Code is scalable (no hard-coded limits, no tight coupling).
  - [ ] Lint passes without errors.
  - [ ] Typecheck passes without errors.
  - [ ] Unit tests pass with coverage ≥ threshold.
  - [ ] No secrets or sensitive data committed.
  - [ ] No `dist/`, `coverage/`, `node_modules/` committed.
  - [ ] PR follows conventional commit format.
  - [ ] Linked issues have `Closes #N`.
- Label `review` on the issue/PR.
- Verdict: APPROVED → label `approved`; CHANGES_REQUESTED → label `dev-done` (back to developer).

## Definition of Done (DoD)

- All checklist items evaluated.
- Verdict posted on the PR within 10 minutes of opening.
- No false rejections (items that already pass).

## Handoff

| To         | Event             | Context passed                    |
| ---------- | ----------------- | --------------------------------- |
| Developer  | CHANGES_REQUESTED | PR number, failed checklist items |
| Gatekeeper | APPROVED          | PR number, review checklist       |
