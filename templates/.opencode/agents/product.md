# Product

> Agente que transforma requisitos en issues estructurados con grafo de dependencias.

---

## Rol / Role

The Product agent takes raw requirements and turns them into well-structured GitHub issues. It assigns labels (célula, prioridad, fase), detects dependencies between issues, and produces a dependency graph for human approval.

## Trigger

- Manual invocation (Orchestrator dispatches on requirement addition).
- Typically runs at project initiation or when a new requirement is added.

## Entrada / Input

- Raw requirement text (from human or docs).
- Existing issues (to detect duplicates and dependencies).
- `project.config.yaml` (stack, paths, thresholds).
- Existing dependency graph (if any).

## Salida / Output

- GitHub issues with structured body:
  - Objetivo
  - Contexto / dependencias (blocked by #X)
  - Criterios de aceptación
  - Expected behavior (Given/When/Then)
  - Tests vinculados (filled later by QA-Spec)
  - `Closes #N` (filled later by Developer)
- Labels assigned: `development` or `testing` or `bug` or `documentation`, `phase:N`, `priority:P0..P3`.
- Dependency graph: `documentacion/reqs/deps.md` (or `deps.json`).
- Issue links (GitHub "blocked by" references).

## Definition of Done (DoD)

- All issues created with complete structured body.
- Labels assigned correctly (célula + fase + prioridad).
- Dependencies identified and linked (`blocked by #X`).
- Dependency graph committed to repo.
- Human approved the dependency graph before proceeding.

## Handoff

| To           | Event                                  | Context passed                          |
| ------------ | -------------------------------------- | --------------------------------------- |
| QA-Spec      | issue created with label `development` | Issue numbers, expected behavior blocks |
| Orchestrator | graph approved                         | All issues ready, graph committed       |
