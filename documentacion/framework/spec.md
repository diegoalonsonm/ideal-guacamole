# Framework spec / Spec del framework

> Living spec of `ideal-guacamole`. Esto es _dogfood_: el framework se describe a sí mismo aquí, y `ig init` copia una versión面向 a consumer projects en `documentacion/framework/spec.md`.

Status: **draft** (completa en Fase 1+).

## 1. Objetivo

Convertir un repo GitHub en un sistema de agentes colaboradores con:

- tooling nativo de GitHub (issues, labels, PRs, Projects v2);
- testing contract-first;
- documentación viva;
- trazabilidad extremo a extremo (requisito → issue → test → bug → fix → PR → release);
- gates autónomos salvo humano en `testing → main` y `main → deploy`.

## 2. Decisiones fijadas

| #                     | Decisión                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Lenguaje del paquete  | TypeScript (ESM, strict, NodeNext)                                                         |
| Registry              | npm público                                                                                |
| Idioma                | bilingüe (ES prompts/dialogue, EN código/identifiers/docs técnicas)                        |
| Versionado            | `semantic-release` + Conventional Commits                                                  |
| Design-system inicial | vacío (los proyectos lo rellenan)                                                          |
| Autonomía             | autónomo salvo humano en `testing → main` y `main → deploy`                                |
| Testing               | contract-first: QA-Spec antes de dev, QA-Run después                                       |
| Ejecución             | híbrida (CI dispara QA-Run/Reviewer/Gatekeeper/Deploy; Orchestrator/Product/Docs manuales) |
| Flaky policy          | 3 reintentos, 2/3 = `flaky-test` (no bloquea); >20% → `quarantined`                        |

## 3. Branch strategy

- `main` (producción, protegida, tag por release)
- `testing` (RC, recibe merge periódico de `dev`)
- `dev` (integración continua de features)
- `feat/<issue>-<slug>` por issue → PR a `dev`
- `hotfix/<id>` desde `main` → PR a `main` + retro-merge a `dev`

## 4. Modelo de distribución

- `ideal-guacamole` se publica en npm público.
- `npx ideal-guacamole init` copia templates (`.opencode/agents/`, `.github/`, `documentacion/`, `AGENTS.md`, `project.config.yaml`) al proyecto destino, no destructivamente.
- `npx ideal-guacamole upgrade` diff/mergea mejoras del framework sin pisar customizaciones del proyecto.
- La **lógica** (`src/orchestrator`, `src/github`, `src/qa`, `src/reports`, `src/traceability`, `src/design-system`, `src/config`) vive en el paquete y la importan los CI de los proyectos.

## 5. Roster de agentes

Ver `AGENTS.md` §7 y `roadmap.md`.

TODO: llenar secciones 6–10 en Fase 1 (contracts de issue/PR/release, labels, traceability, flaky policy in extenso).
