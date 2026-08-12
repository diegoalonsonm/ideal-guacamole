# Roadmap / Hoja de ruta

> Roadmap de implementación del framework `ideal-guacamole`. Cada fase se completa cuando su Definition of Done (DoD) se cumple: tests pasando, typecheck/lint en verde, conventional commit.

---

## Fase 0 — Scaffolding del repo base ✅

**DoD**: `npm i && npm run build` pasan, `git init` y primer commit `chore: initial scaffold`.

- [x] `package.json` (name: `ideal-guacamole`, bin: `ideal-guacamole`/`ig`, exports de `src/`, engines node ≥20).
- [x] `tsconfig.json` strict + ESM + `NodeNext`.
- [x] `eslint.config.js` flat config + `eslint-plugin-unicorn` + `eslint-plugin-n`.
- [x] `prettier` + `.prettierignore`.
- [x] `vitest.config.ts` con coverage ≥80%.
- [x] `commitlint` config.
- [x] `.releaserc.json` (semantic-release + npm público).
- [x] README bilingüe.
- [x] `AGENTS.md` (Operating Procedures).
- [x] `src/index.ts` + `src/cli/main.ts` skeleton (CLI invocable, `info`/`help`/`--version`).
- [x] `tests/framework.spec.ts` mínimo.
- [x] `.gitignore` + `LICENSE` (MIT).

## Fase 1 — CLI `init` mínimo ✅

**DoD**: en sandbox, `ideal-guacamole init` genera el scaffold esperado; con `--github-token` crea las labels en un repo de prueba.

- [x] `src/config/schema.ts` (Zod): name, stack, deployTarget, thresholds (passCritical, passTotal, maxIter), paths.
- [x] `src/cli/init.ts`: copia `templates/*` no destructivamente (`--force`, `--dry-run`).
- [x] `templates/project.config.example.yaml` + `templates/AGENTS.md.template`.
- [x] `templates/.opencode/agents/*.md` (9 esqueletos: rol / trigger / entrada / salida / DoD / handoff).
- [x] `templates/.github/labels.yaml` (célula + estado + prioridad + fase + meta).
- [x] `src/github/labels.ts` + Octokit (crear labels).
- [x] Conectar `init` y `main.ts`.

## Fase 2 — Product agent + Issue templates ✅

**DoD**: agente Product genera issues con dependencias + grafo (`deps.md`).

- [x] `templates/.github/issue-templates/{development,testing,bug,documentation}.md` bilingues.
- [x] `src/github/issues.ts`: crear issue + linkear `blocked by #X` + `phase:N` + `priority:P0..P3`.
- [x] `src/orchestrator/dispatcher.ts` esqueleto (event dispatcher manual/CI).
- [x] `src/orchestrator/state-machine.ts`: estados del pipeline.
- [x] Prompt `.opencode/agents/product.md` completo.

## Fase 3 — QA-Spec (contract-first) ✅

**DoD**: issue con expected behavior produce skeleton de test y se mueve a `dev-ready`.

- [x] `src/qa/spec-parser.ts`: parsea `## Expected behavior` Given/When/Then → Playwright skeleton.
- [x] `src/github/projects.ts`: sync estado → GitHub Projects v2.
- [x] Prompt `.opencode/agents/qa-spec.md` completo.

## Fase 4 — QA-Run + flaky policy

**DoD**: PR a `testing` dispara QA-Run, reporta con política flaky, comenta en PR.

- [ ] `src/qa/runner.ts`: invoca Playwright (MCP o `@playwright/test`), parsea resultados.
- [ ] `src/qa/isolation.ts`: reset DB, browser context fresco, mocks determinísticos.
- [ ] `src/qa/flaky-policy.ts`: 3 reintentos, 2/3 = flaky + label `flaky-test`, no bloquea. Umbral 20% → `quarantined`.
- [ ] `templates/.github/workflows/e2e-testing.yml` dispara QA-Run en PR→testing.
- [ ] Prompt `.opencode/agents/qa-run.md` completo.

## Fase 5 — Reviewer + Gatekeeper + reports

**DoD**: loop end-to-end `dev → testing → main` con gates humanos.

- [ ] `src/reports/pr-report.ts` (markdown con issues cerrados, estado tests, riesgos).
- [ ] `src/reports/release-report.ts` (changelog + migraciones + flags + rollback plan).
- [ ] `src/github/pr.ts`: leer diff, commentar, aprobar.
- [ ] `templates/.github/workflows/ci-dev.yml`, `deploy-main.yml`.
- [ ] Prompts `reviewer.md`, `gatekeeper.md`, `deploy.md`.
- [ ] Gate humano obligatorio en `testing→main` y `main→deploy`.

## Fase 6 — Docs + design-system + traceability

**DoD**: merge a `dev` regenera docs y traceability; bug cerrado añade root-cause a `documentacion/bugs/`.

- [ ] `src/design-system/token-doc-generator.ts` (híbrido: spec humana + sección autogen).
- [ ] `src/traceability/graph.ts`: parsea labels `closes:`, `tests:`, `bug:` → `traceability.md`.
- [ ] Prompt `.opencode/agents/docs.md`.
- [ ] Trigger: post-merge a `dev` + on-demand.

## Fase 7 — CLI `upgrade`

**DoD**: `ideal-guacamole upgrade` lleva mejoras sin pisar cambios del proyecto.

- [ ] `src/cli/upgrade.ts`: diff/merge con marcadores `<<<<<<< ideal-guacamole`/`=======`/`>>>>>>> user`.
- [ ] Tests de upgrade con customizaciones preservadas.

## Fase 8 — Dogfooding + piloto

**DoD**: framework aplicado a este mismo repo + 1 proyecto piloto externo pequeño; lessons documentados.

- [ ] Aplicar el framework a este repo (creación de issues reales, ejecución de agentes).
- [ ] Aplicar a un proyecto piloto externo pequeño.
- [ ] Documentar lessons learned en `documentacion/framework/`.
