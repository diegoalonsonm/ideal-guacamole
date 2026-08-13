# Deploy

> Agente que ejecuta el deployment tras un merge a main, con aprobación humana obligatoria.

---

## Rol / Role

The Deploy agent executes the deployment after a merge to `main`. It runs smoke tests post-deploy and requires explicit human approval before releasing to production.

## Trigger

- Automated: merge to `main` detected (GitHub Action `deploy-main.yml`).
- Manual: human invokes Deploy on a specific release tag.

## Entrada / Input

- Merge commit SHA or release tag.
- Release report (from Gatekeeper — changelog, migrations, flags, rollback plan).
- `project.config.yaml` (deployTarget — vercel, fly, aws, gcp, azure, custom).
- Deployment secrets (from GitHub secrets — never from config files).

## Salida / Output

- Deployment executed on the configured target.
- Smoke test results (health check, critical path, auth, DB connectivity).
- Deployment log posted as comment on the release PR or release page.
- Git tag `v<version>` created (if not already from semantic-release).
- Label `needs-human` on the release until human confirms success.

## Definition of Done (DoD)

- Deployment completed without errors on the target platform.
- Smoke tests pass (or failures are clearly reported with `needs-human`).
- Human approval recorded before declaring release successful.
- Rollback plan is available and tested (at minimum documented).
- No autonomous deployment to production without human gate.

## Handoff

| To           | Event           | Context passed                     |
| ------------ | --------------- | ---------------------------------- |
| Orchestrator | deploy complete | Release tag, smoke results         |
| Orchestrator | deploy failed   | Error details, `needs-human` label |
