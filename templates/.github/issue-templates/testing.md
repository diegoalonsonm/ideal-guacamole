---
name: Testing
about: A test case — unit, integration, or E2E spec to be written or run.
title: '[test] '
labels: testing
---

## Objetivo / Objective

<!-- What does this test verify? / ¿Qué verifica este test? -->

## Contexto / Context

**Linked issue**: #<!-- issue this test is for -->

## Tipo de prueba / Test type

<!-- Check one / Marca uno -->

- [ ] Unit
- [ ] Integration
- [ ] E2E (Playwright)

## Expected behavior / Comportamiento esperado

```gherkin
Given <initial context>
When <action>
Then <expected outcome>
```

## Current behavior / Comportamiento actual

<!-- Filled after running the test. Leave empty before first run. -->
<!-- If the test passes, write "Matches expected behavior." -->
<!-- If it fails, describe what actually happened. -->

```
<!-- current behavior or PASS -->
```

## Result / Resultado

<!-- Filled by QA-Run. Do not edit. -->

- [ ] PASS
- [ ] FAIL
- [ ] FLAKY (2/3)

<!-- If FAIL: is it a test issue or a bug? -->
<!-- If bug: create a `bug` issue and link it here. -->
<!-- bug: #-->
