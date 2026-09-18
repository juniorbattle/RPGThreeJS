import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.MASTER_UI_BASE_URL ?? 'http://127.0.0.1:5173';
const QA_ROOT = resolve('public/assets/dev/option-c/master-ui-integration-v1/qa');
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];
const SURFACES = [
  { id: 'normal-dialogue', surface: 'Canonical single-speaker Tableau', actorId: 'sage_seraphine', ownership: 'MASTER_FULL_BODY' },
  { id: 'tableau-2-actor', surface: 'Static Tableau (2 actor)', ownership: 'MASTER_FULL_BODY' },
  { id: 'tableau-4-actor', surface: 'Static Tableau (4 actor)', ownership: 'MASTER_FULL_BODY' },
  { id: 'travel-advisors', surface: 'TravelView', ownership: 'MASTER_FULL_BODY' },
  { id: 'hero-party', surface: 'ManagementView party/roster', ownership: 'MASTER_RUNTIME_CROP' },
  { id: 'hero-party-marian', surface: 'ManagementView Marian showcase', ownership: 'MASTER_RUNTIME_CROP' },
  { id: 'civilian-dialogue', surface: 'Canonical civilian Tableau', actorId: 'refugee_mother', ownership: 'MASTER_FULL_BODY' },
];
const BEFORE_AFTER_SURFACES = new Set(SURFACES.map(({ id }) => id));
const BEFORE_AT_1920 = new Set(['tableau-4-actor', 'travel-advisors', 'hero-party']);
const BASELINE_PRESENTATION_CSS = `
  .dialogue__portrait { height:min(70vh,780px) !important; }
  .dialogue__portrait.has-image {
    background-position:calc(50% + var(--dialogue-actor-offset-x,0px) + 28px) calc(100% - 10px) !important;
    background-size:auto var(--dialogue-actor-scale,112%) !important;
  }
  .travel-party { --travel-master-scale:1.8 !important; }
  .travel-hero { width:clamp(86px,8.4vw,126px) !important; }
  .unit-stage__figure {
    width:min(86%,440px) !important;
    height:min(70vh,610px) !important;
    padding-bottom:18px !important;
    transform:translateY(-4px) !important;
  }
  .unit-stage__figure img { transform:scale(1.12) !important; }
`;

const manifest = JSON.parse(await readFile(
  resolve('public/assets/characters/pixel/character-system-v2-manifest.json'),
  'utf8',
));
const masterById = new Map(manifest.units.map((unit) => [unit.unitId, unit.master.src]));
const browser = await chromium.launch({ headless: true });
const records = [];
const screenshots = [];
const beforeAfterComparisons = [];
const browserErrors = [];
const characterRequestFailures = [];
const FOLLOWUP_REPORT = 'tableau-dialogue-followup-report.json';
const PROTECTED_ASSET_LOCKS = {
  masters: {
    root: 'public/assets/characters/pixel/masters',
    expectedCount: 37,
    expectedManifestSha256: '103a31c804f2343198e318296a0d6c5d4ecf1eea5f8b61253750a3cea452d3c7',
  },
  combatPoses: {
    root: 'public/assets/characters/pixel/combat',
    expectedCount: 100,
    expectedManifestSha256: '58d009fadb6c61c6f8dcd1f478f6a00d84a6d13a7a5493574530c93ba980fad8',
  },
};
let canonicalDialogueCensus;

async function auditProtectedAssetDirectory(lock) {
  const root = resolve(lock.root);
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const absolutePath = resolve(entry.parentPath ?? entry.path, entry.name);
    const relativePath = relative(root, absolutePath).replaceAll('\\', '/');
    const sha256 = createHash('sha256').update(await readFile(absolutePath)).digest('hex');
    files.push({ path: relativePath, sha256 });
  }
  files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const manifestText = files.map(({ path, sha256 }) => `${path}\t${sha256}`).join('\n');
  const manifestSha256 = createHash('sha256').update(manifestText, 'utf8').digest('hex');
  return {
    root: lock.root,
    fileCount: files.length,
    expectedCount: lock.expectedCount,
    manifestSha256,
    expectedManifestSha256: lock.expectedManifestSha256,
    files,
    result: files.length === lock.expectedCount && manifestSha256 === lock.expectedManifestSha256 ? 'PASS' : 'FAIL',
  };
}

async function loadHarness(page) {
  await page.goto(`${BASE_URL}/docs/reports/cin-6e-a-4r-dialogue-review.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await page.evaluate(async () => {
    if (!document.querySelector('link[data-master-ui-runtime-css]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/src/styles/app.css';
      css.dataset.masterUiRuntimeCss = 'true';
      document.head.append(css);
      await new Promise((resolveLoad, rejectLoad) => {
        css.addEventListener('load', resolveLoad, { once: true });
        css.addEventListener('error', rejectLoad, { once: true });
      });
    }
    const [content, store, catalog, travel, management, dialogue, tableaux, segments, surface, adapter] = await Promise.all([
      import('/src/game/content.ts'),
      import('/src/game/store.ts'),
      import('/src/game/catalog.ts'),
      import('/src/ui/TravelView.ts'),
      import('/src/ui/ManagementView.ts'),
      import('/src/ui/DialogueView.ts'),
      import('/src/cinematics/NarrativeTableau.ts'),
      import('/src/cinematics/DialoguePresentationSegments.ts'),
      import('/src/cinematics/NarrativeSceneSurface.ts'),
      import('/src/cinematics/NarrativeDialogueAdapter.ts'),
    ]);
    window.__masterUiQa = { content, store, catalog, travel, management, dialogue, tableaux, segments, surface, adapter };
  });
}

async function auditCanonicalDialoguePresentation(page) {
  return page.evaluate(() => {
    const modules = window.__masterUiQa;
    const failures = [];
    let stepCount = 0;
    for (const sequence of modules.content.dialogues.values()) {
      const base = modules.tableaux.resolveNarrativeDialogueTableau(sequence.id, sequence)
        ?? modules.tableaux.createGenericNarrativeTableau(sequence);
      const tableau = modules.segments.applyFinalDialoguePresentationPlan(sequence, base);
      const resolver = modules.adapter.createNarrativeDialogueResolver(sequence, tableau, { mediaMode: 'STILL' });
      const presentations = sequence.steps.map((step) => resolver(step));
      stepCount += sequence.steps.length;
      const alignment = modules.tableaux.validateDialogueCast(
        tableau,
        sequence,
        modules.adapter.resolveRepresentedDialogueActors(sequence, resolver),
      );
      const invalidSteps = sequence.steps.filter((step, index) => {
        const presentation = presentations[index];
        return presentation.dialogueSurfaceMode !== 'STATIC_TABLEAU'
          || presentation.showPortrait !== false
          || presentation.castOwnership !== 'STAGE_OWNS_CAST'
          || presentation.speakerVisibleBeforeLine !== true;
      }).map((step) => step.id);
      if (alignment.status === 'FAIL' || invalidSteps.length > 0) {
        failures.push({
          dialogueId: sequence.id,
          alignmentStatus: alignment.status,
          unresolved: alignment.unresolved,
          invalidSteps,
        });
      }
    }
    return {
      dialogueCount: modules.content.dialogues.size,
      stepCount,
      staticTableauDialogueCount: modules.content.dialogues.size - failures.length,
      playerFacingStandaloneBottomDialogues: failures.length,
      failures,
      result: failures.length === 0 ? 'PASS' : 'FAIL',
    };
  });
}

async function renderSurface(page, surface) {
  return page.evaluate(async ({ id, actorId }) => {
    const modules = window.__masterUiQa;
    window.__masterUiQaView?.close?.();
    window.__masterUiQaSurface?.dispose?.();
    document.body.replaceChildren();
    document.body.removeAttribute('class');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#050914';

    const fullPartyState = () => {
      const state = modules.store.createInitialState();
      for (const id of ['rogue', 'lancer']) {
        if (!state.clan.members.some((unit) => unit.definitionId === id)) {
          state.clan.members.push(modules.catalog.createUnitInstance(id, true));
        }
      }
      return state;
    };

    const mountTableau = async (sequence, tableau, phase, step, revealChoices = false) => {
      const stage = document.createElement('section');
      stage.className = 'narrative-stage';
      const media = document.createElement('div');
      media.className = 'narrative-stage__media';
      const dialogueRoot = document.createElement('div');
      dialogueRoot.className = 'narrative-stage__dialogue';
      stage.append(media, dialogueRoot);
      document.body.append(stage);
      const resolver = modules.adapter.createNarrativeDialogueResolver(sequence, tableau, { mediaMode: 'STILL' });
      const presentation = resolver(step);
      const sceneSurface = new modules.surface.NarrativeSceneSurface(media, tableau, { reducedMotion: true });
      sceneSurface.bindDialogue(sequence);
      sceneSurface.mount(tableau.stillImage ?? modules.dialogue.resolveDialogueBackdrop(sequence), phase.id);
      await sceneSurface.whenRenderable();
      await sceneSurface.setPhase(
        phase.id,
        step.actorId,
        presentation.layoutPlacement,
        presentation.speakerFacing,
        presentation.speakerLookTarget,
        presentation.addressedTo,
        presentation.addressResolution,
      );
      const view = new modules.dialogue.DialogueView({
        root: dialogueRoot,
        getState: modules.store.createInitialState,
        applyEffects: async () => undefined,
      });
      const renderedStep = { ...step, next: null, choices: revealChoices ? step.choices : [] };
      void view.play({ ...sequence, steps: [renderedStep] }, {
        mode: 'narrative-stage',
        root: dialogueRoot,
        reducedMotion: true,
        stepPresentation: resolver,
      });
      await new Promise((resolveWait) => window.setTimeout(resolveWait, 80));
      if (revealChoices) {
        dialogueRoot.querySelector('.dialogue__box')?.click();
        await new Promise((resolveWait) => window.setTimeout(resolveWait, 40));
      }
      window.__masterUiQaView = view;
      window.__masterUiQaSurface = sceneSurface;
      return {
        routeOrContext: `${sequence.id}:${phase.id}:${step.id}`,
        characterIds: phase.staticCast.map((actor) => actor.actorId),
      };
    };

    if (id === 'normal-dialogue' || id === 'civilian-dialogue') {
      let selected;
      let selectedScore = -Infinity;
      for (const sequence of modules.content.dialogues.values()) {
        if (!sequence.steps.some((step) => step.actorId === actorId)) continue;
        const base = modules.tableaux.resolveNarrativeDialogueTableau(sequence.id, sequence)
          ?? modules.tableaux.createGenericNarrativeTableau(sequence);
        const tableau = modules.segments.applyFinalDialoguePresentationPlan(sequence, base);
        for (const phase of tableau.phases ?? []) {
          if (!phase.staticCast.some((actor) => actor.actorId === actorId)) continue;
          const step = sequence.steps.find((candidate) => candidate.actorId === actorId && phase.stepIds.includes(candidate.id));
          if (!step) continue;
          const uniqueSpeakers = new Set(sequence.steps.map((candidate) => candidate.actorId).filter(Boolean)).size;
          const score = (uniqueSpeakers === 1 ? 100 : 0) - (phase.staticCast.length * 10) - sequence.steps.length;
          if (score <= selectedScore) continue;
          selected = { sequence, tableau, phase, step };
          selectedScore = score;
        }
      }
      if (!selected) throw new Error(`No active Tableau dialogue step for ${actorId}.`);
      return mountTableau(selected.sequence, selected.tableau, selected.phase, selected.step);
    }

    if (id === 'travel-advisors') {
      const state = fullPartyState();
      const view = new modules.travel.TravelView({
        root: document.body,
        getState: () => state,
        onSelect: async () => undefined,
        onOpenClan: () => undefined,
        onSave: () => undefined,
        onOpenMenu: () => undefined,
      });
      view.open();
      window.__masterUiQaView = view;
      return {
        routeOrContext: 'production TravelView/full party',
        characterIds: Array.from(document.querySelectorAll('.travel-hero')).map((actor) => actor.dataset.characterId),
      };
    }

    if (id === 'hero-party' || id === 'hero-party-marian') {
      const state = fullPartyState();
      const view = new modules.management.ManagementView({
        root: document.body,
        getState: () => state,
        onChange: () => undefined,
      });
      void view.open('clan');
      if (id === 'hero-party-marian') {
        const marian = state.clan.members.find((unit) => unit.definitionId === 'white_mage');
        document.querySelector(`[data-unit="${marian?.id ?? ''}"]`)?.click();
      }
      window.__masterUiQaView = view;
      return {
        routeOrContext: `production ManagementView/clan/${id === 'hero-party-marian' ? 'Marian' : 'Alistair'}`,
        characterIds: state.clan.members.map((unit) => unit.definitionId),
      };
    }

    const isCivilianTableau = id === 'tableau-civilian';
    const explicitDialogueId = id === 'tableau-pre-combat'
      ? 'pre_opening_trail'
      : id === 'tableau-post-combat'
        ? 'post_opening_trail'
        : undefined;
    const targetCount = isCivilianTableau || explicitDialogueId || id === 'tableau-choice'
      ? undefined
      : id === 'tableau-2-actor' ? 2 : 4;
    const preferred = id === 'tableau-2-actor' ? ['alaric', 'maelor'] : ['sage_seraphine'];
    const civilianIds = ['refugee_mother', 'survivor', 'villageoise'];
    let selected;
    let selectedScore = -1;
    for (const sequence of modules.content.dialogues.values()) {
      if (explicitDialogueId && sequence.id !== explicitDialogueId) continue;
      const base = modules.tableaux.resolveNarrativeDialogueTableau(sequence.id, sequence)
        ?? modules.tableaux.createGenericNarrativeTableau(sequence);
      const tableau = modules.segments.applyFinalDialoguePresentationPlan(sequence, base);
      for (const phase of tableau.phases ?? []) {
        if (targetCount !== undefined && phase.staticCast.length !== targetCount) continue;
        const ids = phase.staticCast.map((actor) => actor.actorId);
        const phaseStep = sequence.steps.find((candidate) => (
          phase.stepIds.includes(candidate.id)
          && phase.staticCast.some((actor) => actor.actorId === candidate.actorId)
          && (id !== 'tableau-choice' || Boolean(candidate.choices?.length))
        ));
        const score = explicitDialogueId
          ? 10
          : id === 'tableau-choice'
            ? (phaseStep?.choices?.length ?? 0)
          : isCivilianTableau
          ? ids.filter((characterId) => civilianIds.includes(characterId)).length
          : id === 'tableau-2-actor'
          ? (ids.includes('alaric') ? 2 : 0) + (ids.includes('maelor') ? 1 : 0)
          : (preferred.every((characterId) => ids.includes(characterId)) ? 1 : 0);
        if (score <= selectedScore || score === 0) continue;
        const step = phaseStep;
        if (step) {
          selected = { sequence, tableau, phase, step };
          selectedScore = score;
        }
      }
    }
    if (!selected) throw new Error(`No production Tableau matched ${id}.`);
    const { sequence, tableau, phase, step } = selected;
    return mountTableau(sequence, tableau, phase, step, id === 'tableau-choice');
  }, surface);
}

async function renderStandaloneSurface(page, surface) {
  return page.evaluate(async ({ actorId }) => {
    const modules = window.__masterUiQa;
    window.__masterUiQaView?.close?.();
    window.__masterUiQaSurface?.dispose?.();
    document.body.replaceChildren();
    document.body.removeAttribute('class');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#050914';
    const sequence = [...modules.content.dialogues.values()].find((candidate) => (
      candidate.steps.some((step) => step.actorId === actorId)
    ));
    const step = sequence?.steps.find((candidate) => candidate.actorId === actorId);
    if (!sequence || !step) throw new Error(`No compatibility dialogue step for ${actorId}.`);
    const view = new modules.dialogue.DialogueView({
      root: document.body,
      getState: modules.store.createInitialState,
      applyEffects: async () => undefined,
    });
    void view.play({ ...sequence, steps: [{ ...step, next: null, choices: [] }] }, { reducedMotion: true });
    await new Promise((resolveWait) => window.setTimeout(resolveWait, 80));
    window.__masterUiQaView = view;
    return { routeOrContext: `${sequence.id}:compatibility-before`, characterIds: [actorId] };
  }, surface);
}

async function collectMetrics(page, surface, context) {
  return page.evaluate(async ({ surface, context }) => {
    const selectors = {
      'normal-dialogue': '.narrative-cast__actor img',
      'civilian-dialogue': '.narrative-cast__actor img',
      'tableau-2-actor': '.narrative-cast__actor img',
      'tableau-4-actor': '.narrative-cast__actor img',
      'tableau-civilian': '.narrative-cast__actor img',
      'tableau-choice': '.narrative-cast__actor img',
      'tableau-pre-combat': '.narrative-cast__actor img',
      'tableau-post-combat': '.narrative-cast__actor img',
      'travel-advisors': '.travel-hero__sprite',
      'hero-party': '.roster-card__portrait img, .unit-stage__figure img',
      'hero-party-marian': '.roster-card__portrait img, .unit-stage__figure img',
    };
    const elements = Array.from(document.querySelectorAll(selectors[surface.id]));
    const visible = elements.length > 0 && elements.every((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (element instanceof HTMLImageElement && (!element.complete || element.naturalWidth === 0)) return false;
      if (element instanceof HTMLElement && element.classList.contains('dialogue__portrait') && !style.backgroundImage.includes('/assets/characters/')) return false;
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0;
    });
    const actorImages = Array.from(document.querySelectorAll('.narrative-cast__actor img'));
    const visibleDialoguePortraits = Array.from(document.querySelectorAll('.dialogue__portrait.is-visible')).filter((element) => (
      getComputedStyle(element).backgroundImage.includes('/assets/characters/')
    ));
    const duplicateActor = actorImages.length > 0 && visibleDialoguePortraits.length > 0;
    const alphaCache = new Map();
    const opaqueBounds = async (element) => {
      const rect = element.getBoundingClientRect();
      if (!(element instanceof HTMLImageElement) || !element.complete || !element.naturalWidth) {
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      }
      let alpha = alphaCache.get(element.currentSrc || element.src);
      if (!alpha) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = element.naturalWidth;
          canvas.height = element.naturalHeight;
          const context2d = canvas.getContext('2d', { willReadFrequently: true });
          context2d.drawImage(element, 0, 0);
          const pixels = context2d.getImageData(0, 0, canvas.width, canvas.height).data;
          let minX = canvas.width;
          let minY = canvas.height;
          let maxX = -1;
          let maxY = -1;
          for (let y = 0; y < canvas.height; y += 1) {
            for (let x = 0; x < canvas.width; x += 1) {
              if (pixels[((y * canvas.width + x) * 4) + 3] < 8) continue;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
          alpha = maxX >= minX
            ? { minX, minY, maxX: maxX + 1, maxY: maxY + 1, naturalWidth: canvas.width, naturalHeight: canvas.height }
            : { minX: 0, minY: 0, maxX: canvas.width, maxY: canvas.height, naturalWidth: canvas.width, naturalHeight: canvas.height };
        } catch {
          alpha = { minX: 0, minY: 0, maxX: element.naturalWidth, maxY: element.naturalHeight, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight };
        }
        alphaCache.set(element.currentSrc || element.src, alpha);
      }
      const style = getComputedStyle(element);
      let contentLeft = rect.left;
      let contentTop = rect.top;
      let contentWidth = rect.width;
      let contentHeight = rect.height;
      if (style.objectFit === 'contain') {
        const scale = Math.min(rect.width / alpha.naturalWidth, rect.height / alpha.naturalHeight);
        contentWidth = alpha.naturalWidth * scale;
        contentHeight = alpha.naturalHeight * scale;
        contentLeft = rect.left + ((rect.width - contentWidth) / 2);
        contentTop = style.objectPosition.includes('bottom') || style.objectPosition.endsWith('100%')
          ? rect.bottom - contentHeight
          : rect.top + ((rect.height - contentHeight) / 2);
      }
      const scaleX = contentWidth / alpha.naturalWidth;
      const scaleY = contentHeight / alpha.naturalHeight;
      const left = contentLeft + (alpha.minX * scaleX);
      const top = contentTop + (alpha.minY * scaleY);
      const right = contentLeft + (alpha.maxX * scaleX);
      const bottom = contentTop + (alpha.maxY * scaleY);
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    };
    const bodyElements = surface.id.startsWith('hero-party')
      ? Array.from(document.querySelectorAll('.unit-stage__figure img'))
      : surface.id === 'travel-advisors'
        ? Array.from(document.querySelectorAll('.travel-hero__sprite'))
        : Array.from(document.querySelectorAll('.narrative-cast__actor img'));
    const bodyBounds = await Promise.all(bodyElements.map(opaqueBounds));
    const imageStyles = elements.map((element) => {
      const style = getComputedStyle(element);
      const owner = element.closest('[data-actor-id], [data-character-id], .travel-hero, .roster-card__portrait, .unit-stage__figure, .dialogue__portrait');
      return {
        characterId: owner?.dataset.actorId ?? owner?.dataset.characterId ?? (element instanceof HTMLImageElement ? element.alt : '') ?? '',
        src: element instanceof HTMLImageElement ? new URL(element.src).pathname : style.backgroundImage,
        objectFit: style.objectFit || 'background-image',
        objectPosition: style.objectPosition || style.backgroundPosition,
        transform: style.transform,
        cropMode: owner?.dataset.uiCrop ?? owner?.dataset.cropPolicy ?? 'surface-default',
      };
    });
    const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const intersectionRatio = (a, b) => {
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return (width * height) / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
    };
    const protectedUi = Array.from(document.querySelectorAll('.dialogue__box:not([hidden]), .dialogue-choice, .travel-view__hud, .travel-view__choices, .management__header'));
    const protectedUiCollision = bodyBounds.some((body) => {
      const face = { left: body.left, right: body.right, top: body.top, bottom: body.top + (body.height * 0.38) };
      return protectedUi.some((ui) => intersects(face, ui.getBoundingClientRect()));
    });
    const stageBounds = document.querySelector('.unit-stage')?.getBoundingClientRect();
    const clipped = bodyBounds.some((body) => (
      body.left < -2 || body.right > innerWidth + 2 || body.top < -2 || body.bottom > innerHeight + 2
      || (surface.id.startsWith('hero-party') && stageBounds && (
        body.left < stageBounds.left - 2 || body.right > stageBounds.right + 2
        || body.top < stageBounds.top - 2 || body.bottom > stageBounds.bottom + 2
      ))
    ));
    let actorOverlaps = 0;
    let actorHeadOverlaps = 0;
    for (let leftIndex = 0; leftIndex < bodyBounds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bodyBounds.length; rightIndex += 1) {
        const left = bodyBounds[leftIndex];
        const right = bodyBounds[rightIndex];
        const threshold = surface.id === 'travel-advisors' ? 0.04 : 0.12;
        if (intersectionRatio(left, right) > threshold) actorOverlaps += 1;
        const leftHead = { ...left, bottom: left.top + (left.height * 0.34), height: left.height * 0.34 };
        const rightHead = { ...right, bottom: right.top + (right.height * 0.34), height: right.height * 0.34 };
        if (intersectionRatio(leftHead, rightHead) > 0.08) actorHeadOverlaps += 1;
      }
    }
    const groundContactViolation = bodyBounds.length > 1
      && Math.max(...bodyBounds.map((body) => body.bottom)) - Math.min(...bodyBounds.map((body) => body.bottom)) > innerHeight * 0.045;
    const labels = Array.from(document.querySelectorAll('.travel-hero figcaption')).map((label) => label.getBoundingClientRect());
    let travelLabelCollisions = 0;
    for (let leftIndex = 0; leftIndex < labels.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < labels.length; rightIndex += 1) {
        if (intersects(labels[leftIndex], labels[rightIndex])) travelLabelCollisions += 1;
      }
    }
    const choices = Array.from(document.querySelectorAll('.dialogue-choice')).map((choice) => choice.getBoundingClientRect());
    const choiceGeometryViolation = choices.some((choice) => (
      choice.left < 0 || choice.right > innerWidth || choice.top < 0 || choice.bottom > innerHeight
    )) || choices.some((choice, index) => choices.slice(index + 1).some((other) => intersects(choice, other)));
    const companyProtected = Array.from(document.querySelectorAll('.roster, .unit-sheet, .management__header')).map((item) => item.getBoundingClientRect());
    const companyRegisterCollisions = surface.id.startsWith('hero-party')
      ? bodyBounds.filter((body) => companyProtected.some((target) => intersects(body, target))).length
      : 0;
    const activeSpeaker = document.querySelector('.narrative-cast__actor.is-speaking img');
    const hiddenSpeaker = Boolean(document.querySelector('.narrative-stage')) && (!activeSpeaker || !bodyElements.includes(activeSpeaker));
    const standaloneBottomPanel = Boolean(document.querySelector('.dialogue:not(.dialogue--narrative) .dialogue__portrait.is-visible'));
    const root = document.querySelector('.dialogue, .narrative-stage, .travel-view, .management');
    const overflow = root ? document.documentElement.scrollWidth > innerWidth + 1 : true;
    const visibleBodyHeights = bodyBounds.map((body) => Math.round(body.height * 100) / 100);
    const visibleBodyViewportRatios = bodyBounds.map((body) => Math.round((body.height / innerHeight) * 10_000) / 100);
    const featuredUnit = surface.id.startsWith('hero-party') && bodyBounds[0] && stageBounds ? {
      characterId: document.querySelector('.unit-stage__figure img')?.alt ?? '',
      visibleBodyHeight: visibleBodyHeights[0],
      panelHeight: Math.round(stageBounds.height * 100) / 100,
      panelRatio: Math.round((bodyBounds[0].height / stageBounds.height) * 10_000) / 100,
    } : undefined;
    const passesGeometry = !clipped && !duplicateActor && !protectedUiCollision && !overflow
      && actorOverlaps === 0 && actorHeadOverlaps === 0 && !groundContactViolation
      && travelLabelCollisions === 0 && !choiceGeometryViolation && companyRegisterCollisions === 0
      && !hiddenSpeaker && !standaloneBottomPanel;
    return {
      surface: surface.surface,
      routeOrContext: context.routeOrContext,
      characterIds: context.characterIds,
      assetOwnership: surface.ownership,
      masterPaths: imageStyles.map((item) => item.src).filter((src) => src.includes('/assets/characters/pixel/masters/')),
      viewport: `${innerWidth}x${innerHeight}`,
      cropMode: [...new Set(imageStyles.map((item) => item.cropMode))].join(', '),
      scale: imageStyles.map((item) => item.transform),
      offset: imageStyles.map((item) => item.objectPosition),
      objectFit: [...new Set(imageStyles.map((item) => item.objectFit))].join(', '),
      objectPosition: [...new Set(imageStyles.map((item) => item.objectPosition))].join(', '),
      visible,
      clipped,
      duplicateActor,
      protectedUiCollision,
      overflow,
      hiddenSpeaker,
      actorOverlaps,
      actorHeadOverlaps,
      groundContactViolation,
      choiceGeometryViolation,
      travelLabelCollisions,
      companyRegisterCollisions,
      standaloneBottomPanel,
      visibleBodyHeights,
      visibleBodyViewportRatios,
      visibleBodyBounds: bodyBounds.map((body) => Object.fromEntries(
        Object.entries(body).map(([key, value]) => [key, Math.round(value * 100) / 100]),
      )),
      featuredUnit,
      result: visible && passesGeometry ? 'PASS' : 'FAIL',
      imageStyles,
    };
  }, { surface, context });
}

try {
  await mkdir(QA_ROOT, { recursive: true });
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push({ viewport, kind: 'console', message: message.text() });
    });
    page.on('pageerror', (error) => browserErrors.push({ viewport, kind: 'pageerror', message: error.message }));
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.pathname.includes('/assets/characters/') && response.status() >= 400) {
        characterRequestFailures.push({ viewport, status: response.status(), path: url.pathname });
      }
    });
    await loadHarness(page);
    if (!canonicalDialogueCensus) canonicalDialogueCensus = await auditCanonicalDialoguePresentation(page);
    for (const surface of SURFACES) {
      const rendered = await renderSurface(page, surface);
      await page.waitForTimeout(120);
      const record = await collectMetrics(page, surface, rendered);
      records.push(record);
      const filename = `followup-after-${viewport.width}x${viewport.height}-${surface.id}.png`;
      await page.screenshot({ path: resolve(QA_ROOT, filename), animations: 'disabled' });
      const afterPath = `public/assets/dev/option-c/master-ui-integration-v1/qa/${filename}`;
      screenshots.push(afterPath);
      const shouldCaptureBefore = BEFORE_AFTER_SURFACES.has(surface.id)
        && (viewport.width === 1366 || BEFORE_AT_1920.has(surface.id));
      if (shouldCaptureBefore) {
        if (surface.id === 'normal-dialogue' || surface.id === 'civilian-dialogue') {
          await renderStandaloneSurface(page, surface);
        } else {
          await page.evaluate((css) => {
            const style = document.createElement('style');
            style.id = 'master-ui-baseline-override';
            style.textContent = css;
            document.head.append(style);
            for (const actor of document.querySelectorAll('.narrative-cast__actor')) {
              actor.style.setProperty('--narrative-actor-scale', actor.dataset.physicalScale ?? '1');
            }
          }, BASELINE_PRESENTATION_CSS);
        }
        await page.waitForTimeout(80);
        const beforeFilename = `followup-before-${viewport.width}x${viewport.height}-${surface.id}.png`;
        await page.screenshot({ path: resolve(QA_ROOT, beforeFilename), animations: 'disabled' });
        const beforePath = `public/assets/dev/option-c/master-ui-integration-v1/qa/${beforeFilename}`;
        screenshots.push(beforePath);
        beforeAfterComparisons.push({ surface: surface.surface, viewport: `${viewport.width}x${viewport.height}`, before: beforePath, after: afterPath });
        await page.evaluate(() => document.querySelector('#master-ui-baseline-override')?.remove());
      }
    }
    for (const actorId of ['survivor', 'villageoise']) {
      const surface = { id: 'civilian-dialogue', surface: 'Canonical civilian Tableau audit', actorId, ownership: 'MASTER_FULL_BODY' };
      const rendered = await renderSurface(page, surface);
      await page.waitForTimeout(80);
      records.push(await collectMetrics(page, surface, rendered));
    }
    const auditSurfaces = [
      { id: 'tableau-civilian', surface: 'Static Tableau civilian audit', ownership: 'MASTER_FULL_BODY' },
      { id: 'tableau-choice', surface: 'Static Tableau choice audit', ownership: 'MASTER_FULL_BODY' },
      { id: 'tableau-pre-combat', surface: 'Static Tableau pre-combat audit', ownership: 'MASTER_FULL_BODY' },
      { id: 'tableau-post-combat', surface: 'Static Tableau post-combat audit', ownership: 'MASTER_FULL_BODY' },
    ];
    for (const auditSurface of auditSurfaces) {
      const auditContext = await renderSurface(page, auditSurface);
      await page.waitForTimeout(80);
      records.push(await collectMetrics(page, auditSurface, auditContext));
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const auditedCharacterIds = [...new Set(records.flatMap((record) => record.characterIds))];
const requiredCharacters = [
  'alistair', 'white_mage', 'dark_mage', 'archer', 'rogue', 'lancer',
  'alaric', 'maelor', 'sage_seraphine', 'refugee_mother', 'survivor', 'villageoise', 'wounded_merchant',
];
const allMasterPaths = requiredCharacters.map((id) => masterById.get(id)).filter(Boolean);
const assetOnlyAudits = await Promise.all(['wounded_merchant'].map(async (characterId) => {
  const masterPath = masterById.get(characterId);
  let fileBytes = 0;
  if (masterPath) {
    try {
      fileBytes = (await readFile(resolve('public', masterPath.replace(/^\//, '')))).byteLength;
    } catch {
      fileBytes = 0;
    }
  }
  return {
    characterId,
    activeUiConsumer: false,
    validation: 'MASTER_PATH_AND_FILE_BYTES',
    masterPath,
    fileBytes,
    result: masterPath === `/assets/characters/pixel/masters/${characterId}.png` && fileBytes > 0 ? 'PASS' : 'FAIL',
  };
}));
const protectedAssetHashes = {
  masters: await auditProtectedAssetDirectory(PROTECTED_ASSET_LOCKS.masters),
  combatPoses: await auditProtectedAssetDirectory(PROTECTED_ASSET_LOCKS.combatPoses),
};
const report = {
  schemaVersion: 2,
  mission: 'Option C Character System V2 canonical Tableau dialogue and final scale follow-up',
  generatedAt: new Date().toISOString(),
  status: records.every((record) => record.result === 'PASS')
    && assetOnlyAudits.every((record) => record.result === 'PASS')
    && canonicalDialogueCensus?.result === 'PASS'
    && Object.values(protectedAssetHashes).every((entry) => entry.result === 'PASS')
    && browserErrors.length === 0
    && characterRequestFailures.length === 0 ? 'PASS' : 'FAIL',
  viewports: VIEWPORTS.map(({ width, height }) => `${width}x${height}`),
  requiredCharacters,
  auditedCharacterIds,
  assetOnlyAudits,
  canonicalDialogueCensus,
  protectedAssetHashes,
  requiredMasterPaths: allMasterPaths,
  records,
  beforeAfterComparisons,
  browserErrors,
  characterRequestFailures,
  screenshots,
};
await writeFile(resolve(QA_ROOT, FOLLOWUP_REPORT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status: report.status,
  canonicalDialogueCensus,
  recordResults: records.map((record) => `${record.viewport}:${record.surface}:${record.result}`),
  protectedAssetHashes: Object.fromEntries(Object.entries(protectedAssetHashes).map(([key, value]) => [key, {
    fileCount: value.fileCount,
    manifestSha256: value.manifestSha256,
    result: value.result,
  }])),
  browserErrors,
  characterRequestFailures,
  screenshots: screenshots.length,
  report: `public/assets/dev/option-c/master-ui-integration-v1/qa/${FOLLOWUP_REPORT}`,
}, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
