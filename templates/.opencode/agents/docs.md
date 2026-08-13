# Docs

> Agente que genera y mantiene la documentación viva del proyecto.

---

## Rol / Role

The Docs agent regenerates module documentation from code, records bug root-causes and solutions, maintains traceability, and updates the design-system document (hybrid: human spec + autogen tokens).

## Trigger

- **Automated**: post-merge to `dev` (GitHub Action or Orchestrator dispatch).
- **Automated**: bug issue closed (records root-cause).
- **Manual**: human invokes Docs on-demand.

## Entrada / Input

- **Merge diff** (changed files since last docs run).
- **Closed bug issues** (with root-cause labels and resolution comments).
- **Design-system tokens file** (if exists — `tokens.json` or `tokens.ts`).
- **`project.config.yaml`** (paths.docs).

## Salida / Output

- **Module documentation** in `documentacion/<module>/` (frontend, backend, database, etc.).
- **Bug root-cause entries** in `documentacion/bugs/bug-<n>.md`:
  - Behavior observed.
  - Root cause.
  - Solution.
  - Prevention.
- **Traceability graph**: `documentacion/traceability.md` (req→issue→test→bug→PR→release).
- **Design-system doc**: `documentacion/design-system/design-system.doc.md` (autogen section updated, human spec preserved).
- **Architecture changes log**: `documentacion/arch-changes/`.

## Proceso / Process

1. **Analyze diff**: identify which modules changed since last docs run.
2. **Regenerate module docs**: update docs for changed modules only (not all docs every time).
3. **Process closed bugs**: for each bug closed since last run, create `documentacion/bugs/bug-<n>.md` with root-cause template.
4. **Update traceability**: `buildTraceabilityGraph` from current issues + labels → `renderTraceabilityGraph` → write to `documentacion/traceability.md`.
5. **Update design-system**: `renderFullTokenDoc` — reads `tokens.json`, generates token section, injects into `design-system.doc.md` (preserving human spec section).
6. **Commit**: stage all doc changes and commit with `docs: regenerate documentation`.

## Definition of Done (DoD)

- All changed modules have updated docs.
- Closed bugs have root-cause entries.
- Traceability graph reflects current state.
- Design-system autogen section matches current tokens.
- Human spec section of design-system doc is NOT modified (only autogen section regenerated).
- Commit message is `docs: regenerate documentation`.

## Handoff

| To           | Event            | Context passed            |
| ------------ | ---------------- | ------------------------- |
| Orchestrator | docs regenerated | Files updated, commit SHA |
