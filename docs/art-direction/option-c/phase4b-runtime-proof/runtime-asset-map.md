# Runtime asset map

Every candidate is stored in the isolated DEV namespace and is a byte-identical copy of its approved Phase 4A source. No crop, resize, padding, filtering, palette change, or artistic regeneration was applied. The authoritative per-file path, dimensions, byte count, SHA-256, URL, surface use, and status are recorded in `manifests/runtime-proof-manifest.json`.

## Environments

| Purpose | Phase 4A source | Phase 4B runtime derivative | Runtime URL | Dimensions | Status |
| --- | --- | --- | --- | --- | --- |
| Travel | `phase4-pilot/environment/forest-road-travel-dev.png` | `phase4b/environment/forest-road-travel.png` | `/assets/dev/option-c/phase4b/environment/forest-road-travel.png` | 1672×941 | `RUNTIME_PROOF_CANDIDATE` |
| Tableau | `phase4-pilot/environment/forest-road-tableau-dev.png` | `phase4b/environment/forest-road-tableau.png` | `/assets/dev/option-c/phase4b/environment/forest-road-tableau.png` | 1672×941 | `RUNTIME_PROOF_CANDIDATE` |
| Strategic | `phase4-pilot/environment/forest-road-strategic-dev.png` | `phase4b/environment/forest-road-strategic.png` | `/assets/dev/option-c/phase4b/environment/forest-road-strategic.png` | 1672×941 | `RUNTIME_PROOF_CANDIDATE` |
| Combat Stage | `phase4-pilot/environment/forest-road-combat-stage-dev.png` | `phase4b/environment/forest-road-combat-stage.png` | `/assets/dev/option-c/phase4b/environment/forest-road-combat-stage.png` | 1672×941 | `RUNTIME_PROOF_CANDIDATE` |

## Kestrel animation frames

| State | Phase 4A source pattern | Phase 4B derivative pattern | Runtime URL pattern | Files | Dimensions |
| --- | --- | --- | --- | --- | --- |
| Idle | `animations/idle/processed/kestrel-idle-{1..8}.png` | `kestrel/idle/frame-{01..08}.png` | `/assets/dev/option-c/phase4b/kestrel/idle/frame-{01..08}.png` | 8 | 512×512 |
| Dash | `animations/dash/processed-retry/kestrel-dash-{1..8}.png` | `kestrel/dash/frame-{01..08}.png` | `/assets/dev/option-c/phase4b/kestrel/dash/frame-{01..08}.png` | 8 | 512×512 |
| Attack | `animations/attack/processed-retry/kestrel-attack-{1..8}.png` | `kestrel/attack/frame-{01..08}.png` | `/assets/dev/option-c/phase4b/kestrel/attack/frame-{01..08}.png` | 8 | 512×512 |
| Cast/skill | `animations/skill/processed-retry/kestrel-skill-{1..8}.png` | `kestrel/skill/frame-{01..08}.png` | `/assets/dev/option-c/phase4b/kestrel/skill/frame-{01..08}.png` | 8 | 512×512 |

## Footprint and loading

| Group | Files | Compressed bytes | Decoded RGBA estimate |
| --- | ---: | ---: | ---: |
| Environments | 4 | 12,360,766 | 25,173,632 |
| Animation frames | 32 | 6,166,140 | 33,554,432 |
| Total | 36 | 18,526,906 | 58,728,064 |

The proof preloads all 36 images before exposing a ready state. A missing image produces a visible DEV failure and an error signal; it never substitutes a legacy asset silently.

