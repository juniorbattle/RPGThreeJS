/**
 * R2C-VFX LAB V2 — Simple Preset Composer panel UI.
 *
 * The NORMAL authoring experience. Layout:
 *
 *   ACTION SELECT / PRESET ID
 *   VISUAL SPRITESHEETS   (slot cards + ADD SPRITESHEET)
 *   COMPOSITION           (TOGETHER / SEQUENCE / PAIR THEN LAST)
 *   TECHNICAL POLISH      (AUTO / OFF / LIGHT / STRONG)
 *   PLAY VISUALS ONLY | PLAY FULL PRESET | SAVE DRAFT
 *   ADVANCED (collapsed)  raw numeric overrides, exceptional cases only
 *
 * Work queues, lifecycle, fingerprints, validated snapshots and the raw
 * presentation matrix are NOT part of this mental model. They remain available
 * in the legacy workbench under SYSTEM / DEBUG TOOLS.
 */

import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  getLabActions,
  getLabAction,
  buildCatalogue,
  searchCatalogue,
  getVisualSpriteSheetSteps,
  getQaSourceId,
  loadLabStateFromStorage,
} from './CombatVfxLab';
import type { LabAction, LabCatalogueRecord } from './CombatVfxLab';
import {
  getGroupedActionsInScope,
  getVfxActionScope,
  getActionsInScope,
} from './DemoVfxActionScope';
import { buildDemoWorkloadSummary } from './DemoVfxWorkload';
import {
  addSlot,
  removeSlot,
  replaceSlotCandidate,
  updateSlotProfile,
  setTechnicalPolish,
  setSlotAdvancedOverride,
  clearSlotAdvancedOverride,
  createDraftFromAction,
  compileDraft,
  choreographyCompatibility,
  VFX_SIZE_PROFILES,
  VFX_TIMING_PROFILES,
  VFX_PLACEMENT_PROFILES,
  VFX_CHOREOGRAPHIES,
  VFX_TECHNICAL_POLISH_LEVELS,
  VFX_FIXED_DIRECTION_PROFILES,
  VFX_MIRROR_PROFILES,
  VFX_PIVOT_PROFILES,
  VFX_ROTATION_PRESETS,
  VFX_POSITION_MODES,
  VFX_TRAVEL_FROM_ENDPOINTS,
  VFX_TRAVEL_TO_ENDPOINTS,
  VFX_IMPACT_POWERS,
  VFX_TRAJECTORY_PROFILES,
  DEFAULT_ROTATION_DEGREES,
  DEFAULT_PIVOT_PROFILE,
  DEFAULT_TRAVEL_FROM,
  DEFAULT_TRAVEL_TO,
  DEFAULT_TRAJECTORY_PROFILE,
  DEFAULT_IMPACT_POWER,
  DEFAULT_PHASE,
  MAX_PHASE,
  setSlotPositionMode,
  setSlotTrajectoryProfile,
  nudgeSlotPhase,
  toggleSlotImpactFx,
  setSlotImpactPower,
  resolveSlotPositionMode,
  resolveSlotDirectionProfile,
  resolveSlotMirrorProfile,
  resolveSlotPhases,
  hasActiveImpactFx,
  addCasterMotion,
  removeCasterMotion,
  updateCasterMotion,
  addBeat,
  removeBeat,
  addVfxToBeat,
  addMotionToBeat,
  setBeatStartDelay,
  setBeatComposition,
  deriveBeatsFromPhases,
  hasExplicitBeats,
} from './VfxPresetComposer';
import {
  CASTER_MOTION_TYPES,
  CASTER_MOTION_DESTINATIONS,
  resolveCasterMotionStep,
  type CasterMotionType,
  type CasterMotionDestination,
  type CasterMotionStep,
} from './CasterMotion';
import type {
  VfxPresetDraft,
  VfxVisualSlot,
  VfxSizeProfile,
  VfxTimingProfile,
  VfxPlacementProfile,
  VfxTechnicalPolish,
  VfxAimProfile,
  VfxMirrorProfile,
  VfxPivotProfile,
  VfxPositionMode,
  VfxTravelEndpoint,
  VfxImpactPower,
  VfxTrajectoryProfile,
} from './VfxPresetComposer';
import {
  loadComposerStore,
  saveComposerStore,
  loadComposerUiPrefs,
  saveComposerUiPrefs,
  putDraft,
  getDraft,
  setSelectedActionKey,
  exportComposerDrafts,
  importComposerDrafts,
  createEmptyComposerStore,
  getCandidateCadence,
  isSlotPlayable,
  unplayableSlotCandidates,
  playDraftVisualsOnly,
  playDraftFull,
  playDraftInCombatStage,
  recordSavedFingerprint,
  getSavedStatus,
} from './VfxComposerPlayback';
import type { ComposerPlaybackContext, ComposerStore, ComposerDisplayMode, ComposerAuthoringScope } from './VfxComposerPlayback';
import { buildBatchPublishPlan } from './BatchPublishPlan';
import { ensureDraftRuntimeReady, ensureCandidateRuntimeReady } from './VfxRuntimeReadiness';
import type { DraftReadinessResult } from './VfxRuntimeReadiness';
import { resolvePreview } from './VfxPreviewResolver';
import { filterDefaultComposerCatalogue } from './VfxSourceSuitability';
import {
  computeFingerprint,
  compareFingerprint,
  draftToPublishedEntry,
  publishedPresetId,
  getPublishedEntry,
  publishedEntryToDraft,
  type PublishedVfxRegistry,
  type PublishedVfxEntry,
} from './PublishedVfxRegistry';
import { getActiveRegistry, __devUpdateOverlay, __devClearOverlay } from './PublishedVfxResolver';
import { resolveCandidateSource } from './VfxResourceManager';

const COMPOSER_STYLE_ID = 'r2c-vfx-composer-style';
const COMPOSER_ROOT_ID = 'r2c-vfx-composer';

export interface ComposerPanelOptions {
  enabled: boolean;
  playback?: ComposerPlaybackContext;
}

export function installVfxComposerPanel(options: ComposerPanelOptions): () => void {
  if (!options.enabled || typeof document === 'undefined' || document.getElementById(COMPOSER_ROOT_ID)) {
    return () => {};
  }

  const fullCatalogue = buildCatalogue(inventoryJson as never);
  const catalogue = filterDefaultComposerCatalogue(fullCatalogue);

  // START delay presets for per-beat startDelay control.
  const START_DELAY_PRESETS: ReadonlyArray<readonly [string, number]> = [
    ['INSTANT', 0],
    ['SHORT', 0.3],
    ['MEDIUM', 0.6],
    ['LONG', 1.0],
  ];

  let store: ComposerStore = loadComposerStore(localStorage);
  const actions = getLabActions();
  let currentActionKey = store.selectedActionKey ?? actions[0]?.actionKey ?? '';
  let catalogueOpen = false;
  let catalogueSearch = '';
  let cataloguePage = 1;
  let advancedOpen = false;
  let replaceTargetSlotId: string | null = null;
  let addVfxToBeatId: string | null = null;
  const uiPrefs = loadComposerUiPrefs(localStorage);
  let displayMode: ComposerDisplayMode = uiPrefs.displayMode;
  // V2.6.3 — the stored action always wins over the stored scope, so reloading
  // never silently swaps the operator onto an unrelated DEMO action.
  let authoringScope: ComposerAuthoringScope = currentActionKey
    ? getVfxActionScope(currentActionKey)
    : uiPrefs.authoringScope;
  let bridgeAvailable = true;

  async function checkBridgeHealth(): Promise<void> {
    try {
      const res = await fetch('/dev/vfx-preview-health');
      if (!res.ok) { bridgeAvailable = false; return; }
      const data = await res.json() as { ok?: boolean };
      bridgeAvailable = data.ok === true;
    } catch {
      bridgeAvailable = false;
    }
    if (!bridgeAvailable) render();
  }

  function persistUiPrefs(): void {
    saveComposerUiPrefs(localStorage, { displayMode, authoringScope });
  }

  function setDisplayMode(mode: ComposerDisplayMode): void {
    displayMode = mode;
    persistUiPrefs();
    render();
  }

  /**
   * V2.6.3 — switching scope only changes which actions the ACTION list shows.
   * Drafts, saved fingerprints and publications are never touched.
   */
  function setAuthoringScope(scope: ComposerAuthoringScope): void {
    if (authoringScope === scope) return;
    authoringScope = scope;
    if (getVfxActionScope(currentActionKey) !== scope) {
      const first = getActionsInScope(scope)[0];
      if (first) {
        currentActionKey = first.actionKey;
        store = setSelectedActionKey(store, currentActionKey);
        saveComposerStore(localStorage, store);
      }
    }
    catalogueOpen = false;
    replaceTargetSlotId = null;
    addVfxToBeatId = null;
    persistUiPrefs();
    render();
  }

  addComposerStyle();

  const root = document.createElement('aside');
  root.id = COMPOSER_ROOT_ID;
  document.body.appendChild(root);

  void checkBridgeHealth();

  const statusLine = document.createElement('div');
  statusLine.className = 'cmp-status';

  /** Migrates an existing action into a draft when none exists yet. */
  function ensureDraft(actionKey: string): VfxPresetDraft {
    const existing = getDraft(store, actionKey);
    if (existing) return existing;
    const action = getLabAction(actionKey);
    const draft = createDraftFromAction(buildMigrationSource(action));
    store = putDraft(store, draft);
    return draft;
  }

  /** Seeds slots from the action's visual steps plus any existing QA candidate. */
  function buildMigrationSource(action: LabAction | undefined) {
    if (!action) {
      return { actionKey: currentActionKey, visualSteps: [] };
    }
    const labState = loadLabStateFromStorage(localStorage);
    const visualSteps = getVisualSpriteSheetSteps(action).map((visual) => {
      const step = action.vfxSteps[visual.stepIndex];
      const qaCandidate = getQaSourceId(labState, action.actionKey, visual.stepIndex);
      return {
        ...(qaCandidate ?? step?.sourceCandidateId
          ? { candidateId: qaCandidate ?? step?.sourceCandidateId }
          : {}),
        ...(step?.spriteSheetId ? { spriteSheetId: step.spriteSheetId } : {}),
        ...(step?.anchor ? { anchor: step.anchor } : {}),
        ...(step?.presentation?.layer ? { layer: step.presentation.layer } : {}),
      };
    });
    return {
      actionKey: action.actionKey,
      presetId: action.currentPresetId ?? `composer_${action.actionKey}`,
      ...(action.apCost !== undefined ? { tier: action.apCost } : {}),
      visualSteps,
    };
  }

  function persist(draft: VfxPresetDraft): void {
    store = putDraft(store, draft);
    saveComposerStore(localStorage, store);
  }

  function currentDraft(): VfxPresetDraft {
    return ensureDraft(currentActionKey);
  }

  function mutate(next: VfxPresetDraft): void {
    persist(next);
    render();
  }

  // ---------------------------------------------------------------- rendering

  function render(): void {
    root.textContent = '';
    root.classList.toggle('cmp-minimized', displayMode === 'minimized');
    const draft = currentDraft();

    if (displayMode === 'minimized') {
      root.appendChild(renderMinimizedDock(draft));
      return;
    }

    const minBtn = buildButton('MINIMIZE', 'cmp-minimize', () => setDisplayMode('minimized'));
    minBtn.setAttribute('aria-label', 'MINIMIZE VFX PRESET COMPOSER');
    minBtn.title = 'Minimize VFX Preset Composer';
    root.appendChild(minBtn);

    root.appendChild(renderHeader(draft));
    if (authoringScope === 'DEMO') root.appendChild(renderDemoWorkload());
    root.appendChild(renderChoreography(draft));
    if (catalogueOpen) root.appendChild(renderCataloguePicker(draft));
    root.appendChild(renderPrimaryActions(draft));
    root.appendChild(renderAdvanced(draft));
    root.appendChild(statusLine);
  }

  function renderMinimizedDock(draft: VfxPresetDraft): HTMLElement {
    const dock = document.createElement('div');
    dock.className = 'cmp-dock';

    const title = document.createElement('div');
    title.className = 'cmp-dock-title';
    title.textContent = 'VFX PRESET COMPOSER';
    dock.appendChild(title);

    const action = getLabAction(draft.actionKey);
    const ctx = document.createElement('div');
    ctx.className = 'cmp-dock-context';
    ctx.textContent = action ? `${action.displayName} · ${draft.presetId}` : draft.presetId;
    dock.appendChild(ctx);

    const expandBtn = buildButton('EXPAND', 'cmp-expand', () => setDisplayMode('expanded'));
    expandBtn.setAttribute('aria-label', 'EXPAND VFX PRESET COMPOSER');
    expandBtn.title = 'Expand VFX Preset Composer';
    dock.appendChild(expandBtn);

    return dock;
  }

  function renderHeader(draft: VfxPresetDraft): HTMLElement {
    const header = document.createElement('div');
    header.className = 'cmp-header';

    const title = document.createElement('div');
    title.className = 'cmp-title';
    title.textContent = 'VFX PRESET COMPOSER';
    header.appendChild(title);

    // ---- V2.6.3 SCOPE selector ----
    const scopeRow = document.createElement('div');
    scopeRow.className = 'cmp-row cmp-scope-row';
    const scopeLabel = document.createElement('span');
    scopeLabel.className = 'cmp-scope-label';
    scopeLabel.textContent = 'SCOPE';
    scopeRow.appendChild(scopeLabel);

    const demoBtn = buildButton('DEMO SCOPE', 'cmp-scope-demo', () => setAuthoringScope('DEMO'));
    demoBtn.classList.toggle('is-active', authoringScope === 'DEMO');
    scopeRow.appendChild(demoBtn);

    const upcomingBtn = buildButton('À VENIR', 'cmp-scope-upcoming', () => setAuthoringScope('UPCOMING'));
    upcomingBtn.classList.toggle('is-active', authoringScope === 'UPCOMING');
    scopeRow.appendChild(upcomingBtn);
    header.appendChild(scopeRow);

    const actionRow = document.createElement('div');
    actionRow.className = 'cmp-row';
    const actionLabel = document.createElement('label');
    actionLabel.textContent = 'ACTION';
    const select = document.createElement('select');
    select.className = 'cmp-action-select';
    for (const bucket of getGroupedActionsInScope(authoringScope)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = bucket.label;
      for (const action of bucket.actions) {
        const opt = document.createElement('option');
        opt.value = action.actionKey;
        opt.textContent = `${action.displayName} (${action.actionKey})`;
        optgroup.appendChild(opt);
      }
      select.appendChild(optgroup);
    }
    select.value = currentActionKey;
    select.addEventListener('change', () => {
      currentActionKey = select.value;
      store = setSelectedActionKey(store, currentActionKey);
      catalogueOpen = false;
      replaceTargetSlotId = null;
      addVfxToBeatId = null;
      saveComposerStore(localStorage, store);
      render();
    });
    actionLabel.appendChild(select);
    actionRow.appendChild(actionLabel);
    header.appendChild(actionRow);

    const presetInfo = document.createElement('div');
    presetInfo.className = 'cmp-preset-id';
    presetInfo.innerHTML = `<b>PRESET</b> ${draft.presetId}`;
    header.appendChild(presetInfo);

    return header;
  }

  /**
   * V2.6.3 — DEMO scope workload dashboard. Read-only authoring telemetry; it
   * never gates SAVE, PUBLISH or playback.
   */
  function renderDemoWorkload(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section cmp-workload';
    section.dataset.section = 'demo_workload';

    const summary = buildDemoWorkloadSummary(store, getActiveRegistry());

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = `DEMO WORKLOAD (${summary.published}/${summary.actions} PUBLISHED)`;
    section.appendChild(heading);

    const counters = document.createElement('div');
    counters.className = 'cmp-workload-counters';
    const cells: readonly [string, number, string][] = [
      ['ACTIONS', summary.actions, 'total'],
      ['PUBLISHED', summary.published, 'published'],
      ['READY', summary.ready, 'ready'],
      ['IN PROGRESS', summary.inProgress, 'progress'],
      ['REMAINING', summary.remaining, 'remaining'],
    ];
    for (const [label, value, kind] of cells) {
      const cell = document.createElement('div');
      cell.className = 'cmp-workload-cell';
      cell.dataset.counter = kind;
      const num = document.createElement('span');
      num.className = 'cmp-workload-value';
      num.textContent = String(value);
      const cap = document.createElement('span');
      cap.className = 'cmp-workload-caption';
      cap.textContent = label;
      cell.appendChild(num);
      cell.appendChild(cap);
      counters.appendChild(cell);
    }
    section.appendChild(counters);

    const groups = document.createElement('div');
    groups.className = 'cmp-workload-groups';
    for (const group of summary.groups) {
      const row = document.createElement('div');
      row.className = 'cmp-workload-group';
      row.dataset.group = group.group;
      const name = document.createElement('span');
      name.className = 'cmp-workload-group-name';
      name.textContent = group.label;
      const count = document.createElement('span');
      count.className = 'cmp-workload-group-count';
      count.textContent = `${group.done}/${group.total}`;
      if (group.done === group.total) row.classList.add('is-complete');
      row.appendChild(name);
      row.appendChild(count);
      groups.appendChild(row);
    }
    section.appendChild(groups);

    return section;
  }

  // ---------------------------------------------------------- slot authoring UI

  /** Compact labels used by the normal slot UI. */
  const AT_LABELS: Record<string, string> = {
    AUTO: 'AUTO', TARGET: 'TARGET', FRONT: 'T.FRONT', BACK: 'T.BACK', TOP: 'T.TOP',
    BOTTOM: 'T.BOTTOM', CASTER: 'CASTER', CASTER_FRONT: 'C.FRONT', CASTER_BACK: 'C.BACK', GROUND: 'GROUND',
  };
  const TRAVEL_LABELS: Record<string, string> = {
    CASTER: 'CASTER', CASTER_FRONT: 'C.FRONT', CASTER_BACK: 'C.BACK', TARGET: 'TARGET',
    FRONT: 'T.FRONT', BACK: 'T.BACK', TOP: 'T.TOP', BOTTOM: 'T.BOTTOM', GROUND: 'GROUND', SKY: 'SKY',
  };
  const TRAJECTORY_LABELS: Record<string, string> = {
    STRAIGHT: 'STRAIGHT', ARC_LOW: 'ARC LOW', ARC_HIGH: 'ARC HIGH',
  };
  const DIRECTION_LABELS: Record<string, string> = {
    FIXED: 'FIXED', TO_TARGET: 'TO TARGET', ALONG_PATH: 'ALONG PATH',
  };
  const MIRROR_LABELS: Record<string, string> = {
    NONE: 'NONE', AUTO_HORIZONTAL: 'AUTO', HORIZONTAL: 'H', VERTICAL: 'V', BOTH: 'BOTH',
  };
  const ORIGIN_LABELS: Record<string, string> = {
    CENTER: 'C', LEFT: 'L', RIGHT: 'R', TOP: 'T', BOTTOM: 'B',
  };

  /**
   * CASTER MOTION labels. Phrased as intentions ("STEP IN", "CROSS THROUGH")
   * rather than as engine identifiers, matching the Composer's semantic style.
   */
  const MOTION_TYPE_LABELS: Record<string, string> = {
    IDLE: 'HOLD', DASH_SHORT: 'STEP IN', DASH_THROUGH: 'CROSS THROUGH',
    JUMP_UP: 'JUMP UP', JUMP_DOWN: 'DROP DOWN', JUMP_ARC: 'LEAP',
  };
  const MOTION_DESTINATION_LABELS: Record<string, string> = {
    ORIGIN: 'IN PLACE', TARGET: 'TARGET', TARGET_FRONT: 'T.FRONT', TARGET_BACK: 'T.BACK',
  };
  const MOTION_DURATION_LABELS: Record<string, string> = {
    '0.12': 'FAST', '0.2': 'NORMAL', '0.35': 'SLOW', '0.6': 'VERY SLOW',
  };
  /** Semantic time presets — the author never types raw seconds. */
  const MOTION_START_PRESETS: readonly number[] = [0, 0.15, 0.3, 0.5, 0.8, 1.2];
  const MOTION_DURATION_PRESETS: readonly number[] = [0.12, 0.2, 0.35, 0.6];

  /**
   * Compact indicators for non-default configuration, so the author can read a
   * slot's special behaviour without reopening anything.
   */
  function buildSlotBadges(slot: VfxVisualSlot, phase: number): string[] {
    const badges: string[] = [];
    const positionMode = resolveSlotPositionMode(slot);
    if (positionMode === 'TRAVEL') {
      const from = TRAVEL_LABELS[slot.travelFrom ?? DEFAULT_TRAVEL_FROM] ?? '?';
      const to = TRAVEL_LABELS[slot.travelTo ?? DEFAULT_TRAVEL_TO] ?? '?';
      badges.push(`${from} -> ${to}`);
    }
    const direction = resolveSlotDirectionProfile(slot);
    if (direction === 'TO_TARGET') badges.push('DIR TARGET');
    const rotation = slot.rotationDegrees ?? DEFAULT_ROTATION_DEGREES;
    if (rotation !== DEFAULT_ROTATION_DEGREES) badges.push(`${rotation > 0 ? '+' : ''}${rotation}°`);
    const mirror = resolveSlotMirrorProfile(slot);
    if (mirror === 'AUTO_HORIZONTAL') badges.push('AUTO ↔');
    else if (mirror === 'HORIZONTAL') badges.push('↔');
    else if (mirror === 'VERTICAL') badges.push('↕');
    else if (mirror === 'BOTH') badges.push('↔↕');
    const origin = slot.pivotProfile ?? DEFAULT_PIVOT_PROFILE;
    if (origin !== DEFAULT_PIVOT_PROFILE) badges.push(`ORIGIN ${ORIGIN_LABELS[origin]}`);
    if (phase !== DEFAULT_PHASE) badges.push(`PHASE ${phase}`);
    if (hasActiveImpactFx(slot.impactFx)) {
      const channels: string[] = [];
      if (slot.impactFx?.flash) channels.push('F');
      if (slot.impactFx?.shake) channels.push('S');
      badges.push(`FX: ${channels.join('+')}`);
    }
    return badges;
  }

  /**
   * The normal slot authoring surface.
   *
   * SIZE / SPEED / POSITION are always visible. AT is shown only for FIXED,
   * FROM+TO only for TRAVEL, DIRECTION only when the path does not already
   * define it, and POWER only when an Impact FX channel is active.
   */
  function buildSlotProfiles(draft: VfxPresetDraft, slot: VfxVisualSlot, phase: number): HTMLElement {
    const profiles = document.createElement('div');
    profiles.className = 'cmp-slot-profiles';

    profiles.appendChild(buildProfileControl<VfxSizeProfile>(
      'SIZE', VFX_SIZE_PROFILES, slot.sizeProfile,
      (value) => mutate(updateSlotProfile(draft, slot.id, { sizeProfile: value })),
    ));
    profiles.appendChild(buildProfileControl<VfxTimingProfile>(
      'SPEED', VFX_TIMING_PROFILES, slot.timingProfile,
      (value) => mutate(updateSlotProfile(draft, slot.id, { timingProfile: value })),
    ));

    const positionMode = resolveSlotPositionMode(slot);
    profiles.appendChild(buildProfileControl<VfxPositionMode>(
      'POSITION', VFX_POSITION_MODES, positionMode,
      (value) => mutate(setSlotPositionMode(draft, slot.id, value)),
    ));

    if (positionMode === 'FIXED') {
      profiles.appendChild(buildProfileControl<VfxPlacementProfile>(
        'AT', VFX_PLACEMENT_PROFILES, slot.placementProfile,
        (value) => mutate(updateSlotProfile(draft, slot.id, { placementProfile: value })),
        AT_LABELS,
      ));
    } else {
      profiles.appendChild(buildProfileControl<VfxTravelEndpoint>(
        'FROM', VFX_TRAVEL_FROM_ENDPOINTS, slot.travelFrom ?? DEFAULT_TRAVEL_FROM,
        (value) => mutate(updateSlotProfile(draft, slot.id, { travelFrom: value })),
        TRAVEL_LABELS,
      ));
      profiles.appendChild(buildProfileControl<VfxTravelEndpoint>(
        'TO', VFX_TRAVEL_TO_ENDPOINTS, slot.travelTo ?? DEFAULT_TRAVEL_TO,
        (value) => mutate(updateSlotProfile(draft, slot.id, { travelTo: value })),
        TRAVEL_LABELS,
      ));
      profiles.appendChild(buildProfileControl<VfxTrajectoryProfile>(
        'TRAJECTORY', VFX_TRAJECTORY_PROFILES, slot.trajectoryProfile ?? DEFAULT_TRAJECTORY_PROFILE,
        (value) => mutate(setSlotTrajectoryProfile(draft, slot.id, value)),
        TRAJECTORY_LABELS,
      ));
    }

    // ---- TRANSFORM
    const transformSection = document.createElement('div');
    transformSection.className = 'cmp-slot-transform';
    const badges = buildSlotBadges(slot, phase);
    if (badges.length > 0) {
      const badge = document.createElement('div');
      badge.className = 'cmp-slot-transform-badge';
      badge.textContent = badges.join(' · ');
      transformSection.appendChild(badge);
    }
    const transformRow = document.createElement('div');
    transformRow.className = 'cmp-slot-profiles';

    // TRAVEL orients ALONG PATH automatically, so DIRECTION stays hidden there.
    if (positionMode === 'FIXED') {
      transformRow.appendChild(buildProfileControl<VfxAimProfile>(
        'DIRECTION', VFX_FIXED_DIRECTION_PROFILES, resolveSlotDirectionProfile(slot),
        (value) => mutate(updateSlotProfile(draft, slot.id, { aimProfile: value })),
        DIRECTION_LABELS,
      ));
    }
    transformRow.appendChild(buildProfileControl<string>(
      'ROTATE',
      VFX_ROTATION_PRESETS.map(String),
      String(slot.rotationDegrees ?? DEFAULT_ROTATION_DEGREES),
      (value) => mutate(updateSlotProfile(draft, slot.id, { rotationDegrees: Number(value) })),
    ));
    transformRow.appendChild(buildProfileControl<VfxMirrorProfile>(
      'MIRROR', VFX_MIRROR_PROFILES, resolveSlotMirrorProfile(slot),
      (value) => mutate(updateSlotProfile(draft, slot.id, { mirrorProfile: value })),
      MIRROR_LABELS,
    ));
    transformRow.appendChild(buildProfileControl<VfxPivotProfile>(
      'ORIGIN', VFX_PIVOT_PROFILES, slot.pivotProfile ?? DEFAULT_PIVOT_PROFILE,
      (value) => mutate(updateSlotProfile(draft, slot.id, { pivotProfile: value })),
      ORIGIN_LABELS,
    ));
    transformSection.appendChild(transformRow);
    profiles.appendChild(transformSection);

    // ---- PHASE
    profiles.appendChild(buildPhaseControl(draft, slot, phase));

    // ---- IMPACT FX
    profiles.appendChild(buildImpactFxControl(draft, slot));

    return profiles;
  }

  /** Compact PHASE stepper. Never raw integer typing. */
  function buildPhaseControl(draft: VfxPresetDraft, slot: VfxVisualSlot, phase: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cmp-profile cmp-phase';
    wrapper.dataset.profile = 'phase';
    const caption = document.createElement('span');
    caption.className = 'cmp-profile-label';
    caption.textContent = 'PHASE';
    wrapper.appendChild(caption);
    const group = document.createElement('div');
    group.className = 'cmp-profile-group cmp-phase-group';
    const dec = buildButton('−', 'cmp-phase-dec', () => mutate(nudgeSlotPhase(draft, slot.id, -1)));
    dec.disabled = phase <= 0;
    const value = document.createElement('span');
    value.className = 'cmp-phase-value';
    value.dataset.phase = String(phase);
    value.textContent = String(phase);
    const inc = buildButton('+', 'cmp-phase-inc', () => mutate(nudgeSlotPhase(draft, slot.id, 1)));
    inc.disabled = phase >= MAX_PHASE;
    group.append(dec, value, inc);
    wrapper.appendChild(group);
    return wrapper;
  }

  /**
   * Per-slot IMPACT FX. Default is fully OFF — nothing is ever auto-enabled
   * from tier, AP cost, Ultimate status or candidate family.
   */
  function buildImpactFxControl(draft: VfxPresetDraft, slot: VfxVisualSlot): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cmp-slot-fx';

    const row = document.createElement('div');
    row.className = 'cmp-profile';
    row.dataset.profile = 'impact_fx';
    const caption = document.createElement('span');
    caption.className = 'cmp-profile-label';
    caption.textContent = 'IMPACT FX';
    row.appendChild(caption);
    const group = document.createElement('div');
    group.className = 'cmp-profile-group';
    const channels: Array<{ key: 'flash' | 'shake'; label: string }> = [
      { key: 'flash', label: 'FLASH' },
      { key: 'shake', label: 'SHAKE' },
    ];
    for (const channel of channels) {
      const btn = buildButton(channel.label, 'cmp-profile-btn cmp-fx-btn', () => {
        mutate(toggleSlotImpactFx(draft, slot.id, channel.key));
      });
      btn.dataset.value = channel.key;
      if (slot.impactFx?.[channel.key]) btn.classList.add('cmp-active');
      group.appendChild(btn);
    }
    row.appendChild(group);
    wrapper.appendChild(row);

    // POWER only exists once at least one channel is active.
    if (hasActiveImpactFx(slot.impactFx)) {
      wrapper.appendChild(buildProfileControl<VfxImpactPower>(
        'POWER', VFX_IMPACT_POWERS, slot.impactFx?.power ?? DEFAULT_IMPACT_POWER,
        (value) => mutate(setSlotImpactPower(draft, slot.id, value)),
      ));
    }
    return wrapper;
  }

  function renderCataloguePicker(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section cmp-catalogue';
    section.dataset.section = 'catalogue';

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = replaceTargetSlotId ? 'REPLACE WITH CANDIDATE' : 'CARTOONCOFFEE LIBRARY';
    section.appendChild(heading);

    const searchInput = document.createElement('input');
    searchInput.className = 'cmp-search';
    searchInput.type = 'search';
    searchInput.placeholder = 'Search candidateId or filename...';
    searchInput.value = catalogueSearch;
    searchInput.addEventListener('change', () => {
      catalogueSearch = searchInput.value;
      cataloguePage = 1;
      render();
    });
    section.appendChild(searchInput);

    const result = searchCatalogue(catalogue, {
      search: catalogueSearch,
      page: cataloguePage,
      pageSize: 12,
      currentActionKey,
    });

    const count = document.createElement('div');
    count.className = 'cmp-cat-count';
    count.textContent = `${result.totalFiltered} candidates · page ${result.page}/${result.pageCount}`;
    section.appendChild(count);

    const grid = document.createElement('div');
    grid.className = 'cmp-cat-grid';
    for (const record of result.results) {
      grid.appendChild(renderCandidateCard(draft, record));
    }
    section.appendChild(grid);

    const pager = document.createElement('div');
    pager.className = 'cmp-pager';
    const prev = buildButton('PREV', 'cmp-page-btn', () => { cataloguePage -= 1; render(); });
    prev.disabled = result.page <= 1;
    const next = buildButton('NEXT', 'cmp-page-btn', () => { cataloguePage += 1; render(); });
    next.disabled = result.page >= result.pageCount;
    pager.append(prev, next);
    section.appendChild(pager);

    return section;
  }

  function renderCandidateCard(draft: VfxPresetDraft, record: LabCatalogueRecord): HTMLElement {
    const card = document.createElement('div');
    card.className = 'cmp-cat-card';
    card.dataset.candidateId = record.candidateId;

    const preview = resolvePreview(record.candidateId, undefined);
    if (preview.hasPreview) {
      const img = document.createElement('img');
      img.className = 'cmp-cat-preview';
      img.loading = 'lazy';
      img.src = preview.previewUrl;
      img.alt = record.candidateId;
      img.addEventListener('error', () => {
        img.replaceWith(createPreviewErrorEl('cmp-cat-preview'));
      });
      card.appendChild(img);
    } else if (!bridgeAvailable) {
      card.appendChild(createPreviewErrorEl('cmp-cat-preview'));
    }

    const cid = document.createElement('div');
    cid.className = 'cmp-cat-cid';
    cid.textContent = record.candidateId;
    card.appendChild(cid);

    const meta = document.createElement('div');
    meta.className = 'cmp-cat-meta';
    meta.textContent = `${record.nativeGrid} · ${record.nativeFrameCount}f · ${record.suitability.replace(/_/g, ' ')}`;
    card.appendChild(meta);

    const label = replaceTargetSlotId ? 'USE THIS' : 'ADD TO PRESET';
    card.appendChild(buildButton(label, 'cmp-cat-add', () => {
      if (replaceTargetSlotId) {
        const next = replaceSlotCandidate(draft, replaceTargetSlotId, record.candidateId);
        replaceTargetSlotId = null;
        catalogueOpen = false;
        statusLine.textContent = `Preparing ${record.candidateId}…`;
        mutate(next);
        void ensureCandidateRuntimeReady(record.candidateId).then((r) => {
          if (r.ready) statusLine.textContent = `${record.candidateId} ready for playback`;
        });
      } else if (addVfxToBeatId) {
        const targetBeatId = addVfxToBeatId;
        addVfxToBeatId = null;
        catalogueOpen = false;
        statusLine.textContent = `Preparing ${record.candidateId}…`;
        const withSlot = addSlot(draft, record.candidateId);
        const newSlotId = withSlot.visualSlots.at(-1)!.id;
        const assigned = addVfxToBeat(withSlot, targetBeatId, newSlotId);
        mutate(assigned);
        void ensureCandidateRuntimeReady(record.candidateId).then((r) => {
          if (r.ready) statusLine.textContent = `${record.candidateId} ready for playback`;
        });
      } else {
        statusLine.textContent = `Preparing ${record.candidateId}…`;
        mutate(addSlot(draft, record.candidateId));
        void ensureCandidateRuntimeReady(record.candidateId).then((r) => {
          if (r.ready) statusLine.textContent = `${record.candidateId} ready for playback`;
        });
      }
    }));

    return card;
  }

  // ============================================================ V2.7 CHOREOGRAPHY BEATS

  /**
   * Materializes explicit beats from the current draft state if they don't
   * already exist. This is called before any choreography edit to ensure the
   * first edit preserves all existing VFX and motion assignments.
   *
   * Constraint 1: The first real choreography edit must materialize explicit
   * beats from the current draft state before persisting the edit.
   */
  function materializeBeats(draft: VfxPresetDraft): VfxPresetDraft {
    if (hasExplicitBeats(draft)) return draft;
    const phases = resolveSlotPhases(draft);
    const beats = deriveBeatsFromPhases(phases, draft.visualSlots, draft.choreography);
    if (beats.length === 0 && draft.visualSlots.length === 0 && (draft.casterMotion ?? []).length === 0) {
      return draft;
    }
    return { ...draft, beats, updatedAt: Date.now() };
  }

  /**
   * V2.7 CHOREOGRAPHY — the single authoritative temporal UI.
   *
   * Shows beats as vertical cards. Each beat contains:
   *   - BEAT N header
   *   - START delay control (INSTANT/SHORT/MEDIUM/LONG)
   *   - COMPOSITION control (TOGETHER/SEQUENCE/PAIR THEN LAST)
   *   - Timing display (START DELAY, ABSOLUTE START, DURATION, END — read-only)
   *   - VFX and CASTER MOTION participant cards
   *   - + ADD VFX / + ADD CASTER MOTION / REMOVE BEAT (disabled if non-empty)
   *
   * No global VFX section. No global Motion section. No UNASSIGNED pool.
   * No global Composition section. No second timeline.
   */
  function renderChoreography(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section cmp-choreography';
    section.dataset.section = 'choreography';

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = 'ACTION CHOREOGRAPHY';
    section.appendChild(heading);

    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: getCandidateCadence });
    const beats = draft.beats ?? deriveBeatsFromPhases(resolveSlotPhases(draft), draft.visualSlots, draft.choreography);
    const explicit = hasExplicitBeats(draft);

    const phases = resolveSlotPhases(draft);

    beats.forEach((beat, beatIndex) => {
      const compiledBeat = compiled.compiledBeats[beatIndex];
      const beatEl = document.createElement('div');
      beatEl.className = 'cmp-beat-card';
      beatEl.dataset.beatId = beat.id;
      beatEl.dataset.beatIndex = String(beatIndex);

      // --- Beat header ---
      const beatHeader = document.createElement('div');
      beatHeader.className = 'cmp-beat-header';
      const beatNum = document.createElement('span');
      beatNum.className = 'cmp-beat-num';
      beatNum.textContent = `BEAT ${beatIndex}`;
      beatHeader.appendChild(beatNum);

      // REMOVE BEAT — disabled when non-empty
      if (explicit) {
        const isEmpty = beat.vfxSlotIds.length === 0 && beat.casterMotionIds.length === 0;
        const removeBtn = buildButton('REMOVE BEAT', 'cmp-beat-remove', () => {
          mutate(removeBeat(draft, beat.id));
        });
        removeBtn.disabled = !isEmpty;
        removeBtn.title = isEmpty ? 'Remove this empty beat' : 'Beat must be empty to remove';
        if (!isEmpty) removeBtn.classList.add('cmp-disabled');
        beatHeader.appendChild(removeBtn);
      }
      beatEl.appendChild(beatHeader);

      // --- START delay control ---
      const startDelay = beat.startDelay ?? 0;
      const startRow = document.createElement('div');
      startRow.className = 'cmp-profile cmp-beat-start';
      startRow.dataset.profile = 'start';
      const startLabel = document.createElement('span');
      startLabel.className = 'cmp-profile-label';
      startLabel.textContent = 'START';
      startRow.appendChild(startLabel);
      const startGroup = document.createElement('div');
      startGroup.className = 'cmp-profile-group';
      for (const [presetLabel, presetVal] of START_DELAY_PRESETS) {
        const btn = buildButton(presetLabel, 'cmp-profile-btn', () => {
          const m = explicit ? draft : materializeBeats(draft);
          const targetBeatId = explicit ? beat.id : (m.beats?.[beatIndex]?.id ?? beat.id);
          mutate(setBeatStartDelay(m, targetBeatId, presetVal));
        });
        btn.dataset.value = String(presetVal);
        if (Math.abs(startDelay - presetVal) < 0.001) btn.classList.add('cmp-active');
        startGroup.appendChild(btn);
      }
      startRow.appendChild(startGroup);
      beatEl.appendChild(startRow);

      // --- COMPOSITION control (per-beat) ---
      const beatComposition = beat.composition ?? draft.choreography ?? 'TOGETHER';
      const compRow = document.createElement('div');
      compRow.className = 'cmp-profile cmp-beat-composition';
      compRow.dataset.profile = 'composition';
      const compLabel = document.createElement('span');
      compLabel.className = 'cmp-profile-label';
      compLabel.textContent = 'COMPOSITION';
      compRow.appendChild(compLabel);
      const compGroup = document.createElement('div');
      compGroup.className = 'cmp-profile-group';
      for (const choreography of VFX_CHOREOGRAPHIES) {
        const compat = choreographyCompatibility(choreography, beat.vfxSlotIds.length);
        const btn = buildButton(choreography.replace(/_/g, ' '), 'cmp-choreo-btn', () => {
          const m = explicit ? draft : materializeBeats(draft);
          const targetBeatId = explicit ? beat.id : (m.beats?.[beatIndex]?.id ?? beat.id);
          mutate(setBeatComposition(m, targetBeatId, choreography));
        });
        if (beatComposition === choreography) btn.classList.add('cmp-active');
        if (!compat.compatible) {
          btn.disabled = true;
          btn.title = compat.reason ?? '';
        }
        compGroup.appendChild(btn);
      }
      compRow.appendChild(compGroup);
      beatEl.appendChild(compRow);

      // --- Timing display (read-only) ---
      const timingRow = document.createElement('div');
      timingRow.className = 'cmp-beat-timing';
      if (compiledBeat) {
        const absStart = compiledBeat.startTime;
        const duration = compiledBeat.duration;
        const endTime = Math.round((absStart + duration) * 1000) / 1000;
        timingRow.textContent = `START +${startDelay.toFixed(2)}s · TIME ${absStart.toFixed(2)}s · DURATION ${duration.toFixed(2)}s · END ${endTime.toFixed(2)}s`;
      } else {
        timingRow.textContent = '—';
      }
      beatEl.appendChild(timingRow);

      // --- Beat body: participants ---
      const beatBody = document.createElement('div');
      beatBody.className = 'cmp-beat-body';

      const beatSlots = draft.visualSlots.filter((s) => beat.vfxSlotIds.includes(s.id));
      for (const slot of beatSlots) {
        const slotIndex = draft.visualSlots.indexOf(slot);
        beatBody.appendChild(renderBeatVfxCard(draft, slot, slotIndex, beatIndex, beats.length, phases[slotIndex] ?? 0, explicit));
      }

      const beatMotions = (draft.casterMotion ?? []).filter((m) => beat.casterMotionIds.includes(m.id));
      for (const motion of beatMotions) {
        const motionIndex = (draft.casterMotion ?? []).indexOf(motion);
        beatBody.appendChild(renderBeatMotionCard(draft, motion, motionIndex, beatIndex, beats.length, explicit));
      }

      if (beatSlots.length === 0 && beatMotions.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cmp-beat-empty';
        empty.textContent = 'Empty beat';
        beatBody.appendChild(empty);
      }

      // --- Beat actions ---
      const beatActions = document.createElement('div');
      beatActions.className = 'cmp-beat-actions';
      beatActions.appendChild(buildButton('+ ADD VFX', 'cmp-beat-add-vfx', () => {
        const m = explicit ? draft : materializeBeats(draft);
        const targetBeatId = explicit ? beat.id : (m.beats?.[beatIndex]?.id ?? beat.id);
        addVfxToBeatId = targetBeatId;
        replaceTargetSlotId = null;
        catalogueOpen = true;
        cataloguePage = 1;
        if (!explicit) mutate(m);
        else render();
      }));
      beatActions.appendChild(buildButton('+ ADD CASTER MOTION', 'cmp-beat-add-motion', () => {
        const m = explicit ? draft : materializeBeats(draft);
        const targetBeatId = explicit ? beat.id : (m.beats?.[beatIndex]?.id ?? beat.id);
        const withMotion = addCasterMotion(m);
        const assigned = addMotionToBeat(withMotion, targetBeatId, (withMotion.casterMotion ?? []).at(-1)!.id);
        mutate(assigned);
      }));
      beatBody.appendChild(beatActions);

      beatEl.appendChild(beatBody);
      section.appendChild(beatEl);
    });

    // --- + ADD BEAT ---
    section.appendChild(buildButton('+ ADD BEAT', 'cmp-add-beat', () => {
      const m = explicit ? draft : materializeBeats(draft);
      mutate(addBeat(m));
    }));

    if (beats.length === 0 && draft.visualSlots.length === 0 && (draft.casterMotion ?? []).length === 0) {
      const hint = document.createElement('div');
      hint.className = 'cmp-hint';
      hint.textContent = 'No choreography yet. Use + ADD BEAT to begin.';
      section.appendChild(hint);
    }

    const total = document.createElement('div');
    total.className = 'cmp-beat-total';
    total.textContent = `TOTAL ${compiled.totalDuration.toFixed(2)}s`;
    section.appendChild(total);

    return section;
  }

  /**
   * Renders a VFX slot card inside a beat. Includes all existing slot editing
   * controls (profiles, phase, impact FX) plus beat-specific controls:
   *   ◀ MOVE LEFT  — reassign to previous beat
   *   MOVE RIGHT ▶ — reassign to next beat
   *   DELETE — deletes the slot entirely (also removes from beat membership)
   *   REPLACE — opens catalogue picker to swap candidate
   */
  function renderBeatVfxCard(
    draft: VfxPresetDraft,
    slot: VfxVisualSlot,
    index: number,
    beatIndex: number,
    beatCount: number,
    phase: number,
    explicit: boolean,
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = 'cmp-slot-card';
    card.dataset.slotId = slot.id;

    const top = document.createElement('div');
    top.className = 'cmp-slot-top';
    const num = document.createElement('span');
    num.className = 'cmp-slot-num';
    num.textContent = `SLOT ${index + 1}`;
    const cid = document.createElement('span');
    cid.className = 'cmp-slot-cid';
    cid.textContent = slot.candidateId;
    top.append(num, cid);
    card.appendChild(top);

    const record = catalogue.find((r) => r.candidateId === slot.candidateId);
    const preview = resolvePreview(slot.candidateId, undefined);
    if (preview.hasPreview) {
      const img = document.createElement('img');
      img.className = 'cmp-slot-preview';
      img.src = preview.previewUrl;
      img.alt = slot.candidateId;
      img.addEventListener('error', () => {
        img.replaceWith(createPreviewErrorEl('cmp-slot-preview'));
      });
      card.appendChild(img);
    } else if (!bridgeAvailable) {
      card.appendChild(createPreviewErrorEl('cmp-slot-preview'));
    }

    const filename = document.createElement('div');
    filename.className = 'cmp-slot-filename';
    filename.textContent = record?.sourceFilename ?? '(source filename unavailable)';
    card.appendChild(filename);

    if (!isSlotPlayable(slot.candidateId)) {
      card.classList.add('cmp-slot-unplayable');
      const flag = document.createElement('div');
      flag.className = 'cmp-slot-flag';
      flag.textContent = 'NOT A CARTOONCOFFEE SOURCE — REPLACE TO PREVIEW';
      card.appendChild(flag);
    }

    card.appendChild(buildSlotProfiles(draft, slot, phase));

    const actionsRow = document.createElement('div');
    actionsRow.className = 'cmp-slot-actions';
    actionsRow.appendChild(buildButton('REPLACE', 'cmp-slot-replace', () => {
      replaceTargetSlotId = slot.id;
      catalogueOpen = true;
      cataloguePage = 1;
      render();
    }));

    if (beatIndex >= 0) {
      const moveLeft = buildButton('◀', 'cmp-beat-move-left', () => {
        const m = explicit ? draft : materializeBeats(draft);
        const beats = m.beats!;
        const targetBeat = beats[beatIndex - 1];
        if (targetBeat) mutate(addVfxToBeat(m, targetBeat.id, slot.id));
      });
      moveLeft.disabled = beatIndex <= 0;
      moveLeft.title = 'Move to previous beat';
      actionsRow.appendChild(moveLeft);

      const moveRight = buildButton('▶', 'cmp-beat-move-right', () => {
        const m = explicit ? draft : materializeBeats(draft);
        const beats = m.beats!;
        const targetBeat = beats[beatIndex + 1];
        if (targetBeat) mutate(addVfxToBeat(m, targetBeat.id, slot.id));
      });
      moveRight.disabled = beatIndex >= beatCount - 1;
      moveRight.title = 'Move to next beat';
      actionsRow.appendChild(moveRight);
    }

    actionsRow.appendChild(buildButton('DELETE', 'cmp-slot-remove', () => {
      let next: VfxPresetDraft = removeSlot(draft, slot.id);
      if (explicit && draft.beats) {
        const cleanedBeats = draft.beats
          .map((b) => ({ ...b, vfxSlotIds: b.vfxSlotIds.filter((id) => id !== slot.id) }));
        next = { ...next, beats: cleanedBeats };
      }
      mutate(next);
    }));

    card.appendChild(actionsRow);
    return card;
  }

  /**
   * Renders a CASTER MOTION card inside a beat. Includes all existing motion
   * editing controls (type, destination, speed, start, return) plus
   * beat-specific controls:
   *   ◀ MOVE LEFT  — reassign to previous beat
   *   MOVE RIGHT ▶ — reassign to next beat
   *   DELETE — deletes the motion entirely (also removes from beat membership)
   */
  function renderBeatMotionCard(
    draft: VfxPresetDraft,
    step: CasterMotionStep,
    index: number,
    beatIndex: number,
    beatCount: number,
    explicit: boolean,
  ): HTMLElement {
    const resolved = resolveCasterMotionStep(step);
    const card = document.createElement('div');
    card.className = 'cmp-motion-card';
    card.dataset.motionId = step.id;

    const title = document.createElement('div');
    title.className = 'cmp-motion-title';
    const label = MOTION_TYPE_LABELS[resolved.type] ?? resolved.type;
    const dest = resolved.type !== 'IDLE' && resolved.type !== 'JUMP_UP'
      ? ` → ${MOTION_DESTINATION_LABELS[resolved.destination] ?? resolved.destination}`
      : '';
    title.textContent = `CASTER MOTION: ${label}${dest}`;
    card.appendChild(title);

    card.appendChild(buildProfileControl<CasterMotionType>(
      'MOVE', CASTER_MOTION_TYPES, resolved.type,
      (value) => mutate(updateCasterMotion(draft, step.id, { type: value })),
      MOTION_TYPE_LABELS,
    ));

    if (resolved.type !== 'IDLE' && resolved.type !== 'JUMP_UP') {
      card.appendChild(buildProfileControl<CasterMotionDestination>(
        'TO', CASTER_MOTION_DESTINATIONS, resolved.destination,
        (value) => mutate(updateCasterMotion(draft, step.id, { destination: value })),
        MOTION_DESTINATION_LABELS,
      ));
    }

    card.appendChild(buildProfileControl<string>(
      'START', MOTION_START_PRESETS.map(String), nearestPreset(MOTION_START_PRESETS, resolved.startTime),
      (value) => mutate(updateCasterMotion(draft, step.id, { startTime: Number(value) })),
    ));

    card.appendChild(buildProfileControl<string>(
      'SPEED', MOTION_DURATION_PRESETS.map(String), nearestPreset(MOTION_DURATION_PRESETS, resolved.duration),
      (value) => mutate(updateCasterMotion(draft, step.id, { duration: Number(value) })),
      MOTION_DURATION_LABELS,
    ));

    const returnRow = document.createElement('div');
    returnRow.className = 'cmp-profile';
    returnRow.dataset.profile = 'return';
    const returnCaption = document.createElement('span');
    returnCaption.className = 'cmp-profile-label';
    returnCaption.textContent = 'AFTER';
    returnRow.appendChild(returnCaption);
    const returnGroup = document.createElement('div');
    returnGroup.className = 'cmp-profile-group';
    const stayBtn = buildButton('STAY', 'cmp-profile-btn', () => {
      mutate(updateCasterMotion(draft, step.id, { returnToOrigin: false }));
    });
    stayBtn.dataset.value = 'stay';
    if (!resolved.returnToOrigin) stayBtn.classList.add('cmp-active');
    const backBtn = buildButton('COME BACK', 'cmp-profile-btn', () => {
      mutate(updateCasterMotion(draft, step.id, { returnToOrigin: true }));
    });
    backBtn.dataset.value = 'return';
    if (resolved.returnToOrigin) backBtn.classList.add('cmp-active');
    returnGroup.append(stayBtn, backBtn);
    returnRow.appendChild(returnGroup);
    card.appendChild(returnRow);

    const actions = document.createElement('div');
    actions.className = 'cmp-motion-actions';

    if (beatIndex >= 0) {
      const moveLeft = buildButton('◀', 'cmp-beat-move-left', () => {
        const m = explicit ? draft : materializeBeats(draft);
        const beats = m.beats!;
        const targetBeat = beats[beatIndex - 1];
        if (targetBeat) mutate(addMotionToBeat(m, targetBeat.id, step.id));
      });
      moveLeft.disabled = beatIndex <= 0;
      moveLeft.title = 'Move to previous beat';
      actions.appendChild(moveLeft);

      const moveRight = buildButton('▶', 'cmp-beat-move-right', () => {
        const m = explicit ? draft : materializeBeats(draft);
        const beats = m.beats!;
        const targetBeat = beats[beatIndex + 1];
        if (targetBeat) mutate(addMotionToBeat(m, targetBeat.id, step.id));
      });
      moveRight.disabled = beatIndex >= beatCount - 1;
      moveRight.title = 'Move to next beat';
      actions.appendChild(moveRight);
    }

    actions.appendChild(buildButton('DELETE', 'cmp-motion-remove', () => {
      let next: VfxPresetDraft = removeCasterMotion(draft, step.id);
      if (explicit && draft.beats) {
        const cleanedBeats = draft.beats
          .map((b) => ({ ...b, casterMotionIds: b.casterMotionIds.filter((id) => id !== step.id) }));
        next = { ...next, beats: cleanedBeats };
      }
      mutate(next);
    }));
    card.appendChild(actions);

    return card;
  }

  /** Picks the preset value closest to a resolved number, for button highlighting. */
  function nearestPreset(presets: readonly number[], value: number): string {
    let best = presets[0] ?? 0;
    let bestDelta = Math.abs(best - value);
    for (const preset of presets) {
      const delta = Math.abs(preset - value);
      if (delta < bestDelta) {
        best = preset;
        bestDelta = delta;
      }
    }
    return String(best);
  }

  /**
   * LEGACY preset-level polish.
   *
   * Technical feedback is authored per spritesheet in V2.5 (IMPACT FX on each
   * slot card). This section only remains so that pre-V2.5 presets can still be
   * inspected and turned off; it becomes inert as soon as any slot owns FX.
   */
  function renderTechnicalPolish(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section';
    section.dataset.section = 'technical_polish';

    const slotFxActive = draft.visualSlots.some((slot) => hasActiveImpactFx(slot.impactFx));

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = 'LEGACY TECHNICAL POLISH';
    section.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'cmp-polish-row';
    for (const level of VFX_TECHNICAL_POLISH_LEVELS) {
      const btn = buildButton(level, 'cmp-polish-btn', () => {
        mutate(setTechnicalPolish(draft, level));
      });
      if (draft.technicalPolish === level) btn.classList.add('cmp-active');
      if (slotFxActive) {
        btn.disabled = true;
        btn.title = 'Per-slot IMPACT FX is active and takes over completely.';
      }
      row.appendChild(btn);
    }
    section.appendChild(row);

    const hint = document.createElement('div');
    hint.className = 'cmp-hint';
    hint.textContent = slotFxActive
      ? 'Superseded: per-slot IMPACT FX is authoritative for this preset.'
      : 'Pre-V2.5 preset-wide flash / shake / hit-stop. Prefer per-slot IMPACT FX.';
    section.appendChild(hint);

    return section;
  }

  function renderPrimaryActions(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section cmp-primary';
    section.dataset.section = 'primary_actions';

    const unplayable = unplayableSlotCandidates(draft);
    if (unplayable.length > 0) {
      const warn = document.createElement('div');
      warn.className = 'cmp-warn';
      warn.textContent = `${unplayable.length} slot(s) cannot be previewed (${unplayable.join(', ')}). Use REPLACE to pick a CartoonCoffee source.`;
      section.appendChild(warn);
    }

    const visualsBtn = buildButton('PLAY VISUALS ONLY', 'cmp-play-visuals', () => {
      if (!options.playback) { statusLine.textContent = 'Playback unavailable.'; return; }
      const pb = options.playback;
      const activeDraft = currentDraft();
      visualsBtn.disabled = true;
      statusLine.textContent = 'Preparing VFX assets…';
      ensureDraftRuntimeReady(activeDraft)
        .then(async (readiness: DraftReadinessResult) => {
          if (!readiness.ready) {
            statusLine.textContent = `VFX ACQUISITION FAILED: ${readiness.failedCandidates.join(', ')}`;
            return;
          }
          statusLine.textContent = 'Playing VFX…';
          const result = await playDraftVisualsOnly(pb, activeDraft);
          const skipped = unplayableSlotCandidates(activeDraft).length;
          statusLine.textContent = result.played
            ? `Playback complete: ${result.snapshot?.slotCount} slot(s), 0 technical effects${skipped > 0 ? ` · ${skipped} not previewable` : ''}`
            : `PLAYBACK FAILED: ${result.reason}`;
        })
        .catch(() => {
          statusLine.textContent = 'VFX acquisition error.';
        })
        .finally(() => { visualsBtn.disabled = activeDraft.visualSlots.length === 0; });
    });
    visualsBtn.disabled = draft.visualSlots.length === 0;
    section.appendChild(visualsBtn);

    const fullBtn = buildButton('PLAY FULL PRESET', 'cmp-play-full', () => {
      if (!options.playback) { statusLine.textContent = 'Playback unavailable.'; return; }
      const pb = options.playback;
      const activeDraft = currentDraft();
      fullBtn.disabled = true;
      statusLine.textContent = 'Preparing VFX assets…';
      ensureDraftRuntimeReady(activeDraft)
        .then(async (readiness: DraftReadinessResult) => {
          if (!readiness.ready) {
            statusLine.textContent = `VFX ACQUISITION FAILED: ${readiness.failedCandidates.join(', ')}`;
            return;
          }
          statusLine.textContent = 'Playing VFX…';
          const result = await playDraftFull(pb, activeDraft);
          statusLine.textContent = result.played
            ? `Playback complete: ${result.snapshot?.slotCount} slot(s), ${result.snapshot?.technicalEffectCount} technical effect(s)`
            : `PLAYBACK FAILED: ${result.reason}`;
        })
        .catch(() => {
          statusLine.textContent = 'VFX acquisition error.';
        })
        .finally(() => { fullBtn.disabled = activeDraft.visualSlots.length === 0; });
    });
    fullBtn.disabled = draft.visualSlots.length === 0;
    section.appendChild(fullBtn);

    const stageBtn = buildButton('PLAY IN COMBAT STAGE', 'cmp-play-stage', () => {
      if (!options.playback) { statusLine.textContent = 'Playback unavailable.'; return; }
      const pb = options.playback;
      const activeDraft = currentDraft();
      stageBtn.disabled = true;
      statusLine.textContent = 'Preparing VFX assets…';
      ensureDraftRuntimeReady(activeDraft)
        .then(async (readiness) => {
          if (!readiness.ready) {
            statusLine.textContent = `VFX ACQUISITION FAILED: ${readiness.failedCandidates.join(', ')}`;
            return;
          }
          statusLine.textContent = 'Playing VFX…';
          const result = await playDraftInCombatStage(pb, activeDraft, 'full_preset');
          statusLine.textContent = result.played
            ? `Stage playback complete: ${result.snapshot?.slotCount} slot(s), ${result.snapshot?.technicalEffectCount} technical effect(s)`
            : `STAGE PLAYBACK FAILED: ${result.reason ?? 'unknown'}`;
        })
        .catch((err) => {
          statusLine.textContent = `Stage error: ${err instanceof Error ? err.message : 'unknown'}`;
        })
        .finally(() => { stageBtn.disabled = draft.visualSlots.length === 0; });
    });
    stageBtn.disabled = draft.visualSlots.length === 0;
    section.appendChild(stageBtn);

    section.appendChild(buildButton('SAVE DRAFT', 'cmp-save-draft', () => {
      persist(draft);
      store = recordSavedFingerprint(store, draft.actionKey, draft);
      saveComposerStore(localStorage, store);
      statusLine.textContent = `Draft saved: ${draft.actionKey} (${draft.visualSlots.length} slots)`;
      render();
    }));

    // ---- V2.6.2 Saved status for batch ----
    const savedStatus = getSavedStatus(store, draft.actionKey, draft);
    const savedBadge = document.createElement('div');
    savedBadge.className = 'cmp-saved-badge';
    if (savedStatus === 'NOT_SAVED') {
      savedBadge.textContent = 'NOT SAVED FOR BATCH';
      savedBadge.classList.add('cmp-saved-not');
    } else if (savedStatus === 'READY') {
      savedBadge.textContent = 'SAVED / READY FOR BATCH';
      savedBadge.classList.add('cmp-saved-ready');
    } else {
      savedBadge.textContent = 'MODIFIED SINCE SAVE';
      savedBadge.classList.add('cmp-saved-modified');
    }
    section.appendChild(savedBadge);

    // ---- Publication state ----
    const registry = getActiveRegistry();
    const pubState = compareFingerprint(registry, draft);
    const pubBadge = document.createElement('div');
    pubBadge.className = 'cmp-pub-badge';
    if (pubState === 'not_published') {
      pubBadge.textContent = 'NOT PUBLISHED';
      pubBadge.classList.add('cmp-pub-not-published');
    } else if (pubState === 'published') {
      pubBadge.textContent = 'PUBLISHED';
      pubBadge.classList.add('cmp-pub-published');
    } else {
      pubBadge.textContent = 'MODIFIED SINCE PUBLISH';
      pubBadge.classList.add('cmp-pub-modified');
    }
    section.appendChild(pubBadge);

    // ---- PUBLISH / UPDATE button ----
    if (pubState !== 'published') {
      const publishLabel = pubState === 'not_published' ? 'PUBLISH PRESET' : 'UPDATE PUBLISHED PRESET';
      const publishBtn = buildButton(publishLabel, 'cmp-publish', () => {
        showPublishConfirmation(draft, pubState);
      });
      publishBtn.disabled = draft.visualSlots.length === 0;
      section.appendChild(publishBtn);
    }

    // ---- UNPUBLISH button ----
    if (pubState !== 'not_published') {
      const unpublishBtn = buildButton('UNPUBLISH', 'cmp-unpublish', () => {
        showUnpublishConfirmation(draft);
      });
      section.appendChild(unpublishBtn);
    }

    // ---- V2.6.2 PUBLISH ALL SAVED ----
    const separator = document.createElement('hr');
    separator.className = 'cmp-batch-sep';
    section.appendChild(separator);

    const batchBtn = buildButton('PUBLISH ALL SAVED', 'cmp-publish-all', () => {
      showBatchPublishConfirmation();
    });
    section.appendChild(batchBtn);

    return section;
  }

  function showPublishConfirmation(draft: VfxPresetDraft, pubState: 'not_published' | 'modified'): void {
    const overlay = document.createElement('div');
    overlay.className = 'cmp-confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'cmp-confirm-dialog';

    const title = document.createElement('div');
    title.className = 'cmp-confirm-title';
    title.textContent = pubState === 'not_published' ? 'PUBLISH PRESET' : 'UPDATE PUBLISHED PRESET';
    dialog.appendChild(title);

    const registry = getActiveRegistry();
    const existingEntry = getPublishedEntry(registry, draft.actionKey);

    // Current state
    const currentLabel = document.createElement('div');
    currentLabel.className = 'cmp-confirm-label';
    currentLabel.textContent = 'CURRENT:';
    dialog.appendChild(currentLabel);
    const currentValue = document.createElement('div');
    currentValue.className = 'cmp-confirm-value';
    if (existingEntry) {
      currentValue.textContent = `published_${draft.actionKey} (${existingEntry.visualSlots.length} slots, fingerprint ${existingEntry.fingerprint})`;
    } else {
      currentValue.textContent = 'STATIC FALLBACK';
    }
    dialog.appendChild(currentValue);

    // New state
    const newLabel = document.createElement('div');
    newLabel.className = 'cmp-confirm-label';
    newLabel.textContent = 'NEW:';
    dialog.appendChild(newLabel);

    const summary = document.createElement('div');
    summary.className = 'cmp-confirm-summary';
    const entry = draftToPublishedEntry(draft);
    const summaryPhases = resolveSlotPhases(draft);
    const slotFxActive = draft.visualSlots.some((s) => hasActiveImpactFx(s.impactFx));
    const slotLines = draft.visualSlots.map((s, i) => {
      const parts: string[] = [`  SLOT ${i + 1} ${s.candidateId}`, s.sizeProfile, s.timingProfile];
      if (resolveSlotPositionMode(s) === 'TRAVEL') {
        parts.push(`${TRAVEL_LABELS[s.travelFrom ?? DEFAULT_TRAVEL_FROM]} -> ${TRAVEL_LABELS[s.travelTo ?? DEFAULT_TRAVEL_TO]}`);
        const traj = s.trajectoryProfile ?? DEFAULT_TRAJECTORY_PROFILE;
        if (traj !== DEFAULT_TRAJECTORY_PROFILE) parts.push(`TRJ ${TRAJECTORY_LABELS[traj] ?? traj}`);
      } else {
        parts.push(`AT ${AT_LABELS[s.placementProfile] ?? s.placementProfile}`);
      }
      const direction = resolveSlotDirectionProfile(s);
      if (direction !== 'FIXED') parts.push(DIRECTION_LABELS[direction] ?? direction);
      const rotation = s.rotationDegrees ?? DEFAULT_ROTATION_DEGREES;
      if (rotation !== DEFAULT_ROTATION_DEGREES) parts.push(`ROT ${rotation}°`);
      const mirror = resolveSlotMirrorProfile(s);
      if (mirror !== 'NONE') parts.push(`MIRROR ${MIRROR_LABELS[mirror] ?? mirror}`);
      const origin = s.pivotProfile ?? DEFAULT_PIVOT_PROFILE;
      if (origin !== DEFAULT_PIVOT_PROFILE) parts.push(`ORIGIN ${ORIGIN_LABELS[origin]}`);
      parts.push(`PHASE ${summaryPhases[i] ?? DEFAULT_PHASE}`);
      if (hasActiveImpactFx(s.impactFx)) {
        const channels: string[] = [];
        if (s.impactFx?.flash) channels.push('FLASH');
        if (s.impactFx?.shake) channels.push('SHAKE');
        parts.push(`FX ${channels.join('+')} ${s.impactFx?.power ?? DEFAULT_IMPACT_POWER}`);
      }
      return parts.join(' · ');
    });
    summary.textContent = [
      `Action: ${draft.actionKey}`,
      `Preset ID: ${entry.presetId}`,
      `Slots: ${draft.visualSlots.length}`,
      ...slotLines,
      slotFxActive
        ? 'Impact FX: per-slot (authoritative)'
        : `Legacy Technical Polish: ${draft.technicalPolish}`,
    ].join('\n');
    dialog.appendChild(summary);

    // Validate candidates are supported format
    let formatOk = true;
    for (const slot of draft.visualSlots) {
      if (!resolveCandidateSource(slot.candidateId)) {
        formatOk = false;
        const warn = document.createElement('div');
        warn.className = 'cmp-warn';
        warn.textContent = `BLOCKED: Candidate ${slot.candidateId} has unsupported atlas format. Publication rejected.`;
        dialog.appendChild(warn);
        break;
      }
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'cmp-confirm-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cmp-btn cmp-cancel';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => { overlay.remove(); });
    btnRow.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'cmp-btn cmp-confirm-btn';
    confirmBtn.textContent = 'CONFIRM PUBLISH';
    confirmBtn.disabled = !formatOk;
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Publishing…';
      try {
        const res = await fetch('/dev/vfx-publish-preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft }),
        });
        const data = await res.json() as { ok: boolean; error?: string; fingerprint?: string; registry?: PublishedVfxRegistry };
        if (data.ok && data.registry) {
          __devUpdateOverlay(data.registry);
          store = recordSavedFingerprint(store, draft.actionKey, draft);
          saveComposerStore(localStorage, store);
          statusLine.textContent = `Published: ${draft.actionKey} (fingerprint ${data.fingerprint})`;
          overlay.remove();
          render();
        } else {
          statusLine.textContent = `PUBLISH FAILED: ${data.error ?? 'unknown'}`;
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'CONFIRM PUBLISH';
        }
      } catch (err) {
        statusLine.textContent = `PUBLISH ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'CONFIRM PUBLISH';
      }
    });
    btnRow.appendChild(confirmBtn);

    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  function showUnpublishConfirmation(draft: VfxPresetDraft): void {
    const overlay = document.createElement('div');
    overlay.className = 'cmp-confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'cmp-confirm-dialog';

    const title = document.createElement('div');
    title.className = 'cmp-confirm-title';
    title.textContent = 'UNPUBLISH / RESTORE STATIC VFX';
    dialog.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'cmp-confirm-summary';
    desc.textContent = [
      `Action: ${draft.actionKey}`,
      `This will remove the published VFX configuration.`,
      `Production gameplay will return to the static fallback preset.`,
      `Composer draft remains untouched.`,
    ].join('\n');
    dialog.appendChild(desc);

    const btnRow = document.createElement('div');
    btnRow.className = 'cmp-confirm-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cmp-btn cmp-cancel';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => { overlay.remove(); });
    btnRow.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'cmp-btn cmp-unpublish-btn';
    confirmBtn.textContent = 'CONFIRM UNPUBLISH';
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Unpublishing…';
      try {
        const res = await fetch('/dev/vfx-unpublish-preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionKey: draft.actionKey }),
        });
        const data = await res.json() as { ok: boolean; error?: string; registry?: PublishedVfxRegistry };
        if (data.ok && data.registry) {
          __devUpdateOverlay(data.registry);
          statusLine.textContent = `Unpublished: ${draft.actionKey}. Static fallback restored.`;
          overlay.remove();
          render();
        } else {
          statusLine.textContent = `UNPUBLISH FAILED: ${data.error ?? 'unknown'}`;
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'CONFIRM UNPUBLISH';
        }
      } catch (err) {
        statusLine.textContent = `UNPUBLISH ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'CONFIRM UNPUBLISH';
      }
    });
    btnRow.appendChild(confirmBtn);

    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  function showBatchPublishConfirmation(): void {
    const registry = getActiveRegistry();
    const plan = buildBatchPublishPlan(store, registry);

    const overlay = document.createElement('div');
    overlay.className = 'cmp-confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'cmp-confirm-dialog cmp-batch-dialog';

    const title = document.createElement('div');
    title.className = 'cmp-confirm-title';
    title.textContent = 'PUBLISH ALL SAVED PRESETS?';
    dialog.appendChild(title);

    if (!plan.hasEligible && !plan.hasBlocked) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'cmp-confirm-summary';
      emptyMsg.textContent = 'Nothing to publish.\n\nPossible reasons:\n  • all saved presets are already published\n  • drafts were modified since save\n  • drafts have not been explicitly saved';
      dialog.appendChild(emptyMsg);

      const btnRow = document.createElement('div');
      btnRow.className = 'cmp-confirm-buttons';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'cmp-btn cmp-cancel';
      closeBtn.textContent = 'CLOSE';
      closeBtn.addEventListener('click', () => { overlay.remove(); });
      btnRow.appendChild(closeBtn);
      dialog.appendChild(btnRow);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      return;
    }

    const summary = document.createElement('div');
    summary.className = 'cmp-confirm-summary';
    const savedReady = plan.readyNew.length + plan.readyUpdate.length + plan.readyAlreadyPublished.length;
    summary.textContent = [
      `Saved / ready drafts: ${savedReady}`,
      '',
      `New publications:        ${plan.readyNew.length}`,
      `Updates:                   ${plan.readyUpdate.length}`,
      `Already published:         ${plan.readyAlreadyPublished.length}  — skip`,
      `Modified since save:       ${plan.modifiedSinceSave.length}  — skip`,
      `Not explicitly saved:     ${plan.notSaved.length}  — skip`,
      `Blocked:                   ${plan.blocked.length}`,
      '',
      'This will update the durable Published VFX Registry',
      'in one atomic operation.',
    ].join('\n');
    dialog.appendChild(summary);

    // Show blocked details
    if (plan.hasBlocked) {
      const blockedSection = document.createElement('div');
      blockedSection.className = 'cmp-batch-blocked';
      const blockedTitle = document.createElement('div');
      blockedTitle.className = 'cmp-warn';
      blockedTitle.textContent = 'BLOCKED:';
      blockedSection.appendChild(blockedTitle);
      for (const blocked of plan.blocked) {
        const item = document.createElement('div');
        item.className = 'cmp-batch-blocked-item';
        item.textContent = `${blocked.actionKey}\n  ${blocked.blockReason ?? 'unknown'}`;
        blockedSection.appendChild(item);
      }
      dialog.appendChild(blockedSection);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'cmp-confirm-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cmp-btn cmp-cancel';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => { overlay.remove(); });
    btnRow.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'cmp-btn cmp-batch-confirm-btn';
    confirmBtn.textContent = 'CONFIRM PUBLISH ALL';
    confirmBtn.disabled = plan.hasBlocked || !plan.hasEligible;
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Publishing…';
      try {
        const eligibleDrafts = plan.eligible.map((e) => e.draft);
        const res = await fetch('/dev/vfx-publish-all-presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drafts: eligibleDrafts }),
        });
        const data = await res.json() as {
          ok: boolean;
          registry?: PublishedVfxRegistry;
          publishedCount?: number;
          updatedCount?: number;
          unchangedCount?: number;
          errors?: { actionKey: string; reason: string }[];
        };
        if (data.ok && data.registry) {
          __devUpdateOverlay(data.registry);
          for (const entry of plan.eligible) {
            store = recordSavedFingerprint(store, entry.actionKey, entry.draft);
          }
          saveComposerStore(localStorage, store);
          statusLine.textContent = `Batch publish complete: ${data.publishedCount ?? 0} published · ${data.updatedCount ?? 0} updated · ${data.unchangedCount ?? 0} already current.`;
          overlay.remove();
          render();
        } else {
          const errorList = data.errors?.map((e) => `${e.actionKey}: ${e.reason}`).join('; ') ?? 'unknown';
          statusLine.textContent = `BATCH PUBLISH FAILED: ${plan.blocked.length > 0 ? `${plan.blocked.length} blocked preset` : errorList}. Nothing was written.`;
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'CONFIRM PUBLISH ALL';
        }
      } catch (err) {
        statusLine.textContent = `BATCH PUBLISH ERROR: ${err instanceof Error ? err.message : 'unknown'}`;
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'CONFIRM PUBLISH ALL';
      }
    });
    btnRow.appendChild(confirmBtn);

    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  function showResetAllConfirmation(): void {
    const overlay = document.createElement('div');
    overlay.className = 'cmp-confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'cmp-confirm-dialog cmp-reset-dialog';

    const title = document.createElement('div');
    title.className = 'cmp-confirm-title cmp-danger-title';
    title.textContent = 'RESET ALL VFX PRESETS?';
    dialog.appendChild(title);

    const draftCount = Object.keys(store.drafts).length;
    const registry = getActiveRegistry();
    const publishedCount = Object.keys(registry.actions).length;

    const desc = document.createElement('div');
    desc.className = 'cmp-confirm-summary';
    desc.textContent = [
      'This will permanently:',
      `  • delete all Composer drafts: ${draftCount}`,
      `  • unpublish all published presets: ${publishedCount}`,
      '  • restore static fallback VFX',
      '',
      'VFX spritesheet assets will NOT be deleted.',
      'Export your drafts first if you want a backup.',
    ].join('\n');
    dialog.appendChild(desc);

    const inputLabel = document.createElement('div');
    inputLabel.className = 'cmp-reset-input-label';
    inputLabel.textContent = 'Type RESET ALL to confirm:';
    dialog.appendChild(inputLabel);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'cmp-reset-input';
    textInput.placeholder = 'RESET ALL';
    dialog.appendChild(textInput);

    const btnRow = document.createElement('div');
    btnRow.className = 'cmp-confirm-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cmp-btn cmp-cancel';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => { overlay.remove(); });
    btnRow.appendChild(cancelBtn);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'cmp-btn cmp-export-backup-btn';
    exportBtn.textContent = 'EXPORT BACKUP';
    exportBtn.addEventListener('click', () => {
      const json = exportComposerDrafts(store);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `r2c-vfx-composer-drafts-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      statusLine.textContent = `Exported ${draftCount} draft(s) as backup`;
    });
    btnRow.appendChild(exportBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'cmp-btn cmp-reset-confirm-btn';
    confirmBtn.textContent = 'CONFIRM RESET';
    confirmBtn.disabled = true;
    textInput.addEventListener('input', () => {
      confirmBtn.disabled = textInput.value !== 'RESET ALL';
    });
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Resetting…';
      try {
        const res = await fetch('/dev/vfx-reset-all-presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json() as { ok: boolean; error?: string; registry?: PublishedVfxRegistry; clearedActions?: number };
        if (data.ok && data.registry) {
          __devUpdateOverlay(data.registry);
          store = createEmptyComposerStore();
          saveComposerStore(localStorage, store);
          statusLine.textContent = `All Composer drafts and published VFX presets were reset. Static fallback VFX restored.`;
          overlay.remove();
          render();
        } else {
          statusLine.textContent = `RESET FAILED: ${data.error ?? 'unknown'}`;
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'CONFIRM RESET';
        }
      } catch (err) {
        statusLine.textContent = `RESET FAILED: ${err instanceof Error ? err.message : 'unknown'}`;
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'CONFIRM RESET';
      }
    });
    btnRow.appendChild(confirmBtn);

    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  function renderAdvanced(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section cmp-advanced';
    section.dataset.section = 'advanced';

    const header = document.createElement('div');
    header.className = 'cmp-advanced-header';
    header.textContent = `ADVANCED / DEBUG ${advancedOpen ? '▾' : '▸'}`;
    header.addEventListener('click', () => { advancedOpen = !advancedOpen; render(); });
    section.appendChild(header);

    if (!advancedOpen) return section;

    const body = document.createElement('div');
    body.className = 'cmp-advanced-body';

    const hint = document.createElement('div');
    hint.className = 'cmp-hint';
    hint.textContent = 'Exceptional cases only. Semantic profiles normally cover authoring.';
    body.appendChild(hint);

    for (const [index, slot] of draft.visualSlots.entries()) {
      const block = document.createElement('div');
      block.className = 'cmp-adv-slot';
      block.dataset.slotId = slot.id;
      const title = document.createElement('div');
      title.className = 'cmp-adv-title';
      title.textContent = `SLOT ${index + 1} — ${slot.candidateId}`;
      block.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'cmp-adv-grid';
      const numeric: { key: 'scale' | 'duration' | 'offsetX' | 'offsetY'; step: number }[] = [
        { key: 'scale', step: 0.01 },
        { key: 'duration', step: 0.01 },
        { key: 'offsetX', step: 0.05 },
        { key: 'offsetY', step: 0.05 },
      ];
      for (const def of numeric) {
        const label = document.createElement('label');
        label.className = 'cmp-adv-field';
        label.textContent = def.key;
        const input = document.createElement('input');
        input.type = 'number';
        input.step = String(def.step);
        input.dataset.advKey = def.key;
        input.value = slot.advanced?.[def.key] !== undefined ? String(slot.advanced[def.key]) : '';
        input.placeholder = 'auto';
        input.addEventListener('change', () => {
          const parsed = parseFloat(input.value);
          if (Number.isNaN(parsed)) return;
          mutate(setSlotAdvancedOverride(draft, slot.id, { [def.key]: parsed }));
        });
        label.appendChild(input);
        grid.appendChild(label);
      }
      block.appendChild(grid);

      block.appendChild(buildButton('CLEAR SLOT OVERRIDES', 'cmp-adv-clear', () => {
        mutate(clearSlotAdvancedOverride(draft, slot.id));
      }));
      body.appendChild(block);
    }

    const portable = document.createElement('div');
    portable.className = 'cmp-adv-portable';
    portable.appendChild(buildButton('EXPORT DRAFTS', 'cmp-export-drafts', () => {
      const json = exportComposerDrafts(store);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `r2c-vfx-composer-drafts-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      statusLine.textContent = `Exported ${Object.keys(store.drafts).length} draft(s)`;
    }));

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.className = 'cmp-import-input';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = importComposerDrafts(store, String(reader.result));
        if (result.ok && result.store) {
          store = result.store;
          saveComposerStore(localStorage, store);
          statusLine.textContent = `Imported ${result.imported} draft(s)`;
          render();
        } else {
          statusLine.textContent = `Import failed: ${result.error}`;
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
    portable.appendChild(buildButton('IMPORT DRAFTS...', 'cmp-import-drafts', () => fileInput.click()));
    portable.appendChild(fileInput);
    body.appendChild(portable);

    // ---- DANGER ZONE: Reset all presets (V2.6.1)
    const dangerZone = document.createElement('div');
    dangerZone.className = 'cmp-danger-zone';
    dangerZone.dataset.section = 'danger_zone';
    const dangerTitle = document.createElement('div');
    dangerTitle.className = 'cmp-danger-title';
    dangerTitle.textContent = 'DANGER ZONE';
    dangerZone.appendChild(dangerTitle);
    const dangerDesc = document.createElement('div');
    dangerDesc.className = 'cmp-danger-desc';
    dangerDesc.textContent = 'Reset all Composer drafts and published VFX presets. Static fallback VFX will be restored. VFX spritesheet assets will NOT be deleted.';
    dangerZone.appendChild(dangerDesc);
    dangerZone.appendChild(buildButton('RESET ALL PRESETS', 'cmp-reset-all-btn', () => {
      showResetAllConfirmation();
    }));
    body.appendChild(dangerZone);

    section.appendChild(body);
    return section;
  }

  // ---------------------------------------------------------------- helpers

  function createPreviewErrorEl(className: string): HTMLElement {
    const el = document.createElement('div');
    el.className = className + ' cmp-preview-error';
    el.textContent = 'PREVIEW BRIDGE UNAVAILABLE';
    return el;
  }

  function buildButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function buildProfileControl<T extends string>(
    label: string,
    values: readonly T[],
    current: T,
    onChange: (value: T) => void,
    displayLabels?: Record<string, string>,
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cmp-profile';
    wrapper.dataset.profile = label.toLowerCase();
    const caption = document.createElement('span');
    caption.className = 'cmp-profile-label';
    caption.textContent = label;
    wrapper.appendChild(caption);
    const group = document.createElement('div');
    group.className = 'cmp-profile-group';
    for (const value of values) {
      const displayText = displayLabels?.[value] ?? value;
      const btn = buildButton(displayText, 'cmp-profile-btn', () => onChange(value));
      btn.dataset.value = value;
      if (value === current) btn.classList.add('cmp-active');
      group.appendChild(btn);
    }
    wrapper.appendChild(group);
    return wrapper;
  }

  render();

  return () => {
    root.remove();
    document.getElementById(COMPOSER_STYLE_ID)?.remove();
  };
}

function addComposerStyle(): void {
  if (document.getElementById(COMPOSER_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = COMPOSER_STYLE_ID;
  style.textContent = `
    #${COMPOSER_ROOT_ID}{position:fixed;top:12px;left:12px;width:340px;max-height:calc(100vh - 24px);overflow-y:auto;z-index:9998;
      padding:10px;border:1px solid #2a4a60;border-radius:8px;background:rgba(8,18,28,.94);color:#dfeef7;
      font:12px/1.45 'Segoe UI',system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.5)}
    #${COMPOSER_ROOT_ID} button{cursor:pointer;border:1px solid #3a5c70;border-radius:4px;background:#122b3c;color:#dfeef7;
      font:inherit;font-size:11px;padding:4px 7px}
    #${COMPOSER_ROOT_ID} button:hover:not(:disabled){background:#1b3e54}
    #${COMPOSER_ROOT_ID} button:disabled{opacity:.38;cursor:not-allowed}
    #${COMPOSER_ROOT_ID} button.cmp-active{border-color:#66cfea;background:#12506b;font-weight:700}
    #${COMPOSER_ROOT_ID} input,#${COMPOSER_ROOT_ID} select{width:100%;box-sizing:border-box;border:1px solid #3a5c70;border-radius:4px;
      background:#0c1c2c;color:#dfeef7;font:inherit;font-size:11px;padding:3px 5px}
    #${COMPOSER_ROOT_ID} .cmp-title{color:#9fe5ff;font-size:12px;font-weight:800;letter-spacing:.08em;margin-bottom:6px;padding-right:72px}
    #${COMPOSER_ROOT_ID} .cmp-section{margin-bottom:10px;padding:8px;border:1px solid #24404f;border-radius:6px;background:rgba(14,30,44,.5)}
    #${COMPOSER_ROOT_ID} .cmp-section-heading{color:#9fe5ff;font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px}
    #${COMPOSER_ROOT_ID} .cmp-preset-id{color:#8fa5b2;font-size:10px;margin-top:5px}
    #${COMPOSER_ROOT_ID} .cmp-preset-id b{color:#f1c76c}
    #${COMPOSER_ROOT_ID} .cmp-scope-row{display:flex;align-items:center;gap:5px;margin-bottom:6px}
    #${COMPOSER_ROOT_ID} .cmp-scope-label{color:#8fa5b2;font-size:9px;font-weight:800;letter-spacing:.08em}
    #${COMPOSER_ROOT_ID} .cmp-scope-row button{flex:1 1 auto}
    #${COMPOSER_ROOT_ID} .cmp-scope-row button.is-active{border-color:#66cfea;background:#12506b;font-weight:800}
    #${COMPOSER_ROOT_ID} .cmp-workload{border-color:#2f5468;background:rgba(12,34,50,.62)}
    #${COMPOSER_ROOT_ID} .cmp-workload-counters{display:flex;gap:4px;margin-bottom:7px}
    #${COMPOSER_ROOT_ID} .cmp-workload-cell{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:1px;
      padding:4px 2px;border:1px solid #2a4a60;border-radius:4px;background:rgba(8,20,30,.7)}
    #${COMPOSER_ROOT_ID} .cmp-workload-value{color:#dfeef7;font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
    #${COMPOSER_ROOT_ID} .cmp-workload-caption{color:#7a96a6;font-size:7.5px;font-weight:700;letter-spacing:.05em;text-align:center}
    #${COMPOSER_ROOT_ID} .cmp-workload-cell[data-counter="published"] .cmp-workload-value{color:#6ee7a8}
    #${COMPOSER_ROOT_ID} .cmp-workload-cell[data-counter="ready"] .cmp-workload-value{color:#66cfea}
    #${COMPOSER_ROOT_ID} .cmp-workload-cell[data-counter="progress"] .cmp-workload-value{color:#f1c76c}
    #${COMPOSER_ROOT_ID} .cmp-workload-cell[data-counter="remaining"] .cmp-workload-value{color:#8fa5b2}
    #${COMPOSER_ROOT_ID} .cmp-workload-groups{display:flex;flex-direction:column;gap:2px}
    #${COMPOSER_ROOT_ID} .cmp-workload-group{display:flex;justify-content:space-between;align-items:baseline;
      padding:2px 5px;border-radius:3px;background:rgba(8,20,30,.5)}
    #${COMPOSER_ROOT_ID} .cmp-workload-group.is-complete{background:rgba(110,231,168,.12)}
    #${COMPOSER_ROOT_ID} .cmp-workload-group-name{color:#8fa5b2;font-size:9px;font-weight:700;letter-spacing:.04em}
    #${COMPOSER_ROOT_ID} .cmp-workload-group-count{color:#dfeef7;font-size:9.5px;font-weight:800;font-variant-numeric:tabular-nums}
    #${COMPOSER_ROOT_ID} .cmp-workload-group.is-complete .cmp-workload-group-count{color:#6ee7a8}
    #${COMPOSER_ROOT_ID} .cmp-empty{color:#7a96a6;font-size:11px;font-style:italic;padding:4px 0}
    #${COMPOSER_ROOT_ID} .cmp-slot-card{margin-bottom:8px;padding:7px;border:1px solid #2f5468;border-radius:5px;background:rgba(20,42,58,.55)}
    #${COMPOSER_ROOT_ID} .cmp-slot-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-slot-num{color:#f1c76c;font-size:10px;font-weight:800;letter-spacing:.06em}
    #${COMPOSER_ROOT_ID} .cmp-slot-cid{color:#9fe5ff;font-size:11px;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-slot-preview{display:block;width:100%;height:78px;object-fit:contain;background:#050d15;border-radius:4px;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-preview-error{display:flex;align-items:center;justify-content:center;color:#c44;font-size:9px;font-weight:700;text-align:center;border:1px dashed #633;border-radius:4px}
    #${COMPOSER_ROOT_ID} .cmp-slot-filename{color:#728c9b;font-size:9px;word-break:break-all;margin-bottom:5px}
    #${COMPOSER_ROOT_ID} .cmp-slot-unplayable{border-color:#8c5a3a}
    #${COMPOSER_ROOT_ID} .cmp-slot-flag{margin-bottom:5px;padding:2px 4px;border-radius:3px;background:rgba(255,154,74,.14);color:#ff9a4a;font-size:9px;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-slot-transform{margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-slot-transform-badge{margin-bottom:3px;padding:2px 6px;border-radius:3px;background:rgba(106,217,255,.12);color:#6ad9ff;font-size:9px;font-weight:700;letter-spacing:.04em}
    #${COMPOSER_ROOT_ID} .cmp-profile{margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-profile-label{display:block;color:#8fa5b2;font-size:9px;font-weight:700;letter-spacing:.06em;margin-bottom:2px}
    #${COMPOSER_ROOT_ID} .cmp-profile-group{display:flex;flex-wrap:wrap;gap:3px}
    #${COMPOSER_ROOT_ID} .cmp-profile-btn{flex:1 1 auto;min-width:30px;font-size:10px;padding:3px 2px}
    #${COMPOSER_ROOT_ID} .cmp-phase-group{align-items:center;gap:5px}
    #${COMPOSER_ROOT_ID} .cmp-phase-dec,#${COMPOSER_ROOT_ID} .cmp-phase-inc{width:26px;font-size:12px;font-weight:800;padding:2px 0;line-height:1}
    #${COMPOSER_ROOT_ID} .cmp-phase-value{min-width:22px;text-align:center;color:#f1c76c;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums}
    #${COMPOSER_ROOT_ID} .cmp-slot-fx{margin-top:4px;padding-top:4px;border-top:1px dashed #2f5468}
    #${COMPOSER_ROOT_ID} .cmp-fx-btn.cmp-active{border-color:#ff9a4a;background:#3a2410;color:#ffd9a0}
    #${COMPOSER_ROOT_ID} .cmp-slot-actions{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:5px}
    #${COMPOSER_ROOT_ID} .cmp-slot-remove{border-color:#8c3a3a;background:#2f0d0d}
    #${COMPOSER_ROOT_ID} .cmp-add-slot{width:100%;border-color:#3a8c4a;background:#0d2f1a;font-weight:700;padding:6px}
    #${COMPOSER_ROOT_ID} .cmp-timeline-motion{color:#9fe5ff;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-motion-card{margin-bottom:5px;padding:5px;border:1px solid #2f5468;border-radius:4px;background:#101c24}
    #${COMPOSER_ROOT_ID} .cmp-motion-title{font-size:10px;font-weight:800;letter-spacing:.06em;color:#7fd0ff;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-motion-actions{margin-top:5px}
    #${COMPOSER_ROOT_ID} .cmp-motion-remove{width:100%;border-color:#8c3a3a;background:#2f0d0d}
    #${COMPOSER_ROOT_ID} .cmp-add-motion{width:100%;border-color:#3a6a8c;background:#0d1f2f;font-weight:700;padding:6px}
    #${COMPOSER_ROOT_ID} .cmp-beat-card{margin-bottom:6px;padding:6px;border:1px solid #3a5c70;border-radius:5px;background:rgba(18,38,54,.5)}
    #${COMPOSER_ROOT_ID} .cmp-beat-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #2f5468}
    #${COMPOSER_ROOT_ID} .cmp-beat-num{color:#f1c76c;font-size:11px;font-weight:800;letter-spacing:.06em}
    #${COMPOSER_ROOT_ID} .cmp-beat-timing{color:#8fa5b2;font-size:9px;font-variant-numeric:tabular-nums}
    #${COMPOSER_ROOT_ID} .cmp-beat-body{display:flex;flex-direction:column;gap:4px}
    #${COMPOSER_ROOT_ID} .cmp-beat-empty{color:#7a96a6;font-size:10px;font-style:italic;padding:2px 0}
    #${COMPOSER_ROOT_ID} .cmp-beat-actions{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}
    #${COMPOSER_ROOT_ID} .cmp-beat-add-vfx{flex:1;border-color:#3a8c4a;background:#0d2f1a;font-size:10px;font-weight:700;padding:4px}
    #${COMPOSER_ROOT_ID} .cmp-beat-add-motion{flex:1;border-color:#3a6a8c;background:#0d1f2f;font-size:10px;font-weight:700;padding:4px}
    #${COMPOSER_ROOT_ID} .cmp-beat-remove{flex:1;border-color:#8c3a3a;background:#2f0d0d;font-size:10px;padding:4px}
    #${COMPOSER_ROOT_ID} .cmp-beat-move-left,#${COMPOSER_ROOT_ID} .cmp-beat-move-right{width:28px;font-size:12px;font-weight:800;padding:3px 0;line-height:1}
    #${COMPOSER_ROOT_ID} .cmp-beat-remove-vfx,#${COMPOSER_ROOT_ID} .cmp-beat-remove-motion{border-color:#8c5a3a;background:#2f1d0d;font-size:9px;padding:3px 4px}
    #${COMPOSER_ROOT_ID} .cmp-add-beat{width:100%;border-color:#3a6a8c;background:#0d1f2f;font-weight:700;padding:6px;margin-bottom:6px}
    #${COMPOSER_ROOT_ID} .cmp-beat-total{margin-top:4px;color:#f1c76c;font-size:10px;font-weight:700;font-variant-numeric:tabular-nums}
    #${COMPOSER_ROOT_ID} .cmp-unassigned-pool{margin-top:6px;padding:6px;border:1px dashed #8c5a3a;border-radius:5px;background:rgba(60,30,10,.2)}
    #${COMPOSER_ROOT_ID} .cmp-unassigned-heading{color:#ff9a4a;font-size:10px;font-weight:800;letter-spacing:.06em;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-search{margin-bottom:5px}
    #${COMPOSER_ROOT_ID} .cmp-cat-count{color:#8fa5b2;font-size:9px;margin-bottom:5px}
    #${COMPOSER_ROOT_ID} .cmp-cat-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
    #${COMPOSER_ROOT_ID} .cmp-cat-card{padding:5px;border:1px solid #2a4a60;border-radius:4px;background:rgba(12,28,44,.6)}
    #${COMPOSER_ROOT_ID} .cmp-cat-preview{display:block;width:100%;height:56px;object-fit:contain;background:#050d15;border-radius:3px;margin-bottom:3px}
    #${COMPOSER_ROOT_ID} .cmp-cat-cid{color:#9fe5ff;font-size:10px;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-cat-meta{color:#728c9b;font-size:9px;margin-bottom:3px}
    #${COMPOSER_ROOT_ID} .cmp-cat-add{width:100%;border-color:#52b9d2;background:#0f3b52;font-size:10px}
    #${COMPOSER_ROOT_ID} .cmp-pager{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:5px}
    #${COMPOSER_ROOT_ID} .cmp-choreo-row,#${COMPOSER_ROOT_ID} .cmp-polish-row{display:flex;gap:3px;flex-wrap:wrap}
    #${COMPOSER_ROOT_ID} .cmp-choreo-btn{flex:1;min-width:88px;font-size:10px}
    #${COMPOSER_ROOT_ID} .cmp-polish-btn{flex:1;min-width:56px;font-size:10px}
    #${COMPOSER_ROOT_ID} .cmp-warn{margin-top:5px;color:#ff9a4a;font-size:10px}
    #${COMPOSER_ROOT_ID} .cmp-hint{margin-top:5px;color:#728c9b;font-size:9px;font-style:italic}
    #${COMPOSER_ROOT_ID} .cmp-timeline{margin-top:6px;padding:5px;border-left:2px solid #66cfea;background:rgba(27,57,76,.3)}
    #${COMPOSER_ROOT_ID} .cmp-timeline-row{color:#b9d9e7;font-size:9px;font-variant-numeric:tabular-nums}
    #${COMPOSER_ROOT_ID} .cmp-timeline-total{margin-top:3px;color:#f1c76c;font-size:9px;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-primary{display:grid;gap:5px}
    #${COMPOSER_ROOT_ID} .cmp-play-visuals{border-color:#66cfea;background:#0f3b52;font-weight:800;padding:8px;letter-spacing:.05em}
    #${COMPOSER_ROOT_ID} .cmp-play-full{border-color:#c47a2a;background:#3a2410;font-weight:800;padding:8px;letter-spacing:.05em}
    #${COMPOSER_ROOT_ID} .cmp-save-draft{border-color:#3a8c4a;background:#0d2f1a;font-weight:700;padding:7px}
    #${COMPOSER_ROOT_ID} .cmp-advanced-header{cursor:pointer;color:#8fa5b2;font-size:10px;font-weight:800;letter-spacing:.06em}
    #${COMPOSER_ROOT_ID} .cmp-adv-slot{margin-top:6px;padding:5px;border:1px dashed #2f5468;border-radius:4px}
    #${COMPOSER_ROOT_ID} .cmp-adv-title{color:#f1c76c;font-size:9px;font-weight:700;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-adv-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-adv-field{color:#8fa5b2;font-size:9px}
    #${COMPOSER_ROOT_ID} .cmp-adv-portable{display:grid;gap:4px;margin-top:8px}
    #${COMPOSER_ROOT_ID} .cmp-status{min-height:15px;margin-top:6px;color:#8fa5b2;font-size:10px}
    #${COMPOSER_ROOT_ID} .cmp-minimize{position:absolute;top:8px;right:8px;z-index:9;font-size:9px;padding:2px 6px;border-color:#3a5c70}
    #${COMPOSER_ROOT_ID}.cmp-minimized{width:300px;max-height:none;overflow:visible;padding:7px}
    #${COMPOSER_ROOT_ID}.cmp-minimized .cmp-dock{display:flex;flex-direction:column;gap:5px}
    #${COMPOSER_ROOT_ID} .cmp-dock-title{color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em}
    #${COMPOSER_ROOT_ID} .cmp-dock-context{color:#8fa5b2;font-size:10px;word-break:break-all}
    #${COMPOSER_ROOT_ID} .cmp-expand{border-color:#66cfea;background:#0f3b52;font-weight:700;padding:5px;font-size:10px}
    #${COMPOSER_ROOT_ID} .cmp-pub-badge{padding:4px 7px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:.06em;text-align:center}
    #${COMPOSER_ROOT_ID} .cmp-pub-not-published{background:rgba(120,120,120,.18);color:#aaa;border:1px solid #555}
    #${COMPOSER_ROOT_ID} .cmp-pub-published{background:rgba(58,140,74,.18);color:#5fd97a;border:1px solid #3a8c4a}
    #${COMPOSER_ROOT_ID} .cmp-pub-modified{background:rgba(204,122,42,.18);color:#ff9a4a;border:1px solid #c47a2a}
    #${COMPOSER_ROOT_ID} .cmp-publish{border-color:#c47a2a;background:#3a2410;font-weight:800;padding:7px;letter-spacing:.05em}
    #${COMPOSER_ROOT_ID} .cmp-unpublish{border-color:#8c3a3a;background:#2f0d0d;font-weight:700;padding:6px}
    .cmp-confirm-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6)}
    .cmp-confirm-dialog{width:400px;max-height:80vh;overflow-y:auto;padding:16px;border:1px solid #3a5c70;border-radius:8px;background:rgba(8,18,28,.97);color:#dfeef7;font:12px/1.45 'Segoe UI',system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.6)}
    .cmp-confirm-title{color:#9fe5ff;font-size:14px;font-weight:800;letter-spacing:.06em;margin-bottom:10px}
    .cmp-confirm-label{color:#8fa5b2;font-size:10px;font-weight:700;letter-spacing:.06em;margin-top:8px;margin-bottom:2px}
    .cmp-confirm-value{color:#b9d9e7;font-size:11px;margin-bottom:4px}
    .cmp-confirm-summary{white-space:pre-wrap;color:#dfeef7;font-size:11px;margin-bottom:10px}
    .cmp-confirm-buttons{display:flex;gap:8px;margin-top:12px}
    .cmp-confirm-buttons .cmp-btn{flex:1;padding:8px;font-size:12px;font-weight:700}
    .cmp-confirm-btn{border-color:#c47a2a;background:#3a2410;color:#ffd9a0}
    .cmp-unpublish-btn{border-color:#8c3a3a;background:#2f0d0d;color:#ff9a9a}
    .cmp-cancel{border-color:#3a5c70;background:#122b3c}
    #${COMPOSER_ROOT_ID} .cmp-danger-zone{margin-top:12px;padding:10px;border:1px solid #5a1a1a;border-radius:6px;background:rgba(60,10,10,.3)}
    #${COMPOSER_ROOT_ID} .cmp-danger-title{color:#ff6a5a;font-size:11px;font-weight:800;letter-spacing:.08em;margin-bottom:6px}
    #${COMPOSER_ROOT_ID} .cmp-danger-desc{color:#c9a0a0;font-size:10px;line-height:1.4;margin-bottom:8px}
    #${COMPOSER_ROOT_ID} .cmp-reset-all-btn{border-color:#8c3a3a;background:#2f0d0d;color:#ff9a9a;font-weight:800;padding:8px;letter-spacing:.05em}
    .cmp-reset-dialog{border-color:#5a1a1a !important}
    .cmp-reset-input-label{color:#ff9a9a;font-size:11px;font-weight:700;margin-bottom:4px}
    .cmp-reset-input{width:100%;padding:6px 8px;border:1px solid #5a1a1a;border-radius:4px;background:#1a0808;color:#ffd9d9;font:12px 'Segoe UI',system-ui,sans-serif;margin-bottom:8px}
    .cmp-reset-input:focus{outline:none;border-color:#8c3a3a}
    .cmp-reset-confirm-btn{border-color:#8c3a3a;background:#2f0d0d;color:#ff9a9a}
    .cmp-reset-confirm-btn:disabled{opacity:.4;cursor:not-allowed}
    .cmp-export-backup-btn{border-color:#3a8c4a;background:#0d2f1a;color:#a0d9b0}
    #${COMPOSER_ROOT_ID} .cmp-saved-badge{padding:3px 6px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.05em;text-align:center;margin-top:3px}
    #${COMPOSER_ROOT_ID} .cmp-saved-not{background:rgba(120,120,120,.15);color:#999;border:1px solid #444}
    #${COMPOSER_ROOT_ID} .cmp-saved-ready{background:rgba(58,140,74,.15);color:#5fd97a;border:1px solid #3a8c4a}
    #${COMPOSER_ROOT_ID} .cmp-saved-modified{background:rgba(204,122,42,.15);color:#ff9a4a;border:1px solid #c47a2a}
    #${COMPOSER_ROOT_ID} .cmp-batch-sep{border:none;border-top:1px solid #2a4a60;margin:6px 0}
    #${COMPOSER_ROOT_ID} .cmp-publish-all{border-color:#3a8c4a;background:#0d2f1a;font-weight:800;padding:8px;letter-spacing:.05em;width:100%}
    .cmp-batch-confirm-btn{border-color:#3a8c4a;background:#0d2f1a;color:#a0d9b0}
    .cmp-batch-blocked{margin-top:8px;padding:6px;border:1px solid #8c3a3a;border-radius:4px;background:rgba(60,10,10,.2)}
    .cmp-batch-blocked-item{color:#ff9a9a;font-size:10px;white-space:pre-wrap;margin-top:3px}
  `;
  document.head.appendChild(style);
}
