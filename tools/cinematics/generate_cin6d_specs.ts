import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { combatConfigs } from '../../src/game/content';
import { createNarrativeStagingAudit } from '../../src/cinematics/NarrativeStagingAudit';
import { NARRATIVE_TEXT_REDUCTIONS } from '../../src/cinematics/NarrativeDialogueAdapter';
import { generateRunGraph } from '../../src/game/runSystem';

const ROOT = process.cwd();
const SPEC_ROOT = resolve(ROOT, 'tools/cinematics/specs');

const BEAT_TAXONOMY = [
  'ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE', 'TRAVEL', 'THREAT',
  'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'REFUGE_ARRIVAL',
  'REFUGE_MANAGEMENT', 'REFUGE_DEPARTURE', 'REVELATION', 'JUDGEMENT', 'ENDING', 'EPILOGUE',
] as const;

const CONTENT_VARIANTS: Record<string, string[]> = {
  'lion-camp': ['camp_departure'],
  'lion-audience': ['lion_briefing'],
  'lion-opening-ambush': ['forest_ambush', 'wolf_pack'],
  'lion-nomad-crossroads': ['mystery_recruit'],
  'lion-refugees': ['refugee_trial'],
  'lion-first-trial-event': ['mystery_help', 'mystery_treasure'],
  'lion-first-trial-combat': ['spider_nest', 'forest_patrol', 'serpent_reprisals'],
  'lion-first-refuge': ['forest_refuge'],
  'lion-reserve-trail': ['reserve_trail'],
  'lion-valmir-road': ['road_to_valmir', 'marsh_crossing'],
  'lion-second-trial-event': ['old_shrine_event'],
  'lion-second-trial-combat': ['troll_crossing', 'serpent_checkpoint', 'serpent_duelist_trial'],
  'lion-village-choice': ['village_choice'],
  'lion-second-refuge': ['forest_refuge'],
  'lion-lancer-recruit': ['mystery_lancer_recruit'],
  'lion-witnesses': ['witnesses_on_road'],
  'lion-final-trial-event': ['mystery_dragon_roost', 'mystery_shrine', 'serpent_informant'],
  'lion-final-trial-combat': ['ruins_guardians', 'serpent_hunters'],
  'lion-shadow-signs': ['shadow_signs'],
  'lion-final-refuge': ['final_refuge'],
  'lion-final-judgement': ['lion_finale_judgement'],
};

const CONDITIONS: Record<string, string[]> = {
  'lion-opening-ambush': ['seed selects forest_ambush or wolf_pack'],
  'lion-first-trial-event': ['Lion conduct and audience mandate select help or abandoned-cart truth'],
  'lion-first-trial-combat': ['Lion conduct and audience mandate select spider, patrol or reprisals truth'],
  'lion-valmir-road': ['seed selects road_to_valmir or marsh_crossing'],
  'lion-second-trial-combat': ['Lion conduct and audience mandate select troll, checkpoint or duelist truth'],
  'lion-final-trial-event': ['Lion conduct and prior elite completion select dragon, shrine or informant truth'],
  'lion-final-trial-combat': ['Lion conduct selects ruins guardians or Serpent hunters truth'],
  'lion-final-judgement': ['derived Lion verdict and player judgement choice select Serpent or Lion Trial finale'],
};

const LOCATION: Record<string, string> = {
  'lion-camp': 'Lion camp', 'lion-audience': 'Alaric audience chamber',
  'lion-opening-ambush': 'forest road', 'lion-nomad-crossroads': 'forest crossroads',
  'lion-refugees': 'refugee road', 'lion-first-trial-event': 'first trial road',
  'lion-first-trial-combat': 'contested forest path', 'lion-first-refuge': 'first Lion refuge',
  'lion-reserve-trail': 'reserve trail', 'lion-valmir-road': 'Valmir road fork',
  'lion-second-trial-event': 'old shrine', 'lion-second-trial-combat': 'Bois-Clair approach',
  'lion-village-choice': 'Bois-Clair', 'lion-second-refuge': 'second Lion refuge',
  'lion-lancer-recruit': 'road outside Bois-Clair', 'lion-witnesses': 'witness road',
  'lion-final-trial-event': 'last trial site', 'lion-final-trial-combat': 'Shadow ruins approach',
  'lion-shadow-signs': 'Shadow ruins', 'lion-final-refuge': 'final refuge',
  'lion-final-judgement': 'Lion judgement hall and final battlefield',
};

const BEATS: Record<string, string[]> = {
  'lion-camp': ['DEPARTURE', 'DIALOGUE', 'TRAVEL'],
  'lion-audience': ['ARRIVAL', 'DIALOGUE', 'DECISION', 'DEPARTURE', 'TRAVEL'],
  'lion-opening-ambush': ['THREAT', 'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'DEPARTURE'],
  'lion-nomad-crossroads': ['ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE'],
  'lion-refugees': ['ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE'],
  'lion-first-trial-event': ['ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'AFTERMATH', 'DEPARTURE'],
  'lion-first-trial-combat': ['ARRIVAL', 'THREAT', 'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'DEPARTURE'],
  'lion-first-refuge': ['REFUGE_ARRIVAL', 'REFUGE_MANAGEMENT', 'REFUGE_DEPARTURE'],
  'lion-reserve-trail': ['TRAVEL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE'],
  'lion-valmir-road': ['TRAVEL', 'THREAT', 'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'DECISION'],
  'lion-second-trial-event': ['ARRIVAL', 'REVELATION', 'DIALOGUE', 'DECISION', 'DEPARTURE'],
  'lion-second-trial-combat': ['ARRIVAL', 'THREAT', 'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'DEPARTURE'],
  'lion-village-choice': ['ARRIVAL', 'DIALOGUE', 'DECISION', 'COMBAT', 'POST_COMBAT', 'AFTERMATH'],
  'lion-second-refuge': ['REFUGE_ARRIVAL', 'REFUGE_MANAGEMENT', 'REFUGE_DEPARTURE'],
  'lion-lancer-recruit': ['ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE'],
  'lion-witnesses': ['ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE'],
  'lion-final-trial-event': ['ARRIVAL', 'ENCOUNTER', 'REVELATION', 'DIALOGUE', 'DECISION', 'AFTERMATH', 'DEPARTURE'],
  'lion-final-trial-combat': ['ARRIVAL', 'THREAT', 'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'DEPARTURE'],
  'lion-shadow-signs': ['ARRIVAL', 'REVELATION', 'DIALOGUE', 'DEPARTURE'],
  'lion-final-refuge': ['REFUGE_ARRIVAL', 'DIALOGUE', 'REFUGE_DEPARTURE'],
  'lion-final-judgement': ['ARRIVAL', 'JUDGEMENT', 'DIALOGUE', 'DECISION', 'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'ENDING', 'EPILOGUE'],
};

const MEDIA_BY_NODE: Record<string, string[]> = {
  'lion-camp': ['camp_departure'], 'lion-audience': ['alaric_audience_arrival'],
  'lion-opening-ambush': ['forest_journey_tension'], 'lion-nomad-crossroads': ['cedric_encounter'],
  'lion-refugees': ['refugees_approach'], 'lion-first-refuge': ['first_refuge_arrival', 'first_refuge_departure'],
  'lion-valmir-road': ['valmir_route_fork'], 'lion-village-choice': ['bois_clair_arrival', 'bois_clair_saved', 'bois_clair_sacrificed'],
  'lion-second-refuge': ['second_refuge_departure'], 'lion-lancer-recruit': ['garen_encounter'],
  'lion-witnesses': ['witnesses_encounter'], 'lion-shadow-signs': ['shadow_signs'],
  'lion-final-refuge': ['final_refuge_dossier'],
  'lion-final-judgement': ['lion_judgement', 'serpent_general_reveal', 'lion_champion_reveal', 'serpent_route_ending', 'lion_trial_route_ending'],
};

const NEW_MEDIA_BEATS = [{
  runtimeId: 'audience_road_departure',
  narrativeBeat: 'DEPARTURE/TRAVEL',
  nodeContent: 'edge:lion-audience>lion-opening-ambush',
  location: 'forest road outside Alaric audience',
  cast: ['sage_seraphine', 'alistair', 'maelor'],
  hero: 'alistair',
  advisers: ['sage_seraphine', 'maelor'],
  externalCast: [],
  textBefore: 'lion_briefing mission decision',
  textDuring: 'none; single Continue agency only',
  textAfter: 'pre_opening_trail',
  entryState: 'audience resolved; chosen mission truth already applied',
  exitState: 'company visibly travelling; opening threat may begin',
  visualClassification: 'NEW_MEDIA_REQUIRED',
  narrativeCorrect: true,
  needsRemaster: false,
  needsNewMedia: true,
  reason: 'The audience chamber must be released before forest threat; CIN-6D supplies AUDIENCE_ROAD_DEPARTURE_TABLEAU.',
  qualityReference: 'camp_departure',
  priority: 'P0',
}];

function dialoguesFor(contentIds: string[]): string[] {
  const ids: string[] = [];
  for (const contentId of contentIds) {
    const combat = combatConfigs.get(contentId);
    if (combat?.preCombatDialogueId) ids.push(combat.preCombatDialogueId);
    if (combat?.postCombatDialogueId) ids.push(combat.postCombatDialogueId);
    if (!combat && contentId !== 'forest_refuge') ids.push(contentId);
  }
  return [...new Set(ids)];
}

const graph = generateRunGraph(6100);
const timelineNodes = graph.nodes.map((node) => {
  const variants = CONTENT_VARIANTS[node.id] ?? [node.contentId];
  return {
    nodeId: node.id,
    depth: node.depth,
    nodeType: node.type,
    authoritativeConditions: CONDITIONS[node.id] ?? ['RunSystem node reachability and canonical content effects'],
    contentIds: variants,
    beatKinds: BEATS[node.id],
    location: LOCATION[node.id],
    castDirection: {
      hero: 'alistair', advisers: ['sage_seraphine', 'maelor'],
      externalCast: node.id === 'lion-audience' ? ['alaric'] : [],
      rule: 'Video owns moving cast; static tableau owns enlarged canonical sprites facing the current situation.',
    },
    cinematicIds: MEDIA_BY_NODE[node.id] ?? [],
    staticFallback: node.id === 'lion-audience'
      ? 'AUDIENCE_ROAD_DEPARTURE_TABLEAU on edge:lion-audience>lion-opening-ambush'
      : 'current-context generic NarrativeStage tableau when no reviewed media maps',
    dialogueIds: dialoguesFor(variants),
    speakerRule: 'Canonical dialogue actorId; advisers carry most field exposition; every speaker is staged or explicitly justified offscreen.',
    choiceRule: 'Canonical choice ids, order, effects and consequences remain owned by dialogue/game truth.',
    combatIds: variants.filter((id) => combatConfigs.has(id)),
    entry: BEATS[node.id]?.[0],
    exit: BEATS[node.id]?.at(-1),
    nextNodeIds: node.links,
    releaseRule: 'Release the current hold before a change of place, time, activity, objective or encounter.',
    needsNewMediaCin6e: node.id === 'lion-audience',
  };
});

const edges = graph.nodes.flatMap((node) => node.links.map((target) => ({
  edgeId: `${node.id}>${target}`,
  fromNodeId: node.id,
  toNodeId: target,
  samePlace: false,
  sameTime: true,
  sameActivity: false,
  sameObjective: false,
  sameEncounter: false,
  requiresExplicitPresentation: true,
  presentation: node.id === 'lion-audience'
    ? 'AUDIENCE_ROAD_DEPARTURE_TABLEAU'
    : 'mapped cinematic or current-context NarrativeStage static boundary',
  stalePriorHoldAllowed: false,
})));

const continuity = {
  schemaVersion: 1,
  baseline: '84eb25a19fc1fad4ad77f4db5a1ac85d3fd0cb5a',
  sourceOfTruth: ['RunSystem', 'content.ts', 'dialogue definitions', 'combat definitions', 'derived Lion narrative state'],
  presentationOnly: true,
  beatTaxonomy: BEAT_TAXONOMY,
  summary: { nodes: timelineNodes.length, edges: edges.length, maxDepth: Math.max(...graph.nodes.map((node) => node.depth)) },
  nodes: timelineNodes,
  edges,
};

const staging = createNarrativeStagingAudit();
const reductionByStep = new Map(NARRATIVE_TEXT_REDUCTIONS.map((entry) => [`${entry.dialogueId}:${entry.stepId}`, entry]));
const dialogueEntries = staging.entries.map((entry) => ({
  dialogueId: entry.dialogueId,
  contexts: entry.reachableContexts,
  classifications: entry.steps.map((step) => {
    const key = `${entry.dialogueId}:${step.stepId}`;
    const reduction = reductionByStep.get(key);
    return {
      stepId: step.stepId,
      classification: reduction ? 'POLISH' : 'KEEP',
      intent: reduction?.rationale ?? 'Canonical line remains coherent in every audited reachable context.',
      ...(reduction ? { displayText: reduction.displayText, canonicalTextPreserved: true } : {}),
    };
  }),
}));
const dialogueCounts = dialogueEntries.flatMap((entry) => entry.classifications).reduce<Record<string, number>>((counts, entry) => {
  counts[entry.classification] = (counts[entry.classification] ?? 0) + 1;
  return counts;
}, {});
const dialogueQuality = {
  schemaVersion: 1,
  source: 'canonical dialogue registry plus NarrativeStagingAudit reachable contexts',
  classificationVocabulary: ['KEEP', 'POLISH', 'MOVE', 'CONDITIONALIZE', 'CHANGE_SPEAKER', 'REMOVE_REDUNDANT_LINE', 'ADD_TRANSITION_LINE', 'PRESENTATION_FIX_ONLY', 'CONTENT_BUG', 'REVIEW'],
  summary: {
    dialogues: staging.summary.totalReachableDialogues,
    steps: staging.summary.totalDialogueSteps,
    actionableChoiceStates: staging.summary.choiceSteps,
    ...Object.fromEntries(['KEEP', 'POLISH', 'MOVE', 'CONDITIONALIZE', 'CHANGE_SPEAKER', 'REMOVE_REDUNDANT_LINE', 'ADD_TRANSITION_LINE', 'PRESENTATION_FIX_ONLY', 'CONTENT_BUG', 'REVIEW'].map((key) => [key, dialogueCounts[key] ?? 0])),
  },
  exactPolish: NARRATIVE_TEXT_REDUCTIONS.map((entry) => ({ ...entry, canonicalTextPreserved: true })),
  entries: dialogueEntries,
};

const manifest = JSON.parse(await readFile(resolve(ROOT, 'public/assets/cinematics/manifest.json'), 'utf8'));
const visualAudit = JSON.parse(await readFile(resolve(SPEC_ROOT, 'cinematic_visual_polish_audit.json'), 'utf8'));
const census = JSON.parse(await readFile(resolve(SPEC_ROOT, 'campaign_cinematic_census.json'), 'utf8'));
const visualById = new Map(visualAudit.entries.map((entry: any) => [entry.runtimeId, entry]));
const censusById = new Map(census.cinematics.filter((entry: any) => entry.runtimeId).map((entry: any) => [entry.runtimeId, entry]));
const classificationMap: Record<string, string> = { KEEP: 'KEEP_AS_IS', REMASTER: 'REMASTER_VISUAL', REPLACE_WITH_FAMILY: 'REPLACE_BY_REUSE' };
const existingMedia = manifest.cinematics.filter((entry: any) => !entry.placeholderOnly).map((entry: any) => {
  const visual: any = visualById.get(entry.id);
  const plan: any = censusById.get(entry.id);
  const classification = classificationMap[visual?.classification] ?? 'REVIEW';
  return {
    runtimeId: entry.id,
    currentHash: visual?.sha256 ?? null,
    currentDuration: (entry.durationMs ?? 0) / 1000,
    narrativeBeat: plan?.campaignBeat ?? entry.title,
    nodeContent: [...(plan?.sourceNodeIds ?? []), ...(plan?.contentIds ?? [])],
    location: plan?.environment ?? null,
    cast: plan?.characters ?? [],
    hero: (plan?.characters ?? []).includes('alistair') ? 'alistair' : null,
    advisers: (plan?.characters ?? []).filter((id: string) => id === 'sage_seraphine' || id === 'maelor'),
    externalCast: (plan?.characters ?? []).filter((id: string) => !['alistair', 'sage_seraphine', 'maelor', 'marian', 'elara', 'kestrel'].includes(id)),
    textBefore: plan?.narrativePurpose ?? entry.fallbackText ?? null,
    textDuring: 'NarrativeStage staging audit owns any dialogue presentation.',
    textAfter: plan?.agencyAfter ?? null,
    entryState: plan?.stateConditions ?? [],
    exitState: plan?.agencyAfter ?? 'continue',
    visualClassification: classification,
    narrativeCorrect: true,
    needsRemaster: classification === 'REMASTER_VISUAL' || classification === 'REPLACE_BY_REUSE',
    needsNewMedia: false,
    reason: visual?.recommendedAction ?? 'Manual review required.',
    qualityReference: ['alaric_audience_arrival', 'camp_departure', 'valmir_route_fork'].includes(entry.id) ? entry.id : 'INTEGRATED_KEYFRAME_V3',
    priority: visual?.severity === 'HIGH' ? 'P0' : visual?.severity === 'MEDIUM' ? 'P1' : 'P2',
  };
});
const allMedia = [...existingMedia, ...NEW_MEDIA_BEATS];
const mediaCounts = allMedia.reduce<Record<string, number>>((counts, entry) => {
  counts[entry.visualClassification] = (counts[entry.visualClassification] ?? 0) + 1;
  return counts;
}, {});
const remasterQueue = {
  schemaVersion: 1,
  policy: 'PLAN_ONLY_NO_MEDIA_GENERATION',
  baseline: '84eb25a19fc1fad4ad77f4db5a1ac85d3fd0cb5a',
  goldReferences: ['alaric_audience_arrival', 'camp_departure', 'valmir_route_fork'],
  classificationVocabulary: ['KEEP_AS_IS', 'REMASTER_VISUAL', 'TRIM_OR_REASSEMBLE', 'PRESENTATION_FIX_ONLY', 'REMOVE_FROM_RUNTIME', 'REPLACE_BY_REUSE', 'REVIEW', 'NEW_MEDIA_REQUIRED'],
  summary: Object.fromEntries(['KEEP_AS_IS', 'REMASTER_VISUAL', 'TRIM_OR_REASSEMBLE', 'PRESENTATION_FIX_ONLY', 'REMOVE_FROM_RUNTIME', 'REPLACE_BY_REUSE', 'REVIEW', 'NEW_MEDIA_REQUIRED'].map((key) => [key, mediaCounts[key] ?? 0])),
  existingProductionMasters: existingMedia,
  missingRequiredMedia: NEW_MEDIA_BEATS,
};

await writeFile(resolve(SPEC_ROOT, 'final_narrative_continuity.json'), `${JSON.stringify(continuity, null, 2)}\n`);
await writeFile(resolve(SPEC_ROOT, 'final_dialogue_quality_audit.json'), `${JSON.stringify(dialogueQuality, null, 2)}\n`);
await writeFile(resolve(SPEC_ROOT, 'final_cinematic_remaster_queue.json'), `${JSON.stringify(remasterQueue, null, 2)}\n`);

console.log(JSON.stringify({
  continuity: continuity.summary,
  dialogue: dialogueQuality.summary,
  media: remasterQueue.summary,
}, null, 2));
