import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FINAL_PRESENTATION_BEATS, FINAL_PRESENTATION_BASELINE } from '../../src/cinematics/FinalPresentationRegistry.generated';
import type { ResolvedPresentationBeat } from '../../src/cinematics/NarrativePresentationMode';

type PlannedBeat = {
  beatId: string;
  targetPresentationMode: string;
  visualFamily: string;
  hasDialogue: boolean;
  hasChoice: boolean;
};

type Audit = {
  summary: Record<string, unknown> & {
    playerFacingBeats: number;
    targetModes: Record<string, number>;
    holdExtractionsNeeded: number;
    newTravelStillsNeeded: number;
    tableauBackgroundsReusable: number;
    tableauBackgroundsRequiringRework: number;
    livingStillCandidates: number;
    existingVideosSemanticallyUnnecessary: number;
  };
  beats: PlannedBeat[];
  choiceAudit: Array<{ choiceStateId: string; dialogueId: string; visualOwner: string }>;
  ateAudit: Array<{ dialogueId: string; targetPresentationMode: string }>;
  productionVideoAudit: Array<{
    runtimeId: string;
    targetSemanticRole: string;
    shouldRemainVideo: boolean;
    hashMatchesCin6d: boolean;
    reuseStatus: string;
  }>;
  tableauBackgroundAudit: Array<{ beatId: string; classification: string; backgroundDisposition: string }>;
};

type BrowserQa = {
  pass?: boolean;
  viewports?: Record<string, { pass: boolean }>;
  flows?: Record<string, boolean>;
  maxChoiceHorizontalDeltaPx?: number;
  travelViewFlashes?: number;
  blackFlashes?: number;
  diagnostics?: unknown;
};

const ROOT = process.cwd();
const AUDIT_PATH = resolve(ROOT, 'tools/cinematics/specs/final_presentation_mode_audit.json');
const VALIDATION_PATH = resolve(ROOT, 'tools/cinematics/specs/runtime_presentation_mode_validation.json');
const IMPLEMENTATION_REPORT = resolve(ROOT, 'docs/reports/cin-6d-6-runtime-presentation-restructure.md');
const RESOLUTION_REPORT = resolve(ROOT, 'docs/reports/cin-6d-6-runtime-mode-resolution.md');
const BROWSER_QA_PATH = resolve(ROOT, 'tmp/cinematics/cin6d6/browser-qa/results.json');

async function readOptionalJson<T>(path: string): Promise<T | undefined> {
  try { return JSON.parse(await readFile(path, 'utf8')) as T; } catch { return undefined; }
}

function assetAvailability(beat: ResolvedPresentationBeat, audit: Audit): string {
  if (beat.mode === 'CINEMATIC_VIDEO') return beat.sourceAsset ? 'AVAILABLE' : 'FALLBACK_REQUIRED';
  if (beat.mode === 'CINEMATIC_HOLD') return 'PENDING_HOLD_STILL';
  if (beat.mode === 'TRAVEL_STILL') return beat.travelStillSource ? 'AVAILABLE' : 'PENDING_TRAVEL_STILL';
  if (beat.mode === 'STATIC_TABLEAU') {
    const background = audit.tableauBackgroundAudit.find((entry) => entry.beatId === beat.beatId);
    return background?.classification === 'GOOD' ? 'REUSABLE' : 'LEGACY_FALLBACK_REWORK_PENDING';
  }
  return 'AVAILABLE';
}

function fallbackLabel(beat: ResolvedPresentationBeat): string {
  if (beat.mode === 'CINEMATIC_HOLD') {
    return beat.holdSourceCinematicId ? 'SAFE_FROZEN_FRAME_THEN_CONTEXT_STATIC' : 'CONTEXT_STATIC';
  }
  return beat.fallbackPolicy.kind;
}

async function main(): Promise<void> {
  const audit = JSON.parse(await readFile(AUDIT_PATH, 'utf8')) as Audit;
  const browserQa = await readOptionalJson<BrowserQa>(BROWSER_QA_PATH);
  const runtimeBeats: readonly ResolvedPresentationBeat[] = FINAL_PRESENTATION_BEATS;
  const runtimeById = new Map(runtimeBeats.map((beat) => [beat.beatId, beat]));
  const choiceByDialogue = new Map(audit.choiceAudit.map((choice) => [choice.dialogueId, choice.visualOwner]));

  const rows = audit.beats.map((planned) => {
    const runtime = runtimeById.get(planned.beatId);
    const runtimeMode = runtime?.mode ?? 'UNCLASSIFIED';
    return {
      beat: planned.beatId,
      plannedMode: planned.targetPresentationMode,
      runtimeMode,
      visualFamily: runtime?.visualFamily ?? planned.visualFamily,
      assetAvailability: runtime ? assetAvailability(runtime, audit) : 'UNRESOLVED',
      fallback: runtime ? fallbackLabel(runtime) : 'NONE',
      dialogueOwner: planned.hasDialogue ? runtimeMode : null,
      choiceOwner: planned.hasChoice ? choiceByDialogue.get(runtime?.dialogueId ?? '') ?? null : null,
      result: runtimeMode === planned.targetPresentationMode && runtime?.visualFamily === planned.visualFamily ? 'MATCH' : 'MISMATCH',
    };
  });

  const mismatches = rows.filter((row) => row.result !== 'MATCH');
  const counts = Object.fromEntries([
    'CINEMATIC_VIDEO', 'CINEMATIC_HOLD', 'TRAVEL_STILL', 'STATIC_TABLEAU', 'COMBAT', 'GAMEPLAY_UI',
  ].map((mode) => [mode, runtimeBeats.filter((beat) => beat.mode === mode).length]));
  const validation = {
    schemaVersion: 1,
    baseline: FINAL_PRESENTATION_BASELINE,
    generatedFrom: 'tools/cinematics/specs/final_presentation_mode_audit.json',
    sourceRuntimeRegistry: 'src/cinematics/FinalPresentationRegistry.generated.ts',
    summary: {
      plannedBeats: audit.beats.length,
      runtimeBeats: runtimeBeats.length,
      matches: rows.length - mismatches.length,
      mismatches: mismatches.length,
      unclassified: rows.filter((row) => row.runtimeMode === 'UNCLASSIFIED').length,
      counts,
      choiceOwnersExact: audit.choiceAudit.filter((choice) => runtimeById.get(`dialogue:${choice.dialogueId}`)?.mode === choice.visualOwner).length,
      ateStaticTableau: audit.ateAudit.filter((ate) => runtimeById.get(`dialogue:${ate.dialogueId}`)?.mode === 'STATIC_TABLEAU').length,
      productionMediaHashesUnchanged: audit.productionVideoAudit.filter((video) => video.hashMatchesCin6d).length,
    },
    mediaInventory: audit.productionVideoAudit.map((video) => ({
      id: video.runtimeId,
      runtimeDisposition: video.shouldRemainVideo ? 'USED_AS_CINEMATIC_VIDEO' : 'CURRENTLY_NOT_REQUIRED',
      targetSemanticRole: video.targetSemanticRole,
      reuseStatus: video.reuseStatus,
      hashUnchanged: video.hashMatchesCin6d,
    })),
    rows,
  };
  await writeFile(VALIDATION_PATH, `${JSON.stringify(validation, null, 2)}\n`, 'utf8');

  const modeRows = rows.map((row) => `| \`${row.beat}\` | ${row.plannedMode} | ${row.runtimeMode} | ${row.visualFamily} | ${row.assetAvailability} | ${row.fallback} | ${row.dialogueOwner ?? '—'} | ${row.choiceOwner ?? '—'} | ${row.result} |`).join('\n');
  const resolutionReport = `# CIN-6D.6 Runtime Mode Resolution\n\n## Baseline\n\n\`${FINAL_PRESENTATION_BASELINE}\`\n\n## Coverage\n\n- Player-facing beats: ${rows.length}/144\n- Mode matches: ${rows.length - mismatches.length}/144\n- Mode mismatches: ${mismatches.length}\n- Unclassified: ${validation.summary.unclassified}\n- Choices with exact owner: ${validation.summary.choiceOwnersExact}/28\n- ATE using STATIC_TABLEAU: ${validation.summary.ateStaticTableau}/10\n\n## Runtime counts\n\n| Mode | Runtime | Planned |\n|---|---:|---:|\n${Object.entries(counts).map(([mode, count]) => `| ${mode} | ${count} | ${audit.summary.targetModes[mode]} |`).join('\n')}\n\n## Beat-by-beat resolution\n\n| Beat | Planned mode | Runtime mode | Visual family | Asset availability | Fallback | Dialogue owner | Choice owner | Result |\n|---|---|---|---|---|---|---|---|---|\n${modeRows}\n\nMODE_MISMATCHES: ${mismatches.length}\n`;
  await writeFile(RESOLUTION_REPORT, resolutionReport, 'utf8');

  const browserStatus = browserQa?.pass ? 'PASS' : 'PENDING';
  const browserFlowPasses = browserQa?.flows ? Object.values(browserQa.flows).filter(Boolean).length : 0;
  const implementationReport = `# CIN-6D.6 Runtime Presentation Restructure\n\n## Baseline\n\n\`${FINAL_PRESENTATION_BASELINE}\`\n\n## Architecture before and after\n\nPreviously, NarrativeStage inferred its surface from the presence of a cinematic ID, a static authoring selector, or an existing Journey backdrop. The runtime now resolves authoritative content identity through one pure lookup into an explicit player-facing presentation beat. The semantic mode is separate from JourneySession lifecycle state and selects one primary surface.\n\nAuthoritative game truth remains in RunSystem and the existing dialogue, combat, route, save and finale systems. The new registry only describes presentation.\n\n## Mode type\n\n\`NarrativePresentationMode\` contains exactly CINEMATIC_VIDEO, CINEMATIC_HOLD, TRAVEL_STILL and STATIC_TABLEAU. \`PlayerFacingSurfaceMode\` adds COMBAT and GAMEPLAY_UI without treating them as narrative modes.\n\n## Resolver\n\n\`NarrativePresentationResolver\` is the single pure resolution path. It accepts already-resolved beat, dialogue, cinematic, edge, node/content or combat identity and returns immutable metadata generated from the committed CIN-6D.5 audit. Production code does not load planning JSON.\n\n## Renderer ownership\n\nCINEMATIC_VIDEO and CINEMATIC_HOLD have media-owned cast and empty static cast. TRAVEL_STILL owns the complete image frame and never mounts theatrical sprites. STATIC_TABLEAU retains independent canonical sprites. COMBAT and GAMEPLAY_UI release NarrativeStage ownership.\n\n## Video behavior\n\nCinematicPlayer remains the reviewed local-video player. Video playback resolves through explicit media beats, keeps skip/reduced-motion/failure behavior, and records presentation-only completion so the same Journey boundary does not replay a resolved presentation.\n\n## Hold behavior\n\nCINEMATIC_HOLD is promoted from the relevant frozen endpoint when available. Missing decoder/frame state reconstructs through the current visual-family static fallback without replaying an event. Context changes release the hold before Travel Still, tableau or combat. Current route-ending and epilogue identities do not match, so epilogue uses the explicit safe static fallback.\n\n## Travel Still behavior\n\n\`TravelStillSurface\` is a first-class, full-frame, 16:9-safe image surface with no dialogue, actor labels or sprite cast. Missing future assets use deterministic family/tableau fallbacks and expose a non-visual DEV data marker. A typed LIVING_STILL source degrades to its static fallback under reduced motion and does not invoke CinematicPlayer.\n\n## Tableau behavior\n\nSTATIC_TABLEAU retains the existing large canonical full sprites, intentional bottom crop, speaker focus, listener dimming and choice geometry. Reveal cinematics release before extended dialogue tableaux mount.\n\n## Asset-role separation\n\nEvery beat has an explicit role: VIDEO_MASTER, HOLD_STILL, TRAVEL_STILL, TABLEAU_BACKGROUND, COMBAT_SURFACE or GAMEPLAY_SURFACE. \`tableauBackgroundId\` is independent from dialogue identity, enabling CIN-6E replacement by metadata.\n\n## Visual family integration\n\nAll 13 committed families are typed and attached to all 144 beats. They influence only source/fallback selection and diagnostics.\n\n## Preload strategy\n\nJourney preloads only currently authoritative successor candidates. Video references continue through CinematicPreloader; image references are deduplicated separately and released with NarrativeStage.\n\n## Fallback strategy\n\nEach mode preserves its semantics: video falls back to its context, hold never replays a resolved event, Travel Still falls back to its current family image, and tableau falls back to the existing dialogue background. No fallback changes game truth.\n\n## Save and resume\n\nNo save field was added. Presentation is reconstructed from the authoritative current node/content/dialogue identities. Frames, decoder position, DOM, opacity and semantic mode are not persisted.\n\n## Browser QA\n\nStatus: ${browserStatus}.\n\n${browserQa ? `- Required A–P flows: ${browserFlowPasses}/16 PASS\n- 1920×1080: ${browserQa.viewports?.['1920x1080']?.pass ? 'PASS' : 'FAIL'}\n- 1366×768: ${browserQa.viewports?.['1366x768']?.pass ? 'PASS' : 'FAIL'}\n- Choice maximum horizontal delta: ${browserQa.maxChoiceHorizontalDeltaPx ?? 'n/a'} px\n- TravelView flashes: ${browserQa.travelViewFlashes ?? 'n/a'}\n- Black flashes: ${browserQa.blackFlashes ?? 'n/a'}\n` : '- Browser results are generated separately by the deterministic Chromium QA runner.\n'}\n## Regression results\n\n- Runtime mapping: ${rows.length - mismatches.length}/144 match\n- Choice ownership: ${validation.summary.choiceOwnersExact}/28 exact\n- ATE ownership: ${validation.summary.ateStaticTableau}/10 STATIC_TABLEAU\n- Production media hashes: ${validation.summary.productionMediaHashesUnchanged}/31 unchanged\n\n## Protected systems\n\nRunSystem, save schema, dialogue truth, choice effects, route consequences, combat runtime and VFX remain unchanged. Production media remains untouched. TravelView remains production default.\n\n## Remaining pending media work\n\nNo media was generated. Current runtime slots use the CIN-6D.5 temporary fallbacks until the visual pipeline supplies reviewed assets.\n\n## READY FOR VISUAL PIPELINE\n\n- CINEMATIC_VIDEO slots: ${counts.CINEMATIC_VIDEO}\n- HOLD_STILL assets missing: ${audit.summary.holdExtractionsNeeded}\n- TRAVEL_STILL assets missing: ${audit.summary.newTravelStillsNeeded}\n- TABLEAU_BACKGROUND assets requiring rework: ${audit.summary.tableauBackgroundsRequiringRework}\n- TABLEAU_BACKGROUND assets reusable: ${audit.summary.tableauBackgroundsReusable}\n- LIVING_STILL candidates: ${audit.summary.livingStillCandidates}\n- Existing videos semantically reclassified: ${audit.summary.existingVideosSemanticallyUnnecessary}\n`;
  await writeFile(IMPLEMENTATION_REPORT, implementationReport, 'utf8');

  console.log(JSON.stringify(validation.summary, null, 2));
}

await main();
