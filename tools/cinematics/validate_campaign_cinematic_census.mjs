import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROJECT_ROOT = resolve(SCRIPT_DIR, '..', '..');
const DEFAULT_CENSUS_PATH = resolve(DEFAULT_PROJECT_ROOT, 'tools/cinematics/specs/campaign_cinematic_census.json');

const COVERAGE = new Set(['NONE', 'REUSE', 'UNIQUE', 'STATE_VARIANT', 'APPROVED_EXISTING']);
const PRIMARY_MEDIA_COVERAGES = Object.freeze(['UNIQUE', 'STATE_VARIANT', 'APPROVED_EXISTING']);
const PRIMARY_MEDIA_COVERAGE_SET = new Set(PRIMARY_MEDIA_COVERAGES);
const ORDERED_TARGET_KINDS = new Set([...PRIMARY_MEDIA_COVERAGES, 'REUSE_FAMILY']);
const TIERS = new Set(['MICRO', 'JOURNEY', 'HERO']);
const PRIORITIES = new Set(['P0', 'P1', 'P2']);
const PRODUCTION_STATUSES = new Set(['NOT_PLANNED', 'FAMILY_PLANNED', 'PLANNED', 'APPROVED_EXISTING', 'HELD_CONTEXT']);
const TRIGGERS = new Set(['NONE', 'JOURNEY_NODE', 'JOURNEY_EDGE', 'BEFORE_DIALOGUE', 'BEFORE_COMBAT', 'AFTER_COMBAT', 'CHAPTER_BEAT', 'STATE_AFTERMATH', 'REFUGE_ARRIVAL', 'REFUGE_DEPARTURE', 'ENDING']);
const READINESS = new Set(['SOURCE_READY', 'SOURCE_PARTIAL', 'SOURCE_BLOCKED']);
const ASSET_STATUSES = new Set(['READY', 'OPTIONAL', 'MISSING']);
const ENVIRONMENT_STATUSES = new Set(['READY', 'REUSE', 'MISSING']);
const FACING = new Set(['SCREEN_RIGHT', 'SCREEN_LEFT', 'CAMERA', 'AWAY_FROM_CAMERA']);
const COMPLEXITY = new Set(['STATIC_LOW', 'CONTROLLED', 'ADVANCED']);
const CONTINUITY = new Set(['ROOT_SOURCE', 'CUT_SOURCE', 'CHAIN_SOURCE']);
const AUDIO = new Set(['SILENT_GAME_MUSIC', 'AMBIENCE_SFX_GAME_MUSIC', 'HERO_SCORE_LATER']);
const BURDEN = new Set(['LOW', 'MEDIUM', 'HIGH']);

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function arrayEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Could not derive source region '${startMarker}' -> '${endMarker}'.`);
  return source.slice(start, end);
}

export function deriveRunSystemTruth(projectRoot = DEFAULT_PROJECT_ROOT) {
  const source = readFileSync(resolve(projectRoot, 'src/game/runSystem.ts'), 'utf8');
  const template = between(source, 'const LION_ROUTE_TEMPLATE', 'const FIRST_EVENT_VARIANTS');
  const nodes = [];
  const nodePattern = /\{\s*id: '([^']+)',\s*type: '([^']+)',\s*depth: (\d+),[\s\S]*?contentId: '([^']+)',[\s\S]*?links: \[([^\]]*)\]/g;
  for (const match of template.matchAll(nodePattern)) {
    nodes.push({
      id: match[1],
      type: match[2],
      depth: Number(match[3]),
      contentId: match[4],
      links: [...match[5].matchAll(/'([^']+)'/g)].map((link) => link[1]),
    });
  }

  const adaptiveRegion = between(source, 'const FIRST_EVENT_VARIANTS', 'const SEEDED_CREATURE_VARIANTS');
  const adaptiveContentIds = sortedUnique(
    [...adaptiveRegion.matchAll(/contentId: '([^']+)'/g)].map((match) => match[1]),
  );

  const seededRegion = between(source, 'const SEEDED_CREATURE_VARIANTS', 'const ELITE_ROUTE_CONTENT_IDS');
  const seededContent = [];
  for (const match of seededRegion.matchAll(/'([^']+)': \[([^\]]+)\]/g)) {
    seededContent.push({
      nodeId: match[1],
      contentIds: [...match[2].matchAll(/'([^']+)'/g)].map((content) => content[1]),
    });
  }

  return {
    nodes,
    forks: nodes.filter((node) => node.links.length > 1),
    adaptiveContentIds,
    seededContent,
  };
}

export function deriveCombatTruth(projectRoot = DEFAULT_PROJECT_ROOT) {
  const source = readFileSync(resolve(projectRoot, 'src/game/content.ts'), 'utf8');
  const region = between(source, 'const rawCombats', 'const combatVisualComposition');
  const combats = [];
  const pattern = /\{ id: '([^']+)'[^\r\n]*preCombatDialogueId: '([^']+)', postCombatDialogueId: '([^']+)'/g;
  for (const match of region.matchAll(pattern)) {
    combats.push({ combatId: match[1], preCombatDialogueId: match[2], postCombatDialogueId: match[3] });
  }
  return combats;
}

export function deriveAteTruth(projectRoot = DEFAULT_PROJECT_ROOT) {
  const source = readFileSync(resolve(projectRoot, 'src/game/content.ts'), 'utf8');
  const region = source.slice(source.indexOf('export const POST_NODE_ATE'));
  const pairs = [];
  for (const match of region.matchAll(/'([^']+)': \[([^\]]+)\]/g)) {
    for (const dialogue of match[2].matchAll(/'([^']+)'/g)) {
      pairs.push({ triggerNodeId: match[1], id: dialogue[1] });
    }
  }
  return pairs;
}

export function loadCampaignCinematicCensus(path = DEFAULT_CENSUS_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function targetResolver(census) {
  const identities = new Set(census.cinematics.map((entry) => entry.identity));
  const families = new Set(census.reuseFamilies.map((family) => `family:${family.id}`));
  const variants = new Set(census.cinematics.flatMap((entry) => (entry.variants ?? []).map((variant) => variant.identity)));
  return new Set([...identities, ...families, ...variants]);
}

function targetAccountingDetails(census, target) {
  if (typeof target !== 'string') return null;
  if (target.startsWith('family:')) {
    const family = census.reuseFamilies.find((candidate) => `family:${candidate.id}` === target);
    return family ? { targetKind: 'REUSE_FAMILY', priority: family.priority, mediaStrategy: family.mediaStrategy } : null;
  }
  const direct = census.cinematics.find((entry) => entry.identity === target);
  if (direct) return { targetKind: direct.coverage, priority: direct.priority };
  const parent = census.cinematics.find((entry) => (entry.variants ?? []).some((variant) => variant.identity === target));
  return parent ? { targetKind: 'STATE_VARIANT', priority: parent.priority } : null;
}

function runtimeIdForTarget(census, target) {
  if (typeof target !== 'string') return null;
  if (target.startsWith('family:')) {
    return census.reuseFamilies.find((candidate) => `family:${candidate.id}` === target)?.runtimeId ?? null;
  }
  const direct = census.cinematics.find((entry) => entry.identity === target);
  if (direct) return direct.runtimeId ?? null;
  for (const entry of census.cinematics) {
    const variant = (entry.variants ?? []).find((candidate) => candidate.identity === target);
    if (variant) return variant.runtimeId ?? null;
  }
  return null;
}

export function plannedProductionVideoFiles(census) {
  return sortedUnique(census.productionBatches
    .flatMap((batch) => batch.targets)
    .map((item) => runtimeIdForTarget(census, item.target))
    .filter(Boolean)
    .map((runtimeId) => `${runtimeId}.mp4`));
}

function expectedOrderedTargets(census, priority) {
  const primaryTargets = census.cinematics
    .filter((entry) => entry.priority === priority && PRIMARY_MEDIA_COVERAGE_SET.has(entry.coverage))
    .flatMap((entry) => entry.coverage === 'STATE_VARIANT'
      ? (entry.variants ?? []).map((variant) => variant.identity)
      : [entry.identity]);
  const reuseTargets = census.reuseFamilies
    .filter((family) => family.priority === priority && family.mediaStrategy === 'OWN_VIDEO')
    .map((family) => `family:${family.id}`);
  return [...primaryTargets, ...reuseTargets];
}

function mediaSecondsFor(census, priority) {
  let seconds = 0;
  for (const entry of census.cinematics) {
    if (entry.priority !== priority || !['UNIQUE', 'STATE_VARIANT'].includes(entry.coverage)) continue;
    if (entry.coverage === 'STATE_VARIANT') {
      seconds += entry.variants.reduce((total, variant) => total + variant.planningSeconds, 0);
    } else {
      seconds += entry.planningSeconds;
    }
  }
  for (const family of census.reuseFamilies) {
    if (family.priority === priority && family.mediaStrategy === 'OWN_VIDEO') seconds += family.planningSeconds;
  }
  return seconds;
}

function summaryFor(census) {
  const countBy = (key, values) => Object.fromEntries(values.map((value) => [
    value,
    census.cinematics.filter((entry) => entry[key] === value).length,
  ]));
  const readiness = Object.fromEntries([...READINESS].map((value) => [
    value,
    census.cinematics.filter((entry) => entry.sourceReadiness === value).length,
  ]));
  return {
    entries: census.cinematics.length,
    coverage: countBy('coverage', [...COVERAGE]),
    tiers: countBy('tier', [...TIERS]),
    prioritizedPrimaryMediaEntries: Object.fromEntries([...PRIORITIES].map((priority) => [
      priority,
      census.cinematics.filter((entry) => entry.priority === priority && PRIMARY_MEDIA_COVERAGE_SET.has(entry.coverage)).length,
    ])),
    orderedTargetsIncludingReuse: Object.fromEntries([...PRIORITIES].map((priority) => [
      priority,
      census.productionBatches.filter((batch) => batch.priority === priority).flatMap((batch) => batch.targets).length,
    ])),
    sourceReadiness: readiness,
    routeNodes: census.routeTemplate.nodes.length,
    forks: census.topologicalForks.length,
    adaptiveContentIds: sortedUnique(census.adaptiveContent.flatMap((family) => [
      ...family.currentSelectionContentIds,
      ...family.legacyAssignmentContentIds,
    ])).length,
    seededContentIds: sortedUnique(census.seededContent.flatMap((family) => family.contentIds)).length,
  };
}

export function validateCampaignCinematicCensus({
  projectRoot = DEFAULT_PROJECT_ROOT,
  censusPath = DEFAULT_CENSUS_PATH,
} = {}) {
  const errors = [];
  let census;
  try {
    census = loadCampaignCinematicCensus(censusPath);
  } catch (error) {
    return { ok: false, errors: [`Census parse failed: ${error instanceof Error ? error.message : String(error)}`], summary: null };
  }

  assert(census.schemaVersion === 1, 'schemaVersion must be 1.', errors);
  assert(census.baseline === 'c3074906bbf6882decf3d4ef482867a5af17ce3a', 'Baseline does not match CIN-4 HEAD.', errors);
  assert(census.campaign === 'lion', "campaign must be 'lion'.", errors);
  assert(census.canonicalCharacterRoot === 'public/assets/characters/pixel/full/', 'Canonical character root is incorrect.', errors);
  assert(census.canonicalFacing === 'SCREEN_RIGHT', 'Canonical facing must be SCREEN_RIGHT.', errors);
  assert(census.productionDefault?.current === 'TravelView' && census.productionDefault?.journeyAvailability === 'DEV_SELECTED' && census.productionDefault?.changedByCin5 === false, 'Production default doctrine changed.', errors);

  let truth;
  try {
    truth = deriveRunSystemTruth(projectRoot);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    truth = { nodes: [], forks: [], adaptiveContentIds: [], seededContent: [] };
  }
  const plannedNodes = census.routeTemplate.nodes;
  assert(truth.nodes.length === 21, `Repository route template must contain 21 nodes; derived ${truth.nodes.length}.`, errors);
  assert(census.routeTemplate.nodeCount === truth.nodes.length, 'Recorded nodeCount differs from repository truth.', errors);
  assert(census.routeTemplate.maxDepth === Math.max(...truth.nodes.map((node) => node.depth)), 'Recorded maxDepth differs from repository truth.', errors);
  assert(arrayEqual(plannedNodes.map((node) => node.id), truth.nodes.map((node) => node.id)), 'Route node order/IDs differ from RunSystem.', errors);
  for (const node of truth.nodes) {
    const planned = plannedNodes.find((candidate) => candidate.id === node.id);
    assert(planned?.type === node.type, `Route type mismatch for ${node.id}.`, errors);
    assert(planned?.depth === node.depth, `Route depth mismatch for ${node.id}.`, errors);
    assert(planned?.contentId === node.contentId, `Route content mismatch for ${node.id}.`, errors);
    assert(arrayEqual(planned?.links ?? [], node.links), `Route links mismatch for ${node.id}.`, errors);
  }
  assert(plannedNodes.find((node) => node.id === 'lion-first-refuge')?.type === 'refuge', 'lion-first-refuge must remain refuge.', errors);
  assert(plannedNodes.find((node) => node.id === 'lion-second-refuge')?.type === 'refuge', 'lion-second-refuge must remain refuge.', errors);
  assert(plannedNodes.find((node) => node.id === 'lion-final-refuge')?.type === 'story', 'lion-final-refuge must remain story.', errors);

  assert(truth.forks.length === 3, `Repository must expose exactly 3 topological forks; derived ${truth.forks.length}.`, errors);
  assert(census.topologicalForks.length === truth.forks.length, 'Fork count differs from repository truth.', errors);
  for (const fork of truth.forks) {
    const planned = census.topologicalForks.find((candidate) => candidate.incomingNodeId === fork.id);
    assert(Boolean(planned), `Missing fork plan for ${fork.id}.`, errors);
    assert(arrayEqual(planned?.candidateNodeIds ?? [], fork.links), `Fork candidates mismatch for ${fork.id}.`, errors);
    assert(Boolean(planned?.freezeIdentity), `Fork ${fork.id} has no freeze identity.`, errors);
    assert(Boolean(planned?.preloadGroup), `Fork ${fork.id} has no preload group.`, errors);
  }

  const censusAdaptive = sortedUnique(census.adaptiveContent.flatMap((family) => [
    ...family.currentSelectionContentIds,
    ...family.legacyAssignmentContentIds,
  ]));
  assert(arrayEqual(censusAdaptive, truth.adaptiveContentIds), `Adaptive content differs from RunSystem. Expected ${truth.adaptiveContentIds.join(', ')}.`, errors);
  const censusSeeded = census.seededContent.map((family) => ({ nodeId: family.nodeId, contentIds: family.contentIds }));
  assert(JSON.stringify(censusSeeded) === JSON.stringify(truth.seededContent), 'Seeded content differs from RunSystem.', errors);

  const identities = census.cinematics.map((entry) => entry.identity);
  assert(new Set(identities).size === identities.length, 'Duplicate cinematic semantic identity.', errors);
  const familyIds = census.reuseFamilies.map((family) => family.id);
  assert(new Set(familyIds).size === familyIds.length, 'Duplicate reuse family ID.', errors);
  const validTargets = targetResolver(census);
  for (const fork of census.topologicalForks) {
    assert(validTargets.has(fork.freezeIdentity), `Fork freeze identity '${fork.freezeIdentity}' does not resolve.`, errors);
    for (const identity of fork.outgoingEdgeCoverage) assert(validTargets.has(identity), `Fork coverage identity '${identity}' does not resolve.`, errors);
  }

  const runtimeIds = [];
  const mediaCoverages = PRIMARY_MEDIA_COVERAGE_SET;
  for (const entry of census.cinematics) {
    const label = entry.identity ?? '<missing identity>';
    assert(typeof entry.identity === 'string' && /^(node|edge|content|state):/.test(entry.identity), `Invalid identity '${label}'.`, errors);
    assert(COVERAGE.has(entry.coverage), `${label}: invalid coverage '${entry.coverage}'.`, errors);
    assert(PRODUCTION_STATUSES.has(entry.productionStatus), `${label}: invalid production status '${entry.productionStatus}'.`, errors);
    assert(TRIGGERS.has(entry.triggerIntent), `${label}: invalid trigger '${entry.triggerIntent}'.`, errors);
    assert(AUDIO.has(entry.audioIntent), `${label}: invalid audio intent '${entry.audioIntent}'.`, errors);
    assert(Array.isArray(entry.sourceNodeIds) && Array.isArray(entry.contentIds), `${label}: source/content IDs must be arrays.`, errors);
    for (const nodeId of entry.sourceNodeIds) assert(truth.nodes.some((node) => node.id === nodeId), `${label}: unknown source node '${nodeId}'.`, errors);

    if (entry.coverage === 'NONE') {
      assert(entry.runtimeId === null && entry.tier === null && entry.priority === null, `${label}: NONE entry must not schedule media.`, errors);
    }
    if (entry.coverage === 'REUSE') {
      assert(typeof entry.reuseFamily === 'string' && familyIds.includes(entry.reuseFamily), `${label}: unresolved reuseFamily.`, errors);
      assert(TIERS.has(entry.tier), `${label}: REUSE tier is invalid.`, errors);
    }
    if (mediaCoverages.has(entry.coverage)) {
      assert(typeof entry.runtimeId === 'string' && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(entry.runtimeId), `${label}: planned runtimeId must be lowercase snake_case.`, errors);
      if (typeof entry.runtimeId === 'string') runtimeIds.push(entry.runtimeId);
      assert(TIERS.has(entry.tier), `${label}: media tier is invalid.`, errors);
      assert(PRIORITIES.has(entry.priority), `${label}: media priority is invalid.`, errors);
      assert(READINESS.has(entry.sourceReadiness), `${label}: sourceReadiness is invalid.`, errors);
      assert(COMPLEXITY.has(entry.motionComplexity), `${label}: motionComplexity is invalid.`, errors);
      assert(BURDEN.has(entry.generationBurden), `${label}: generationBurden is invalid.`, errors);
      assert(Number.isInteger(entry.targetShotsMin) && Number.isInteger(entry.targetShotsMax) && entry.targetShotsMin > 0 && entry.targetShotsMin <= entry.targetShotsMax, `${label}: invalid shot range.`, errors);
      assert(Number.isFinite(entry.targetDurationSecondsMin) && Number.isFinite(entry.targetDurationSecondsMax) && entry.targetDurationSecondsMin > 0 && entry.targetDurationSecondsMin <= entry.targetDurationSecondsMax, `${label}: invalid duration range.`, errors);
      assert(Array.isArray(entry.continuityPlan) && entry.continuityPlan.length > 0 && entry.continuityPlan.every((value) => CONTINUITY.has(value)), `${label}: invalid continuity plan.`, errors);
      assert(entry.environment && ENVIRONMENT_STATUSES.has(entry.environment.status), `${label}: invalid environment status.`, errors);
      if (entry.environment?.preferredAsset) {
        const assetPath = resolve(projectRoot, entry.environment.preferredAsset);
        if (entry.environment.status === 'MISSING') assert(!existsSync(assetPath), `${label}: environment exists but is marked MISSING.`, errors);
        else assert(existsSync(assetPath), `${label}: environment path does not exist: ${entry.environment.preferredAsset}.`, errors);
      }
      for (const character of entry.characters ?? []) {
        assert(ASSET_STATUSES.has(character.assetStatus), `${label}: invalid character asset status for ${character.id}.`, errors);
        assert(FACING.has(character.stagingIntent?.facing), `${label}: invalid facing for ${character.id}.`, errors);
        if (character.assetStatus === 'READY') assert(existsSync(resolve(projectRoot, character.asset)), `${label}: READY character asset missing: ${character.asset}.`, errors);
        if (character.assetStatus === 'MISSING') assert(!existsSync(resolve(projectRoot, character.asset)), `${label}: character exists but is marked MISSING: ${character.asset}.`, errors);
      }
    }

    if (entry.coverage === 'STATE_VARIANT') {
      assert(Array.isArray(entry.variants) && entry.variants.length >= 2, `${label}: STATE_VARIANT requires at least two variants.`, errors);
      for (const variant of entry.variants ?? []) {
        assert(typeof variant.identity === 'string' && variant.identity.startsWith('state:'), `${label}: invalid state variant identity.`, errors);
        assert(typeof variant.runtimeId === 'string' && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(variant.runtimeId), `${label}: invalid state variant runtimeId.`, errors);
        assert(Array.isArray(variant.stateConditions) && variant.stateConditions.length > 0, `${label}: state variant lacks conditions.`, errors);
        assert(Number.isFinite(variant.planningSeconds) && variant.planningSeconds >= entry.targetDurationSecondsMin && variant.planningSeconds <= entry.targetDurationSecondsMax, `${label}: state variant planning duration is outside range.`, errors);
        if (typeof variant.runtimeId === 'string') runtimeIds.push(variant.runtimeId);
      }
    } else if (mediaCoverages.has(entry.coverage)) {
      assert(Number.isFinite(entry.planningSeconds) && entry.planningSeconds >= entry.targetDurationSecondsMin && entry.planningSeconds <= entry.targetDurationSecondsMax, `${label}: planningSeconds is outside duration range.`, errors);
    }
  }
  assert(new Set(runtimeIds).size === runtimeIds.length, 'Duplicate planned runtime cinematic ID.', errors);

  for (const family of census.reuseFamilies) {
    assert(TIERS.has(family.tier), `Reuse family ${family.id}: invalid tier.`, errors);
    assert(READINESS.has(family.sourceReadiness), `Reuse family ${family.id}: invalid readiness.`, errors);
    assert(BURDEN.has(family.generationBurden), `Reuse family ${family.id}: invalid burden.`, errors);
    if (family.backingIdentity) assert(validTargets.has(family.backingIdentity), `Reuse family ${family.id}: backing identity does not resolve.`, errors);
    if (family.backingAsset) assert(existsSync(resolve(projectRoot, family.backingAsset)), `Reuse family ${family.id}: backing asset is missing.`, errors);
    if (family.mediaStrategy === 'OWN_VIDEO') {
      assert(PRIORITIES.has(family.priority), `Reuse family ${family.id}: own video requires priority.`, errors);
      assert(typeof family.runtimeId === 'string' && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(family.runtimeId), `Reuse family ${family.id}: invalid runtimeId.`, errors);
      assert(Number.isFinite(family.planningSeconds) && family.planningSeconds >= family.targetDurationSecondsMin && family.planningSeconds <= family.targetDurationSecondsMax, `Reuse family ${family.id}: invalid planning duration.`, errors);
    }
  }

  for (const node of truth.nodes) {
    assert(census.cinematics.some((entry) => entry.sourceNodeIds.includes(node.id)), `Route node ${node.id} has no census coverage.`, errors);
  }
  const accountedContent = new Set(census.cinematics.flatMap((entry) => entry.contentIds));
  for (const contentId of [...truth.adaptiveContentIds, ...truth.seededContent.flatMap((family) => family.contentIds)]) {
    assert(accountedContent.has(contentId), `Reachable adaptive/seeded content '${contentId}' is not covered.`, errors);
  }

  const actualCombats = deriveCombatTruth(projectRoot);
  assert(actualCombats.length === 17, `Expected 17 production combat configs; derived ${actualCombats.length}.`, errors);
  assert(census.combatFraming.length === actualCombats.length, 'Combat framing count differs from production combat configs.', errors);
  for (const combat of actualCombats) {
    const planned = census.combatFraming.find((entry) => entry.combatId === combat.combatId);
    assert(Boolean(planned), `Missing combat framing for ${combat.combatId}.`, errors);
    assert(planned?.preCombatDialogueId === combat.preCombatDialogueId, `Pre-combat dialogue mismatch for ${combat.combatId}.`, errors);
    assert(planned?.postCombatDialogueId === combat.postCombatDialogueId, `Post-combat dialogue mismatch for ${combat.combatId}.`, errors);
  }

  const actualAtes = deriveAteTruth(projectRoot);
  assert(actualAtes.length === 10, `Expected 10 ATE rules; derived ${actualAtes.length}.`, errors);
  assert(census.ateAudit.length === actualAtes.length, 'ATE audit count differs from POST_NODE_ATE.', errors);
  for (const ate of actualAtes) {
    const planned = census.ateAudit.find((entry) => entry.id === ate.id);
    assert(planned?.triggerNodeId === ate.triggerNodeId, `ATE trigger mismatch for ${ate.id}.`, errors);
    assert(['NO_VIDEO', 'REUSE_CONTEXT', 'UNIQUE_VIDEO'].includes(planned?.decision), `ATE ${ate.id} has invalid video decision.`, errors);
  }

  assert(census.reputationEventAudit.opportunities.length === 3, 'Reputation event opportunity count must be 3.', errors);
  assert(census.reputationEventAudit.events.length === 9, 'Reputation event definition count must be 9.', errors);
  assert(census.reputationEventAudit.opportunities.every((entry) => entry.maxEventsPerRun === 2 && entry.minimumStepsSinceAnyEvent === 3), 'Reputation event frequency limits are not preserved.', errors);
  assert(census.reputationEventAudit.events.every((entry) => entry.decision === 'REUSE_CONTEXT'), 'Reputation events must not silently multiply unique video.', errors);

  const approved = new Map(census.cinematics.filter((entry) => entry.coverage === 'APPROVED_EXISTING').map((entry) => [entry.runtimeId, entry]));
  assert(approved.get('lion_judgement')?.tier === 'HERO', 'lion_judgement must be APPROVED_EXISTING HERO.', errors);
  assert(approved.get('serpent_general_reveal')?.tier === 'MICRO', 'serpent_general_reveal must be APPROVED_EXISTING MICRO.', errors);
  assert(approved.get('lion_champion_reveal')?.tier === 'MICRO', 'lion_champion_reveal must be APPROVED_EXISTING MICRO.', errors);
  assert(census.cinematics.some((entry) => entry.identity === 'state:serpent_pursuit:ending' && entry.priority === 'P0'), 'Serpent finale ending is not P0-covered.', errors);
  assert(census.cinematics.some((entry) => entry.identity === 'state:lion_trial:ending' && entry.priority === 'P0'), 'Lion Trial ending is not P0-covered.', errors);

  const accounting = census.priorityAccounting;
  assert(arrayEqual(accounting?.primaryMediaCoverages ?? [], PRIMARY_MEDIA_COVERAGES), 'Priority accounting must define UNIQUE, STATE_VARIANT, and APPROVED_EXISTING as the primary media coverages.', errors);
  assert(accounting?.reuseFamilyTargetKind === 'REUSE_FAMILY', 'Priority accounting must name reuse-family targets REUSE_FAMILY.', errors);
  assert(new Set(census.productionBatches.map((batch) => batch.id)).size === census.productionBatches.length, 'Duplicate production batch ID.', errors);
  for (const batch of census.productionBatches) {
    assert(PRIORITIES.has(batch.priority), `${batch.id}: invalid production batch priority '${batch.priority}'.`, errors);
    for (const item of batch.targets) {
      assert(validTargets.has(item.target), `${batch.id}: target '${item.target}' does not resolve.`, errors);
      assert(ORDERED_TARGET_KINDS.has(item.targetKind), `${batch.id}: target '${item.target}' has invalid targetKind '${item.targetKind}'.`, errors);
      const details = targetAccountingDetails(census, item.target);
      assert(details?.targetKind === item.targetKind, `${batch.id}: target '${item.target}' must be marked ${details?.targetKind ?? '<unresolved>'}, not '${item.targetKind}'.`, errors);
      assert(details?.priority === batch.priority, `${batch.id}: target '${item.target}' priority differs from batch ${batch.priority}.`, errors);
      if (item.targetKind === 'REUSE_FAMILY') {
        assert(details?.mediaStrategy === 'OWN_VIDEO', `${batch.id}: REUSE_FAMILY target '${item.target}' must resolve to an OWN_VIDEO family.`, errors);
      }
    }
  }
  for (const priority of PRIORITIES) {
    const primaryEntries = census.cinematics.filter((entry) => entry.priority === priority && PRIMARY_MEDIA_COVERAGE_SET.has(entry.coverage));
    const stateVariantAdditionalTargets = primaryEntries
      .filter((entry) => entry.coverage === 'STATE_VARIANT')
      .reduce((total, entry) => total + Math.max(0, (entry.variants ?? []).length - 1), 0);
    const reuseFamilyTargets = census.reuseFamilies.filter((family) => family.priority === priority && family.mediaStrategy === 'OWN_VIDEO').length;
    const expectedTargets = expectedOrderedTargets(census, priority);
    const actualTargets = census.productionBatches
      .filter((batch) => batch.priority === priority)
      .flatMap((batch) => batch.targets.map((item) => item.target));
    const composition = accounting?.orderedTargetComposition?.[priority];
    assert(accounting?.prioritizedPrimaryMediaEntries?.[priority] === primaryEntries.length, `${priority}: prioritized primary media entry count mismatch; derived ${primaryEntries.length}.`, errors);
    assert(accounting?.orderedTargetsIncludingReuse?.[priority] === actualTargets.length, `${priority}: ordered target count including reuse mismatch; derived ${actualTargets.length}.`, errors);
    assert(composition?.primaryMediaEntries === primaryEntries.length, `${priority}: primary-media composition count mismatch.`, errors);
    assert(composition?.stateVariantAdditionalTargets === stateVariantAdditionalTargets, `${priority}: state-variant expansion count mismatch.`, errors);
    assert(composition?.reuseFamilyTargets === reuseFamilyTargets, `${priority}: reuse-family target count mismatch.`, errors);
    assert(composition?.totalTargets === expectedTargets.length, `${priority}: composed ordered-target total mismatch.`, errors);
    assert(primaryEntries.length + stateVariantAdditionalTargets + reuseFamilyTargets === expectedTargets.length, `${priority}: ordered-target accounting formula is inconsistent.`, errors);
    assert(new Set(actualTargets).size === actualTargets.length, `${priority}: duplicate ordered production target.`, errors);
    assert(arrayEqual(sortedUnique(actualTargets), sortedUnique(expectedTargets)), `${priority}: ordered production targets must contain exactly the expanded primary entries and OWN_VIDEO reuse families.`, errors);
  }
  const pathNodes = census.goldenPath.nodeSequence;
  for (let index = 0; index < pathNodes.length - 1; index += 1) {
    const current = truth.nodes.find((node) => node.id === pathNodes[index]);
    assert(current?.links.includes(pathNodes[index + 1]), `Golden path transition ${pathNodes[index]} -> ${pathNodes[index + 1]} is unreachable.`, errors);
  }
  for (const target of census.goldenPath.p0Targets) {
    assert(validTargets.has(target), `Golden path target '${target}' does not resolve.`, errors);
    if (target.startsWith('family:')) {
      assert(census.reuseFamilies.find((family) => `family:${family.id}` === target)?.priority === 'P0', `Golden path family '${target}' is not P0.`, errors);
    } else {
      const direct = census.cinematics.find((entry) => entry.identity === target);
      const parent = census.cinematics.find((entry) => (entry.variants ?? []).some((variant) => variant.identity === target));
      assert((direct ?? parent)?.priority === 'P0', `Golden path target '${target}' is not P0.`, errors);
    }
  }
  assert(census.goldenPath.p0VideoCount === census.goldenPath.p0Targets.length, 'Golden path video count differs from target list.', errors);

  assert(census.characterAssets.length === 52 && new Set(census.characterAssets).size === 52, 'Canonical character inventory must contain 52 unique IDs.', errors);
  for (const id of census.characterAssets) assert(existsSync(resolve(projectRoot, census.canonicalCharacterRoot, `${id}.png`)), `Canonical character inventory path missing for ${id}.`, errors);
  assert(census.environmentAssets.length === 22 && new Set(census.environmentAssets).size === 22, 'Lion environment inventory must contain 22 unique files.', errors);
  for (const path of census.environmentAssets) assert(existsSync(resolve(projectRoot, path)), `Environment inventory path missing: ${path}.`, errors);
  for (const gap of census.assetGaps) assert(['BLOCKING_P0', 'BLOCKING_P1', 'OPTIONAL'].includes(gap.blockingSeverity), `Asset gap has invalid severity for ${gap.cinematic}.`, errors);

  const mediaIds = new Set(census.currentApprovedMedia.map((entry) => entry.runtimeId));
  assert(arrayEqual([...mediaIds].sort(), ['lion_champion_reveal', 'lion_judgement', 'serpent_general_reveal']), 'Approved media set is incorrect.', errors);
  let approvedSeconds = 0;
  let approvedBytes = 0;
  for (const media of census.currentApprovedMedia) {
    const path = resolve(projectRoot, media.path);
    assert(existsSync(path), `Approved media is missing: ${media.path}.`, errors);
    if (existsSync(path)) {
      assert(statSync(path).size === media.bytes, `${media.runtimeId}: byte size changed.`, errors);
      assert(sha256(path) === media.sha256, `${media.runtimeId}: SHA-256 changed.`, errors);
    }
    approvedSeconds += media.durationSeconds;
    approvedBytes += media.bytes;
  }
  const productionVideoFiles = readdirSync(resolve(projectRoot, 'public/assets/cinematics'))
    .filter((name) => /\.(?:mp4|webm|mov)$/i.test(name))
    .sort();
  const plannedVideoFiles = new Set(plannedProductionVideoFiles(census));
  const unplannedVideoFiles = productionVideoFiles.filter((name) => !plannedVideoFiles.has(name));
  assert(unplannedVideoFiles.length === 0, `Unplanned production video files: ${unplannedVideoFiles.join(', ')}.`, errors);

  const p0NewSeconds = mediaSecondsFor(census, 'P0');
  const p1NewSeconds = mediaSecondsFor(census, 'P1');
  const p2NewSeconds = mediaSecondsFor(census, 'P2');
  const bps = approvedBytes / approvedSeconds;
  assert(approvedSeconds === census.mediaProjection.currentApprovedSeconds, 'Current approved seconds projection mismatch.', errors);
  assert(approvedBytes === census.mediaProjection.currentApprovedBytes, 'Current approved bytes projection mismatch.', errors);
  assert(Math.abs(bps - census.mediaProjection.empiricalBytesPerSecond) < 0.001, 'Empirical bytes/second mismatch.', errors);
  assert(p0NewSeconds === census.mediaProjection.p0NewSeconds, `P0 new seconds mismatch: derived ${p0NewSeconds}.`, errors);
  assert(p0NewSeconds + approvedSeconds === census.mediaProjection.p0TotalSeconds, 'P0 total seconds mismatch.', errors);
  assert(p0NewSeconds + p1NewSeconds + approvedSeconds === census.mediaProjection.p0P1TotalSeconds, 'P0+P1 seconds mismatch.', errors);
  assert(p0NewSeconds + p1NewSeconds + p2NewSeconds + approvedSeconds === census.mediaProjection.fullP0P1P2Seconds, 'Full projected seconds mismatch.', errors);
  assert(Math.round(census.mediaProjection.p0TotalSeconds * bps) === census.mediaProjection.p0ProjectedBytes, 'P0 projected bytes mismatch.', errors);
  assert(Math.round(census.mediaProjection.p0P1TotalSeconds * bps) === census.mediaProjection.p0P1ProjectedBytes, 'P0+P1 projected bytes mismatch.', errors);
  assert(Math.round(census.mediaProjection.fullP0P1P2Seconds * bps) === census.mediaProjection.fullProjectedBytes, 'Full projected bytes mismatch.', errors);

  const triggerSource = readFileSync(resolve(projectRoot, 'src/cinematics/CinematicTriggers.ts'), 'utf8');
  assert(/lion_finale_judgement: 'lion_judgement'/.test(triggerSource), 'Production beforeDialogue trigger changed.', errors);
  assert(/serpent_captain: 'serpent_general_reveal'/.test(triggerSource) && /lion_chief: 'lion_champion_reveal'/.test(triggerSource), 'Production beforeCombat triggers changed.', errors);
  assert(/afterCombat: Object\.freeze\(\{\}\)/.test(triggerSource) && /chapterBeat: Object\.freeze\(\{\}\)/.test(triggerSource), 'Production afterCombat/chapterBeat registry is not empty.', errors);
  const journeySource = readFileSync(resolve(projectRoot, 'src/journey/JourneyPresentationResolver.ts'), 'utf8');
  const journeyMapRegion = between(
    journeySource,
    'export const JOURNEY_PRESENTATION_MAP',
    '});',
  );
  const actualJourneyMappings = [...journeyMapRegion.matchAll(/\[nodeArrivalKey\('([^']+)'\)\]: '([^']+)'/g)]
    .map((match) => `${match[1]}=${match[2]}`)
    .sort();
  const expectedJourneyMappings = [
    'lion-camp=camp_departure',
    'lion-refugees=refugees_approach',
    'lion-valmir-road=valmir_route_fork',
    'lion-witnesses=witnesses_encounter',
  ].sort();
  assert(
    arrayEqual(actualJourneyMappings, expectedJourneyMappings),
    `Journey production map differs from the reviewed CIN-6A allowlist: ${actualJourneyMappings.join(', ') || '<empty>'}.`,
    errors,
  );

  return { ok: errors.length === 0, errors, summary: summaryFor(census) };
}

function main() {
  const result = validateCampaignCinematicCensus();
  if (!result.ok) {
    console.error('CIN-5 campaign cinematic census: FAIL');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('CIN-5 campaign cinematic census: PASS');
  console.log(JSON.stringify(result.summary, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
