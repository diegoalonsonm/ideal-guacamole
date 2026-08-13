# ideal-guacamole

> Framework agnóstico para construir **pipelines de desarrollo basados en agentes** sobre GitHub (issues, labels, PRs) con testing contract-first, documentación viva y trazabilidad extremo a extremo.

---

## Español

### ¿Qué es?

`ideal-guacamole` es un framework genérico que convierte un repositorio GitHub en un sistema de agentes colaboradores: planificadores, desarrolladores, QA, reviewers, gatekeepers, docs y deploy.

Cada agente tiene un rol claro (rol, trigger, entradas, salidas, Definition of Done, handoff) y se comunica con los demás a través de artefactos nativos de GitHub (issues, labels, PRs, GitHub Projects v2) y de archivos versionados dentro del propio repo.

### Principios

- **Bajo acoplamiento**: usamos tooling nativo de GitHub (issues, labels, branches, PRs) → portable y auditable.
- **Contract-first**: los test specs se derivan del `expected behavior` del issue **antes** del desarrollo; el dev los usa como Definition of Done.
- **Trazabilidad**: requisito → issue → test → bug → fix → PR → release conectados por labels y referencias.
- **Bilingüe**: prompts/dialogación con humanos en español; código, identifiers y documentación técnica en inglés.
- **Human-in-the-loop donde importa**: autonomía completa salvo aprobación humana obligatoria en `testing → main` y `main → deploy`.
- **Dogfooded**: este repo usa el propio framework para desarrollarse a sí mismo.

### Arquitectura (rápida)

```
templates/        → lo que `ig init` copia a un proyecto destino (.opencode/agents, .github/, documentacion/)
src/              → lógica del paquete exportada (no se copia): orchestrator, github, qa, reports, traceability, design-system, config, cli
documentacion/    → docs vivas del framework (dogfooded) + ejemplo
```

### Branch strategy

- `main` (producción, protegida, tag por release)
- `testing` (release candidate; recibe merge periódico de `dev`)
- `dev` (integración continua de features)
- `feat/<issue>-<slug>` por issue, PR a `dev`
- `hotfix/<id>` desde `main`

### El loop

```
[Planificación (manual)]
      │
      ▼
  Product → issues base + grafo de dependencias → humano aprueba
      │
      ▼
  QA-Spec → test specs del expected behavior (contract-first)
      │
      ▼
  Developer → branch feat/12-slug, implementa usando specs como DoD
      │
      ▼
  CI dev: lint+typecheck+unit  →  Reviewer agent → merge a `dev`
      │
      ▼
  RC dev→testing → CI dispara QA-Run (Playwright + flaky policy)
      │
      ▼
  ¿falla? ── sí → feedback etiquetado → vuelve a Developer (loop, máx 3 iter, escalation humana)
      │ no
      ▼
  Gatekeeper → release report → humano APROBACIÓN → merge `testing → main`
      │
      ▼
  Deploy → smoke tests → humano APROBACIÓN → tag + release notes
      │
      ▼
  Docs agent → regenera docs de módulo + bugs root-cause + traceability + design-system
```

### Quick start

```bash
# NUEVO proyecto (scaffold)
mkdir mi-proyecto && cd mi-proyecto
npm init -y
npm install -D ideal-guacamole @playwright/test
npx ideal-guacamole init
# → copia .opencode/, .github/issue-templates/, documentacion/, project.config.yaml, AGENTS.md automáticamente
# (con --force sobrescribe, --dry-run previsualiza, --github-token <tok> crea las labels vía Octokit)

# PROYECTO existente (upgrade no destructivo)
npx ideal-guacamole upgrade
```

### Configuración (`project.config.yaml`)

```yaml
name: mi-proyecto
stack:
  frontend: next
  backend: fastapi
  database: postgres
deployTarget: vercel # vercel | fly | aws | custom
thresholds:
  passCritical: 1.0
  passTotal: 0.95
  maxIter: 3
paths:
  frontend: ./web
  backend: ./api
```

### Agentes

| Agente       | Trigger                   | DoD                                                            |
| ------------ | ------------------------- | -------------------------------------------------------------- |
| Orchestrator | manual / evento           | dispatch correcto, estado actualizado                          |
| Product      | manual                    | issues con dependencias + grafo aprobado                       |
| QA-Spec      | issue:created+dev         | test specs adjuntos, issue → `dev-ready`                       |
| Developer    | issue:dev-ready           | branch + PR con tests pasando                                  |
| QA-Run       | PR→testing                | reporte con flaky policy; feedback etiquetado                  |
| Reviewer     | PR abierta                | checklist legibilidad/escalabilidad/security/coverage          |
| Gatekeeper   | PR lista                  | PR report; merge dev→testing aprobado (humano en testing→main) |
| Docs         | merge a `dev` / on-demand | docs regeneradas + traceability                                |
| Deploy       | merge a `main`            | deployment + smoke (humano aprueba)                            |

### Estado del proyecto

**Fases 0–8 completadas.** El framework está funcional end-to-end:

| Fase | Descripción                                           | Estado |
| ---- | ----------------------------------------------------- | ------ |
| 0    | Scaffolding del repo base                             | ✅     |
| 1    | CLI `init` + templates + labels                       | ✅     |
| 2    | Product agent + state machine + dispatcher            | ✅     |
| 3    | QA-Spec (contract-first Given/When/Then → Playwright) | ✅     |
| 4    | QA-Run + isolation + flaky policy (3x, 2/3 rule)      | ✅     |
| 5    | Reviewer + Gatekeeper + PR/release reports            | ✅     |
| 6    | Docs + design-system token gen + traceability         | ✅     |
| 7    | CLI `upgrade` (conflict-marker merge)                 | ✅     |
| 8    | Dogfooding + lessons                                  | ✅     |

Revisa `documentacion/framework/roadmap.md` y `documentacion/framework/lessons.md`.

---

## English

### What is it?

`ideal-guacamole` is a generic framework that turns a GitHub repository into a system of collaborating agents: planners, developers, QA, reviewers, gatekeepers, docs, and deploy.

Each agent has a clear role (role, trigger, inputs, outputs, Definition of Done, handoff) and communicates via native GitHub artifacts (issues, labels, PRs, GitHub Projects v2) plus versioned files inside the repo.

### Quick start

```bash
# NEW project (scaffold)
mkdir my-project && cd my-project
npm init -y
npm install -D ideal-guacamole @playwright/test
npx ideal-guacamole init

# EXISTING project (non-destructive upgrade)
npx ideal-guacamole upgrade
```

### Status

Phases 0–8 complete. See `documentacion/framework/roadmap.md` and `documentacion/framework/lessons.md`.

---

## License

MIT © Diego Naranjo Meza
