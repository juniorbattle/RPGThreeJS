import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN6EA_BASE_URL ?? 'http://127.0.0.1:5173';
const CANDIDATE = resolve(
  process.env.CIN6EA_CANDIDATE
    ?? resolve(process.cwd(), 'tmp/cinematics/cin6ea/execution/pilot_a/smoke/pilot_a_static_tableau_background_a.png'),
);
const CANDIDATE_ID = process.env.CIN6EA_CANDIDATE_ID ?? 'pilot_a_static_tableau_background_a';
const DIALOGUE_ID = process.env.CIN6EA_DIALOGUE_ID ?? 'lion_briefing';
const VISUAL_FAMILY = process.env.CIN6EA_VISUAL_FAMILY ?? 'ALARIC_AUDIENCE';
const TARGET_STEP_ID = process.env.CIN6EA_STEP_ID ?? '';
const SHOW_CHOICES = process.env.CIN6EA_SHOW_CHOICES === '1';
const OUTPUT_DIR = resolve(
  process.env.CIN6EA_OUTPUT_DIR
    ?? resolve(process.cwd(), 'tmp/cinematics/cin6ea/execution/pilot_a/runtime-composite-a'),
);
const VIEWPORTS = Object.freeze([
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
]);
const CANDIDATE_URL = `${BASE_URL}/__cin6ea/${CANDIDATE_ID}.png`;

function diagnosticsFor(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('[VFX Preview]')) {
      diagnostics.consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    diagnostics.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  return diagnostics;
}

async function installPilotSurface(page) {
  await page.goto(`${BASE_URL}/?presentation=narrative&media=stills&qa=1`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ candidateUrl, candidateId, dialogueId, visualFamily }) => {
    const root = document.querySelector('#app');
    if (!(root instanceof HTMLElement)) throw new Error('Missing #app root.');
    root.replaceChildren();
    const canvas = document.querySelector('#world-canvas');
    if (canvas instanceof HTMLElement) canvas.style.display = 'none';
    document.body.className = '';
    document.body.dataset.mode = 'NARRATIVE';

    const [stageModule, tableauModule, registryModule, playerModule, dialogueModule, adapterModule, contentModule, storeModule] = await Promise.all([
      import('/src/cinematics/NarrativeStage.ts'),
      import('/src/cinematics/NarrativeTableau.ts'),
      import('/src/cinematics/CinematicRegistry.ts'),
      import('/src/cinematics/CinematicPlayer.ts'),
      import('/src/ui/DialogueView.ts'),
      import('/src/cinematics/NarrativeDialogueAdapter.ts'),
      import('/src/game/content.ts'),
      import('/src/game/store.ts'),
    ]);

    const registry = new registryModule.CinematicRegistry({ version: 1, cinematics: [] });
    const player = new playerModule.CinematicPlayer(registry, root);
    const stage = new stageModule.NarrativeStage({
      player,
      registry,
      root,
      mediaMode: 'STILL',
      transitionRevealMs: 0,
      loadingIndicatorDelayMs: 0,
      dev: true,
    });
    const sequence = contentModule.dialogues.get(dialogueId);
    if (!sequence) throw new Error(`Missing ${dialogueId} dialogue.`);
    const tableau = tableauModule.resolveNarrativeDialogueTableau(dialogueId, sequence);
    if (!tableau) throw new Error(`Missing ${dialogueId} tableau.`);

    stage.setTableau(tableau);
    stage.bindDialogue(sequence);
    stage.setPresentationBeat({
      beatId: `cin6ea:${candidateId}`,
      mode: 'STATIC_TABLEAU',
      visualFamily,
      narrativePurpose: 'DEV-only CIN-6E-A background-fit validation in the production NarrativeStage.',
      dialogueId: sequence.id,
      assetRole: 'TABLEAU_BACKGROUND',
      assetSlotId: candidateId,
      sourceAsset: candidateUrl,
      fallbackAsset: tableau.stillImage,
      tableauBackgroundId: candidateId,
      castOwnership: 'STAGE_OWNS_CAST',
      staticCast: tableau.cast.visualActors,
      mediaSubjects: [],
      hasDialogue: true,
      hasChoice: true,
      continueOnly: false,
      preloadRefs: [candidateUrl],
      fallbackPolicy: {
        kind: 'TABLEAU_LEGACY_BACKGROUND',
        assetId: tableau.stillImage,
        neverReplaysResolvedEvent: true,
        mutatesGameTruth: false,
      },
    });
    await stage.presentStill(candidateUrl, `cin6ea:${candidateId}`);

    const state = storeModule.createInitialState();
    const view = new dialogueModule.DialogueView({
      root: stage.dialogueLayer,
      getState: () => state,
      applyEffects: async () => undefined,
    });
    const stepPresentation = adapterModule.createNarrativeDialogueResolver(sequence, tableau, {
      mediaMode: 'STILL',
      hasMovingMedia: false,
    });
    void view.play(sequence, {
      mode: 'narrative-stage',
      root: stage.dialogueLayer,
      stepPresentation,
      reducedMotion: true,
      onStepChange: (step, presentation) => stage.activateDialogueStep(
        step.id,
        presentation.mode,
        presentation.anchorId,
        presentation.phaseId,
        step.actorId,
        presentation.presentationStrategy,
        presentation.layoutProfile,
        presentation.layoutPlacement,
        presentation.dialogueSurfaceMode,
      ),
    });
    window.__cin6eaPilot = { stage, view };
  }, { candidateUrl: CANDIDATE_URL, candidateId: CANDIDATE_ID, dialogueId: DIALOGUE_ID, visualFamily: VISUAL_FAMILY });

  await page.locator('.narrative-stage[data-presentation-mode="STATIC_TABLEAU"]').waitFor({ state: 'visible' });
  const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${DIALOGUE_ID}"]`);
  await dialogue.waitFor({ state: 'visible' });
  if (TARGET_STEP_ID) {
    for (let index = 0; index < 40; index += 1) {
      if (await dialogue.getAttribute('data-dialogue-step') === TARGET_STEP_ID) break;
      await dialogue.locator('.dialogue__box').click({ force: true });
      await page.waitForTimeout(25);
    }
    const reached = await dialogue.getAttribute('data-dialogue-step');
    if (reached !== TARGET_STEP_ID) throw new Error(`Could not reach ${DIALOGUE_ID}:${TARGET_STEP_ID}; stopped at ${reached}.`);
  }
  if (SHOW_CHOICES) {
    await dialogue.locator('.dialogue__box').click({ force: true });
    await dialogue.locator('.dialogue-choice').first().waitFor({ state: 'visible' });
  }
  await page.locator('.narrative-cast__actor.is-speaking img').waitFor({ state: 'visible' });
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}

async function readMetrics(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.narrative-stage');
    const surface = stage?.querySelector('.narrative-scene-surface');
    const card = stage?.querySelector('.dialogue__box');
    const cast = [...(stage?.querySelectorAll('.narrative-cast__actor') ?? [])];
    const cardRect = card?.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      stage: {
        presentationMode: stage?.dataset.presentationMode ?? null,
        visualFamily: stage?.dataset.visualFamily ?? null,
        assetRole: stage?.dataset.presentationAssetRole ?? null,
        tableauBackgroundId: stage?.dataset.tableauBackgroundId ?? null,
        castOwnership: stage?.dataset.narrativeCastOwnership ?? null,
        mediaSurface: stage?.dataset.narrativeMediaSurface ?? null,
        primarySurfaceInvariant: stage?.dataset.primarySurfaceInvariant ?? null,
      },
      surface: {
        scene: surface?.dataset.narrativeScene ?? null,
        visualPhase: surface?.dataset.visualPhase ?? null,
        layoutPlacement: surface?.dataset.layoutPlacement ?? null,
        backgroundImage: getComputedStyle(surface?.querySelector('.narrative-scene-surface__environment') ?? document.body).backgroundImage,
      },
      dialogue: {
        sequence: stage?.querySelector('.dialogue')?.dataset.dialogueSequence ?? null,
        step: stage?.querySelector('.dialogue')?.dataset.dialogueStep ?? null,
        actor: stage?.querySelector('.dialogue')?.dataset.dialogueActor ?? null,
        placement: stage?.querySelector('.dialogue')?.dataset.narrativePlacement ?? null,
        sceneMode: stage?.querySelector('.dialogue')?.dataset.narrativeSceneMode ?? null,
        text: stage?.querySelector('.dialogue__text-reveal')?.textContent ?? '',
        card: cardRect ? {
          x: cardRect.x,
          y: cardRect.y,
          width: cardRect.width,
          height: cardRect.height,
          topPercent: cardRect.y / window.innerHeight * 100,
          widthPercent: cardRect.width / window.innerWidth * 100,
        } : null,
      },
      cast: cast.map((actor) => {
        const image = actor.querySelector('img');
        const rect = actor.getBoundingClientRect();
        return {
          actorId: actor.dataset.actorId ?? null,
          screenPosition: actor.dataset.screenPosition ?? null,
          castState: actor.dataset.castState ?? null,
          physicalScale: actor.dataset.physicalScale ?? null,
          opacity: getComputedStyle(actor).opacity,
          image: image?.getAttribute('src') ?? null,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      }),
      counts: {
        primarySurfaces: stage?.querySelectorAll('[data-narrative-layer="media"] > .narrative-media-surface, [data-narrative-layer="media"] > .cinematic-overlay').length ?? 0,
        actors: cast.length,
        underCharacterLabels: stage?.querySelectorAll('.narrative-cast__label').length ?? 0,
        choiceButtons: stage?.querySelectorAll('.dialogue-choice').length ?? 0,
      },
    };
  });
}

await mkdir(OUTPUT_DIR, { recursive: true });
const candidateBytes = await readFile(CANDIDATE);
const browser = await chromium.launch({ headless: true });
const report = {
  mission: 'CIN-6E-A.1 exact-image runtime composite QA',
  candidate: CANDIDATE,
  candidateId: CANDIDATE_ID,
  dialogueId: DIALOGUE_ID,
  visualFamily: VISUAL_FAMILY,
  targetStepId: TARGET_STEP_ID || null,
  showChoices: SHOW_CHOICES,
  candidateUrl: CANDIDATE_URL,
  generatedAt: new Date().toISOString(),
  captures: [],
};

try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const diagnostics = diagnosticsFor(page);
    await page.route(CANDIDATE_URL, (route) => route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: candidateBytes,
    }));
    await installPilotSurface(page);
    const id = `${viewport.width}x${viewport.height}`;
    const stepSuffix = TARGET_STEP_ID ? `-step-${TARGET_STEP_ID}` : '';
    const screenshot = resolve(OUTPUT_DIR, `${id}-${CANDIDATE_ID}${stepSuffix}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    report.captures.push({ id, screenshot, metrics: await readMetrics(page), diagnostics });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(resolve(OUTPUT_DIR, 'runtime-composite-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
