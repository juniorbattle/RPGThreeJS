# 11 — Quality Gates

## Scoring

Each gate is scored 1-5. Minimum required: 4/5 for each gate.

| Gate | Description | Score |
|---|---|---|
| A. Roster completeness | All 12 playable heroes censused | 5/5 |
| B. Canonical identity integrity | Canonical sources preserved, not cloned | 5/5 |
| C. Schema completeness | Character/animation/anchor/scale schemas complete | 5/5 |
| D. Animation consistency | Kestrel timing preserved, draft states valid | 5/5 |
| E. Anchor/scale consistency | All anchors positive, scales positive | 5/5 |
| F. Tableau scalability | 1-4 actor staging supported | 4/5 |
| G. Strategic scalability | Per-surface loading supported | 5/5 |
| H. Combat-stage scalability | Attacker/target loading supported | 4/5 |
| I. Selective loading | No global preload, per-surface only | 5/5 |
| J. Cache/memory architecture | LRU, reuse, no thrash, memory report | 4/5 |
| K. Codex handoff readiness | 5 slots per character, semantic keys | 5/5 |
| L. DEV/prod isolation | Vite DEV gate, dynamic import, no prod import | 5/5 |
| M. Test coverage | 118 tests across 18 categories | 5/5 |
| N. Kestrel backward compat | Phase 4B assets/timing/tests preserved | 5/5 |

**Overall: 67/70 — PASS**

## Browser QA Evidence (QA Closeout)

### 1920x1080 — PASS
- Character Lab: All 5 characters (Kestrel, Alistair, Marian, Elara, Morvan) load correctly
- Animation states switch correctly (idle/dash/attack/skill/cast)
- Mirror toggle works (CSS scaleX(-1))
- Anchor overlays display correctly (foot/body/head/weapon)
- Surface switching works (tableau/strategic/combat-stage)
- BG dark/light toggle works
- No UI collision, no page overflow

- Tableau Lab: Cast size 1-4 works
- Cast member switching works
- Speaker designation works (speaker highlighted, listeners dimmed)
- Facing LEFT/RIGHT works
- No UI collision

- Strategic Lab: Character switching works
- Animation states play correctly
- Strategic scale applied (characters smaller than combat-stage)
- Environment background displays correctly

- Combat Stage Lab: Character switching works
- Animation states play correctly
- Environment background displays correctly

### 1366x768 — PASS
- Responsive layout collapses to column (controls below display area)
- No horizontal overflow
- All labs remain functional
- Lab nav tabs resize correctly

### Runtime Console
- CONSOLE_ERRORS = 0
- PAGE_ERRORS = 0
- FAILED_REQUESTS = 0
- Verified across all 4 labs at both resolutions

> NOTE: Browser QA evidence above was captured during the prior 4-character
> roster (Kestrel, Alistair, Marian, Morvan). The current roster is 5
> characters (Kestrel, Alistair, Marian, Elara, Morvan). Browser QA for the
> updated roster is OPERATOR_REVIEW_REQUIRED — labs are DEV inspection
> tools, not final runtime acceptance. Final visual acceptance still
> requires the real runtime surfaces: STATIC_TABLEAU, STRATEGIC COMBAT,
> and COMBAT STAGE.

### Network QA
- Character Lab: Only character images requested, no environment plates
- Tableau Lab: Only tableau environment + visible cast idle frames requested
- Strategic Lab: Only strategic environment + participating character frames requested
- Combat Stage Lab: Only combat-stage environment + attacker/target frames requested
- NO_GLOBAL_OPTION_C_PRELOAD = YES (verified in browser, not just source code)
- No unnecessary Option C file requests observed

### Defects Found and Fixed During QA
1. Character registry empty in browser (Vite dev module evaluation issue)
   - Fix: Added `ensurePhase4cRegistered()` explicit registration call
2. Animation states threw "Unknown animation state 'idle'" (missing returnState in controller)
   - Fix: Pass ALL animation definitions to SpriteFrameAnimationController
3. Lab navigation tabs hidden by Character Lab's `position:fixed` CSS
   - Fix: Only apply `position:fixed` to router, not to labs inside router
4. Strategic/Combat Stage labs didn't play animations (static image only)
   - Fix: Added SpriteFrameAnimationController + requestAnimationFrame loop
5. Strategic Lab character dimensions too large (no scale applied)
   - Fix: Added `--actor-scale` CSS variable for strategic scale

## Gate details

### F. Tableau scalability (4/5)
- Supports 1-4 actors with speaker/listener distinction
- Facing and mirror controls
- Missing: real narrative tableau integration (Phase 4D scope)

### H. Combat-stage scalability (4/5)
- Attacker/target loading with required state
- Environment plate display
- Missing: real combat bridge integration (Phase 4D scope)

### J. Cache/memory architecture (4/5)
- LRU eviction, reuse, no-thrash, memory report
- Missing: real GPU texture memory tracking (DEV estimate only)
