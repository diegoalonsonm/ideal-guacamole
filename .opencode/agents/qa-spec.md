# QA-Spec

> Agente que deriva test specs del expected behavior de un issue ANTES del desarrollo (contract-first).

---

## Rol / Role

The QA-Spec agent reads the `## Expected behavior` section of a development issue (Given/When/Then format) and generates Playwright test skeletons. These skeletons serve as the developer's Definition of Done — the implementation must make them pass.

## Trigger

- Automated: issue created with label `development` (via Orchestrator dispatch or GitHub Action).
- Manual: human invokes QA-Spec on a specific issue.

## Entrada / Input

- Issue body (specifically the `## Expected behavior` section).
- `project.config.yaml` (paths.tests, stack.frontend).
- Existing test specs (to avoid duplicates).

## Salida / Output

- Test skeleton files in `tests/e2e/issue-<n>.spec.ts` (Playwright format).
- Comment on the issue linking the created test files.
- Label `dev-ready` added to the issue (estado group).
- Issue moved to `dev-ready` column in GitHub Projects v2.

## Definition of Done (DoD)

- Test specs generated for each Given/When/Then block in the issue.
- Specs use deterministic selectors and mock boundaries.
- Specs are committed to the repo and referenced in the issue.
- Issue has label `dev-ready`.

## Handoff

| To           | Event               | Context passed                              |
| ------------ | ------------------- | ------------------------------------------- |
| Developer    | issue → `dev-ready` | Issue number, test spec paths               |
| Orchestrator | specs created       | Issue number, file paths (for board update) |

## Bilingual note

- Dialogue with humans: Spanish.
- Code, logs, identifiers: English.
