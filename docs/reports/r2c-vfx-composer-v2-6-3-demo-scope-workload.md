# R2C-VFX Composer V2.6.3 — DEMO Scope + Workload Consolidation

**Phase A of the V2.6.3 / V2.7 mission.**
Status: **implemented, validated, uncommitted** — awaiting checkpoint approval before Phase B.

---

## 1. Objective

The Composer exposed all **83** authorable actions as one flat list, with no way to tell
which ones the current playable demo actually needs. V2.6.3 adds an **authoring scope**
layer so an operator can concentrate on the real demo workload, plus a dashboard that
reports how much of that workload is genuinely finished.

Two hard constraints shaped the design:

- **Authoring metadata only.** Scope is never preset data and never reaches production
  runtime. `PublishedVfxResolver` and the published registry stay completely
  scope-agnostic.
- **No gameplay changes.** No combat rule, skill, AI, enemy roster or asset was touched.
  The classifier only *reads* game data.

---

## 2. Baseline

| Item | Value |
| --- | --- |
| Branch | `main` |
| HEAD at start | `5f93b2cd42d5b2e4deb227eb28f090576e9e1cd5` |
| Durable registry | `src/combat/vfx/generated/published-vfx-presets.json` |
| Published presets at start | **33** (operator's uncommitted authoring state, preserved by explicit decision) |
| Tests at start | 1558 passing |

The mission preflight expected an empty registry after a `RESET ALL`. The working tree
instead contained 33 manually published presets. The operator chose **Preserve — treat as
current authoring state**, so the 33 presets were kept and became the workload baseline.

---

## 3. Scope classification

### 3.1 Derivation, not a hand-written list

`src/combat/vfx/DemoVfxActionScope.ts` derives everything from authoritative game data:

| Question | Authoritative source |
| --- | --- |
| Who starts in the party? | `createInitialState().clan.members` |
| Who can join later? | every `recruitUnit` narrative effect in `dialogues` |
| What equipment can be owned? | starting kit + `state.shops` stock + `addItem` effects + `craftRecipes` (resolved to a fixed point, since recipes chain) |
| Which skills are usable? | `getMaxUnlockedSkillAp(weaponTier)` against each skill's AP, plus `skillModifier.replaces` / `.grants` from obtainable gear |
| Which combats can occur? | run graph across 12 seeds × 8 conduct-flag profiles via `getAvailableRunNodes`, plus every `startCombat` effect, plus both Lion finale routes |
| Who fights in them? | `combatConfigs[*].enemyVisualIds` / `escortVisualIds` / `bossVisualId` |

Weapon-tier reasoning is per-loadout: a weapon's own tier gates skills that weapon
grants, while accessories are evaluated against the unit's best obtainable weapon
(accessories do not change tier). Ultimates (≥ 5 AP) are excluded because
`isUltimateUnlockedForHero` has no unlock path in the current build.

### 3.2 The one unavoidable mirror

Enemy *visual → skill* assignment lives inside `legacyCombatRuntime.js`, which cannot be
imported from a pure module (it touches DOM and pulls in Three.js at module scope). That
table is mirrored in `ENEMY_VISUAL_SKILLS` / `BOSS_COMBAT_SKILLS` and protected by five
drift tests that parse the runtime source and assert:

- every mirrored `skills:[...]` array matches the runtime exactly;
- every `team:'foe'` template the runtime declares has a mirror entry;
- the `elite:true` / `boss:true` flag matches `ELITE_VISUAL_IDS`;
- both `BOSS_DEFS` skill lists match the finale route mapping;
- every mirrored skill id resolves in the skill catalog.

If anyone edits an enemy roster, these tests fail loudly rather than letting the scope
silently rot.

### 3.3 Reachability result

All **17** authored combat encounters are reachable, and a test asserts this
(`unreachable` must be empty). The non-obvious cases:

- `spider_nest`, `troll_crossing`, `serpent_duelist_trial`, `serpent_hunters` are only
  ever offered as **conduct-tier route variants** (honour / infamy), never by a dialogue.
- `village_defense` / `village_raid` come from the `village_choice` story branch.
- `serpent_captain` / `lion_chief` are chosen by `resolveLionFinaleExecution`, not by a
  node `contentId`.

17 distinct enemy visuals are deployed: `cave_rat`, `forest_badger`, `forest_spider`,
`forest_troll_elite`, `goblin`, `lion_champion`, `marsh_toad`, `serpent_brute`,
`serpent_duelist_elite`, `serpent_general_boss`, `serpent_oracle`, `serpent_raider`,
`skeleton`, `venom_serpent`, `wild_boar`, `wolf`, `young_dragon_elite`.

---

## 4. Exact census

**83 total actions = 34 DEMO + 49 UPCOMING.**

| DEMO group | Count |
| --- | --- |
| `PLAYER_CORE` | 14 |
| `PLAYER_RECRUITABLE` | 4 |
| `CREATURES` | 1 |
| `SERPENTS` | 4 |
| `ELITES_BOSSES` | 11 |
| `SYSTEM` | 0 |
| **Total** | **34** |

| UPCOMING group | Count |
| --- | --- |
| `HEROES_UPCOMING` | 42 |
| `ENEMIES_UPCOMING` | 5 |
| `BOSSES_UPCOMING` | 2 |
| `OTHER_UPCOMING` | 0 |
| **Total** | **49** |

### 4.1 The 34 DEMO actions

Demo party: **core** `warrior`, `white_mage`, `dark_mage`, `archer`; **recruitable**
`rogue`, `lancer`.

| Action | Group | Why it is in the demo |
| --- | --- | --- |
| `basic_greatsword_hit` | PLAYER_CORE | initial roster — basic attack |
| `w_break_guard` | PLAYER_CORE | weapon tier unlocks 2 AP skill |
| `w_charge` | PLAYER_CORE | weapon tier unlocks 3 AP skill |
| `basic_crosier_hit` | PLAYER_CORE | initial roster — basic attack |
| `w_salvation` | PLAYER_CORE | weapon tier unlocks 2 AP skill |
| `basic_grimoire_hit` | PLAYER_CORE | initial roster — basic attack |
| `n_dark_bolt` | PLAYER_CORE | weapon tier unlocks 2 AP skill |
| `basic_longbow_hit` | PLAYER_CORE | initial roster — basic attack |
| `a_precise_shot` | PLAYER_CORE | weapon tier unlocks 2 AP skill |
| `a_hawk_leap` | PLAYER_CORE | weapon tier unlocks 3 AP skill |
| `d_cursed_blade` | PLAYER_CORE | granted to Alistair by `strength_ring` |
| `e_vigor_rune` | PLAYER_CORE | granted to Marian by `sage_seal` |
| `ni_shadow_step` | PLAYER_CORE | granted to Kestrel by `windstep_longbow` |
| `ar_calibrated_shot` | PLAYER_CORE | granted to Kestrel by `longbow` |
| `basic_dagger_hit` | PLAYER_RECRUITABLE | rogue — basic attack |
| `ro_sneak_attack` | PLAYER_RECRUITABLE | rogue — 2 AP skill |
| `basic_long_spear_hit` | PLAYER_RECRUITABLE | lancer — basic attack |
| `l_long_thrust` | PLAYER_RECRUITABLE | lancer — 2 AP skill |
| `enemy_heavy_strike` | SERPENTS | `serpent_brute` in `forest_patrol` |
| `enemy_dark_bolt` | SERPENTS | `serpent_oracle` in `serpent_checkpoint` |
| `enemy_hex` | SERPENTS | `serpent_oracle` in reachable patrols |
| `enemy_binding_shot` | SERPENTS | `serpent_raider` / `forest_spider` |
| `enemy_venom_strike` | CREATURES | `venom_serpent` / `marsh_toad` in `road_to_valmir` |
| `boss_guard` | ELITES_BOSSES | `forest_troll_elite` in `troll_crossing` |
| `boss_quake` | ELITES_BOSSES | `forest_troll_elite` in `troll_crossing` |
| `boss_slam` | ELITES_BOSSES | `forest_troll_elite` in `troll_crossing` |
| `boss_fortify` | ELITES_BOSSES | `serpent_duelist_elite` |
| `boss_pin` | ELITES_BOSSES | `serpent_duelist_elite` |
| `boss_flurry` | ELITES_BOSSES | `serpent_duelist_elite` |
| `boss_regen` | ELITES_BOSSES | `young_dragon_elite` |
| `boss_freeze` | ELITES_BOSSES | `young_dragon_elite` |
| `boss_inferno` | ELITES_BOSSES | `young_dragon_elite` |
| `boss_titan_slam` | ELITES_BOSSES | Général Serpent — `serpent_captain` finale |
| `boss_apocalypse` | ELITES_BOSSES | Champion du Lion — `lion_chief` finale |

### 4.2 Why the 49 UPCOMING actions are excluded

- **9 hero Ultimates** — `isUltimateUnlockedForHero` is false for every unit; no unlock path exists.
- **~24 hero skills** — require a weapon tier above anything purchasable or craftable
  (e.g. `w_whirl` at 4 AP needs T3; the best warrior weapon obtainable is T2).
- **~9 actions on classes that cannot join** — `paladin`, `dark_knight`, `red_mage`,
  `enchanter`, `ninja`, `artilleryman` have no `recruitUnit` effect in the demo.
- **5 enemy skills** — carried only by templates no combat config deploys
  (`enemy_crush` and `enemy_dragon_breath` on the unused `troll` / `young_wyrm`),
  or otherwise never reached.
- **2 boss skills** — `boss_execution` (`undead_champion`, authored but never deployed)
  and `boss_roar`.

---

## 5. Workload model

`src/combat/vfx/DemoVfxWorkload.ts` reuses the V2.6.2 saved-fingerprint / published-fingerprint
semantics so the dashboard can never disagree with the batch publish dialog. The four
states are mutually exclusive and total:

| State | Condition |
| --- | --- |
| `PUBLISHED` | a registry entry exists **and** the draft is not ahead of it (no draft, or draft fingerprint == published) |
| `READY` | an explicit `SAVE DRAFT` fingerprint matches the current draft **and** publishing would still change the registry |
| `IN_PROGRESS` | a draft with at least one visual slot exists, but it is neither `READY` nor fully `PUBLISHED` |
| `REMAINING` | no meaningful authoring work yet |

An empty scaffold draft — created merely by selecting an action — counts as `REMAINING`,
not `IN_PROGRESS`, so browsing the list never inflates progress.

### 5.1 Current workload

Against the preserved 33-preset registry with a clean local store:

| Counter | Value |
| --- | --- |
| Actions | 34 |
| Published | **13** |
| Ready | 0 |
| In progress | 0 |
| Remaining | 21 |

| Group | Progress |
| --- | --- |
| PLAYER — CORE | 9 / 14 |
| PLAYER — RECRUITABLE | 4 / 4 |
| CREATURES | 0 / 1 |
| SERPENTS | 0 / 4 |
| ELITES / BOSSES | 0 / 11 |

Of the 33 published presets, **13 are DEMO-scope** and 20 are UPCOMING-scope — i.e. a
majority of past publication effort went to actions the current demo cannot show. That
is precisely the misallocation this feature exists to surface. The entire enemy and boss
workload (16 actions) is untouched.

---

## 6. UI behaviour

Added to the Composer header, above `ACTION`:

```
SCOPE  [ DEMO SCOPE ]  [ À VENIR ]
```

- The `ACTION` list is filtered to the active scope and grouped under labelled
  `<optgroup>`s in declared group order.
- In `DEMO` scope a **DEMO WORKLOAD** section renders directly below the header with five
  counters (Actions / Published / Ready / In progress / Remaining) and one progress row
  per non-empty group. Completed groups are tinted green. The section is hidden in
  `À VENIR` scope.
- Scope is persisted in `ComposerUiPrefs` (`r2c-vfx-composer-ui-prefs`) alongside
  `displayMode`, and is **never** written into draft or preset data.
- On reload the **stored action wins over the stored scope**: if the operator was last
  editing an UPCOMING action, the panel reopens in `À VENIR` rather than silently
  jumping to an unrelated DEMO action.
- Switching scope only re-points the selection when the current action is not in the
  target scope. It never mutates drafts, saved fingerprints or publications.

### 6.1 Publication invariants

Scope is authoring metadata, so every action remains fully authorable regardless of
scope. `ADD SPRITESHEET`, `SAVE DRAFT`, publish, update, unpublish, `RESET ALL` and
playback behave identically for a DEMO and an UPCOMING action. This is asserted directly
(tests 17–22), including drafting *and saving* an UPCOMING action and proving a draft
survives a scope round-trip byte-for-byte.

---

## 7. Tests

**77 new tests** across three files; **1635 total passing** across 67 files.

| File | Tests | Coverage |
| --- | --- | --- |
| `DemoVfxActionScope.test.ts` | 37 | partition totality/exclusivity, determinism, group ordering, census consistency, route reachability (all 17 combats), party derivation, obtainable-item derivation, hero AP/tier gating, Ultimate lock, enemy grouping, legacy-runtime drift guard |
| `DemoVfxWorkload.test.ts` | 18 | full state machine including stale-save and draft-ahead-of-publication edges, state partition, group progress sums, out-of-scope isolation, determinism |
| `VfxV2_6_3DemoScope.test.ts` | 22 | scope selector rendering/toggling, filtered + grouped action list, selection migration, prefs persistence and shape, action-wins-over-scope restoration, dashboard visibility/counters/rows, and the six publication-invariant assertions |

### 7.1 Two pre-existing bugs fixed

**Section-order test.** `CombatVfxComposerPanel.test.ts` test 3 pinned the section list;
it now includes `demo_workload`.

**Registry-coupled resolver tests.** Four tests in `PublishedVfxResolver.test.ts`
asserted that `basic_crosier_hit` was absent from the *durable* registry. That is real,
mutable authoring state — publishing that action broke them, which is exactly what
happened with the operator's 33 presets. This was the same test-isolation defect class
the mission asked to remove from V2.6.2. Fixed by deriving an action key at runtime that
is provably absent from the durable registry, instead of hard-coding one an operator may
later publish. These four failures were **not** caused by Phase A.

---

## 8. Validation gates

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | **PASS** — 0 errors |
| Unit tests | `npx vitest run` | **PASS** — 1635 / 1635, 67 files |
| Build | `npm run build` | **PASS** — built in 5.22s |
| Registry validator | `npm run vfx:validate-published` | **PASS** — registry valid, 33 presets |

---

## 9. Files changed

**New**

- `src/combat/vfx/DemoVfxActionScope.ts` — scope classifier and reachability derivation
- `src/combat/vfx/DemoVfxWorkload.ts` — workload state machine and summary
- `src/combat/vfx/DemoVfxActionScope.test.ts`
- `src/combat/vfx/DemoVfxWorkload.test.ts`
- `src/combat/vfx/VfxV2_6_3DemoScope.test.ts`
- `docs/reports/r2c-vfx-composer-v2-6-3-demo-scope-workload.md`

**Modified**

- `src/combat/vfx/VfxComposerPlayback.ts` — `authoringScope` added to `ComposerUiPrefs`, backward-compatible default `DEMO`
- `src/combat/vfx/CombatVfxComposerPanel.ts` — scope selector, grouped action list, workload dashboard, styles
- `src/combat/vfx/CombatVfxComposerPanel.test.ts` — section-order expectation
- `src/combat/vfx/PublishedVfxResolver.test.ts` — decoupled from durable registry contents

**Unchanged by design**

- `PublishedVfxResolver.ts`, `PublishedVfxRegistry.ts`, `published-vfx-presets.json`
  (contents preserved), all gameplay modules, all assets.

---

## 10. Phase A checkpoint

| Condition | Status |
| --- | --- |
| Exact DEMO census produced and justified | **Met** — 34 DEMO / 49 UPCOMING of 83, every entry with a derived reason |
| Scope derived from authoritative game data | **Met** — only one mirrored table, guarded by five drift tests |
| All 17 combats proven reachable | **Met** — asserted in test |
| Workload summary implemented and reported | **Met** — 13 / 34 published, per-group breakdown |
| Existing V2.6.2 functionality preserved | **Met** — batch publish untouched; publication invariants asserted |
| No gameplay or runtime changes | **Met** — classifier only reads game data |
| All validation gates green | **Met** — typecheck, 1635 tests, build, registry validator |
| Committed | **No** — held for approval as instructed |

**Remaining before Phase B:** manual browser QA of the scope selector and dashboard, and
operator approval of this checkpoint.
