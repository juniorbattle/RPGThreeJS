import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VIDEO_CINEMATIC_TRIGGERS } from '../../src/cinematics/CinematicTriggers.ts';
import { JOURNEY_PRESENTATION_MAP } from '../../src/journey/JourneyPresentationResolver.ts';
import {
  deriveAteTruth,
  deriveCombatTruth,
  deriveRunSystemTruth,
  loadCampaignCinematicCensus,
  validateCampaignCinematicCensus,
} from './validate_campaign_cinematic_census.mjs';

const projectRoot = process.cwd();
const censusPath = resolve(projectRoot, 'tools/cinematics/specs/campaign_cinematic_census.json');
const census = loadCampaignCinematicCensus(censusPath);
const truth = deriveRunSystemTruth(projectRoot);
const primaryMediaCoverages = ['UNIQUE', 'STATE_VARIANT', 'APPROVED_EXISTING'];
const mediaEntries = census.cinematics.filter((entry) => primaryMediaCoverages.includes(entry.coverage));
const identitySet = new Set(census.cinematics.map((entry) => entry.identity));
const familySet = new Set(census.reuseFamilies.map((entry) => `family:${entry.id}`));
const variantSet = new Set(census.cinematics.flatMap((entry) => (entry.variants ?? []).map((variant) => variant.identity)));
const resolvableTargets = new Set([...identitySet, ...familySet, ...variantSet]);

function entry(identity) {
  return census.cinematics.find((candidate) => candidate.identity === identity);
}

function sorted(values) {
  return [...values].sort();
}

function productionTargets(priority) {
  return census.productionBatches
    .filter((batch) => batch.priority === priority)
    .flatMap((batch) => batch.targets);
}

describe('CIN-5 campaign cinematic census contract', () => {
  it('parses as JSON', () => {
    expect(() => JSON.parse(readFileSync(censusPath, 'utf8'))).not.toThrow();
  });

  it('passes the deterministic census validator', () => {
    expect(validateCampaignCinematicCensus({ projectRoot, censusPath })).toMatchObject({
      ok: true,
      errors: [],
      summary: {
        prioritizedPrimaryMediaEntries: { P0: 17, P1: 9, P2: 0 },
        orderedTargetsIncludingReuse: { P0: 20, P1: 11, P2: 0 },
      },
    });
  });

  it('records schema version 1', () => {
    expect(census.schemaVersion).toBe(1);
  });

  it('records the exact CIN-4 baseline', () => {
    expect(census.baseline).toBe('c3074906bbf6882decf3d4ef482867a5af17ce3a');
  });

  it('records the canonical character root', () => {
    expect(census.canonicalCharacterRoot).toBe('public/assets/characters/pixel/full/');
  });

  it('records SCREEN_RIGHT as canonical master facing', () => {
    expect(census.canonicalFacing).toBe('SCREEN_RIGHT');
  });

  it('derives exactly 21 current route-template nodes', () => {
    expect(truth.nodes).toHaveLength(21);
    expect(census.routeTemplate.nodeCount).toBe(21);
  });

  it('covers the exact repository-derived route node IDs', () => {
    expect(census.routeTemplate.nodes.map((node) => node.id)).toEqual(truth.nodes.map((node) => node.id));
  });

  it('covers every route-template node in a cinematic decision', () => {
    for (const node of truth.nodes) {
      expect(census.cinematics.some((candidate) => candidate.sourceNodeIds.includes(node.id)), node.id).toBe(true);
    }
  });

  it('records repository-derived max depth 17', () => {
    expect(Math.max(...truth.nodes.map((node) => node.depth))).toBe(17);
    expect(census.routeTemplate.maxDepth).toBe(17);
  });

  it('derives exactly three topological forks', () => {
    expect(truth.forks).toHaveLength(3);
    expect(census.topologicalForks).toHaveLength(3);
  });

  it('records the exact three fork predecessor nodes', () => {
    expect(census.topologicalForks.map((fork) => fork.incomingNodeId)).toEqual([
      'lion-refugees', 'lion-valmir-road', 'lion-witnesses',
    ]);
  });

  it('matches every fork candidate to current RunSystem links', () => {
    for (const fork of truth.forks) {
      expect(census.topologicalForks.find((candidate) => candidate.incomingNodeId === fork.id)?.candidateNodeIds).toEqual(fork.links);
    }
  });

  it('gives every fork a freeze identity and preload group', () => {
    expect(census.topologicalForks.every((fork) => resolvableTargets.has(fork.freezeIdentity) && fork.preloadGroup)).toBe(true);
  });

  it('covers adaptive first-event variants', () => {
    const family = census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-first-trial-event');
    expect(family.currentSelectionContentIds).toEqual(['mystery_help', 'mystery_treasure']);
  });

  it('covers adaptive first-combat variants and mandate overrides', () => {
    const family = census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-first-trial-combat');
    expect(family.currentSelectionContentIds).toEqual(['spider_nest', 'forest_patrol', 'serpent_reprisals']);
    expect(family.mandateOverrides).toEqual({ lionMandateHonour: 'spider_nest', lionMandateAdvance: 'serpent_reprisals' });
  });

  it('covers the fixed adaptive second-event variant', () => {
    expect(census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-second-trial-event').currentSelectionContentIds).toEqual(['old_shrine_event']);
  });

  it('covers second-combat variants and advance mandate override', () => {
    const family = census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-second-trial-combat');
    expect(family.currentSelectionContentIds).toEqual(['troll_crossing', 'serpent_checkpoint', 'serpent_duelist_trial']);
    expect(family.mandateOverrides).toEqual({ lionMandateAdvance: 'serpent_checkpoint' });
  });

  it('covers current final-event variants', () => {
    expect(census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-final-trial-event').currentSelectionContentIds).toEqual([
      'mystery_dragon_roost', 'serpent_informant', 'mystery_shrine',
    ]);
  });

  it('accounts for the legacy-compatible lancer final-event assignment', () => {
    expect(census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-final-trial-event').legacyAssignmentContentIds).toEqual(['mystery_lancer_recruit']);
  });

  it('covers final-combat variants', () => {
    expect(census.adaptiveContent.find((candidate) => candidate.nodeId === 'lion-final-trial-combat').currentSelectionContentIds).toEqual(['ruins_guardians', 'serpent_hunters']);
  });

  it('matches the complete adaptive set derived from RunSystem', () => {
    const recorded = sorted(census.adaptiveContent.flatMap((family) => [...family.currentSelectionContentIds, ...family.legacyAssignmentContentIds]));
    expect(recorded).toEqual(truth.adaptiveContentIds);
  });

  it('covers seeded opening variants with one family', () => {
    expect(census.seededContent.find((candidate) => candidate.nodeId === 'lion-opening-ambush')).toMatchObject({
      contentIds: ['forest_ambush', 'wolf_pack'], strategy: 'SHARED_FAMILY', reuseFamily: 'forest_journey_tension',
    });
  });

  it('covers seeded Valmir variants with one family', () => {
    expect(census.seededContent.find((candidate) => candidate.nodeId === 'lion-valmir-road')).toMatchObject({
      contentIds: ['road_to_valmir', 'marsh_crossing'], strategy: 'SHARED_FAMILY', reuseFamily: 'bois_clair_road_tension',
    });
  });

  it('classifies lion_judgement as approved HERO', () => {
    expect(entry('node:lion-final-judgement:judgement')).toMatchObject({ runtimeId: 'lion_judgement', coverage: 'APPROVED_EXISTING', tier: 'HERO', priority: 'P0' });
  });

  it('classifies serpent_general_reveal as approved MICRO', () => {
    expect(entry('content:serpent_captain:reveal')).toMatchObject({ runtimeId: 'serpent_general_reveal', coverage: 'APPROVED_EXISTING', tier: 'MICRO', priority: 'P0' });
  });

  it('classifies lion_champion_reveal as approved MICRO', () => {
    expect(entry('content:lion_chief:reveal')).toMatchObject({ runtimeId: 'lion_champion_reveal', coverage: 'APPROVED_EXISTING', tier: 'MICRO', priority: 'P0' });
  });

  it('P0-covers both finale routes', () => {
    expect(entry('state:serpent_pursuit:ending')?.priority).toBe('P0');
    expect(entry('state:lion_trial:ending')?.priority).toBe('P0');
  });

  it('preserves lion-first-refuge as interactive refuge', () => {
    expect(census.routeTemplate.nodes.find((node) => node.id === 'lion-first-refuge')).toMatchObject({ type: 'refuge', boundaryKind: 'CONTINUE_BOUNDARY' });
  });

  it('preserves lion-second-refuge as interactive refuge', () => {
    expect(census.routeTemplate.nodes.find((node) => node.id === 'lion-second-refuge')).toMatchObject({ type: 'refuge', boundaryKind: 'CONTINUE_BOUNDARY' });
  });

  it('preserves lion-final-refuge as story', () => {
    expect(census.routeTemplate.nodes.find((node) => node.id === 'lion-final-refuge')).toMatchObject({ type: 'story', boundaryKind: 'CONTINUE_BOUNDARY' });
  });

  it('gives every UNIQUE entry a snake_case runtime ID', () => {
    expect(census.cinematics.filter((candidate) => candidate.coverage === 'UNIQUE').every((candidate) => /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(candidate.runtimeId))).toBe(true);
  });

  it('gives every planned media entry a valid tier', () => {
    expect(mediaEntries.every((candidate) => ['MICRO', 'JOURNEY', 'HERO'].includes(candidate.tier))).toBe(true);
  });

  it('gives every planned media entry a priority', () => {
    expect(mediaEntries.every((candidate) => ['P0', 'P1', 'P2'].includes(candidate.priority))).toBe(true);
  });

  it('defines prioritized primary media entries independently from reuse families', () => {
    expect(census.priorityAccounting.primaryMediaCoverages).toEqual(primaryMediaCoverages);
    expect(census.priorityAccounting.reuseFamilyTargetKind).toBe('REUSE_FAMILY');
  });

  it('records 17 P0, 9 P1, and 0 P2 prioritized primary media entries', () => {
    const derived = Object.fromEntries(['P0', 'P1', 'P2'].map((priority) => [
      priority,
      mediaEntries.filter((entry) => entry.priority === priority).length,
    ]));
    expect(derived).toEqual({ P0: 17, P1: 9, P2: 0 });
    expect(census.priorityAccounting.prioritizedPrimaryMediaEntries).toEqual(derived);
  });

  it('records 20 P0, 11 P1, and 0 P2 ordered targets including reuse', () => {
    const derived = Object.fromEntries(['P0', 'P1', 'P2'].map((priority) => [priority, productionTargets(priority).length]));
    expect(derived).toEqual({ P0: 20, P1: 11, P2: 0 });
    expect(census.priorityAccounting.orderedTargetsIncludingReuse).toEqual(derived);
  });

  it('explains the P0 target expansion as one state target plus two reuse families', () => {
    expect(census.priorityAccounting.orderedTargetComposition.P0).toEqual({
      primaryMediaEntries: 17,
      stateVariantAdditionalTargets: 1,
      reuseFamilyTargets: 2,
      totalTargets: 20,
    });
  });

  it('explains the P1 target expansion as two reuse families', () => {
    expect(census.priorityAccounting.orderedTargetComposition.P1).toEqual({
      primaryMediaEntries: 9,
      stateVariantAdditionalTargets: 0,
      reuseFamilyTargets: 2,
      totalTargets: 11,
    });
  });

  it('marks every ordered target with its actual primary coverage or REUSE_FAMILY', () => {
    for (const batch of census.productionBatches) {
      for (const item of batch.targets) {
        const family = census.reuseFamilies.find((candidate) => `family:${candidate.id}` === item.target);
        const direct = entry(item.target);
        const parent = census.cinematics.find((candidate) => (candidate.variants ?? []).some((variant) => variant.identity === item.target));
        const expectedKind = family ? 'REUSE_FAMILY' : (direct?.coverage ?? (parent ? 'STATE_VARIANT' : null));
        expect(item.targetKind, `${batch.id}:${item.target}`).toBe(expectedKind);
      }
    }
  });

  it('keeps REUSE_FAMILY targets out of prioritized primary media counts', () => {
    const reuseTargets = census.productionBatches.flatMap((batch) => batch.targets).filter((item) => item.targetKind === 'REUSE_FAMILY');
    expect(reuseTargets).toHaveLength(4);
    expect(reuseTargets.every((item) => item.target.startsWith('family:'))).toBe(true);
    expect(mediaEntries.some((entry) => entry.coverage === 'REUSE')).toBe(false);
  });

  it('gives every planned media entry a valid shot range', () => {
    expect(mediaEntries.every((candidate) => candidate.targetShotsMin > 0 && candidate.targetShotsMax >= candidate.targetShotsMin)).toBe(true);
  });

  it('gives every planned media entry a valid duration range', () => {
    expect(mediaEntries.every((candidate) => candidate.targetDurationSecondsMin > 0 && candidate.targetDurationSecondsMax >= candidate.targetDurationSecondsMin)).toBe(true);
  });

  it('resolves every READY character path', () => {
    for (const candidate of mediaEntries.flatMap((item) => item.characters).filter((character) => character.assetStatus === 'READY')) {
      expect(existsSync(resolve(projectRoot, candidate.asset)), candidate.asset).toBe(true);
    }
  });

  it('does not falsely mark missing character paths READY', () => {
    for (const candidate of mediaEntries.flatMap((item) => item.characters).filter((character) => character.assetStatus === 'MISSING')) {
      expect(existsSync(resolve(projectRoot, candidate.asset)), candidate.asset).toBe(false);
    }
  });

  it('resolves every READY or REUSE environment path', () => {
    for (const candidate of mediaEntries.filter((item) => ['READY', 'REUSE'].includes(item.environment.status))) {
      expect(existsSync(resolve(projectRoot, candidate.environment.preferredAsset)), candidate.environment.preferredAsset).toBe(true);
    }
  });

  it('resolves every reuse-family reference', () => {
    const families = new Set(census.reuseFamilies.map((family) => family.id));
    expect(census.cinematics.filter((candidate) => candidate.coverage === 'REUSE').every((candidate) => families.has(candidate.reuseFamily))).toBe(true);
  });

  it('has no duplicate semantic identities', () => {
    expect(identitySet.size).toBe(census.cinematics.length);
  });

  it('has no duplicate runtime IDs where runtime IDs are required', () => {
    const runtimeIds = mediaEntries.flatMap((candidate) => [candidate.runtimeId, ...(candidate.variants ?? []).map((variant) => variant.runtimeId)]);
    expect(new Set(runtimeIds).size).toBe(runtimeIds.length);
  });

  it('limits state-specific media to the visibly distinct Bois-Clair aftermath', () => {
    const variants = census.cinematics.filter((candidate) => candidate.coverage === 'STATE_VARIANT');
    expect(variants).toHaveLength(1);
    expect(variants[0].variants.map((variant) => variant.identity)).toEqual(['state:bois_clair:saved', 'state:bois_clair:sacrificed']);
  });

  it('keeps Shadow Signs neutral to knowledge and disclosure choices', () => {
    expect(entry('node:lion-shadow-signs:arrival')).toMatchObject({ coverage: 'UNIQUE', tier: 'HERO' });
    expect(entry('node:lion-shadow-signs:arrival').notes.join(' ')).toContain('neutral pre-dialogue HERO');
  });

  it('keeps finale ending media route-specific but disclosure-neutral', () => {
    expect(entry('state:serpent_pursuit:ending').notes.join(' ')).toContain('disclosure remains DialogueView truth');
    expect(entry('state:lion_trial:ending').notes.join(' ')).toContain('Never imply the Serpent General died');
  });

  it('resolves every production-batch target', () => {
    for (const item of census.productionBatches.flatMap((batch) => batch.targets)) expect(resolvableTargets.has(item.target), item.target).toBe(true);
  });

  it('uses only reachable transitions in the golden path', () => {
    for (let index = 0; index < census.goldenPath.nodeSequence.length - 1; index += 1) {
      const node = truth.nodes.find((candidate) => candidate.id === census.goldenPath.nodeSequence[index]);
      expect(node.links, node.id).toContain(census.goldenPath.nodeSequence[index + 1]);
    }
  });

  it('resolves every golden-path P0 target', () => {
    expect(census.goldenPath.p0Targets.every((target) => resolvableTargets.has(target))).toBe(true);
  });

  it('records 17 production combat configs with pre and post dialogue', () => {
    const combats = deriveCombatTruth(projectRoot);
    expect(combats).toHaveLength(17);
    expect(combats.every((combat) => combat.preCombatDialogueId && combat.postCombatDialogueId)).toBe(true);
  });

  it('matches combat framing to repository combat hooks', () => {
    expect(census.combatFraming.map(({ combatId, preCombatDialogueId, postCombatDialogueId }) => ({ combatId, preCombatDialogueId, postCombatDialogueId }))).toEqual(deriveCombatTruth(projectRoot));
  });

  it('does not schedule routine post-combat video', () => {
    const routine = census.combatFraming.filter((combat) => !['village_defense', 'village_raid', 'serpent_captain', 'lion_chief'].includes(combat.combatId));
    expect(routine.every((combat) => combat.postVideoDecision === 'NONE')).toBe(true);
  });

  it('audits all 10 repository-derived ATE rules', () => {
    expect(deriveAteTruth(projectRoot)).toHaveLength(10);
    expect(census.ateAudit).toHaveLength(10);
  });

  it('places the two refuge-watch ATEs at the correct nodes', () => {
    expect(census.ateAudit.find((ate) => ate.id === 'ate_first_refuge_watch')?.triggerNodeId).toBe('lion-first-refuge');
    expect(census.ateAudit.find((ate) => ate.id === 'ate_bois_clair_night_watch')?.triggerNodeId).toBe('lion-second-refuge');
  });

  it('assigns no unique video to an ATE', () => {
    expect(census.ateAudit.every((ate) => ['NO_VIDEO', 'REUSE_CONTEXT'].includes(ate.decision))).toBe(true);
  });

  it('records exactly three reputation-event opportunities', () => {
    expect(census.reputationEventAudit.opportunities.map((opportunity) => opportunity.triggerNodeId)).toEqual(['lion-first-refuge', 'lion-village-choice', 'lion-final-refuge']);
  });

  it('records exactly nine reputation-event definitions', () => {
    expect(census.reputationEventAudit.events).toHaveLength(9);
  });

  it('preserves reputation-event frequency caps and spacing', () => {
    expect(census.reputationEventAudit.opportunities.every((opportunity) => opportunity.maxEventsPerRun === 2 && opportunity.minimumStepsSinceAnyEvent === 3)).toBe(true);
  });

  it('uses shared context for every reputation event', () => {
    expect(census.reputationEventAudit.events.every((event) => event.decision === 'REUSE_CONTEXT')).toBe(true);
  });

  it('keeps exact production trigger maps unchanged', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS).toEqual({
      beforeDialogue: { lion_finale_judgement: 'lion_judgement' },
      beforeCombat: { serpent_captain: 'serpent_general_reveal', lion_chief: 'lion_champion_reveal' },
      afterCombat: {},
      chapterBeat: {},
    });
  });

  it('keeps the Journey production presentation map empty', () => {
    expect(JOURNEY_PRESENTATION_MAP).toEqual({});
  });

  it('keeps exactly the three approved production video files', () => {
    expect(readdirSync(resolve(projectRoot, 'public/assets/cinematics')).filter((name) => /\.(?:mp4|webm|mov)$/i.test(name)).sort()).toEqual([
      'lion_champion_reveal.mp4', 'lion_judgement.mp4', 'serpent_general_reveal.mp4',
    ]);
  });

  it('records exact current approved duration and byte totals', () => {
    expect(census.currentApprovedMedia.reduce((sum, media) => sum + media.durationSeconds, 0)).toBe(33);
    expect(census.currentApprovedMedia.reduce((sum, media) => sum + media.bytes, 0)).toBe(41_589_566);
  });

  it('records P0 and full projected seconds consistently', () => {
    expect(census.mediaProjection).toMatchObject({ p0NewSeconds: 239, p0TotalSeconds: 272, p0P1TotalSeconds: 330, fullP0P1P2Seconds: 330 });
  });

  it('keeps TravelView as production default and Journey DEV-selected', () => {
    expect(census.productionDefault).toEqual({ current: 'TravelView', journeyAvailability: 'DEV_SELECTED', changedByCin5: false });
  });

  it('inventories 52 canonical full character assets', () => {
    expect(census.characterAssets).toHaveLength(52);
    for (const id of census.characterAssets) expect(existsSync(resolve(projectRoot, census.canonicalCharacterRoot, `${id}.png`)), id).toBe(true);
  });

  it('inventories 22 current Lion-phase environments', () => {
    expect(census.environmentAssets).toHaveLength(22);
    for (const path of census.environmentAssets) expect(existsSync(resolve(projectRoot, path)), path).toBe(true);
  });

  it('does not modify GameState or save-schema source files', () => {
    const changed = execFileSync('git', ['status', '--short'], { cwd: projectRoot, encoding: 'utf8' });
    expect(changed).not.toMatch(/src\/game\/(?:types|store)\.ts/);
  });

  it('does not introduce new production media in the worktree', () => {
    const changed = execFileSync('git', ['status', '--short'], { cwd: projectRoot, encoding: 'utf8' });
    expect(changed).not.toMatch(/public\/assets\/cinematics\/.*\.(?:mp4|webm|mov|png)/i);
  });
});
