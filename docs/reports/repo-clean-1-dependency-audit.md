# REPO-CLEAN-1 — Dependency, script and configuration audit

## Dependencies

| Package | Direct evidence | Classification | Cleanup finding |
| --- | --- | --- | --- |
| `three` | combat stage/VFX/render imports | ACTIVE runtime | keep |
| `zod` | cinematic registry, game types, combat protocol | ACTIVE runtime | keep |
| `@fontsource/cinzel` | app/combat CSS | ACTIVE runtime | keep |
| `@fontsource/inter` | app/combat CSS | ACTIVE runtime | keep |
| `@fontsource/vt323` | app/combat CSS | ACTIVE runtime | keep |
| `@types/three` | TypeScript Three usage | ACTIVE build | keep |
| `happy-dom` | per-test Vitest environments | ACTIVE test | keep |
| `playwright` | cinematic/VFX/manual browser-QA scripts | ACTIVE tooling | keep; document manual QA |
| `typescript` | build/typecheck | ACTIVE build | keep |
| `vite` | dev/build/preview/config | ACTIVE build | keep |
| `vitest` | 125 test files | ACTIVE test | keep |

No possible unused declared dependency was proven.

`vite-node` is invoked by `test:r7-simulation` and `cinematics:validate-narrative-staging` but is not directly declared. It is currently transitively present. This is a HIGH reproducibility issue under strict package managers; it is an add/direct-declaration recommendation, not a removal.

## NPM scripts

| Script | Classification | Finding |
| --- | --- | --- |
| `dev` | ACTIVE | Vite development server and VFX dev bridge |
| `build` | ACTIVE | Typecheck plus both Rollup entries |
| `preview` | ACTIVE | production preview |
| `test` | ACTIVE | full Vitest suite |
| `test:watch` | ACTIVE | local test workflow |
| `test:r7-simulation` | CURRENT_QA_TOOL | target exists; transitive `vite-node` risk |
| `cinematics:validate-narrative-staging` | CURRENT_QA_TOOL | target exists; transitive `vite-node` risk |
| `vfx:sync-runtime` | CURRENT_PRODUCTION_TOOL | target exists; external MegaPack required |
| `vfx:sync-candidate` | CURRENT_PRODUCTION_TOOL | target exists; external MegaPack required |
| `vfx:validate-published` | CURRENT_QA_TOOL | target exists and protects registry state |

No declared script is broken by a missing target.

## Package-manager configuration

Both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm v9) match current package declarations. No `packageManager` field selects authority. `pnpm-workspace.yaml` contains `allowBuilds.esbuild: set this to true or false`, which reads as unresolved generated guidance rather than a deliberate boolean policy.

Classification: `CONSOLIDATE_CANDIDATE`, HIGH. Choose one manager only after clean-install parity, script availability, build and full-suite checks. Do not delete either lock in REPO-CLEAN-1.

## TypeScript and Vite configuration

- Root `tsconfig.json` is ACTIVE and strict, but includes only `src` and `vite.config.ts`; TypeScript tools are outside normal typecheck coverage.
- Root `vite.config.ts` is ACTIVE build/dev configuration. Its VFX development middleware is substantial but not obsolete.
- `tools/cinematics/vite-node.config.ts` is a milestone/current-tool config that avoids loading the VFX dev bridge during deterministic generators.
- `legacy-combat.html` is an ACTIVE second Rollup input, not dead legacy output.
- `.gitattributes` protects PDF binary handling.
- `.env.example` is portable guidance, not a secret.

No `vitest.config`, `playwright.config`, ESLint, Prettier or PostCSS config exists. Absence is not a deletion candidate. Future maintainability work may add explicit configs but must avoid mass-format churn.

## Portability candidates

- `tools/vfx/generate-cadence-index.mjs` and `gif-cadence-forensics.mjs` hard-code one user's MegaPack root; migrate to the existing environment resolution model.
- two Python cinematic review tools hard-code Windows font locations; provide configured/fallback font discovery if retained.
- 27 pipeline metadata files embed absolute project input paths; archive or sanitize in a dedicated lineage-preserving migration.
- historical reports with local paths are harmless evidence and should not be silently rewritten.

## Phase 5 validation

Any dependency/config cleanup requires a fresh install using the selected lock, `npm run build`, all npm-script smoke checks, focused tool tests, the full suite, production media hashes, protected-path audit and `NEW_REGRESSIONS = 0`.
