# AGENTS.md — Operating Procedures for `ideal-guacamole`

> This file is the source of truth that every AI agent working on this repo MUST respect. It defines tooling, conventions, branches, commit style, test commands, and "do not do" rules.
> This file is dogfooded: it's both a working rule for development on this framework AND the template shipped to consumer projects.

---

## 1. Project context / Contexto del proyecto

- **Package name**: `ideal-guacamole`
- **Language**: TypeScript (ESM, strict)
- **Runtime target**: Node.js >= 20.11.0
- **Package manager**: npm (no pnpm/yarn lockfiles checked in)
- **Distribution**: npm public registry
- **Versioning**: `semantic-release` + Conventional Commits
- **Bilingual rule**: human-facing prompts/dialogue in **Spanish**; code, identifiers, log messages, technical docs in **English**.

## 2. Tech stack / Stack técnico

- **TypeScript** 5.x, strict mode, `NodeNext` modules
- **Vitest** for unit/integration tests (coverage >= 80% lines/functions)
- **ESLint** flat config + **Prettier**
- **Octokit** (`@octokit/rest`, `@octokit/graphql`) — GitHub API
- **Playwright** (`@playwright/test`) — E2E tests, invoked via MCP where applicable
- **Commander** + **Zod** — CLI and config schema
- **semantic-release** + **commitlint** + **husky**

## 3. Common commands / Comandos comunes

```bash
npm run build          # tsc -p tsconfig.build.json
npm run typecheck     # tsc --noEmit
npm run lint          # eslint .
npm run lint:fix     # eslint . --fix
npm run format        # prettier --write .
npm run format:check  # prettier --check .
npm test              # vitest run
npm run test:coverage # vitest run --coverage
npm run semantic-release:dry  # dry-run locally (requires local env vars for plugins)
```

**Run before committing / correr antes de commit:**

```bash
npm run typecheck && npm run lint && npm test
```

## 4. Git conventions / Convenciones de git

### Branches

- `main` — production-ready, tagged per release. **NEVER commit directly.**
- `testing` — release candidate. Receives periodic merges from `dev`.
- `dev` — continuous integration of feature branches.
- `feat/<issue>-<slug>` — one branch per issue, PR → `dev`.
- `hotfix/<id>` — from `main`, PR → `main` + retro-merge to `dev`.

### Conventional Commits (enforced by commitlint)

`feat: new init CLI` | `fix(cli): handle empty dir` | `docs: roadmap` | `chore: bump deps` | `refactor: split dispatcher` | `test: add spec-parser cases` | `ci: e2e workflow`

Header max 100 chars. Scope recommended (`feat(cli):`, `fix(qa):` …).

### NEVER / NUNCA

- ❌ Do not push to `main` directly. Always via PR.
- ❌ Do not `--no-verify` or skip Husky hooks.
- ❌ Do not amend published commits or force-push any protected branch.
- ❌ Do not commit secrets (env files, tokens, `.pem`).
- ❌ Do not commit `dist/`, `coverage/`, `node_modules/`.
- ❌ Do not bypass typecheck or lint to land a change faster.
- ❌ Do not add comments to code unless explicitly requested.

## 5. Architecture map / Mapa de arquitectura

```
src/
├── cli/             # `ig` CLI entry + commands (init, upgrade)
├── orchestrator/    # event dispatcher, pipeline state machine, GitHub Projects sync
├── github/          # Octokit wrappers: issues, labels, pr, projects
├── qa/              # spec-parser (Given/When/Then → Playwright), runner, isolation, flaky-policy
├── reports/         # pr-report, release-report builders
├── traceability/    # label-based graph (req→issue→test→bug→PR→release)
├── design-system/  # token-doc generator (hybrid: human spec + autogen tokens)
└── config/          # Zod schema + loader for project.config.yaml

templates/          # Clean copies used by `ig init` (dogfooded from .opencode/, .github/, documentacion/)
.opencode/          # Agent Operating Procedures (copied to consumer projects)
documentacion/      # Living docs of this repo (dogfood) + sample
tests/              # Vitest specs
```

## 6. Definition of Done (per change) / DoD

Un cambio está listo para merge cuando:

1. Tests nuevos/fallidos están en verde.
2. `npm run typecheck` y `npm run lint` pasan sin errores.
3. Cobertura no baja del umbral (80% líneas/funciones).
4. Conventional commit en el squash-merge.
5. Si toca `project.config.yaml` schema, actualiza `src/config/schema.ts` y la doc del campo.
6. Si añade un agente, actualiza `AGENTS.md` y `templates/.opencode/agents/`.

## 7. Agent roster / Roster de agentes

| Agente       | Trigger                 | Salida                           | Gate                                          |
| ------------ | ----------------------- | -------------------------------- | --------------------------------------------- |
| Orchestrator | manual / evento         | dispatch correcto                | –                                             |
| Product      | manual                  | issues + grafo deps              | humano aprueba grafo                          |
| QA-Spec      | issue:created+dev       | test specs adjuntos              | issue → `dev-ready`                           |
| Developer    | issue:dev-ready         | branch + PR con tests verdes     | –                                             |
| QA-Run       | PR→testing              | report con flaky policy          | fail → loop a dev (máx 3)                     |
| Reviewer     | PR abierta              | checklist                        | aprobar / rechazar                            |
| Gatekeeper   | PR lista                | PR report                        | merge dev→testing; **humano en testing→main** |
| Docs         | merge a dev / on-demand | docs + traceability actualizadas | –                                             |
| Deploy       | merge a main            | deployment + smoke               | **humano aprueba release**                    |

## 8. Flaky test policy / Política de flaky tests

- 3 reintentos por test con aislamiento limpio (DB reset, browser context fresco, mocks determinísticos).
- 2/3 pasando → marca `flaky-test`, **no bloquea** el PR. Genera issue para investigar aparte.
- Fail consistente → entra como bug real al loop dev↔testing.
- > 20% flakiness inter-run → suite `quarantined` hasta corrección.

## 9. Where to find what / Dónde encontrar cada cosa

- Roadmap de fases: `documentacion/framework/roadmap.md`
- Lessons learned: `documentacion/framework/lessons.md`
- Spec del framework: `documentacion/framework/spec.md`
- Design-system (vacío en Fase 0): `documentacion/design-system/design-system.doc.md`
- Templates para `ig init`: `templates/`
- Prompts de agentes: `.opencode/agents/*.md` (generados en Fase 1)
- Labels del repo: `.github/labels.yaml` (generado en Fase 1)

## 10. GitHub integration / Integración con GitHub

The framework uses a **hybrid** approach for GitHub API access:

- **Octokit** (REST + GraphQL) — core library for `issues`, `labels`, `PRs` (type-safe, testable).
- **GitHub CLI (`gh`)** — fallback for authentication and **Projects v2** (more stable than raw GraphQL).

### Authentication

`createOctokit()` (`src/github/client.ts`) resolves the token in this order:

1. `--github-token` CLI flag (if provided)
2. `GITHUB_TOKEN` environment variable
3. `GH_TOKEN` environment variable
4. `gh auth token` (if `gh` is installed and authenticated)

If none of these work, it throws `GitHubAuthError` with clear instructions.

### Projects v2

Uses `gh project item-add` / `gh project item-edit` shell commands instead of raw GraphQL mutations. This is more stable and less verbose. Requires `gh` CLI installed (preinstalled on GitHub-hosted runners).

### CI workflows

Workflows use `actions/github-script@v7` (Octokit inline) for PR comments and `${{ secrets.GITHUB_TOKEN }}` for authentication. The CLI subcommands `qa-run` and `review` use `createOctokit()` internally.

## 11. When in doubt / En duda

- Ante un edge case no cubierto en este archivo, decide a favor de **reproducibilidad** (que el pipeline pueda re-corre el mismo paso y llegar al mismo resultado) y **auditabilidad** (que cualquier decision quede trazada en un issue/label/PR).
- Nunca ejecutar acciones irreversibles (deploy, merge a `main`, borrado de issues) de forma autónoma.
