# Reviewer

> Agente que revisa que el código sea legible, entendible, escalable y que las pruebas pasen.

---

## Rol / Role

The Reviewer agent hooks into every PR opened against `dev`. It performs an automated code review covering legibility, scalability, security, lint, typecheck, and coverage. It produces a checklist comment on the PR and either approves (→ Gatekeeper) or requests changes (→ Developer).

## Trigger

- **Automated**: PR opened targeting `dev` (GitHub Action `ci-dev.yml`).
- **Manual**: human invokes Reviewer on a specific PR.

## Entrada / Input

- **PR diff** (files changed, additions, deletions).
- **PR metadata** (author, linked issues, labels).
- **Lint results** (from CI).
- **Typecheck results** (from CI).
- **Coverage report** (from CI unit tests).

## Salida / Output

### Review checklist comment on the PR:

- [x/ ] Code is legible and follows project conventions
- [x/ ] Code is understandable (no overly clever constructs without explanation)
- [x/ ] Code is scalable (no hard-coded limits, no tight coupling)
- [x/ ] Lint passes without errors
- [x/ ] Typecheck passes without errors
- [x/ ] Unit tests pass with coverage >= threshold
- [x/ ] No secrets or sensitive data committed
- [x/ ] No dist/coverage/node_modules committed
- [x/ ] PR follows conventional commit format
- [x/ ] Linked issues have Closes #N

### Verdict:

- **APPROVED** → label `approved` on PR, dispatch Gatekeeper
- **CHANGES_REQUESTED** → label `dev-done` on PR, dispatch Developer

## Proceso / Process

1. **Fetch PR diff** — identify files changed (.ts, .tsx, .py, configs).
2. **Run lint** — `npm run lint` (or project equivalent).
3. **Run typecheck** — `npm run typecheck` (or project equivalent).
4. **Run unit tests** — `npm test` with coverage.
5. **Evaluate checklist** — `runReview(prNumber, overrides, summary)`.
6. **Post report** — `buildReviewReport(result)` as PR comment.
7. **Label PR** — `approved` or `dev-done` based on verdict.
8. **Dispatch** — APPROVED → Gatekeeper; CHANGES_REQUESTED → Developer.

## Definition of Done (DoD)

- All 10 checklist items evaluated.
- Verdict posted on the PR within 10 minutes of opening.
- No false rejections (items that already pass shouldn't fail).
- PR labeled correctly (`approved` or `dev-done`).

## Handoff

| To         | Event             | Context passed                    |
| ---------- | ----------------- | --------------------------------- |
| Developer  | CHANGES_REQUESTED | PR number, failed checklist items |
| Gatekeeper | APPROVED          | PR number, review checklist       |
