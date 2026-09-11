import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createNarrativeStagingAudit } from '../../src/cinematics/NarrativeStagingAudit';
import { resolveNarrativeDialogueTableau } from '../../src/cinematics/NarrativeTableau';
import { combatConfigs, dialogues, POST_NODE_ATE } from '../../src/game/content';
import { generateRunGraph } from '../../src/game/runSystem';
import { resolveDialogueBackdrop } from '../../src/ui/DialogueView';

const ROOT = process.cwd();
const SPEC_ROOT = resolve(ROOT, 'tools/cinematics/specs');
const REPORT_ROOT = resolve(ROOT, 'docs/reports');
const BASELINE = '71e2132970ed77fc957e00966681657f4e6e2b2a';

const MODES = [
  'CINEMATIC_VIDEO',
  'CINEMATIC_HOLD',
  'TRAVEL_STILL',
  'STATIC_TABLEAU',
  'COMBAT',
  'GAMEPLAY_UI',
] as const;
type PresentationMode = typeof MODES[number];

type Beat = {
  beatId: string;
  nodeId: string | null;
  edgeId: string | null;
  contentId: string | null;
  dialogueId: string | null;
  combatId: string | null;
  beatKind: string;
  currentPresentation: string;
  targetPresentationMode: PresentationMode;
  currentAsset: string | string[] | null;
  targetAssetRole: string;
  location: string;
  timeContext: string;
  activity: string;
  cast: string[];
  speakerOwnership: string;
  heroRepresentation: 'HERO_REQUIRED' | 'HERO_OPTIONAL' | 'HERO_NOT_APPROPRIATE';
  advisers: string[];
  externalCast: string[];
  hasDialogue: boolean;
  hasChoice: boolean;
  hasCombat: boolean;
  previousBeat: string;
  nextBeat: string;
  contextContinuity: string;
  holdAllowed: boolean;
  reason: string;
  currentIssue: string;
  futureMediaAction: string;
  priority: 'P0' | 'P1' | 'P2';
  disposition: string[];
  visualFamily: string;
};

const COMPANY = new Set(['alistair', 'sage_seraphine', 'maelor', 'marian', 'kestrel', 'elara', 'cedric', 'lancer']);
const ADVISERS = new Set(['sage_seraphine', 'maelor']);

const NODE_LOCATION: Record<string, string> = {
  'lion-camp': 'Lion camp',
  'lion-audience': 'Alaric audience chamber',
  'lion-opening-ambush': 'forest road',
  'lion-nomad-crossroads': 'forest crossroads',
  'lion-refugees': 'refugee road',
  'lion-first-trial-event': 'first trial road',
  'lion-first-trial-combat': 'contested forest path',
  'lion-first-refuge': 'first Lion refuge',
  'lion-reserve-trail': 'reserve trail',
  'lion-valmir-road': 'Valmir road fork',
  'lion-second-trial-event': 'old shrine',
  'lion-second-trial-combat': 'Bois-Clair approach',
  'lion-village-choice': 'Bois-Clair',
  'lion-second-refuge': 'second Lion refuge',
  'lion-lancer-recruit': 'road outside Bois-Clair',
  'lion-witnesses': 'witness road',
  'lion-final-trial-event': 'last trial site',
  'lion-final-trial-combat': 'Shadow ruins approach',
  'lion-shadow-signs': 'Shadow ruins',
  'lion-final-refuge': 'final refuge',
  'lion-final-judgement': 'Lion judgement hall and final battlefields',
};

const NODE_FAMILY: Record<string, string> = {
  'lion-camp': 'LION_CAMP',
  'lion-audience': 'ALARIC_AUDIENCE',
  'lion-opening-ambush': 'FOREST_ROAD',
  'lion-nomad-crossroads': 'FOREST_ROAD',
  'lion-refugees': 'FOREST_ROAD',
  'lion-first-trial-event': 'FOREST_ROAD',
  'lion-first-trial-combat': 'FOREST_ROAD',
  'lion-first-refuge': 'FIRST_REFUGE',
  'lion-reserve-trail': 'VALMIR_ROAD',
  'lion-valmir-road': 'VALMIR_ROAD',
  'lion-second-trial-event': 'VALMIR_ROAD',
  'lion-second-trial-combat': 'VALMIR_ROAD',
  'lion-village-choice': 'BOIS_CLAIR',
  'lion-second-refuge': 'SECOND_REFUGE',
  'lion-lancer-recruit': 'SECOND_REFUGE',
  'lion-witnesses': 'WITNESS_ROAD',
  'lion-final-trial-event': 'SHADOW_RUINS',
  'lion-final-trial-combat': 'SHADOW_RUINS',
  'lion-shadow-signs': 'SHADOW_RUINS',
  'lion-final-refuge': 'FINAL_REFUGE',
  'lion-final-judgement': 'LION_JUDGEMENT',
};

const COMBAT_NODE: Record<string, string> = {
  village_defense: 'lion-village-choice',
  village_raid: 'lion-village-choice',
  forest_patrol: 'lion-first-trial-combat',
  forest_ambush: 'lion-opening-ambush',
  wolf_pack: 'lion-opening-ambush',
  spider_nest: 'lion-first-trial-combat',
  marsh_crossing: 'lion-valmir-road',
  serpent_reprisals: 'lion-first-trial-combat',
  serpent_checkpoint: 'lion-second-trial-combat',
  road_to_valmir: 'lion-valmir-road',
  ruins_guardians: 'lion-final-trial-combat',
  serpent_hunters: 'lion-final-trial-combat',
  serpent_duelist_trial: 'lion-second-trial-combat',
  troll_crossing: 'lion-second-trial-combat',
  young_dragon_roost: 'lion-final-trial-event',
  serpent_captain: 'lion-final-judgement',
  lion_chief: 'lion-final-judgement',
};

const POOL_DIALOGUE_NODE: Record<string, string> = {
  mystery_ambush: 'lion-first-trial-combat',
  mystery_lancer_recruit: 'lion-lancer-recruit',
  mystery_shrine: 'lion-final-trial-event',
  mystery_treasure: 'lion-first-trial-event',
  mystery_troll_crossing: 'lion-second-trial-combat',
  serpent_duelist_trial: 'lion-second-trial-combat',
  serpent_informant: 'lion-final-trial-event',
};

const DIALOGUE_VIDEO: Record<string, string | string[]> = {
  lion_briefing: 'alaric_audience_arrival',
  village_choice: 'bois_clair_arrival',
  shadow_signs: 'shadow_signs',
  final_refuge: 'final_refuge_dossier',
  lion_finale_judgement: 'lion_judgement',
  pre_opening_trail: 'forest_journey_tension',
  mystery_recruit: 'cedric_encounter',
  mystery_lancer_recruit: 'garen_encounter',
  mystery_help: 'injured_merchant_encounter',
  mystery_treasure: 'abandoned_cart_reveal',
  old_shrine_event: 'shrine_reveal_context',
  mystery_shrine: 'shrine_reveal_context',
  mystery_dragon_roost: 'young_dragon_encounter',
  serpent_informant: 'serpent_informant_encounter',
  pre_spider_nest: 'spider_nest_reveal',
  pre_troll_crossing: 'troll_crossing_reveal',
  pre_serpent_duelist_trial: 'serpent_duelist_reveal',
  pre_serpent_patrol: 'serpent_road_tension',
  pre_serpent_reprisals: 'serpent_road_tension',
  pre_serpent_checkpoint: 'serpent_road_tension',
  pre_serpent_hunters: 'serpent_road_tension',
  pre_ruins_guardians: 'ruins_approach_context',
  serpent_pursuit_pre_combat: 'serpent_general_reveal',
  pre_lion_chief: 'lion_champion_reveal',
};

const HOLD_DIALOGUES = new Set([
  'camp_departure',
  'epilogue',
  'lion_briefing',
  'lion_finale_judgement',
  'mystery_dragon_roost',
  'mystery_help',
  'mystery_shrine',
  'mystery_treasure',
  'old_shrine_event',
  'pre_lion_chief',
  'pre_opening_trail',
  'pre_ruins_guardians',
  'pre_serpent_checkpoint',
  'pre_serpent_duelist_trial',
  'pre_serpent_hunters',
  'pre_serpent_patrol',
  'pre_serpent_reprisals',
  'pre_spider_nest',
  'pre_troll_crossing',
  'serpent_informant',
  'serpent_pursuit_pre_combat',
  'village_choice',
]);

const REUSABLE_TABLEAU_BACKGROUNDS = new Set(['acte_ouverture', 'post_opening_trail']);

const MEDIA_TRAVEL_STILL = new Set(['first_refuge_departure', 'second_refuge_departure']);
const MEDIA_HOLD_PURPOSE: Record<string, string> = {
  lion_judgement: 'CHOICE',
  serpent_general_reveal: 'IMMEDIATE_DIALOGUE',
  lion_champion_reveal: 'IMMEDIATE_DIALOGUE',
  forest_journey_tension: 'IMMEDIATE_DIALOGUE',
  camp_departure: 'CONTINUE',
  alaric_audience_arrival: 'CHOICE',
  refugees_approach: 'ROUTE_DECISION',
  first_refuge_arrival: 'CONTINUE',
  valmir_route_fork: 'ROUTE_DECISION',
  bois_clair_arrival: 'CHOICE',
  bois_clair_saved: 'CONTINUE',
  bois_clair_sacrificed: 'CONTINUE',
  witnesses_encounter: 'ROUTE_DECISION',
  ruins_approach_context: 'IMMEDIATE_DIALOGUE',
  serpent_route_ending: 'IMMEDIATE_DIALOGUE',
  lion_trial_route_ending: 'IMMEDIATE_DIALOGUE',
  serpent_road_tension: 'IMMEDIATE_DIALOGUE',
  shrine_reveal_context: 'CHOICE',
  injured_merchant_encounter: 'CHOICE',
  abandoned_cart_reveal: 'CHOICE',
  spider_nest_reveal: 'IMMEDIATE_DIALOGUE',
  troll_crossing_reveal: 'IMMEDIATE_DIALOGUE',
  serpent_duelist_reveal: 'IMMEDIATE_DIALOGUE',
  young_dragon_encounter: 'CHOICE',
  serpent_informant_encounter: 'CHOICE',
};

const MEDIA_FAMILY: Record<string, string> = {
  lion_judgement: 'LION_JUDGEMENT',
  serpent_general_reveal: 'SERPENT_FINALE',
  lion_champion_reveal: 'LION_TRIAL',
  forest_journey_tension: 'FOREST_ROAD',
  camp_departure: 'LION_CAMP',
  alaric_audience_arrival: 'ALARIC_AUDIENCE',
  refugees_approach: 'FOREST_ROAD',
  first_refuge_arrival: 'FIRST_REFUGE',
  first_refuge_departure: 'FIRST_REFUGE',
  valmir_route_fork: 'VALMIR_ROAD',
  bois_clair_arrival: 'BOIS_CLAIR',
  bois_clair_saved: 'BOIS_CLAIR',
  bois_clair_sacrificed: 'BOIS_CLAIR',
  second_refuge_departure: 'SECOND_REFUGE',
  witnesses_encounter: 'WITNESS_ROAD',
  ruins_approach_context: 'SHADOW_RUINS',
  shadow_signs: 'SHADOW_RUINS',
  final_refuge_dossier: 'FINAL_REFUGE',
  serpent_route_ending: 'SERPENT_FINALE',
  lion_trial_route_ending: 'LION_TRIAL',
  cedric_encounter: 'FOREST_ROAD',
  garen_encounter: 'SECOND_REFUGE',
  serpent_road_tension: 'VALMIR_ROAD',
  shrine_reveal_context: 'SHADOW_RUINS',
  injured_merchant_encounter: 'FOREST_ROAD',
  abandoned_cart_reveal: 'FOREST_ROAD',
  spider_nest_reveal: 'FOREST_ROAD',
  troll_crossing_reveal: 'VALMIR_ROAD',
  serpent_duelist_reveal: 'VALMIR_ROAD',
  young_dragon_encounter: 'SHADOW_RUINS',
  serpent_informant_encounter: 'SHADOW_RUINS',
};

const TABLEAU_COMPANION_MEDIA = new Set([
  'refugees_approach',
  'bois_clair_saved',
  'bois_clair_sacrificed',
  'witnesses_encounter',
  'shadow_signs',
  'final_refuge_dossier',
  'cedric_encounter',
  'garen_encounter',
]);

const TRAVEL_STILLS = [
  { id: 'camp_to_audience', edgeIds: ['lion-camp>lion-audience'], family: 'LION_CAMP', environment: 'camp road toward Alaric', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'purposeful departure at dawn', livingStillCandidate: true, currentReuse: 'camp_departure as visual reference only' },
  { id: 'audience_road_departure', edgeIds: ['lion-audience>lion-opening-ambush'], family: 'FOREST_ROAD', environment: 'forest road outside the audience', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'quiet release from court tension', livingStillCandidate: true, currentReuse: 'AUDIENCE_ROAD_DEPARTURE_TABLEAU is a temporary semantic prototype' },
  { id: 'forest_road_after_opening', edgeIds: ['lion-opening-ambush>lion-nomad-crossroads'], family: 'FOREST_ROAD', environment: 'cleared forest road', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'breath after danger', livingStillCandidate: true, currentReuse: 'forest_fork backdrop may guide geography' },
  { id: 'crossroads_to_refugees', edgeIds: ['lion-nomad-crossroads>lion-refugees'], family: 'FOREST_ROAD', environment: 'crossroads becoming refugee road', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'forward motion with social stakes ahead', livingStillCandidate: false, currentReuse: 'forest road family may be reused after reframing' },
  { id: 'first_trial_to_refuge', edgeIds: ['lion-first-trial-event>lion-first-refuge', 'lion-first-trial-combat>lion-first-refuge'], family: 'FIRST_REFUGE', environment: 'approach to first palisade refuge', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'earned safety', livingStillCandidate: true, currentReuse: 'first_refuge_arrival supplies landmarks' },
  { id: 'first_refuge_departure', edgeIds: ['lion-first-refuge>lion-reserve-trail'], family: 'FIRST_REFUGE', environment: 'road leaving first refuge', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'measured return to the road', livingStillCandidate: true, currentReuse: 'replace current first_refuge_departure full video with a derived still role' },
  { id: 'reserve_to_valmir', edgeIds: ['lion-reserve-trail>lion-valmir-road'], family: 'VALMIR_ROAD', environment: 'reserve trail opening onto Valmir road', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'rising smoke and approaching division', livingStillCandidate: true, currentReuse: 'reserve_trail and valmir_route_fork guide continuity' },
  { id: 'second_trial_to_bois_clair', edgeIds: ['lion-second-trial-event>lion-village-choice', 'lion-second-trial-combat>lion-village-choice'], family: 'BOIS_CLAIR', environment: 'last ridge before Bois-Clair', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'urgent approach to visible fire', livingStillCandidate: true, currentReuse: 'bois_clair_arrival supplies landmarks and grade' },
  { id: 'bois_clair_to_second_refuge', edgeIds: ['lion-village-choice>lion-second-refuge'], family: 'BOIS_CLAIR', environment: 'road leaving the resolved village state', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'consequence carried forward', livingStillCandidate: false, currentReuse: 'outcome ending frames may be continuity references, never stale holds' },
  { id: 'second_refuge_departure', edgeIds: ['lion-second-refuge>lion-lancer-recruit'], family: 'SECOND_REFUGE', environment: 'road beyond second refuge', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'rested company returning to uncertainty', livingStillCandidate: true, currentReuse: 'replace current second_refuge_departure full video with a derived still role' },
  { id: 'garen_to_witness_road', edgeIds: ['lion-lancer-recruit>lion-witnesses'], family: 'WITNESS_ROAD', environment: 'open road toward the witnesses', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'company composition settled before testimony', livingStillCandidate: false, currentReuse: 'witnesses_encounter supplies road landmarks' },
  { id: 'final_trial_to_shadow', edgeIds: ['lion-final-trial-event>lion-shadow-signs', 'lion-final-trial-combat>lion-shadow-signs'], family: 'SHADOW_RUINS', environment: 'threshold of the Shadow ruins', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'quiet dread before revelation', livingStillCandidate: true, currentReuse: 'shadow_signs supplies palette and architecture' },
  { id: 'shadow_to_final_refuge', edgeIds: ['lion-shadow-signs>lion-final-refuge'], family: 'FINAL_REFUGE', environment: 'road from the ruins to the final refuge', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'evidence carried toward judgement', livingStillCandidate: true, currentReuse: 'final_refuge_dossier supplies destination landmarks' },
  { id: 'final_refuge_to_judgement', edgeIds: ['lion-final-refuge>lion-final-judgement'], family: 'LION_JUDGEMENT', environment: 'approach to the Lion judgement hall', party: ['alistair', 'sage_seraphine', 'maelor'], uiSafeZone: 'LOWER_RIGHT', mood: 'formal final approach', livingStillCandidate: false, currentReuse: 'lion_judgement supplies authority, palette and architecture' },
] as const;

const RUNTIME_REQUIREMENTS = [
  'Add an explicit semantic presentationMode field with the six audited values.',
  'Resolve presentation by player-facing beat identity instead of inferring role from media availability.',
  'Add a first-class TRAVEL_STILL surface for single-route and route-choice pacing boundaries.',
  'Allow TRAVEL_STILL assets to select STATIC_IMAGE or optional LIVING_STILL implementations without changing semantics.',
  'Reference or extract an approved exact final frame for every required CINEMATIC_HOLD.',
  'Enforce hold continuity and release on place, time, encounter, situation, or activity changes.',
  'Enforce VIDEO_OWNS_CAST and TABLEAU_OWNS_CAST so static sprites never duplicate integrated video characters.',
  'Separate STATIC_TABLEAU background identity from dialogue text, cast layers, and speaker emphasis.',
  'Attach visual-family metadata to video, hold, travel-still, and tableau-background roles.',
  'Make preload and fallback mode-aware, preserving agency and using the target mode rather than an arbitrary old scene.',
];

const VISUAL_PIPELINE_REQUIREMENTS = [
  'CINEMATIC_VIDEO: silent 1920x1080 H.264/yuv420p masters with meaningful motion or reveal and integrated cast.',
  'CINEMATIC_HOLD: lossless approved final-frame extraction or exact runtime frame reference with matching composition.',
  'TRAVEL_STILL: 16:9 cinematic establishing image, with an optional lightweight living-still derivative for approved ambient motion only.',
  'STATIC_TABLEAU_BACKGROUND: 16:9 character-free environment plate with ground plane, perspective, contact area and protected UI/face zones.',
  'All roles in one visual family must share palette, light, camera height, lens character, landmarks, atmosphere and time continuity.',
  'Tableau backgrounds must contain no baked party member or state-dependent actor.',
  'Every asset brief must record dialogue and choice safe zones plus speaker staging lanes.',
  'Lighting direction, temperature, horizon and scale must support canonical sprites without source alteration.',
];

const VISUAL_FAMILY_BASE = [
  ['LION_CAMP', ['lion-camp'], 'warm dawn and banked fire', 'dawn', 'wide low eye-level departure frame', ['Lion banners', 'camp palisade', 'mountain road']],
  ['ALARIC_AUDIENCE', ['lion-audience'], 'warm torchlight against deep Lion blue', 'interior timeless', 'formal symmetrical authority frame', ['central Lion banner', 'dais', 'torch rows']],
  ['FOREST_ROAD', ['lion-opening-ambush', 'lion-nomad-crossroads', 'lion-refugees', 'lion-first-trial-event', 'lion-first-trial-combat'], 'filtered woodland daylight with controlled threat shadows', 'day', 'grounded road perspective with open lower staging plane', ['forked road', 'forest ridge', 'travel markers']],
  ['FIRST_REFUGE', ['lion-first-refuge'], 'sheltered amber fire against cool woods', 'dusk', 'safe enclosure with visible exit road', ['palisade', 'watch fires', 'supply shelter']],
  ['VALMIR_ROAD', ['lion-reserve-trail', 'lion-valmir-road', 'lion-second-trial-event', 'lion-second-trial-combat'], 'clear mountain light with distant smoke', 'late day', 'wide route geography and readable directional depth', ['road fork', 'Valmir ridge', 'shrine stones']],
  ['BOIS_CLAIR', ['lion-village-choice'], 'firelit smoke with outcome-specific recovery light', 'late day into night', 'village square and split objective geography', ['chapel', 'north captives route', 'south reserves route']],
  ['SECOND_REFUGE', ['lion-second-refuge', 'lion-lancer-recruit'], 'low night fire transitioning to cool morning', 'night to morning', 'intimate refuge staging opening onto the road', ['campfire', 'tent line', 'departure gate']],
  ['WITNESS_ROAD', ['lion-witnesses'], 'open neutral daylight with long road depth', 'day', 'social encounter frame with witness lane and party lane', ['road marker', 'distant Bois-Clair smoke', 'wooded verge']],
  ['SHADOW_RUINS', ['lion-final-trial-event', 'lion-final-trial-combat', 'lion-shadow-signs'], 'cool stone light with restrained violet corruption', 'overcast day', 'monumental ruin depth with readable evidence foreground', ['inscribed stones', 'ruin arch', 'shadow veins']],
  ['FINAL_REFUGE', ['lion-final-refuge'], 'quiet pre-judgement dusk with warm shelter edge', 'dusk', 'reflective camp frame with dossier-safe negative space', ['final campfire', 'Lion road', 'dossier table']],
  ['LION_JUDGEMENT', ['lion-final-judgement'], 'formal gold torchlight and deep blue authority', 'interior timeless', 'symmetrical judgement frame with opposed lanes', ['Lion dais', 'central seal', 'court banners']],
  ['SERPENT_FINALE', ['lion-final-judgement'], 'cold ruin atmosphere cut by hostile Serpent red', 'twilight', 'boss reveal and aftermath axis toward the artefact', ['ruin arena', 'Serpent standard', 'Shadow artefact']],
  ['LION_TRIAL', ['lion-final-judgement'], 'hard Lion gold against weathered stone', 'twilight', 'ritual duel axis with Alaric authority visible in geography', ['trial circle', 'Lion standard', 'judgement terrace']],
] as const;

function nodeForDialogue(dialogueId: string, contexts: readonly string[]): string | null {
  for (const context of contexts) {
    const direct = context.match(/^(?:campaign-node|ate-after|node):(.+)$/)?.[1];
    if (direct) return direct;
    const combatId = context.match(/^(?:pre-combat|post-combat):(.+)$/)?.[1];
    if (combatId && COMBAT_NODE[combatId]) return COMBAT_NODE[combatId];
  }
  if (dialogueId === 'acte_ouverture' || dialogueId === 'camp_departure') return 'lion-camp';
  if (dialogueId === 'epilogue') return 'lion-final-judgement';
  if (POOL_DIALOGUE_NODE[dialogueId]) return POOL_DIALOGUE_NODE[dialogueId];
  return null;
}

function familyForDialogue(dialogueId: string, nodeId: string | null): string {
  if (dialogueId === 'epilogue' || dialogueId === 'lion_finale_judgement') return 'LION_JUDGEMENT';
  if (dialogueId === 'serpent_general_aftermath' || dialogueId === 'serpent_pursuit_pre_combat') return 'SERPENT_FINALE';
  if (dialogueId === 'lion_trial_aftermath' || dialogueId === 'pre_lion_chief') return 'LION_TRIAL';
  if (nodeId) return NODE_FAMILY[nodeId] ?? 'FOREST_ROAD';
  if (dialogueId.includes('village') || dialogueId.includes('bois_clair')) return 'BOIS_CLAIR';
  if (dialogueId.includes('refuge')) return 'FIRST_REFUGE';
  if (dialogueId.includes('shadow') || dialogueId.includes('ruins') || dialogueId.includes('shrine')) return 'SHADOW_RUINS';
  return 'FOREST_ROAD';
}

function heroRule(family: string, cast: readonly string[]): Beat['heroRepresentation'] {
  if (family === 'ALARIC_AUDIENCE' || family === 'LION_JUDGEMENT') return 'HERO_OPTIONAL';
  if (family === 'SERPENT_FINALE' || family === 'LION_TRIAL') return 'HERO_REQUIRED';
  return cast.includes('alistair') ? 'HERO_REQUIRED' : 'HERO_REQUIRED';
}

function targetCastForDialogue(
  dialogueId: string,
  family: string,
  speakers: readonly string[],
  currentCast: readonly string[],
  target: PresentationMode,
): string[] {
  if (target === 'CINEMATIC_HOLD') return [...currentCast];
  if (dialogueId === 'acte_ouverture') return [...currentCast];
  const hero = heroRule(family, currentCast) === 'HERO_REQUIRED' ? ['alistair'] : [];
  const speakingAdvisers = speakers.filter((id) => ADVISERS.has(id));
  const fallbackAdviser = speakingAdvisers.length
    ? []
    : /treasure|raid|denunciation|intimidation|brokered|supply|market/.test(dialogueId) ? ['maelor'] : ['sage_seraphine'];
  return [...new Set([...speakers, ...hero, ...speakingAdvisers, ...fallbackAdviser])];
}

function castIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => typeof entry === 'string' ? entry : (entry as { id?: string }).id).filter((id): id is string => Boolean(id));
}

function locationText(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'preferredAsset' in value) return `${fallback} (${String((value as { preferredAsset?: string }).preferredAsset ?? 'environment reference')})`;
  return fallback;
}

function markdownCell(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ').replaceAll('|', '\\|');
  return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function dispositionFor(current: string, target: PresentationMode, extra: string[] = []): string[] {
  return [...new Set([current === target ? 'CORRECT' : 'RECLASSIFY', ...extra])];
}

const continuity = JSON.parse(await readFile(resolve(SPEC_ROOT, 'final_narrative_continuity.json'), 'utf8'));
const dialogueQuality = JSON.parse(await readFile(resolve(SPEC_ROOT, 'final_dialogue_quality_audit.json'), 'utf8'));
const remaster = JSON.parse(await readFile(resolve(SPEC_ROOT, 'final_cinematic_remaster_queue.json'), 'utf8'));
const census = JSON.parse(await readFile(resolve(SPEC_ROOT, 'campaign_cinematic_census.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(ROOT, 'public/assets/cinematics/manifest.json'), 'utf8'));
const staging = createNarrativeStagingAudit();

const stagingByDialogue = new Map(staging.entries.map((entry) => [entry.dialogueId, entry]));
const remasterById = new Map(remaster.existingProductionMasters.map((entry: any) => [entry.runtimeId, entry]));
const censusById = new Map(census.cinematics.filter((entry: any) => entry.runtimeId).map((entry: any) => [entry.runtimeId, entry]));
const manifestProduction = manifest.cinematics.filter((entry: any) => !entry.placeholderOnly);
const graph = generateRunGraph(6100);

const mediaAudit = await Promise.all(manifestProduction.map(async (descriptor: any) => {
  const plan: any = censusById.get(descriptor.id);
  const oldAudit: any = remasterById.get(descriptor.id);
  const family = MEDIA_FAMILY[descriptor.id];
  const targetMode: PresentationMode = MEDIA_TRAVEL_STILL.has(descriptor.id) ? 'TRAVEL_STILL' : 'CINEMATIC_VIDEO';
  const needsHoldFrame = Boolean(MEDIA_HOLD_PURPOSE[descriptor.id]);
  const sourcePath = String(descriptor.sources[0].src);
  const bytes = await readFile(resolve(ROOT, 'public', sourcePath.replace(/^\//, '')));
  const currentHash = createHash('sha256').update(bytes).digest('hex');
  const hashMatchesCin6d = currentHash === oldAudit?.currentHash;
  const cast = castIds(plan?.characters);
  return {
    runtimeId: descriptor.id,
    currentUsage: plan?.campaignBeat ?? descriptor.title,
    currentSemanticRole: 'CINEMATIC_VIDEO',
    targetSemanticRole: targetMode,
    shouldRemainVideo: targetMode === 'CINEMATIC_VIDEO',
    needsHoldFrame,
    holdPurpose: needsHoldFrame ? MEDIA_HOLD_PURPOSE[descriptor.id] : null,
    exactFinalFrameValid: needsHoldFrame ? oldAudit?.visualClassification === 'KEEP_AS_IS' : null,
    unsuitableHoldReason: needsHoldFrame && oldAudit?.visualClassification !== 'KEEP_AS_IS'
      ? 'Approve the remastered final composition before extracting the durable hold.'
      : null,
    needsTableauBackgroundCompanion: TABLEAU_COMPANION_MEDIA.has(descriptor.id),
    canBeReplacedByTravelStill: targetMode === 'TRAVEL_STILL',
    needsVisualRemaster: Boolean(oldAudit?.needsRemaster),
    reuseStatus: oldAudit?.visualClassification ?? 'REVIEW',
    visualFamily: family,
    sourceNodeIds: plan?.sourceNodeIds ?? [],
    contentIds: plan?.contentIds ?? [],
    cast,
    currentHash,
    cin6dHash: oldAudit?.currentHash ?? null,
    hashMatchesCin6d,
    reason: targetMode === 'TRAVEL_STILL'
      ? 'This is connective travel with no meaningful action or reveal; retain its world design as a still reference.'
      : 'Motion or reveal materially advances the world at this beat.',
  };
}));

const dialogueBeats: Beat[] = staging.entries.map((entry) => {
  const sequence = dialogues.get(entry.dialogueId)!;
  const contexts = [...entry.reachableContexts];
  const nodeId = nodeForDialogue(entry.dialogueId, contexts);
  const family = familyForDialogue(entry.dialogueId, nodeId);
  const target: PresentationMode = HOLD_DIALOGUES.has(entry.dialogueId) ? 'CINEMATIC_HOLD' : 'STATIC_TABLEAU';
  const current: PresentationMode = DIALOGUE_VIDEO[entry.dialogueId] ? 'CINEMATIC_HOLD' : 'STATIC_TABLEAU';
  const tableau = resolveNarrativeDialogueTableau(entry.dialogueId, sequence)!;
  const speakers = [...entry.speakers];
  const cast = targetCastForDialogue(entry.dialogueId, family, speakers, tableau.cast.visualActors, target);
  const choices = entry.steps.filter((step) => step.choiceCount > 0);
  const backgroundNeedsWork = target === 'STATIC_TABLEAU' && !REUSABLE_TABLEAU_BACKGROUNDS.has(entry.dialogueId);
  const targetVideo = DIALOGUE_VIDEO[entry.dialogueId]
    ?? (entry.dialogueId === 'camp_departure' ? 'camp_departure' : entry.dialogueId === 'epilogue' ? ['serpent_route_ending', 'lion_trial_route_ending'] : null);
  const currentAsset = DIALOGUE_VIDEO[entry.dialogueId] ?? resolveDialogueBackdrop(sequence);
  const extraDisposition = target === 'STATIC_TABLEAU' && backgroundNeedsWork
    ? ['NEEDS_BACKGROUND_REWORK']
    : target === 'CINEMATIC_HOLD' ? ['NEEDS_HOLD_EXTRACTION', 'NEEDS_RUNTIME_SUPPORT'] : [];
  return {
    beatId: `dialogue:${entry.dialogueId}`,
    nodeId,
    edgeId: null,
    contentId: contexts.find((context) => context.startsWith('campaign-node:')) ? entry.dialogueId : contexts[0] ?? entry.dialogueId,
    dialogueId: entry.dialogueId,
    combatId: contexts.map((context) => context.match(/^(?:pre-combat|post-combat):(.+)$/)?.[1]).find(Boolean) ?? null,
    beatKind: entry.dialogueId.startsWith('ate_') ? 'ATE'
      : entry.dialogueId.startsWith('pre_') || entry.dialogueId.endsWith('_pre_combat') ? 'PRE_COMBAT_DIALOGUE'
        : entry.dialogueId.startsWith('post_') || entry.dialogueId.endsWith('_aftermath') ? 'POST_COMBAT_DIALOGUE'
          : entry.dialogueId.startsWith('rep_event_') ? 'REPUTATION_EVENT' : 'DIALOGUE',
    currentPresentation: current,
    targetPresentationMode: target,
    currentAsset,
    targetAssetRole: target === 'CINEMATIC_HOLD' ? `${Array.isArray(targetVideo) ? 'route_ending' : targetVideo}_hold` : `${family.toLowerCase()}_tableau_background`,
    location: nodeId ? NODE_LOCATION[nodeId] : family.replaceAll('_', ' ').toLowerCase(),
    timeContext: entry.dialogueId.startsWith('ate_') ? 'immediately after the triggering node' : 'current encounter time',
    activity: entry.dialogueId.startsWith('ate_') ? 'reflection and consequence commentary' : choices.length ? 'dialogue and decision' : 'dialogue',
    cast,
    speakerOwnership: target === 'CINEMATIC_HOLD' ? 'VIDEO_OWNS_CAST' : 'TABLEAU_OWNS_CAST',
    heroRepresentation: heroRule(family, cast),
    advisers: cast.filter((id) => ADVISERS.has(id)),
    externalCast: speakers.filter((id) => !COMPANY.has(id)),
    hasDialogue: true,
    hasChoice: choices.length > 0,
    hasCombat: false,
    previousBeat: `context-entry:${contexts[0] ?? entry.dialogueId}`,
    nextBeat: choices.length ? `choice:${entry.dialogueId}:${choices[0]!.stepId}` : `context-exit:${contexts[0] ?? entry.dialogueId}`,
    contextContinuity: target === 'CINEMATIC_HOLD' ? 'SAME_MOMENT_REQUIRED' : 'CURRENT_CONTEXT_TABLEAU',
    holdAllowed: target === 'CINEMATIC_HOLD',
    reason: target === 'CINEMATIC_HOLD'
      ? 'The exchange or agency belongs to the immediately preceding reveal and benefits from its exact endpoint.'
      : 'Speaker choreography, conditional cast, or reflective dialogue is the primary presentation value.',
    currentIssue: current !== target
      ? target === 'STATIC_TABLEAU'
        ? 'An extended exchange currently remains attached to video staging instead of transferring speaker focus to a tableau.'
        : 'Same-moment dialogue is currently reconstructed as a tableau after the cinematic endpoint.'
      : backgroundNeedsWork
        ? 'The semantic mode is correct, but the current plate is not purpose-built for premium sprite integration.'
        : 'No semantic mode mismatch.',
    futureMediaAction: target === 'CINEMATIC_HOLD'
      ? 'Approve and reference the exact final frame; do not overlay duplicate sprites.'
      : backgroundNeedsWork
        ? 'Create or rework a character-free family tableau plate with audited stage and UI safe zones.'
        : 'Retain the existing plate and revalidate against the family bible.',
    priority: current !== target ? 'P0' : backgroundNeedsWork ? 'P1' : 'P2',
    disposition: dispositionFor(current, target, extraDisposition),
    visualFamily: family,
  };
});

const choiceAudit = staging.entries.flatMap((entry) => {
  const dialogueBeat = dialogueBeats.find((beat) => beat.dialogueId === entry.dialogueId)!;
  return entry.steps.filter((step) => step.choiceCount > 0).map((step) => ({
    choiceStateId: `${entry.dialogueId}:${step.stepId}`,
    dialogueId: entry.dialogueId,
    stepId: step.stepId,
    choiceCount: step.choiceCount,
    visualOwner: dialogueBeat.targetPresentationMode,
    castOwnership: dialogueBeat.speakerOwnership,
    geometryOwner: 'CANONICAL_DIALOGUE_CHOICE_GEOMETRY',
    canonicalSemanticsPreserved: true,
    exception: null,
    reason: dialogueBeat.targetPresentationMode === 'CINEMATIC_HOLD'
      ? 'Agency answers the exact preceding reveal without a context change.'
      : 'Agency belongs to the theatrical exchange and needs independently focused actors.',
  }));
});

const edgeTravelById = new Map(TRAVEL_STILLS.flatMap((still) => still.edgeIds.map((edgeId) => [edgeId, still])));
const branchSources = new Set(['lion-refugees', 'lion-valmir-road', 'lion-witnesses']);
const currentHoldSources = new Set(['lion-camp', 'lion-refugees', 'lion-valmir-road', 'lion-witnesses']);
const edgeBeats: Beat[] = continuity.edges.map((edge: any) => {
  const routeDecision = branchSources.has(edge.fromNodeId);
  const target: PresentationMode = routeDecision ? 'CINEMATIC_HOLD' : 'TRAVEL_STILL';
  const current: PresentationMode = currentHoldSources.has(edge.fromNodeId) ? 'CINEMATIC_HOLD' : 'STATIC_TABLEAU';
  const family = NODE_FAMILY[edge.toNodeId] ?? NODE_FAMILY[edge.fromNodeId];
  const still = edgeTravelById.get(edge.edgeId);
  return {
    beatId: `edge:${edge.edgeId}`,
    nodeId: edge.fromNodeId,
    edgeId: edge.edgeId,
    contentId: null,
    dialogueId: null,
    combatId: null,
    beatKind: routeDecision ? 'ROUTE_DECISION_BOUNDARY' : 'TRAVEL_BOUNDARY',
    currentPresentation: current,
    targetPresentationMode: target,
    currentAsset: edge.presentation,
    targetAssetRole: routeDecision ? `${NODE_FAMILY[edge.fromNodeId].toLowerCase()}_route_hold` : `${still?.id ?? edge.edgeId}_travel_still`,
    location: `${NODE_LOCATION[edge.fromNodeId]} → ${NODE_LOCATION[edge.toNodeId]}`,
    timeContext: 'between resolved node and next committed node',
    activity: routeDecision ? 'route selection, then travel commit' : 'travel pause and Continue',
    cast: ['alistair', 'sage_seraphine', 'maelor'],
    speakerOwnership: routeDecision ? 'VIDEO_OWNS_CAST' : 'TRAVEL_SURFACE_OWNS_ENVIRONMENT',
    heroRepresentation: 'HERO_REQUIRED',
    advisers: ['sage_seraphine', 'maelor'],
    externalCast: [],
    hasDialogue: false,
    hasChoice: routeDecision,
    hasCombat: false,
    previousBeat: `node-resolved:${edge.fromNodeId}`,
    nextBeat: `node-entry:${edge.toNodeId}`,
    contextContinuity: routeDecision ? 'SAME_ROUTE_REVEAL_UNTIL_COMMIT' : 'NEW_TRAVEL_CONTEXT',
    holdAllowed: routeDecision,
    reason: routeDecision
      ? 'The spatial route decision belongs to the immediately preceding route reveal.'
      : 'The prior scene has ended; the player needs current-world punctuation before the next event.',
    currentIssue: current === target ? 'No semantic mode mismatch.' : 'A generic tableau or stale cinematic endpoint currently carries a connective travel role.',
    futureMediaAction: routeDecision
      ? 'Extract and approve the route-reveal final frame; release it immediately after commit.'
      : 'Provide the mapped family travel still; reuse one still across compatible edges where geography permits.',
    priority: current === target ? 'P2' : edge.edgeId === 'lion-audience>lion-opening-ambush' ? 'P0' : 'P1',
    disposition: dispositionFor(current, target, current === target ? [] : ['NEEDS_ASSET', 'NEEDS_RUNTIME_SUPPORT']),
    visualFamily: family,
  };
});

const mediaBeats: Beat[] = mediaAudit.map((media: any) => {
  const oldAudit: any = remasterById.get(media.runtimeId);
  const plan: any = censusById.get(media.runtimeId);
  const nodeId = plan?.sourceNodeIds?.[0] ?? null;
  const target = media.targetSemanticRole as PresentationMode;
  const current: PresentationMode = 'CINEMATIC_VIDEO';
  return {
    beatId: `media:${media.runtimeId}`,
    nodeId,
    edgeId: null,
    contentId: plan?.contentIds?.[0] ?? null,
    dialogueId: null,
    combatId: null,
    beatKind: target === 'TRAVEL_STILL' ? 'CONNECTIVE_DEPARTURE' : 'WORLD_EVENT_OR_REVEAL',
    currentPresentation: current,
    targetPresentationMode: target,
    currentAsset: `/assets/cinematics/${media.runtimeId}.mp4`,
    targetAssetRole: target === 'TRAVEL_STILL' ? `${media.runtimeId}_travel_still` : `${media.runtimeId}_video`,
    location: locationText(plan?.environment, nodeId ? NODE_LOCATION[nodeId] : media.visualFamily.replaceAll('_', ' ').toLowerCase()),
    timeContext: 'event-local',
    activity: plan?.campaignBeat ?? 'cinematic reveal',
    cast: media.cast,
    speakerOwnership: 'VIDEO_OWNS_CAST',
    heroRepresentation: heroRule(media.visualFamily, media.cast),
    advisers: media.cast.filter((id: string) => ADVISERS.has(id)),
    externalCast: media.cast.filter((id: string) => !COMPANY.has(id)),
    hasDialogue: false,
    hasChoice: false,
    hasCombat: false,
    previousBeat: 'current-context-entry',
    nextBeat: media.needsHoldFrame ? `hold:${media.runtimeId}` : 'next-current-context-beat',
    contextContinuity: media.needsHoldFrame ? 'FINAL_FRAME_MAY_CONTINUE_SAME_MOMENT' : 'RELEASE_AT_VIDEO_END',
    holdAllowed: media.needsHoldFrame,
    reason: media.reason,
    currentIssue: target === 'TRAVEL_STILL'
      ? 'A full cinematic is semantically excessive for a connective departure pause.'
      : oldAudit?.needsRemaster ? 'Semantic video role is correct; visual remaster status remains separate.' : 'No semantic mode mismatch.',
    futureMediaAction: target === 'TRAVEL_STILL'
      ? 'Retain the visual family reference and replace runtime use with a still or approved living still.'
      : oldAudit?.needsRemaster ? oldAudit.reason : 'Retain the production master.',
    priority: target === 'TRAVEL_STILL' ? 'P0' : oldAudit?.priority ?? 'P2',
    disposition: dispositionFor(current, target, [
      ...(target === 'TRAVEL_STILL' ? ['NEEDS_ASSET', 'NEEDS_RUNTIME_SUPPORT'] : []),
      ...(oldAudit?.needsRemaster ? ['NEEDS_ASSET'] : []),
    ]),
    visualFamily: media.visualFamily,
  };
});

const combatBeats: Beat[] = census.combatFraming.map((combat: any) => {
  const nodeId = COMBAT_NODE[combat.combatId];
  const family = combat.combatId === 'serpent_captain' ? 'SERPENT_FINALE'
    : combat.combatId === 'lion_chief' ? 'LION_TRIAL' : NODE_FAMILY[nodeId];
  return {
    beatId: `combat:${combat.combatId}`,
    nodeId,
    edgeId: null,
    contentId: combat.combatId,
    dialogueId: null,
    combatId: combat.combatId,
    beatKind: 'TACTICAL_COMBAT',
    currentPresentation: 'COMBAT',
    targetPresentationMode: 'COMBAT',
    currentAsset: null,
    targetAssetRole: 'EXISTING_TACTICAL_COMBAT_RUNTIME',
    location: NODE_LOCATION[nodeId],
    timeContext: 'immediately after pre-combat presentation',
    activity: 'tactical combat',
    cast: [],
    speakerOwnership: 'COMBAT_RUNTIME_OWNS_ACTORS',
    heroRepresentation: 'HERO_REQUIRED',
    advisers: [],
    externalCast: [],
    hasDialogue: false,
    hasChoice: false,
    hasCombat: true,
    previousBeat: `dialogue:${combat.preCombatDialogueId}`,
    nextBeat: `dialogue:${combat.postCombatDialogueId}`,
    contextContinuity: 'COMBAT_IS_AN_EXPLICIT_RUNTIME_RUPTURE',
    holdAllowed: false,
    reason: 'Combat remains a non-narrative presentation boundary and owns its own actors and interaction.',
    currentIssue: 'No semantic mode mismatch.',
    futureMediaAction: 'None in CIN-6D.5.',
    priority: 'P2',
    disposition: ['CORRECT'],
    visualFamily: family,
  };
});

const gameplayBeats: Beat[] = ['lion-first-refuge', 'lion-second-refuge'].map((nodeId) => ({
  beatId: `gameplay-ui:${nodeId}`,
  nodeId,
  edgeId: null,
  contentId: 'forest_refuge',
  dialogueId: null,
  combatId: null,
  beatKind: 'REFUGE_MANAGEMENT',
  currentPresentation: 'GAMEPLAY_UI',
  targetPresentationMode: 'GAMEPLAY_UI',
  currentAsset: null,
  targetAssetRole: 'EXISTING_REFUGE_MANAGEMENT_UI',
  location: NODE_LOCATION[nodeId],
  timeContext: 'refuge stay',
  activity: 'rest, shop, clan and skill management',
  cast: [],
  speakerOwnership: 'GAMEPLAY_UI_OWNS_INTERACTION',
  heroRepresentation: 'HERO_OPTIONAL',
  advisers: [],
  externalCast: [],
  hasDialogue: false,
  hasChoice: true,
  hasCombat: false,
  previousBeat: `refuge-arrival:${nodeId}`,
  nextBeat: `refuge-departure:${nodeId}`,
  contextContinuity: 'SAME_REFUGE_GAMEPLAY_CONTEXT',
  holdAllowed: false,
  reason: 'Management remains gameplay UI and must not be forced into a narrative mode.',
  currentIssue: 'No semantic mode mismatch.',
  futureMediaAction: 'None in CIN-6D.5.',
  priority: 'P2',
  disposition: ['CORRECT'],
  visualFamily: NODE_FAMILY[nodeId],
}));

const beats = [...mediaBeats, ...dialogueBeats, ...edgeBeats, ...combatBeats, ...gameplayBeats];
const modeCounts = Object.fromEntries(MODES.map((mode) => [mode, beats.filter((beat) => beat.targetPresentationMode === mode).length]));

const tableauBackgroundAudit = dialogueBeats.filter((beat) => beat.targetPresentationMode === 'STATIC_TABLEAU').map((beat) => {
  const sequence = dialogues.get(beat.dialogueId!)!;
  const isReusable = REUSABLE_TABLEAU_BACKGROUNDS.has(beat.dialogueId!);
  const borrowedContext = beat.dialogueId!.startsWith('ate_') || beat.dialogueId!.startsWith('rep_event_');
  return {
    beatId: beat.beatId,
    dialogueId: beat.dialogueId,
    visualFamily: beat.visualFamily,
    currentBackground: resolveDialogueBackdrop(sequence),
    classification: isReusable ? 'GOOD' : borrowedContext ? 'REPLACE' : 'NEEDS_REWORK',
    perspective: isReusable ? 'APPROVED' : 'REAUTHOR_FOR_STAGED_CAST',
    horizon: isReusable ? 'APPROVED' : 'MATCH_FAMILY_CAMERA_HEIGHT',
    groundPlane: isReusable ? 'APPROVED' : 'ADD_PLAUSIBLE_CONTACT_AREA',
    foregroundStagingArea: isReusable ? 'APPROVED' : 'PROTECT_ENLARGED_CAST_LANES',
    lightingDirection: isReusable ? 'APPROVED' : 'MATCH_CANONICAL_SPRITE_KEY_LIGHT',
    lightingColor: isReusable ? 'APPROVED' : 'MATCH_VISUAL_FAMILY',
    spriteReadability: isReusable ? 'GOOD' : 'REQUIRES_REWORK',
    faceReadability: isReusable ? 'GOOD' : 'REQUIRES_REWORK',
    negativeSpace: isReusable ? 'GOOD' : 'REQUIRES_AUTHORED_UI_SAFE_ZONE',
    visualClutter: isReusable ? 'CONTROLLED' : 'REDUCE_BEHIND_FACES',
    depth: isReusable ? 'CINEMATIC' : 'REBUILD_FOREGROUND_MIDGROUND_BACKGROUND',
    cinematicStyleCompatibility: isReusable ? 'GOOD' : 'MATCH_FAMILY_GOLD_REFERENCE',
    bakedDuplicateCharacter: false,
    bakedEnvironmentalFigures: ['refugee_trial', 'village_choice', 'witnesses_on_road'].includes(sequence.sceneArtId ?? ''),
    stateDependentBakedActor: false,
    reason: isReusable
      ? 'The existing reviewed composition already supports the current tableau grammar.'
      : borrowedContext
        ? 'The dialogue borrows a scene plate from another beat; create a context-specific character-free tableau background.'
        : 'The semantic tableau is correct, but the current plate needs purpose-built sprite integration.',
  };
});

const CONDITIONAL_ACTORS: Record<string, string[]> = {
  final_refuge: ['cedric', 'lancer'],
  ate_serpent_scout_report: ['cedric'],
  ate_first_refuge_watch: ['cedric'],
  ate_serpent_general_warning: ['cedric'],
};

const tableauCastAudit = dialogueBeats.filter((beat) => beat.targetPresentationMode === 'STATIC_TABLEAU').map((beat) => {
  const stagingEntry = stagingByDialogue.get(beat.dialogueId!)!;
  const speakers = [...stagingEntry.speakers];
  const hero = beat.heroRepresentation === 'HERO_REQUIRED' ? 'alistair' : null;
  const conditionalActors = CONDITIONAL_ACTORS[beat.dialogueId!] ?? [];
  const advisers = beat.cast.filter((id) => ADVISERS.has(id));
  const externalActors = speakers.filter((id) => !COMPANY.has(id));
  return {
    dialogueId: beat.dialogueId,
    speakers,
    hero,
    advisers,
    listeners: beat.cast.filter((id) => !speakers.includes(id)),
    externalActors,
    optionalRecruits: conditionalActors.filter((id) => id === 'cedric' || id === 'lancer'),
    conditionalActors,
    targetCast: beat.cast,
    entireRosterJustified: beat.dialogueId === 'acte_ouverture' || (beat.cast.length >= 5 && speakers.length >= 5),
    missingSpeaker: speakers.some((speaker) => !beat.cast.includes(speaker)),
    futureRecruitShownUnconditionally: conditionalActors.some((actor) => beat.cast.includes(actor) && !speakers.includes(actor)),
    impossibleCast: false,
    bakedDuplicateCharacter: false,
  };
});

const ateAudit = Object.entries(POST_NODE_ATE).flatMap(([nodeId, dialogueIds]) => dialogueIds.map((dialogueId) => {
  const beat = dialogueBeats.find((candidate) => candidate.dialogueId === dialogueId)!;
  const background = tableauBackgroundAudit.find((candidate) => candidate.dialogueId === dialogueId)!;
  const stagingEntry = stagingByDialogue.get(dialogueId)!;
  return {
    dialogueId,
    triggerNodeId: nodeId,
    targetPresentationMode: beat.targetPresentationMode,
    location: beat.location,
    backgroundRequirement: `${beat.visualFamily.toLowerCase()}_ate_tableau_background`,
    currentBackgroundSuitable: background.classification === 'GOOD',
    backgroundDisposition: background.classification,
    visibleCast: beat.cast,
    speakerSequence: stagingEntry.speakers,
    heroPresence: beat.heroRepresentation,
    conditionalRecruits: stagingEntry.speakers.filter((id) => id === 'cedric' || id === 'lancer'),
    videoJustified: false,
    resolved: true,
  };
}));

const nodeCoverage = graph.nodes.map((node) => ({
  nodeId: node.id,
  beatIds: beats.filter((beat) => beat.nodeId === node.id).map((beat) => beat.beatId),
}));

const routeChoiceEdgeAudit = edgeBeats.map((beat) => ({
  edgeId: beat.edgeId,
  playerVisiblePause: true,
  currentMode: beat.currentPresentation,
  targetMode: beat.targetPresentationMode,
  routeDecisionOwner: beat.hasChoice ? beat.targetPresentationMode : null,
  travelStillId: beat.targetPresentationMode === 'TRAVEL_STILL' ? edgeTravelById.get(beat.edgeId!)?.id ?? null : null,
  holdReleaseAfterCommit: beat.targetPresentationMode === 'CINEMATIC_HOLD',
  recommendation: beat.reason,
}));

const familyPlan = VISUAL_FAMILY_BASE.map(([id, nodes, lighting, timeOfDay, cameraLanguage, landmarks]) => {
  const familyMedia = mediaAudit.filter((entry: any) => entry.visualFamily === id);
  const familyTableaux = tableauBackgroundAudit.filter((entry) => entry.visualFamily === id);
  const familyTravel = TRAVEL_STILLS.filter((entry) => entry.family === id);
  return {
    id,
    nodesAndEvents: nodes,
    currentVideoMasters: familyMedia.map((entry: any) => entry.runtimeId),
    futureHoldFrames: familyMedia.filter((entry: any) => entry.needsHoldFrame).map((entry: any) => `${entry.runtimeId}_hold`),
    requiredTravelStills: familyTravel.map((entry) => entry.id),
    requiredTableauBackgrounds: [...new Set(familyTableaux.map((entry) => `${entry.dialogueId}_tableau_bg`))],
    lighting,
    timeOfDay,
    cameraLanguage,
    environmentLandmarks: landmarks,
    stagingContinuity: 'Preserve world scale, ground contact and protected speaker/choice lanes across all roles.',
    environmentContinuity: 'Video, hold, travel still and tableau plate must read as the same physical location and time progression.',
  };
});

const summary = {
  nodes: nodeCoverage.length,
  edges: routeChoiceEdgeAudit.length,
  dialogues: dialogueBeats.length,
  dialogueSteps: dialogueQuality.summary.steps,
  choices: choiceAudit.length,
  ate: ateAudit.length,
  productionVideos: mediaAudit.length,
  playerFacingBeats: beats.length,
  targetModes: modeCounts,
  existingVideosRetained: mediaAudit.filter((entry: any) => entry.shouldRemainVideo).length,
  existingVideosSemanticallyUnnecessary: mediaAudit.filter((entry: any) => !entry.shouldRemainVideo).length,
  holdExtractionsNeeded: mediaAudit.filter((entry: any) => entry.needsHoldFrame).length,
  newTravelStillsNeeded: TRAVEL_STILLS.length,
  tableauBackgroundsReusable: tableauBackgroundAudit.filter((entry) => entry.classification === 'GOOD').length,
  tableauBackgroundsRequiringRework: tableauBackgroundAudit.filter((entry) => entry.classification !== 'GOOD').length,
  livingStillCandidates: TRAVEL_STILLS.filter((entry) => entry.livingStillCandidate).length,
  runtimeFeaturesRequired: RUNTIME_REQUIREMENTS.length,
  visualFamilies: familyPlan.length,
  playerFacingBeatsUnclassified: beats.filter((beat) => !MODES.includes(beat.targetPresentationMode)).length,
};

const audit = {
  schemaVersion: 1,
  baseline: BASELINE,
  policy: 'PLANNING_ONLY_NO_RUNTIME_OR_MEDIA_CHANGES',
  sourceOfTruth: ['RunSystem graph', 'canonical dialogue registry', 'combat registry', 'NarrativeStagingAudit', 'production cinematic manifest', 'CIN-6D continuity and media audits'],
  modeEnum: MODES,
  doctrine: {
    cinematicVideo: 'A moving, integrated world event or reveal. VIDEO_OWNS_CAST.',
    cinematicHold: 'The exact endpoint of the immediately preceding cinematic, valid only while place, time, encounter, situation and activity remain unchanged.',
    travelStill: 'An independent current-context establishing frame for travel, route pacing or Continue; it never belongs to the prior scene.',
    staticTableau: 'A premium theatrical environment plate with separate canonical actors and dynamic speaker emphasis. TABLEAU_OWNS_CAST.',
    activeSpeaker: 'full emphasis; physical scale unchanged',
    listeners: 'subdued at the approved level; physical scale unchanged',
    ateDefault: 'STATIC_TABLEAU',
    travelDefault: 'TRAVEL_STILL',
  },
  summary,
  nodeCoverage,
  edgeAudit: routeChoiceEdgeAudit,
  dialogueCoverage: dialogueBeats.map((beat) => ({ dialogueId: beat.dialogueId, beatId: beat.beatId, targetMode: beat.targetPresentationMode })),
  choiceAudit,
  ateAudit,
  productionVideoAudit: mediaAudit,
  travelStillAudit: TRAVEL_STILLS.map((entry) => ({
    ...entry,
    beatId: `travel:${entry.id}`,
    fromContext: entry.edgeIds.map((edgeId) => edgeId.split('>')[0]),
    toContext: entry.edgeIds.map((edgeId) => edgeId.split('>')[1]),
    partyComposition: entry.party,
    heroRequirement: 'HERO_REQUIRED',
    adviserRequirement: 'ONE_OR_TWO_RELEVANT_ADVISERS',
    implementationCandidate: entry.livingStillCandidate ? 'STATIC_IMAGE_OR_LIVING_STILL' : 'STATIC_IMAGE',
    newAssetRequired: true,
  })),
  tableauBackgroundAudit,
  tableauCastAudit,
  beats,
  pacingAudit: {
    current: ['TOO_MANY_CONTINUES', 'INSUFFICIENT_TRAVEL_BREATHING_ROOM', 'UNNECESSARY_HOLD'],
    target: 'GOOD_RHYTHM',
    reason: 'The target separates dramatic reveals, same-moment agency, character discussion and connective travel instead of asking one held surface to carry all four roles.',
  },
  keyReclassifications: [
    'first_refuge_departure: CINEMATIC_VIDEO → TRAVEL_STILL',
    'second_refuge_departure: CINEMATIC_VIDEO → TRAVEL_STILL',
    'extended Cedric and Garen recruitment dialogue: CINEMATIC_HOLD → STATIC_TABLEAU',
    'Shadow Signs and final-refuge discussion: CINEMATIC_HOLD → STATIC_TABLEAU after their reveal videos',
    'camp_departure dialogue and ending epilogue: STATIC_TABLEAU → CINEMATIC_HOLD where the exact endpoint remains current',
    'single-route Journey boundaries: generic STATIC_TABLEAU or old hold → independent TRAVEL_STILL',
  ],
  audienceToRoad: [
    'CINEMATIC_VIDEO: alaric_audience_arrival',
    'CINEMATIC_HOLD: audience dialogue and mission choice',
    'release hold after audience resolution',
    'TRAVEL_STILL: audience_road_departure',
    'CINEMATIC_VIDEO: forest_journey_tension',
    'CINEMATIC_HOLD: immediate pre-combat dialogue',
    'COMBAT',
    'STATIC_TABLEAU: post-combat discussion',
  ],
  runtimeRequirements: RUNTIME_REQUIREMENTS,
  visualPipelineRequirements: VISUAL_PIPELINE_REQUIREMENTS,
  invariants: {
    gameTruthChanged: false,
    runSystemChanged: false,
    saveSchemaChanged: false,
    combatRuntimeChanged: false,
    vfxChanged: false,
    runtimePresentationChanged: false,
    mediaChanged: false,
    newMediaGenerated: false,
    minimaxAttempts: 0,
    imageGenerationAttempts: 0,
  },
};

const visualFamilySpec = {
  schemaVersion: 1,
  baseline: BASELINE,
  policy: 'PLANNING_ONLY_NO_ASSET_GENERATION',
  goldReferences: ['alaric_audience_arrival', 'camp_departure', 'valmir_route_fork'],
  summary: {
    visualFamilies: familyPlan.length,
    productionVideos: mediaAudit.length,
    futureHoldFrames: mediaAudit.filter((entry: any) => entry.needsHoldFrame).length,
    travelStillRoles: TRAVEL_STILLS.length,
    tableauBackgroundBeatRequirements: tableauBackgroundAudit.length,
    livingStillCandidates: TRAVEL_STILLS.filter((entry) => entry.livingStillCandidate).length,
  },
  families: familyPlan,
  globalContinuityRule: 'Every role in a family shares physical location, palette, lighting, camera language, scale, depth, landmarks and explicit time progression.',
  backgroundActorRule: 'STATIC_TABLEAU backgrounds contain no baked party member or state-dependent actor.',
};

function beatTable(rows: Beat[]): string {
  const header = '| Beat | Node/Edge | Purpose | Current mode | Target mode | Dialogue | Choice | Cast ownership | Current asset | Required asset type | Runtime support? | Visual work? | Disposition |\n|---|---|---|---|---|:---:|:---:|---|---|---|:---:|:---:|---|';
  return [header, ...rows.map((beat) => `| \`${markdownCell(beat.beatId)}\` | ${markdownCell(beat.edgeId ?? beat.nodeId)} | ${markdownCell(beat.activity)} | ${beat.currentPresentation} | **${beat.targetPresentationMode}** | ${beat.hasDialogue ? 'yes' : 'no'} | ${beat.hasChoice ? 'yes' : 'no'} | ${beat.speakerOwnership} | ${markdownCell(beat.currentAsset)} | ${markdownCell(beat.targetAssetRole)} | ${beat.disposition.includes('NEEDS_RUNTIME_SUPPORT') ? 'yes' : 'no'} | ${beat.disposition.some((item) => ['NEEDS_ASSET', 'NEEDS_BACKGROUND_REWORK', 'NEEDS_HOLD_EXTRACTION'].includes(item)) ? 'yes' : 'no'} | ${beat.disposition.join(', ')} |`)];
}

const doctrineReport = `# CIN-6D.5 — Final presentation mode doctrine

## Status and intent

This document is the authoritative semantic doctrine for the next runtime and visual-production missions. It changes no runtime, media, game truth, route, save, combat or VFX behavior. The target alternates deliberately between an immersive cinematic world and a theatrical NarrativeStage.

## Intended player experience

Video means that the world is advancing. A hold means that the player is still inside the exact moment the video established. A travel still gives the player a current-world pause between important events. A static tableau turns character interpretation, disagreement and agency into an authored stage scene. None of these roles is a fallback quality tier.

## The four semantic modes

### CINEMATIC_VIDEO

Use for a meaningful arrival, encounter, character or enemy reveal, environmental discovery, material aftermath, boss entrance, ending or narratively significant departure. Motion or reveal must add meaning. The video owns environment, integrated cast, lighting, depth, camera and action. **VIDEO_OWNS_CAST**: do not mount duplicate canonical sprites during playback.

### CINEMATIC_HOLD

Use the exact approved endpoint of an immediately preceding cinematic for dialogue, Continue or choice in the same place, time, encounter, situation and activity. Release it as soon as any of those facts changes. A hold belongs to the preceding cinematic; it is not an independent travel asset. If dynamic speaker focus is required, transition to STATIC_TABLEAU.

### TRAVEL_STILL

Use an independent 16:9 establishing frame for travel, route pacing, post-event breathing room or a next-step Continue when no dramatic event is occurring. It belongs to the current transition and must look like a paused cinematic establishing shot. An optional living-still implementation may animate only ambient foliage, smoke, fire, cloth, water, weather, light or subtle camera drift.

### STATIC_TABLEAU

Use a premium cinematic environment plate plus separately staged canonical actors for ATEs, adviser exchanges, exposition, reactions, refuge conversations, smaller encounters and post-event discussion. The tableau owns cast. The active speaker receives full emphasis; listeners are subdued; actor scale and composition remain stable during handoff.

## Cast and background ownership

- Field tableaux use one Hero as the company representative, one or two relevant advisers, and the external situation or NPC when required.
- Audience and authority compositions may treat the Hero as optional when the established frame already communicates company presence.
- A video or hold with baked/integrated cast never receives duplicate sprite layers.
- A tableau background is character-free and is authored for the declared horizon, ground plane, perspective, contact area, light direction, face lanes and UI safe zones.
- ATE defaults to STATIC_TABLEAU. Travel and next-step boundaries default to TRAVEL_STILL.

## Transition grammar

Supported common transitions are:

- TRAVEL_STILL → CINEMATIC_VIDEO
- CINEMATIC_VIDEO → CINEMATIC_HOLD → dialogue, Continue or decision
- CINEMATIC_VIDEO → STATIC_TABLEAU when an extended exchange needs speaker focus
- STATIC_TABLEAU → decision → TRAVEL_STILL
- TRAVEL_STILL → STATIC_TABLEAU
- CINEMATIC_VIDEO → COMBAT
- COMBAT → STATIC_TABLEAU or TRAVEL_STILL
- ENDING_VIDEO → CINEMATIC_HOLD or STATIC_TABLEAU → epilogue

Additional legitimate transitions are STATIC_TABLEAU → CINEMATIC_VIDEO for a newly revealed event, CINEMATIC_HOLD → COMBAT while the exact confrontation remains current, and GAMEPLAY_UI → TRAVEL_STILL after refuge management.

## Invalid or suspicious transitions

Flag a hold carried into another location or activity, a travel still hosting an extended baked-cast dialogue, static sprites layered over video-owned cast, a full video replay used only to provide Continue, an old generic plate after a premium video, or any loading transition that returns to an already-ended scene.

## Campaign examples

- Opening company conversation: STATIC_TABLEAU.
- Camp departure: CINEMATIC_VIDEO, then an exact hold only for same-moment Continue.
- Alaric arrival: CINEMATIC_VIDEO → CINEMATIC_HOLD for dialogue and choice.
- Audience completion: release the hold → TRAVEL_STILL on the forest road.
- Forest danger: CINEMATIC_VIDEO → CINEMATIC_HOLD for pre-combat dialogue → COMBAT → STATIC_TABLEAU aftermath.
- Extended Cedric, Garen, Shadow Signs and final-refuge discussions transfer from their reveal video to STATIC_TABLEAU.
- ATE reflection remains STATIC_TABLEAU.
- First and second refuge departure masters become TRAVEL_STILL roles because no action or reveal justifies a full cinematic.

## Visual families and living stills

The 13 families in the companion plan bind video, hold, travel still and tableau background through the same location identity, palette, lighting, camera height, lens character, environment landmarks and time progression. Living stills remain an implementation option for ${summary.livingStillCandidates} of ${summary.newTravelStillsNeeded} travel roles; their semantic mode remains TRAVEL_STILL.

## REQUIREMENTS FOR RUNTIME RESTRUCTURE

${RUNTIME_REQUIREMENTS.map((item) => `- ${item}`).join('\n')}

## REQUIREMENTS FOR VISUAL PRODUCTION PIPELINE

${VISUAL_PIPELINE_REQUIREMENTS.map((item) => `- ${item}`).join('\n')}
`;

const auditReport = `# CIN-6D.5 — Full player-facing scene mode audit

## Coverage and decision

- Baseline: \`${BASELINE}\`
- Nodes: **${summary.nodes}/21**
- Reachable edges: **${summary.edges}/23**
- Dialogues and context: **${summary.dialogues}/71**, covering **${summary.dialogueSteps}/247** steps
- Choice states with explicit owner: **${summary.choices}/28**
- ATEs: **${summary.ate}/10**
- Production videos: **${summary.productionVideos}/31**
- Player-facing audit rows: **${summary.playerFacingBeats}**, unclassified: **${summary.playerFacingBeatsUnclassified}**

Target mode counts are ${Object.entries(summary.targetModes).map(([mode, count]) => `\`${mode}\` ${count}`).join(', ')}. Counts use one row per production-media role, dialogue sequence, reachable edge, combat and refuge-management surface. Choice states are attached to their dialogue beat and audited separately, so they are not counted twice.

## Findings

- ${summary.existingVideosRetained} videos retain CINEMATIC_VIDEO semantics; ${summary.existingVideosSemanticallyUnnecessary} connective departure videos become TRAVEL_STILL.
- ${summary.holdExtractionsNeeded} production masters need approved hold endpoints.
- ${summary.newTravelStillsNeeded} distinct travel-still roles cover the 17 non-route-choice edges through family reuse.
- ${summary.tableauBackgroundsReusable} target tableau beats can reuse their reviewed plate; ${summary.tableauBackgroundsRequiringRework} need a reworked or replacement character-free plate.
- ${summary.livingStillCandidates} travel roles may benefit from ambient-only living stills.
- Current pacing flags: TOO_MANY_CONTINUES, INSUFFICIENT_TRAVEL_BREATHING_ROOM and UNNECESSARY_HOLD. The target rhythm separates reveal, same-moment agency, conversation and travel.

## Key reclassifications

${audit.keyReclassifications.map((item) => `- ${item}`).join('\n')}

## Audience → road target sequence

${audit.audienceToRoad.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Master presentation matrix

${beatTable(beats)}

## All dialogue choice owners

| Choice state | Owner | Cast owner | Canonical geometry and semantics |
|---|---|---|---|
${choiceAudit.map((entry) => `| \`${entry.choiceStateId}\` | ${entry.visualOwner} | ${entry.castOwnership} | preserved |`).join('\n')}

## ATE classification

| ATE | Trigger | Target | Hero | Current background | Disposition |
|---|---|---|---|---|---|
${ateAudit.map((entry) => `| \`${entry.dialogueId}\` | \`${entry.triggerNodeId}\` | ${entry.targetPresentationMode} | ${entry.heroPresence} | ${entry.currentBackgroundSuitable ? 'suitable' : 'not purpose-built'} | ${entry.backgroundDisposition} |`).join('\n')}

## Production video semantic audit

| Runtime id | Target role | Remain video | Hold | Hold purpose | Final frame valid now | Tableau companion | Visual status |
|---|---|:---:|:---:|---|:---:|:---:|---|
${mediaAudit.map((entry: any) => `| \`${entry.runtimeId}\` | ${entry.targetSemanticRole} | ${entry.shouldRemainVideo ? 'yes' : 'no'} | ${entry.needsHoldFrame ? 'yes' : 'no'} | ${entry.holdPurpose ?? '—'} | ${entry.exactFinalFrameValid === null ? 'n/a' : entry.exactFinalFrameValid ? 'yes' : 'approve after remaster'} | ${entry.needsTableauBackgroundCompanion ? 'yes' : 'no'} | ${entry.reuseStatus} |`).join('\n')}

## Travel and route boundary audit

| Edge | Current | Target | Route owner | Travel-still role | Hold release |
|---|---|---|---|---|---|
${routeChoiceEdgeAudit.map((entry) => `| \`${entry.edgeId}\` | ${entry.currentMode} | ${entry.targetMode} | ${entry.routeDecisionOwner ?? '—'} | ${entry.travelStillId ?? '—'} | ${entry.holdReleaseAfterCommit ? 'after commit' : 'prior scene already released'} |`).join('\n')}

## Static-tableau background audit

| Dialogue beat | Family | Current background | Classification | Required action |
|---|---|---|---|---|
${tableauBackgroundAudit.map((entry) => `| \`${entry.dialogueId}\` | ${entry.visualFamily} | \`${entry.currentBackground}\` | ${entry.classification} | ${entry.reason} |`).join('\n')}

## Static-tableau cast audit

| Dialogue | Speakers | Hero | Advisers | Listeners | External | Conditional | Cast validity |
|---|---|---|---|---|---|---|---|
${tableauCastAudit.map((entry) => `| \`${entry.dialogueId}\` | ${entry.speakers.join(', ')} | ${entry.hero ?? 'optional'} | ${entry.advisers.join(', ') || 'none'} | ${entry.listeners.join(', ') || 'none'} | ${entry.externalActors.join(', ') || 'none'} | ${entry.conditionalActors.join(', ') || 'none'} | ${entry.missingSpeaker || entry.futureRecruitShownUnconditionally || entry.impossibleCast ? 'REVIEW' : 'PASS'} |`).join('\n')}

## REQUIREMENTS FOR RUNTIME RESTRUCTURE

${RUNTIME_REQUIREMENTS.map((item) => `- ${item}`).join('\n')}

## REQUIREMENTS FOR VISUAL PRODUCTION PIPELINE

${VISUAL_PIPELINE_REQUIREMENTS.map((item) => `- ${item}`).join('\n')}
`;

const familyReport = `# CIN-6D.5 — Visual-family continuity plan

## Global rule

VIDEO, HOLD, TRAVEL_STILL and STATIC_TABLEAU_BACKGROUND must describe the same physical world inside one family. Time changes must be explicit. Gold references remain \`alaric_audience_arrival\`, \`camp_departure\` and \`valmir_route_fork\`; none is modified here.

## Family index

| Family | Nodes/events | Videos | Holds | Travel stills | Tableau backgrounds | Light/time | Camera | Landmarks |
|---|---|---:|---:|---:|---:|---|---|---|
${familyPlan.map((family) => `| ${family.id} | ${family.nodesAndEvents.map((id) => `\`${id}\``).join(', ')} | ${family.currentVideoMasters.length} | ${family.futureHoldFrames.length} | ${family.requiredTravelStills.length} | ${family.requiredTableauBackgrounds.length} | ${family.lighting}; ${family.timeOfDay} | ${family.cameraLanguage} | ${family.environmentLandmarks.join(', ')} |`).join('\n')}

## Family requirements

${familyPlan.map((family) => `### ${family.id}

- Current videos: ${family.currentVideoMasters.length ? family.currentVideoMasters.map((id) => `\`${id}\``).join(', ') : 'none'}
- Future holds: ${family.futureHoldFrames.length ? family.futureHoldFrames.map((id) => `\`${id}\``).join(', ') : 'none'}
- Travel stills: ${family.requiredTravelStills.length ? family.requiredTravelStills.map((id) => `\`${id}\``).join(', ') : 'none'}
- Tableau backgrounds: ${family.requiredTableauBackgrounds.length ? family.requiredTableauBackgrounds.map((id) => `\`${id}\``).join(', ') : 'none'}
- Lighting and time: ${family.lighting}; ${family.timeOfDay}.
- Camera: ${family.cameraLanguage}.
- Landmarks: ${family.environmentLandmarks.join(', ')}.
- Staging: ${family.stagingContinuity}
- Environment: ${family.environmentContinuity}`).join('\n\n')}

## Production boundary

This is a role and continuity plan. It creates no prompts, images, video, derived frames or runtime manifest entries.
`;

await writeFile(resolve(SPEC_ROOT, 'final_presentation_mode_audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
await writeFile(resolve(SPEC_ROOT, 'final_visual_family_plan.json'), `${JSON.stringify(visualFamilySpec, null, 2)}\n`);
await writeFile(resolve(REPORT_ROOT, 'cin-6d-5-final-presentation-mode-doctrine.md'), doctrineReport);
await writeFile(resolve(REPORT_ROOT, 'cin-6d-5-full-scene-mode-audit.md'), auditReport);
await writeFile(resolve(REPORT_ROOT, 'cin-6d-5-visual-family-continuity.md'), familyReport);

console.log(JSON.stringify({ summary, invariants: audit.invariants }, null, 2));
