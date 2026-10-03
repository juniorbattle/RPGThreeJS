# Manual playtest production correction

Status: **ACTIVE**. Operator decision **OD-2026-10-03-A**, received 2026-10-03 (America/Toronto) in chat `01a0f5ba-db22-7412-b3ad-a3429d76cad6`.

**Highest remediation priority before generic DEMO-QA-POLISH continuation.** This explicit request authorizes the dedicated contract task `PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`. Normal implementation tasks still cannot edit LOCKED contracts. The orchestrator writes under the exclusive lock; contracts-guardian independently reviews this first lot and remains read-only.

## Authority and acceptance

These are operator manual-playtest findings and approved target decisions, not claims that the fixes already exist. A previous automated PASS cannot invalidate the manual visual finding. Keep historical proofs intact, label their original scope/baseline, and reopen the affected acceptance criteria. The new target needs fresh representative production/browser evidence and selected visual inspection; unit PASS alone does not close a visual finding.

Existing DEMO-QA-POLISH work, especially battlefield keyboard/combat WIP, is **deferred, not deleted**. Preserve its files, snapshot, exact next action, evidence/dispositions and remaining tests. Resume it after the ordered remediation list, or perform a clearly documented independent task when an item has an external blocker. Do not restart completed work outside the reopened scope.

## Approved Traversal changes (operator points 1–12)

- **Ground continuity:** T0/T1/T3 Route, Checkpoint and Return Route form one Traversal family. Same ground language, earth-color family, scale, perspective, two-lane placement and foreground/route/depth relationship. Narrative checkpoint props can vary; an unjustified floor/zone/style jump cannot.
- **Clan representation:** the caravan physically represents the traveling clan. Traversal world contains environment, props, an optional external subject and caravan. Never stage clan members ahead of their own vehicle as if awaiting it. Clan actors return in the event's STATIC_TABLEAU.
- **No NPC required:** ruins, landmarks, forks, abandoned camps and environmental clues are valid stopping points without a standing sprite.
- **One hostile marker:** a hostile checkpoint uses at most one Shadow Enemy from the pursuer's visual family. It means hostile presence/imminent combat; it does not replace or define Tactical Combat's canonical formation.
- **Checkpoint departure:** one perceived continuous movement: visible acceleration, screen coverage, world swap under coverage, reveal with momentum already engaged. No few-pixels/fade/second-start sequence.
- **Final exit:** caravan maintains perceived forward momentum and fully leaves the screen to the right before handoff. Easing must not look like a near stop followed by disappearance.
- **Pursuit conclusion:** approach, lane pressure/interaction, window end, then COMMITTED CHARGE. One lane is chosen for the charge, readable strong acceleration/run motion attempts to overtake the caravan. A miss overtakes and exits right. A collision requests the existing canonical combat authority. The old CAUGHT -> resetRouteSpeed-only / no-road-combat rule is explicitly superseded by this dedicated amendment.
- **Canonical mapping limit:** require an authored eligible canonical encounter/node/combat mapping, normal owner handoff, and single resolution. No invented formation, encounter, reward or consequence. Missing mapping blocks that collision integration and is reported precisely; a miss does not resolve or bypass a canonical battle/choice. Pursuit never computes combat outcomes or writes campaign truth itself.
- **Obstacles:** active production obstacle family is `rock` only. Other assets may remain historical pending reviewed dependency cleanup; their names do not authorize deletion.
- **Road lifecycle:** rock, gold and other temporary road elements spawn offscreen/at a natural edge, enter, persist as the caravan passes, and despawn only after their complete viewport exit. Collection/contact must not cause arbitrary instant popping; prevent duplicate collection through the existing temporary-loot owner.
- **Depth:** use ground depth (`screenGroundY` or equivalent). A far/upper-lane object cannot occlude the near/lower-lane caravan just because its sprite was created later.
- **Constrained randomness:** select among valid authored configurations only: allowed lanes, spacing, telegraph/reaction time, no absurd overlap and coherent perspective.

## Approved narrative and presentation changes (points 13–21)

- **Pre-judgement campfire:** mandatory campfire/preparation boundary before Alaric's final judgement: end of route, breathing/preparation/context, then judgement. Neither a new Traversal nor a ninth cinematic nor an automatic full refuge-management hub. Preserve existing durable IDs/branch truth; reuse approved content where possible. This decision does not grant new loot securing, rewards or invented plot.
- **Fact-consistent dialogue:** trust, suspicion, gratitude, fear and judgement reflect tracked campaign facts, including majorMerits, majorBreaches, witnesses, village outcome, refugees, merchant, shrine, conduct and reputation. Reputation alone is insufficient. Caution may have a concrete factual reason; positive deeds must not be erased by an unrelated default distrust line. Contextual correction may acknowledge existing established facts without creating lore, choices, outcomes or new consequences.
- **Narratively true environments:** verify location, time, relevant weather, destroyed/intact state, present faction, branch outcome and event context. An attractive but narratively false image fails acceptance.
- **Relational tableau geography:** positions express alliance, opposition, request, authority and target. Alaric and heroes face the General Serpent as the opposed subject; Bois-Clair civilian is distinct from the heroes' group. Keep the four-visible-actor cap through a framed subset/restaging. Do not change canon to fit slots.
- **DIALOGUE_STAGING:** same-side/opposing-side/authority/subject/speaker relationships inform authored slot planning. Slots are not semantically interchangeable. This doctrine belongs to PRESENTATION_AND_MEDIA, not a ninth production contract.
- **Cast continuity:** brief exit, breathing interval, then entry/restaging; bounded duration, readable choices and focus. Reduced motion uses gentle fade/pause/focus continuity without large displacement.
- **Facing:** authored for readability, not reactive on every speaker change. Turn when a relationship/subject/opposition/dramatic focus actually changes; otherwise maintain a stable pose. No left/right line-by-line ping-pong.
- **Transition copy:** no visible production `...` placeholder. Use relevant authored text/title or no text. This prohibition is about placeholders, not legitimate punctuation in authored dialogue or meaningful ATE labels.
- **ATE captions:** “Pendant ce temps…”, “Au même moment…”, “De l’autre côté…” are approved transition grammar. Choose by simultaneity, place/group change or temporal continuity, never randomly; no new plot information.

## Protected positive findings (point 22)

- **Alaric judgement — PRESERVE:** personal, forceful, dependent on the player's route, effective narrative climax. Corrections must not flatten it into generic copy or remove fact-sensitive branches.
- **Temporary gold — LOCK / APPROVED:** route -> temporary gold -> risk; defeat loses unsecured loot; the existing camp/refuge owner boundary secures it. Traversal never credits secured gold; a visual campfire is not automatically such a boundary.
- **Eight cinematic slots — STRUCTURE APPROVED:** keep the number and existing eight IDs. Artistic video work remains external/manual; recurring generation, polling and MP4 replacement stay excluded. Audio remains DEFERRED.

## Specialist responsibilities (point 23)

All reviewers stay read-only; one lock holder integrates. Use bounded relevant briefs, not a blanket launch of every specialist.

| Role | Specific responsibility |
| --- | --- |
| contracts-guardian | First dedicated contract amendment, exact supersession, authority/save boundaries and compliance |
| traversal-engineer | TraversalRoadScene, route/checkpoint ground/motion, Risk/Reward/Pursuit, lane depth, spawn/lifetime, T0/T1/T3 regressions |
| narrative-tableau | Grouping, alliances/opposition, stable facing, cast continuity, ATE captions/ellipsis cleanup, contextual staging |
| ui-accessibility | Cast-transition motion and OS/game reduced-motion alternative, responsive dialogue, focus and readable transitions |
| cinematics-journey | Pre-judgement campfire boundary, ATE and Journey handoff; do not reopen the eight videos |

Wave3 activation is limited to traversal-engineer. world-art-continuity and other planned profiles remain deferred. Skill fallback remains valid if a custom profile is not exposed by the installed host.

## Ordered remediation queue (point 24)

| Order | Task | Required result |
| --- | --- | --- |
| 1 | PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1 | Explicit approved LOCKED amendment, versioned set, supersession and functioning new immutable Git baseline |
| 2 | TRAVERSAL-VISUAL-CONVERGENCE | Shared ground/checkpoint family; no clan sprites in world; empty stops valid; one Shadow marker |
| 3 | TRAVERSAL-MOTION-POLISH | One checkpoint departure motion and complete forward final exit |
| 4 | TRAVERSAL-PURSUIT-THREAT | Readable run/committed charge; miss exits; collision uses a verified canonical mapping or precise blocker |
| 5 | TRAVERSAL-ROAD-ELEMENTS | Rock-only production, temporary reward authority, natural spawn/lifetime, ground depth, valid spacing |
| 6 | PRE-JUDGEMENT-CAMPFIRE | Mandatory preparation boundary with correct Journey/resume/agency and no extra video/hub authority |
| 7 | NARRATIVE-CONTEXT-COHERENCE | Existing tracked facts select coherent acknowledgement/trust/judgement |
| 8 | STATIC-TABLEAU-STAGING-POLISH | Relational grouping, stable facing, short cast continuity, reduced-motion/focus/responsive acceptance |
| 9 | SCENE-TRANSITION-COPY | Remove placeholder ellipses; meaningful context-chosen ATE transition grammar |
| 10 | ENVIRONMENT-NARRATIVE-COHERENCE | Contextual environment audit and corrections grounded in current narrative facts |
| 11 | Resume deferred DEMO-QA-POLISH | Battlefield keyboard WIP and other unfinished full-demo acceptance, with original provenance/next action retained |

Continue autonomously between coherent subtasks on dev. Completion of the contract lot means decisions are binding, **not** that runtime visuals/mechanics are implemented or accepted. Scheduler model, reasoning, recurrence, status and notifications are preserved; changes concern the current priority/routing. Protect main and retain lock/WIP/checkpoint discipline.
