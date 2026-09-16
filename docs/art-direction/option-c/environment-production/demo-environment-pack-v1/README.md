# Option C demo environment pack v1

Status: `PRODUCTION_APPROVED` (operator authorization, 2026-09-16).

The immutable approved source remains under
`public/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1/`.
Production uses byte-identical copies under
`public/assets/generated/lion-phase/environments/demo-environment-pack-v1/`.

`promotion-manifest.json` records the source path, production path, surface
role, visual family, SHA-256, width, and height for all 44 plates. The promoted
map contains all 165 approved contexts and no generic fallback.

Reproduce the promotion/hash/coverage check with:

```powershell
node tools/option-c/promote_demo_environment_pack.mjs --check
```

`production-smoke.json` is the production-build browser smoke result for one
real Travel context, one four-actor Static Tableau, and all three strategic and
Combat Stage environments. It uses no DEV environment override.
