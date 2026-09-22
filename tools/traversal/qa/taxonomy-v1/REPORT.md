# Traversal T0 — interaction taxonomy and transitions

Implementation complete for operator review, uncommitted/unpushed on `campaign-structure-1`, based on `dd80b596a0ae22eb1fb9fc480341f189f37813fa`.

The six categories now have separate contact rules and signs. Large optional narrative scenes ask Rencontrer / Ignorer independently of lane. Random enemies have two avoidance opportunities. Chest, gold and ward collect in motion with local feedback. The physical fork uses matching direction labels, direct choice, a fully covering curtain, authoritative branch commit while covered, and automatic restart.

[Full content taxonomy and actual IDs](CONTENT-AUDIT.md) · [Visual review gallery](REVIEW.html)

## Required Chromium evidence

Full application runs use the real GameApp, canonical dialogue, generic combat iframe, and Travel View handoff. The existing development-only victory control completes combats; this verifies handoffs, not combat balance. No saved production game is used.

| Required scenario | Evidence | Result |
|---|---|---|
| Mandatory approach and activation | `final/meet-fight/mandatory-approach.png`, `decision-0.2.png`, `mandatory-combat.png` | brake / focus, Continuer only, canonical handoff |
| Optional event Meet | `final/meet-fight/merchant-meet.png`, `canonical-dialogue.png`, report states at .4 and .91 | local merchant plus canonical Cedric and wounded-person dialogues; same route returns |
| Optional event Ignore | `targeted/ignored-visible.png`, `targeted/report.json`, `final/ignore-flee/report.json` | subject visible while driving; canonical bypass absent immediately and recorded only after passing |
| Enemy lane avoidance | `final/avoid/report.json` | no .30 decision, no optional combat; mandatory still engages |
| Enemy Fight | `final/meet-fight/decision-0.3.png`, `random-combat.png`, report | Combattre / Fuir; generic combat and return at .30 |
| Enemy Flee | `targeted/flee-visible.png`, `final/ignore-flee/report.json` | lane changes, enemies remain visible, no combat entry |
| Chest moving collection | `final/meet-fight/collect-road-cache.png` | hinged lid reaction and local provision feedback; phase RUNNING, no panel |
| Gold moving collection | `final/meet-fight/collect-gold.png` | local +5 feedback; phase RUNNING, no panel |
| Obstacle lane avoidance | `final/meet-fight/obstacle-avoid.png` | lower lane passes upper debris without modal interaction |
| Fork direct choice, fade, variant, resume | `targeted/fork-narrow.png`, `fork-full-cover.png`, `combat-variant-resumed.png`; final full runs for event variant | authoritative choice unset before .48 s; commit at opacity 1; curtain is topmost hit-tested element; route restarts |
| Route -> event | full-run NODE_HANDOFF -> NODE_RESOLUTION states at .2, .4, .91; canonical dialogue screenshot | shared hold/cover and existing canonical entry |
| Event -> same route | full-run NODE_RESOLUTION -> RUNNING at identical .2, .4, .91; .30 for generic combat | shared reveal, unchanged session location, acceleration |
| Traversal -> Travel View | all three `final/*/travel-return.png` and reports | all three returned successfully with no page errors |

The deterministic browser harness in `tools/traversal/taxonomy-review.html` isolates presentation for extra checks: seeds 0/1/2 render wolves/spiders/patrol; a 960x720 viewport validates the fork and both branch presentations. Its event callbacks resolve immediately and are not evidence for canonical event rendering; full application runs above provide that evidence.

## Browser scale audit

Measured visible-bounds wrappers against truck rendered height at 1463x823 and 960x720, then inspected screenshots:

| Subject | Measured ratio | Assessment |
|---|---:|---|
| Merchant, Cedric, mother/child group, wounded person | .60 | within .55–.70 target; roadside scenes remain substantial |
| Wolves / spiders | .52 | within .45–.65 target; formations readable before contact |
| Human patrol | .60 | within medium enemy target |
| Chest | .26 | within .25–.35 target; no event diamond |
| Broken cart obstacle | .45 | within .25–.50 target; no narrative marker |
| Large elite enemy | not present in actual T0 pools | existing .70 family retained; no new elite added solely for this pass |

## Verification and limits

- Full regression: **2454 passed / 144 files**, `full-tests.log` (104.34 seconds). This live result is fully green; older VFX baseline failures did not occur.
- Final focused Traversal verification after curtain layering and entry wheel-distance refinement: **35 passed / 11 files**, `focused-tests.log`.
- Final TypeScript check: passed.
- Final production build: passed, existing large-chunk advisory only (`build.log`).
- `git diff --check`: passed.
- No diffs in `public`, canonical game/campaign/render data, authored world section definitions, or production policy. Production remains disabled, designAssetsReady remains false, T0 remains the only rollout leg.
- Pickup rewards and obstacle collision are deliberately preview-local. They do not alter inventory, damage or persistent saves.
- The accepted world-v1 art, shared road camera and two-lane layout remain intact. No assets regenerated or replaced.
- Operator visual approval remains pending. No commit or push performed.
