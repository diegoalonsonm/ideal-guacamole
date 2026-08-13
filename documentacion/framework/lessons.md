# Lessons Learned / Lecciones Aprendidas

> Phases 0–8 of ideal-guacamole development — what worked, what didn't, and what to improve.

---

## What worked well / Lo que funcionó bien

1. **Phase 0 scaffolding first**: Setting up tsconfig strict, ESLint flat config, Vitest, and semantic-release before any real code prevented tech debt accumulation from day one.

2. **Template dogfooding**: Using the framework's own `.opencode/agents/` and `.github/labels.yaml` on this repo validated the `init` command's output in real time.

3. **Contract-first QA-Spec (Phase 3)**: The `spec-parser` that converts Given/When/Then into Playwright skeletons is the highest-value module — it enforces test coverage before code is written.

4. **Flaky policy (Phase 4)**: The 3-retry / 2-of-3 rule with `quarantined` label prevents the infinite dev↔testing loop that flaky tests cause.

5. **Conflict-marker upgrade (Phase 7)**: Non-destructive `upgrade` with `<<<<<<<`/`=======`/`>>>>>>>` markers preserves project customizations while bringing framework improvements.

## What to improve / Lo que mejorar

1. **ESLint strict mode friction**: `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + unicorn rules caused ~50% of development time in lint fixes. Consider relaxing some rules in future iterations or adding a `recommended` preset for consumer projects that's less strict.

2. **`js-yaml` ESM imports**: The package exports named functions (`load`), not a default export. This caused a runtime crash only visible in tests. Document ESM import patterns for all dependencies.

3. **YAML scientific notation**: GitHub label colors like `5319E7` were parsed as `53190000000` by `js-yaml`. Quoting hex colors in YAML is required. Consider using `YAML.parse` with a schema that disables scientific notation.

4. **Playwright integration**: The runner (`runTests`) currently shells out to `npx playwright test`. For production, integrating via MCP or the Playwright API directly would give better control over retries and isolation.

5. **GitHub Projects v2**: The GraphQL queries for Projects v2 are complex and require `node_id` fields that aren't always available. Consider using `gh` CLI as a fallback.

## Next steps / Próximos pasos

- Apply the framework to a **real project** (pilot) to validate the full pipeline.
- Add **Husky hooks** (pre-commit: lint+typecheck; commit-msg: commitlint).
- Test the **`--github-token` flow** against a real GitHub repo.
- Implement **MCP-based Playwright runner** (Phase 4 TODO).
- Add **`ideal-guacamole qa-run`** and **`ideal-guacamole review`** CLI subcommands (referenced in workflows but not yet wired).
