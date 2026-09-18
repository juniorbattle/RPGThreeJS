# Option C demo environment pack v1

Status: **PRODUCTION_APPROVED** (operator authorization, 2026-09-16).

## Production authority

The active runtime authority is:

- manifest: `src/render/data/demo-environment-pack-v1.production.json`
- public assets:
  `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/`

The promoted pack contains the approved Lion-demo environment plates and their
deterministic context mappings. Runtime consumers must resolve production URLs;
no `public/assets/dev/option-c` path is required.

## Source history

The original DEV production pack, review screenshots and one-shot promotion
pipeline were removed from the active tree by REPO-CLEAN-4 after production
promotion was locked. Their exact files and provenance remain recoverable from
Git history before the cleanup branch.

The retained production manifests carry the approved identifiers, hashes,
dimensions, surface roles and visual families required by runtime resolution.

## Runtime contract

The pack supports the current presentation roles:

- TRAVEL
- STATIC_TABLEAU
- STRATEGIC_COMBAT
- COMBAT_STAGE
- CINEMATIC_SOURCE_ENVIRONMENT where applicable

Missing contexts or roles are errors rather than generic visual fallbacks.

## Change policy

Do not modify the approved environment pixels during cinematic work unless a
specific cinematic source treatment requires a derived asset. Derived cinematic
sources must not silently replace the production gameplay plate.
