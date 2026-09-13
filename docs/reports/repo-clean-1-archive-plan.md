# REPO-CLEAN-1 — Archive plan

No file is moved or deleted in this mission.

## Archive principles

- Archive when an item is inactive but retains design, approval, rejection, lineage or Option C value.
- Keep source/manifest relationships together.
- External archives must preserve SHA-256, original path, commit, role and approval status.
- Do not archive current runtime dependencies, active test inputs or current A.4R operator evidence.
- Never treat rejection as absence of historical value.

## Proposed conceptual bundles

### `archive/characters/validation-history/`

219 files / 219,669,557 bytes from non-ready GPT character validation trees. Include raw images, processed derivatives, boards, reserves, rejected markers, QC reports and pipeline metadata. Preserve the production commit and canonical promotion mapping. High Option C value.

Keep `validation/ready/**` active until `run_cin671_browser_qa` and the ready manifest are migrated. Its exact duplicates with canonical full sprites are consolidation work, not archive-by-name.

### `archive/docs/hero60/`

23 unique history files after two byte-identical screenshot copies are consolidated. Preserve recovery snapshots, human-QA states and the one canonical screenshot.

### `archive/vfx/r1-toolchain/`

16 scripts / 319,063 bytes. Keep r1 inventory, grid detection, gallery and browser validation as one coherent milestone toolchain. Active `sync-*`, preview and published-registry tools stay outside the archive.

### `archive/cinematics/cin6ea2-a3/`

17 tools/specs / 107,804 bytes plus, if desired, two review PDFs. Preserve operator selections, approval, regate data, source preparation and builders together.

### External VFX evidence archive

258 ignored files / 268,184,981 bytes. Preserve approved validation evidence and a manifest; purge reproducible rejected derivatives only after operator review.

### External cinematic QA archive

2,582 older ignored files / 4,072,553,291 bytes. Triage by milestone. `cin4` is the largest contributor at 2,414,279,998 bytes. Keep `cin67` and `cin6ea4` locally until current A.4R review closes.

### `archive/assets/status-source/`

12 raw/reference status files / 25,956,826 bytes. Runtime status files remain under `status-indicators/runtime`.

## Do not archive yet

- 31 production MP4s and source posters.
- canonical full sprites or combat poses.
- generated runtime backgrounds.
- A.4R runtime plan or current lock tests.
- current A.4R browser screenshots.
- VFX selected-runtime manifest, preview index or empty published registry.
- future/unreferenced character sprites; these need Option C review and are KEEP_HISTORY.

## Archive manifest fields for REPO-CLEAN-2

Each archived file should record original path, size, SHA-256, baseline commit, role, approval/rejection state, runtime/test/tool references, replacement path, and restore instructions.
