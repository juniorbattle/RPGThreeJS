import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type PlannedBeat = {
  beatId: string;
  nodeId: string | null;
  edgeId: string | null;
  contentId: string | null;
  dialogueId: string | null;
  combatId: string | null;
  targetPresentationMode: string;
  currentAsset: string | string[] | null;
  targetAssetRole: string;
  location: string;
  timeContext: string;
  activity: string;
  cast: string[];
  speakerOwnership: string;
  hasDialogue: boolean;
  hasChoice: boolean;
  hasCombat: boolean;
  contextContinuity: string;
  reason: string;
  visualFamily: string;
};

type Audit = {
  beats: PlannedBeat[];
  productionVideoAudit: Array<{ runtimeId: string }>;
};

type ProductionModes = {
  schemaVersion: number;
  sourceAudit: string;
  contractSet: string;
  approvedVideoIds: string[];
  modeOverrides: Record<string, string>;
};

const ROOT = process.cwd();
const AUDIT_PATH = resolve(ROOT, 'tools/cinematics/specs/final_presentation_mode_audit.json');
const PRODUCTION_PATH = resolve(ROOT, 'tools/cinematics/specs/production_presentation_modes.json');
const OUTPUT_PATH = resolve(ROOT, 'src/cinematics/FinalPresentationRegistry.generated.ts');
const BASELINE = 'PRODUCTION-CONTRACTS-LOCK-1:eight-slot-v1';

const FAMILY_FALLBACKS: Readonly<Record<string, string>> = Object.freeze({
  LION_CAMP: '/assets/generated/lion-phase/dialogue/camp_departure.webp',
  ALARIC_AUDIENCE: '/assets/generated/lion-phase/dialogue/lion_briefing.webp',
  FOREST_ROAD: '/assets/generated/lion-phase/dialogue/forest_fork.webp',
  FIRST_REFUGE: '/assets/generated/lion-phase/dialogue/lion_refuge.webp',
  VALMIR_ROAD: '/assets/generated/lion-phase/dialogue/reserve_trail.webp',
  BOIS_CLAIR: '/assets/generated/lion-phase/dialogue/village_choice.webp',
  SECOND_REFUGE: '/assets/generated/lion-phase/dialogue/lion_refuge.webp',
  WITNESS_ROAD: '/assets/generated/lion-phase/dialogue/witnesses_on_road.webp',
  SHADOW_RUINS: '/assets/generated/lion-phase/dialogue/shadow_signs.webp',
  FINAL_REFUGE: '/assets/generated/lion-phase/dialogue/lion_refuge.webp',
  LION_JUDGEMENT: '/assets/generated/lion-phase/dialogue/lion_finale_judgement.webp',
  SERPENT_FINALE: '/assets/generated/lion-phase/dialogue/epilogue.webp',
  LION_TRIAL: '/assets/generated/lion-phase/dialogue/epilogue.webp',
});

function assetRole(mode: string): string {
  if (mode === 'CINEMATIC_VIDEO') return 'VIDEO_MASTER';
  if (mode === 'CINEMATIC_HOLD') return 'HOLD_STILL';
  if (mode === 'TRAVEL_STILL') return 'TRAVEL_STILL';
  if (mode === 'STATIC_TABLEAU') return 'TABLEAU_BACKGROUND';
  if (mode === 'COMBAT') return 'COMBAT_SURFACE';
  return 'GAMEPLAY_SURFACE';
}

function castOwnership(beat: PlannedBeat): string {
  if (beat.targetPresentationMode === 'CINEMATIC_VIDEO' || beat.targetPresentationMode === 'CINEMATIC_HOLD') {
    return 'VIDEO_OWNS_CAST';
  }
  if (beat.targetPresentationMode === 'TRAVEL_STILL') return 'TRAVEL_SURFACE_OWNS_ENVIRONMENT';
  if (beat.targetPresentationMode === 'STATIC_TABLEAU') return 'STAGE_OWNS_CAST';
  return 'PRIMARY_GAMEPLAY_SURFACE';
}

function fallbackKind(mode: string): string {
  if (mode === 'CINEMATIC_VIDEO') return 'VIDEO_POSTER_OR_CONTEXT_STATIC';
  if (mode === 'CINEMATIC_HOLD') return 'HOLD_FRAME_OR_CONTEXT_STATIC';
  if (mode === 'TRAVEL_STILL') return 'TRAVEL_FAMILY_STATIC';
  if (mode === 'STATIC_TABLEAU') return 'TABLEAU_LEGACY_BACKGROUND';
  return 'NONE';
}

function releaseRule(beat: PlannedBeat): string | undefined {
  if (beat.targetPresentationMode !== 'CINEMATIC_HOLD') return undefined;
  if (beat.dialogueId === 'epilogue') return 'AT_EPILOGUE_TERMINATION';
  if (beat.beatId.startsWith('edge:')) return 'AFTER_AGENCY';
  if (beat.beatId.includes('pre_') || beat.dialogueId?.includes('pre_combat')) return 'BEFORE_COMBAT';
  return 'ON_CONTEXT_CHANGE';
}

function sourceAsset(beat: PlannedBeat): string | undefined {
  if (typeof beat.currentAsset !== 'string' || !beat.currentAsset.startsWith('/')) return undefined;
  if (beat.targetPresentationMode !== 'CINEMATIC_VIDEO' && beat.currentAsset.endsWith('.mp4')) return undefined;
  return beat.currentAsset;
}

function holdSource(beat: PlannedBeat, videoIds: Set<string>): string | undefined {
  if (beat.targetPresentationMode !== 'CINEMATIC_HOLD') return undefined;
  if (typeof beat.currentAsset === 'string' && videoIds.has(beat.currentAsset)) return beat.currentAsset;
  const inferred = beat.targetAssetRole.replace(/_hold$/, '');
  return videoIds.has(inferred) ? inferred : undefined;
}

function optional(key: string, value: unknown): Record<string, unknown> {
  return value === null || value === undefined || value === '' ? {} : { [key]: value };
}

async function main(): Promise<void> {
  const audit = JSON.parse(await readFile(AUDIT_PATH, 'utf8')) as Audit;
  const production = JSON.parse(await readFile(PRODUCTION_PATH, 'utf8')) as ProductionModes;
  if (production.schemaVersion !== 1
    || production.sourceAudit !== 'tools/cinematics/specs/final_presentation_mode_audit.json'
    || production.contractSet !== 'PRODUCTION-CONTRACTS-LOCK-1') {
    throw new Error('Production presentation source does not match the locked audit and contract set.');
  }
  const approved = new Set(production.approvedVideoIds);
  if (approved.size !== 8 || production.approvedVideoIds.length !== 8) {
    throw new Error('Production presentation source must declare exactly eight distinct video IDs.');
  }
  const historicalVideos = new Set(audit.productionVideoAudit.map((video) => video.runtimeId));
  if ([...approved].some((id) => !historicalVideos.has(id))) {
    throw new Error('An approved video ID is absent from the historical media audit.');
  }
  const historicalBeats = new Map(audit.beats.map((beat) => [beat.beatId, beat]));
  for (const [beatId, mode] of Object.entries(production.modeOverrides)) {
    const prior = historicalBeats.get(beatId);
    if (!prior || !['CINEMATIC_VIDEO', 'CINEMATIC_HOLD'].includes(prior.targetPresentationMode)
      || !['TRAVEL_STILL', 'STATIC_TABLEAU', 'COMBAT'].includes(mode)) {
      throw new Error(`Invalid production presentation override: ${beatId} -> ${mode}.`);
    }
  }
  const beats = audit.beats.map((historicalBeat) => {
    const mode = production.modeOverrides[historicalBeat.beatId] ?? historicalBeat.targetPresentationMode;
    const beat = { ...historicalBeat, targetPresentationMode: mode };
    const historicalVideoId = historicalBeat.beatId.startsWith('media:')
      ? historicalBeat.beatId.slice('media:'.length) : undefined;
    if (historicalBeat.targetPresentationMode === 'CINEMATIC_VIDEO'
      && historicalVideoId && !approved.has(historicalVideoId) && mode === 'CINEMATIC_VIDEO') {
      throw new Error(`Unconverted historical video beat: ${historicalBeat.beatId}.`);
    }
    if (historicalBeat.targetPresentationMode === 'CINEMATIC_HOLD'
      && typeof historicalBeat.currentAsset === 'string'
      && historicalVideos.has(historicalBeat.currentAsset)
      && !approved.has(historicalBeat.currentAsset)
      && mode === 'CINEMATIC_HOLD') {
      throw new Error(`Unconverted hold of retired video: ${historicalBeat.beatId}.`);
    }
    if (mode === 'CINEMATIC_VIDEO' && !approved.has(historicalVideoId ?? '')) {
      throw new Error(`Unapproved video beat: ${historicalBeat.beatId}.`);
    }
    const fallbackAsset = FAMILY_FALLBACKS[beat.visualFamily];
    const source = sourceAsset(beat);
    const cinematicId = mode === 'CINEMATIC_VIDEO' ? beat.beatId.replace(/^media:/, '') : undefined;
    const holdSourceCinematicId = holdSource(beat, approved);
    if (mode === 'CINEMATIC_HOLD' && !holdSourceCinematicId && beat.dialogueId !== 'epilogue') {
      throw new Error(`Production hold has no approved preceding video: ${beat.beatId}.`);
    }
    const staticCast = mode === 'STATIC_TABLEAU' ? beat.cast : [];
    const mediaSubjects = mode === 'CINEMATIC_VIDEO' || mode === 'CINEMATIC_HOLD' ? beat.cast : [];
    const converted = mode !== historicalBeat.targetPresentationMode;
    const assetSlotId = converted
      ? `${beat.beatId.replace(/^(media|dialogue):/, '').replace(/[^a-z0-9_]/g, '_')}_${mode.toLowerCase()}`
      : beat.targetAssetRole;
    return {
      beatId: beat.beatId,
      mode,
      visualFamily: beat.visualFamily,
      narrativePurpose: converted ? 'Production presentation conversion of the historical beat.' : beat.reason,
      ...optional('nodeId', beat.nodeId),
      ...optional('edgeId', beat.edgeId),
      ...optional('contentId', beat.contentId),
      ...optional('dialogueId', beat.dialogueId),
      ...optional('combatId', beat.combatId),
      assetRole: assetRole(mode),
      assetSlotId,
      ...optional('sourceAsset', source),
      ...optional('fallbackAsset', fallbackAsset),
      ...optional('cinematicId', cinematicId),
      ...optional('holdSourceCinematicId', holdSourceCinematicId),
      ...(mode === 'STATIC_TABLEAU' ? { tableauBackgroundId: assetSlotId } : {}),
      castOwnership: castOwnership(beat),
      staticCast,
      mediaSubjects,
      hasDialogue: beat.hasDialogue,
      hasChoice: beat.hasChoice,
      continueOnly: !beat.hasDialogue && !beat.hasChoice && !beat.hasCombat,
      ...(mode === 'CINEMATIC_HOLD' ? {
        holdContinuity: {
          location: beat.location,
          timeContext: beat.timeContext,
          encounter: beat.contentId ?? beat.nodeId ?? beat.edgeId ?? beat.beatId,
          activity: beat.activity,
        },
        releaseRule: releaseRule(beat),
      } : {}),
      preloadRefs: [...new Set([source, holdSourceCinematicId].filter((value): value is string => Boolean(value)))],
      fallbackPolicy: {
        kind: fallbackKind(mode),
        ...optional('assetId', fallbackAsset),
        neverReplaysResolvedEvent: true,
        mutatesGameTruth: false,
      },
    };
  });

  const contents = `/* eslint-disable */\n/* AUTO-GENERATED by tools/cinematics/generate_cin6d6_runtime_registry.ts. */\nimport type { ResolvedPresentationBeat } from './NarrativePresentationMode';\n\nexport const FINAL_PRESENTATION_BASELINE = '${BASELINE}' as const;\n\nexport const FINAL_PRESENTATION_BEATS = Object.freeze(${JSON.stringify(beats, null, 2)} as const satisfies readonly ResolvedPresentationBeat[]);\n`;
  await writeFile(OUTPUT_PATH, contents, 'utf8');
  console.log(JSON.stringify({ beats: beats.length, output: OUTPUT_PATH }, null, 2));
}

await main();
