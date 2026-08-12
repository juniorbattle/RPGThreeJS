/**
 * R2C-LAB V1D — Combat VFX Presentation Lab Workbench UI.
 *
 * Permanent dev-only panel for VFX designers. Installed only when
 * `vfxlab=1` is present in the combat iframe URL.
 *
 * V1D adds: full megapack library, GIF preview preselection, accordion UI,
 * preview/assignment separation, and source identity display.
 */

import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  getLabActions,
  getLabAction,
  getHeroGroups,
  getEnemyGroups,
  getActionCount,
  buildCatalogue,
  searchCatalogue,
  getCatalogueCounts,
  createDefaultLabState,
  getQaSourceId,
  setQaSourceId,
  clearQaSourceId,
  getSelectedStep,
  setSelectedStep,
  getSelectedVisualStepIndex,
  getVisualSpriteSheetSteps,
  getVisualSpriteSheetCount,
  getQaStatus,
  getQaPresentation,
  setQaPresentation,
  resetQaStep,
  getProductionPresentation,
  getEffectivePresentation,
  isPresentationModified,
  migrateLabStateIfNeeded,
  saveLabStateToStorage,
  exportLabSnapshot,
  serializeSnapshot,
  isLabEnabled,
  LAB_PAGE_SIZE,
  getStepNotes,
  setStepNotes,
  getValidatedConfig,
  validateStepConfiguration,
  clearValidation,
  restoreValidated,
  getValidationStepStatus,
  getValidationActionStatus,
  getValidationProgress,
  findNextToValidate,
  exportValidatedConfig,
  serializeValidatedConfig,
  getPreviewCandidateId,
  setPreviewCandidateId,
  clearPreviewCandidateId,
  getAccordionOpen,
  setAccordionOpen,
  expandAllAccordions,
  collapseAllAccordions,
  DEFAULT_ACCORDION_OPEN,
  ALL_ACCORDION_SECTIONS,
  getProductionVisualConfig,
  getValidatedVisualConfig,
  configsSemanticallyEqual,
  computeConfigFingerprint,
  getLifecycleStatus,
  confirmProductionVerified,
  clearProductionVerified,
  getActionLifecycleSummary,
  getProductionProgress,
  buildWorkQueue,
  findNextInWorkQueue,
  generateApplyPackage,
  generateApplyTaskText,
  getArtisticState,
  getProductionState,
  getNextRequiredAction,
  recordProductionTested,
  clearProductionTested,
  canConfirmProductionVerified,
  labStepKey,
  getDisplayMode,
  setDisplayMode,
  resetArtisticWorkspace,
  auditCleanArtisticWorkspace,
  clearR2cAStateFromStorage,
} from './CombatVfxLab';
import type {
  LabAction,
  LabState,
  LabCatalogueRecord,
  LabFormatFilter,
  LabAvailabilityFilter,
  LabUsageFilter,
  LabGifFilter,
  LabCatalogueResult,
  LabPresentationOverride,
  LabValidationStepStatus,
  LabValidationActionStatus,
  LabValidationProgress,
  LabAccordionSection,
  ValidatedStepConfiguration,
  ValidatedConfigExport,
  InventoryJsonRecord,
  VisualSpriteSheetStep,
  ProductionLifecycleStatus,
  WorkQueueMode,
  ActionLifecycleSummary,
  ProductionProgress,
  ApplyPackage,
  VisualConfig,
  ArtisticState,
  ProductionState,
  NextRequiredAction,
  LabDisplayMode,
  CleanWorkspaceAudit,
} from './CombatVfxLab';
import type { VfxAnchor, VfxOrientation } from './VfxTypes';
import type { VfxResourceStats } from './VfxResourceManager';
import { acquireCandidate } from './LabAcquisition';
import type { AcquireResult } from './LabAcquisition';
import type { LabPlaybackContext, LabPlaybackSnapshot } from './LabPlayback';
import { playProduction, playQaOverride, playValidated, replay, getLastPlaybackSnapshot, playQaInCombatStage, playValidatedInCombatStage, playProductionInCombatStage } from './LabPlayback';
import { resolvePreview, isValidCandidateId } from './VfxPreviewResolver';

const STYLE_ID = 'r2c-vfx-lab-style';
const ROOT_ID = 'r2c-vfx-lab';

interface WorkbenchOptions {
  enabled: boolean;
  playback?: LabPlaybackContext;
  getStats?: () => VfxResourceStats;
}

export function installCombatVfxLabWorkbench(options: WorkbenchOptions): () => void {
  if (!options.enabled || typeof document === 'undefined' || document.getElementById(ROOT_ID)) {
    return () => {};
  }

  const catalogue = buildCatalogue(inventoryJson as never);
  const counts = getCatalogueCounts(catalogue);
  const actionCounts = getActionCount();
  let state = migrateLabStateIfNeeded(localStorage);
  let currentActionKey = state.selectedActionKey ?? getLabActions()[0]?.actionKey ?? '';
  let acquisitionStatus: Record<string, 'ACQUIRING' | 'ERROR'> = {};
  let lastPlaybackSnapshot: LabPlaybackSnapshot | null = null;
  let catalogueResult: LabCatalogueResult = { page: 1, pageCount: 1, totalFiltered: 0, results: [] };

  // R2C-LAB V1D.4: Lazy GIF preview observer for visual catalogue cards
  let previewObserver: IntersectionObserver | null = null;
  let miniPreviewStats = { active: 0, loaded: 0, failed: 0 };
  const MAX_ACTIVE_MINI_PREVIEWS = 10;

  addLabStyle();

  const root = document.createElement('aside');
  root.id = ROOT_ID;
  root.setAttribute('aria-label', 'Combat VFX Presentation Lab');

  const title = document.createElement('h2');
  title.textContent = 'Combat VFX Lab';
  const subtitle = document.createElement('span');
  subtitle.className = 'lab-subtitle';
  subtitle.textContent = `V1E — ${actionCounts.total} actions · ${counts.total} catalogue · DEV ONLY`;

  // V1E.2: Minimize button in header
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'lab-minimize-btn';
  minimizeBtn.textContent = '— MINIMIZE';
  minimizeBtn.addEventListener('click', () => {
    state = setDisplayMode(state, 'MINIMIZED');
    saveLabStateToStorage(localStorage, state);
    if (previewObserver) {
      previewObserver.disconnect();
      previewObserver = null;
    }
    render();
  });

  const headerRow = document.createElement('div');
  headerRow.className = 'lab-header-row';
  const headerText = document.createElement('div');
  headerText.append(title, subtitle);
  headerRow.append(headerText, minimizeBtn);
  root.appendChild(headerRow);

  // V1E: Top action bar — persistent context
  const actionBar = document.createElement('div');
  actionBar.className = 'lab-action-bar';
  root.appendChild(actionBar);

  // V1E: Work queue mode selector
  const queueBar = document.createElement('div');
  queueBar.className = 'lab-queue-bar';
  root.appendChild(queueBar);

  // V1E: Two-column workbench
  const workbench = document.createElement('div');
  workbench.className = 'lab-workbench';

  // Left column: Catalogue
  const catalogueCol = document.createElement('div');
  catalogueCol.className = 'lab-col-catalogue';
  workbench.appendChild(catalogueCol);

  // Right column: VFX Inspector
  const inspectorCol = document.createElement('div');
  inspectorCol.className = 'lab-col-inspector';
  workbench.appendChild(inspectorCol);

  root.appendChild(workbench);

  // V1E: Bottom status bar with primary CTA
  const ctaBar = document.createElement('div');
  ctaBar.className = 'lab-cta-bar';
  root.appendChild(ctaBar);

  // V1E.3.4: System / Debug Tools — standalone area, no outer accordion
  const debugToolsContainer = document.createElement('div');
  debugToolsContainer.className = 'lab-debug-tools';
  root.appendChild(debugToolsContainer);

  // Export section
  const exportSection = document.createElement('div');
  exportSection.className = 'lab-section';
  const exportBtn = document.createElement('button');
  exportBtn.className = 'lab-export-btn';
  exportBtn.textContent = 'EXPORT LAB SNAPSHOT';
  exportBtn.addEventListener('click', onExport);
  exportSection.appendChild(exportBtn);

  const exportValidatedBtn = document.createElement('button');
  exportValidatedBtn.className = 'lab-export-validated-btn';
  exportValidatedBtn.textContent = 'EXPORT VALIDATED VFX CONFIGURATION';
  exportValidatedBtn.addEventListener('click', onExportValidated);
  exportSection.appendChild(exportValidatedBtn);
  root.appendChild(exportSection);

  const statusLine = document.createElement('span');
  statusLine.className = 'lab-status';
  root.appendChild(statusLine);

  document.body.appendChild(root);

  // V1E: Action select in the top action bar
  const actionSelect = document.createElement('select');
  populateActionSelect(actionSelect);
  actionSelect.value = currentActionKey;
  actionSelect.addEventListener('change', () => {
    currentActionKey = actionSelect.value;
    state = { ...state, selectedActionKey: currentActionKey };
    saveLabStateToStorage(localStorage, state);
    render();
  });

  function createAccordionSection(section: LabAccordionSection, title: string): { wrapper: HTMLElement; body: HTMLElement } {
    const wrapper = document.createElement('div');
    wrapper.className = 'lab-accordion';
    wrapper.dataset.section = section;

    const header = document.createElement('div');
    header.className = 'lab-accordion-header';
    header.textContent = title;

    const toggle = document.createElement('span');
    toggle.className = 'lab-accordion-toggle';
    header.appendChild(toggle);

    const body = document.createElement('div');
    body.className = 'lab-accordion-body';

    wrapper.append(header, body);

    header.addEventListener('click', () => {
      const isOpen = getAccordionOpen(state, section);
      state = setAccordionOpen(state, section, !isOpen);
      saveLabStateToStorage(localStorage, state);
      updateAccordionVisual(wrapper, section, toggle, body);
    });

    updateAccordionVisual(wrapper, section, toggle, body);

    return { wrapper, body };
  }

  function updateAccordionVisual(wrapper: HTMLElement, section: LabAccordionSection, toggle: HTMLElement, body: HTMLElement): void {
    const isOpen = getAccordionOpen(state, section);
    wrapper.classList.toggle('lab-accordion-open', isOpen);
    wrapper.classList.toggle('lab-accordion-closed', !isOpen);
    toggle.textContent = isOpen ? '▼' : '▶';
    body.style.display = isOpen ? '' : 'none';
  }

  function populateActionSelect(select: HTMLSelectElement): void {
    const heroGroups = getHeroGroups();
    for (const group of heroGroups) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = `${group.unitName} (${group.className})`;
      for (const action of group.actions) {
        const opt = document.createElement('option');
        opt.value = action.actionKey;
        opt.textContent = `[${action.slot}] ${action.displayName}`;
        optgroup.appendChild(opt);
      }
      select.appendChild(optgroup);
    }
    const enemyGroups = getEnemyGroups();
    for (const group of enemyGroups) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      for (const action of group.actions) {
        const opt = document.createElement('option');
        opt.value = action.actionKey;
        opt.textContent = action.displayName;
        optgroup.appendChild(opt);
      }
      select.appendChild(optgroup);
    }
  }

  function getCurrentAction(): LabAction | undefined {
    return getLabAction(currentActionKey);
  }

  // V1E.2: Minimized dock container (separate from main workbench)
  const minimizedDock = document.createElement('div');
  minimizedDock.className = 'lab-minimized-dock';
  minimizedDock.style.display = 'none';
  root.appendChild(minimizedDock);

  function render(): void {
    const action = getCurrentAction();
    const mode = getDisplayMode(state);

    // V1E.2: Toggle visibility based on display mode
    if (mode === 'MINIMIZED') {
      // V1E.2.1: Shrink root to compact floating dock
      root.classList.add('lab-minimized');
      // Hide all expanded-mode elements
      headerRow.style.display = 'none';
      actionBar.style.display = 'none';
      queueBar.style.display = 'none';
      workbench.style.display = 'none';
      ctaBar.style.display = 'none';
      debugToolsContainer.style.display = 'none';
      exportSection.style.display = 'none';
      statusLine.style.display = 'none';

      // Clear expanded content to free DOM resources
      actionBar.replaceChildren();
      queueBar.innerHTML = '';
      catalogueCol.innerHTML = '';
      inspectorCol.innerHTML = '';
      ctaBar.innerHTML = '';
      debugToolsContainer.innerHTML = '';

      // Render minimized dock
      minimizedDock.style.display = '';
      renderMinimizedDock(action);
      return;
    }

    // EXPANDED mode — show all elements
    root.classList.remove('lab-minimized');
    headerRow.style.display = '';
    actionBar.style.display = '';
    queueBar.style.display = '';
    workbench.style.display = '';
    ctaBar.style.display = '';
    debugToolsContainer.style.display = '';
    exportSection.style.display = '';
    statusLine.style.display = '';
    minimizedDock.style.display = 'none';
    minimizedDock.innerHTML = '';

    // Clear all dynamic containers
    actionBar.replaceChildren();
    queueBar.innerHTML = '';
    catalogueCol.innerHTML = '';
    inspectorCol.innerHTML = '';
    ctaBar.innerHTML = '';
    debugToolsContainer.innerHTML = '';

    if (!action) {
      renderCatalogue(catalogueCol);
      return;
    }

    renderActionBar(action);
    renderQueueBar();
    renderInspector(action);
    renderCtaBar(action);
    renderDebugTools(action);
    renderCatalogue(catalogueCol);
  }

  // ============================================================ V1E.2 Minimized Test Dock

  function renderMinimizedDock(action: LabAction | undefined): void {
    minimizedDock.innerHTML = '';

    // Header row: title + OPEN LAB
    const dockHeader = document.createElement('div');
    dockHeader.className = 'lab-dock-header';

    const dockTitle = document.createElement('span');
    dockTitle.className = 'lab-dock-title';
    dockTitle.textContent = 'COMBAT VFX TEST';
    dockHeader.appendChild(dockTitle);

    const openLabBtn = document.createElement('button');
    openLabBtn.className = 'lab-dock-open-btn';
    openLabBtn.textContent = 'OPEN LAB';
    openLabBtn.addEventListener('click', () => {
      state = setDisplayMode(state, 'EXPANDED');
      saveLabStateToStorage(localStorage, state);
      render();
    });
    dockHeader.appendChild(openLabBtn);
    minimizedDock.appendChild(dockHeader);

    if (!action) {
      const noAction = document.createElement('div');
      noAction.className = 'lab-dock-no-action';
      noAction.textContent = 'No action selected';
      minimizedDock.appendChild(noAction);
      return;
    }

    const visualSteps = getVisualSpriteSheetSteps(action);
    const spriteSheetCount = visualSteps.length;
    const stepIdx = getSelectedVisualStepIndex(state, action);
    const artistic = getArtisticState(state, action, stepIdx);
    const production = getProductionState(state, action, stepIdx);
    const ownerName = action.ownerDisplayName ?? action.ownerType;
    const visualLabel = spriteSheetCount === 0
      ? '0 VISUAL'
      : `VFX ${visualSteps.findIndex(v => v.stepIndex === stepIdx) + 1} / ${spriteSheetCount}`;

    // Context info
    const ctxDiv = document.createElement('div');
    ctxDiv.className = 'lab-dock-context';
    ctxDiv.innerHTML = `
      <div class="lab-dock-action-name">${action.displayName}</div>
      <div class="lab-dock-meta">
        <span class="lab-dock-owner">${ownerName}</span>
        <span class="lab-dock-visual">${visualLabel}</span>
      </div>
      <div class="lab-dock-badges">
        <span class="lab-badge-artistic lab-artistic-${artistic.toLowerCase()}">ART · ${formatArtisticState(artistic)}</span>
        <span class="lab-badge-production lab-production-${production.toLowerCase()}">PROD · ${formatProductionState(production)}</span>
      </div>
    `;
    minimizedDock.appendChild(ctxDiv);

    // Playback buttons
    const hasQaSource = Boolean(getQaSourceId(state, action.actionKey, stepIdx));
    const hasValidated = Boolean(getValidatedConfig(state, action.actionKey, stepIdx));
    const hasStage = Boolean(options.playback?.buildStageContext);
    const prodConfig = getProductionVisualConfig(action, stepIdx);
    const valConfig = getValidatedVisualConfig(state, action.actionKey, stepIdx);
    const productionMatchesValidated = prodConfig && valConfig
      ? configsSemanticallyEqual(prodConfig, valConfig)
      : false;

    const playbackDiv = document.createElement('div');
    playbackDiv.className = 'lab-dock-playback';

    // PLAY QA IN STAGE
    const playQaStageBtn = document.createElement('button');
    playQaStageBtn.className = 'lab-dock-play-btn';
    playQaStageBtn.textContent = 'PLAY QA IN STAGE';
    playQaStageBtn.title = 'Play QA in Combat Stage';
    playQaStageBtn.disabled = !options.playback || !hasQaSource || !hasStage;
    if (playQaStageBtn.disabled && !hasQaSource) {
      playQaStageBtn.textContent = 'QA SOURCE REQUIRED';
    }
    playQaStageBtn.addEventListener('click', async () => {
      if (!options.playback) return;
      playQaStageBtn.disabled = true;
      playQaStageBtn.textContent = 'PLAYING...';
      const result = await playQaInCombatStage(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        dockStatus.textContent = `QA PLAYED: ${action.actionKey}`;
      } else {
        dockStatus.textContent = 'Stage preview unavailable';
      }
      playQaStageBtn.disabled = false;
      playQaStageBtn.textContent = 'PLAY QA IN STAGE';
    });
    playbackDiv.appendChild(playQaStageBtn);

    // PLAY VALIDATED IN STAGE
    const playValStageBtn = document.createElement('button');
    playValStageBtn.className = 'lab-dock-play-btn lab-play-validated-stage-btn';
    playValStageBtn.textContent = 'PLAY VALIDATED IN STAGE';
    playValStageBtn.title = 'Play Validated in Combat Stage';
    playValStageBtn.disabled = !options.playback || !hasValidated || !hasStage;
    if (playValStageBtn.disabled && !hasValidated) {
      playValStageBtn.textContent = 'NO VALIDATED CONFIG';
    }
    playValStageBtn.addEventListener('click', async () => {
      if (!options.playback) return;
      playValStageBtn.disabled = true;
      playValStageBtn.textContent = 'PLAYING...';
      const result = await playValidatedInCombatStage(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        dockStatus.textContent = `VALIDATED PLAYED: ${action.actionKey}`;
      } else {
        dockStatus.textContent = 'Validated stage unavailable';
      }
      playValStageBtn.disabled = false;
      playValStageBtn.textContent = 'PLAY VALIDATED IN STAGE';
    });
    playbackDiv.appendChild(playValStageBtn);

    // TEST PRODUCTION IN STAGE
    const playProdStageBtn = document.createElement('button');
    playProdStageBtn.className = 'lab-dock-play-btn lab-play-prod-stage-btn';
    playProdStageBtn.textContent = 'TEST PRODUCTION IN STAGE';
    playProdStageBtn.title = 'Test Production in Combat Stage';
    const prodTestDisabled = !options.playback || !hasStage || !productionMatchesValidated;
    playProdStageBtn.disabled = prodTestDisabled;
    if (!productionMatchesValidated && hasValidated) {
      playProdStageBtn.textContent = 'APPLY VALIDATED CONFIG FIRST';
    }
    playProdStageBtn.addEventListener('click', async () => {
      if (!options.playback) return;
      playProdStageBtn.disabled = true;
      playProdStageBtn.textContent = 'TESTING...';
      const result = await playProductionInCombatStage(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        dockStatus.textContent = `PRODUCTION TESTED: ${action.actionKey}`;
        // V1E.1B: Record production test fingerprint — same as expanded mode
        state = recordProductionTested(state, action, stepIdx);
        saveLabStateToStorage(localStorage, state);
      } else {
        dockStatus.textContent = 'Production stage unavailable';
      }
      playProdStageBtn.disabled = false;
      playProdStageBtn.textContent = 'TEST PRODUCTION IN STAGE';
    });
    playbackDiv.appendChild(playProdStageBtn);

    minimizedDock.appendChild(playbackDiv);

    // Navigation
    const navDiv = document.createElement('div');
    navDiv.className = 'lab-dock-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'lab-nav-btn';
    prevBtn.textContent = '◀ PREV';
    prevBtn.addEventListener('click', () => {
      const allActions = getLabActions();
      const idx = allActions.findIndex(a => a.actionKey === currentActionKey);
      const prevIdx = idx > 0 ? idx - 1 : allActions.length - 1;
      currentActionKey = allActions[prevIdx]!.actionKey;
      actionSelect.value = currentActionKey;
      state = { ...state, selectedActionKey: currentActionKey };
      saveLabStateToStorage(localStorage, state);
      render();
    });
    navDiv.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'lab-nav-btn lab-nav-next';
    nextBtn.textContent = 'NEXT ▶';
    nextBtn.addEventListener('click', () => {
      const mode = state.workQueueMode ?? 'ALL';
      const next = findNextInWorkQueue(state, mode, currentActionKey, getSelectedVisualStepIndex(state, action));
      if (next) {
        currentActionKey = next.actionKey;
        actionSelect.value = next.actionKey;
        state = { ...state, selectedActionKey: next.actionKey };
        state = setSelectedStep(state, next.actionKey, next.stepIndex);
        saveLabStateToStorage(localStorage, state);
        render();
      } else {
        dockStatus.textContent = 'Queue empty!';
      }
    });
    navDiv.appendChild(nextBtn);

    minimizedDock.appendChild(navDiv);

    // Status feedback
    const dockStatus = document.createElement('div');
    dockStatus.className = 'lab-dock-status';
    minimizedDock.appendChild(dockStatus);
  }

  // ============================================================ V1E Workbench Render Functions

  function renderActionBar(action: LabAction): void {
    const ctx = document.createElement('div');
    ctx.className = 'lab-action-context';

    const visualSteps = getVisualSpriteSheetSteps(action);
    const spriteSheetCount = visualSteps.length;
    const stepIdx = getSelectedVisualStepIndex(state, action);
    const summary = getActionLifecycleSummary(state, action);
    const artistic = getArtisticState(state, action, stepIdx);
    const production = getProductionState(state, action, stepIdx);

    const ownerName = action.ownerDisplayName ?? action.ownerType;
    const visualLabel = spriteSheetCount === 0
      ? '0 VISUAL'
      : `VISUAL ${visualSteps.findIndex(v => v.stepIndex === stepIdx) + 1} / ${spriteSheetCount}`;

    // === ROW 1: Action select + Navigation ===
    const mainRow = document.createElement('div');
    mainRow.className = 'lab-action-main-row';

    const selectWrap = document.createElement('div');
    selectWrap.className = 'lab-action-select-wrap';
    selectWrap.appendChild(actionSelect);
    mainRow.appendChild(selectWrap);

    // Navigation buttons
    const nav = document.createElement('div');
    nav.className = 'lab-action-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'lab-nav-btn';
    prevBtn.textContent = '◀ PREV';
    prevBtn.addEventListener('click', () => {
      const allActions = getLabActions();
      const idx = allActions.findIndex(a => a.actionKey === currentActionKey);
      const prevIdx = idx > 0 ? idx - 1 : allActions.length - 1;
      currentActionKey = allActions[prevIdx]!.actionKey;
      actionSelect.value = currentActionKey;
      state = { ...state, selectedActionKey: currentActionKey };
      saveLabStateToStorage(localStorage, state);
      render();
    });
    nav.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'lab-nav-btn lab-nav-next';
    nextBtn.textContent = 'NEXT ▶';
    nextBtn.addEventListener('click', () => {
      const mode = state.workQueueMode ?? 'ALL';
      const next = findNextInWorkQueue(state, mode, currentActionKey, getSelectedVisualStepIndex(state, action));
      if (next) {
        currentActionKey = next.actionKey;
        actionSelect.value = next.actionKey;
        state = { ...state, selectedActionKey: next.actionKey };
        state = setSelectedStep(state, next.actionKey, next.stepIndex);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Next: ${next.actionKey} (step ${next.stepIndex})`;
        render();
      } else {
        statusLine.textContent = 'Queue empty!';
      }
    });
    nav.appendChild(nextBtn);

    mainRow.appendChild(nav);
    ctx.appendChild(mainRow);

    // === ROW 2: Metadata (owner, preset, visual, badges) ===
    const metaRow = document.createElement('div');
    metaRow.className = 'lab-action-meta-row';

    const metaItems = document.createElement('div');
    metaItems.className = 'lab-action-meta-items';
    metaItems.innerHTML = `
      <span class="lab-action-owner-chip">${ownerName}</span>
      <span class="lab-action-preset-chip"><b>PRESET</b> ${action.currentPresetId ?? 'none'}</span>
      <span class="lab-action-visual-chip">${visualLabel}</span>
    `;

    // Multi-VFX progress
    if (spriteSheetCount > 1) {
      metaItems.innerHTML += `
        <span class="lab-action-progress-chip"><b>ART</b> ${summary.validatedCount}/${spriteSheetCount}</span>
        <span class="lab-action-progress-chip"><b>PROD</b> ${summary.verifiedCount}/${spriteSheetCount}</span>
      `;
    }

    metaRow.appendChild(metaItems);

    // Status badges
    const badges = document.createElement('div');
    badges.className = 'lab-action-badges';
    badges.innerHTML = `
      <span class="lab-badge-artistic lab-artistic-${artistic.toLowerCase()}">ART · ${formatArtisticState(artistic)}</span>
      <span class="lab-badge-production lab-production-${production.toLowerCase()}">PROD · ${formatProductionState(production)}</span>
    `;
    metaRow.appendChild(badges);

    ctx.appendChild(metaRow);
    actionBar.appendChild(ctx);
  }

  function renderQueueBar(): void {
    const modes: WorkQueueMode[] = ['CONFIGURE', 'APPLY', 'VERIFY', 'ALL'];
    const currentMode = state.workQueueMode ?? 'ALL';

    const label = document.createElement('span');
    label.className = 'lab-queue-label';
    label.textContent = 'WORK QUEUE';
    queueBar.appendChild(label);

    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.className = 'lab-queue-btn' + (mode === currentMode ? ' lab-queue-active' : '');
      btn.textContent = mode;
      const count = buildWorkQueue(state, mode).length;
      btn.textContent += ` (${count})`;
      btn.addEventListener('click', () => {
        state = { ...state, workQueueMode: mode };
        saveLabStateToStorage(localStorage, state);
        render();
      });
      queueBar.appendChild(btn);
    }
  }

  function renderInspector(action: LabAction): void {
    const visualSteps = getVisualSpriteSheetSteps(action);
    const spriteSheetCount = visualSteps.length;
    const stepIdx = getSelectedVisualStepIndex(state, action);
    const step = action.vfxSteps[stepIdx];
    const lifecycle = getLifecycleStatus(state, action, stepIdx);

    // Auto-correct selected step
    const realStepIndex = getSelectedVisualStepIndex(state, action);
    if (realStepIndex !== getSelectedStep(state, action.actionKey)) {
      state = setSelectedStep(state, action.actionKey, realStepIndex);
      saveLabStateToStorage(localStorage, state);
    }

    // === CURRENT VFX ===
    const vfxHeader = document.createElement('div');
    vfxHeader.className = 'lab-inspector-section';
    vfxHeader.innerHTML = `<div class="lab-inspector-title">CURRENT VFX</div>`;

    const presetDiv = document.createElement('div');
    presetDiv.className = 'lab-preset-info';
    presetDiv.innerHTML = `<b>PRESET</b> ${action.currentPresetId ?? 'none'} · <b>VISUAL STEPS</b> ${spriteSheetCount}`;
    vfxHeader.appendChild(presetDiv);

    if (spriteSheetCount === 0) {
      const noVfx = document.createElement('div');
      noVfx.className = 'lab-no-spritesheet';
      noVfx.textContent = 'NO CONFIGURABLE VISUAL STEP';
      vfxHeader.appendChild(noVfx);
      inspectorCol.appendChild(vfxHeader);
      return;
    }

    if (spriteSheetCount === 1) {
      // Single visual step — hide selector, just show the step name
      const currentDiv = document.createElement('div');
      currentDiv.className = 'lab-current-vfx';
      currentDiv.innerHTML = `<b>VISUAL STEP</b><br>${visualSteps[0]!.spriteSheetId}`;
      vfxHeader.appendChild(currentDiv);
    } else {
      // Multiple visual steps — show clean selector
      const label = document.createElement('label');
      label.className = 'lab-vfx-spritesheet-selector';
      label.textContent = 'PRESET VISUAL LAYER';
      const select = document.createElement('select');
      for (const vs of visualSteps) {
        const opt = document.createElement('option');
        opt.value = String(vs.stepIndex);
        opt.textContent = `Visual layer ${vs.visualIndex + 1} / ${spriteSheetCount} — ${vs.spriteSheetId}`;
        select.appendChild(opt);
      }
      select.value = String(stepIdx);
      select.addEventListener('change', () => {
        state = setSelectedStep(state, action.actionKey, parseInt(select.value, 10));
        saveLabStateToStorage(localStorage, state);
        render();
      });
      label.appendChild(select);
      vfxHeader.appendChild(label);
    }

    // Lifecycle status badge
    const lifecycleDiv = document.createElement('div');
    lifecycleDiv.className = `lab-lifecycle-badge lab-lifecycle-${lifecycle.toLowerCase()}`;
    lifecycleDiv.textContent = formatLifecycleStatus(lifecycle);
    vfxHeader.appendChild(lifecycleDiv);

    inspectorCol.appendChild(vfxHeader);

    if (!step) return;

    // === SOURCE PIPELINE ===
    renderSourcePipeline(action, stepIdx);

    // === PRESENTATION ===
    renderPresentation(action, stepIdx);

    // === PLAYBACK ===
    renderPlaybackSection(action, stepIdx, lifecycle);

    // === LIFECYCLE ===
    renderLifecycleSection(action, stepIdx, lifecycle);
  }

  function renderSourcePipeline(action: LabAction, stepIdx: number): void {
    const step = action.vfxSteps[stepIdx];
    if (!step) return;

    const prodSource = step.sourceCandidateId ?? step.spriteSheetId ?? 'none';
    const qaId = getQaSourceId(state, action.actionKey, stepIdx);
    const validated = getValidatedConfig(state, action.actionKey, stepIdx);
    const previewId = getPreviewCandidateId(state);

    const section = document.createElement('div');
    section.className = 'lab-inspector-section';
    section.innerHTML = `<div class="lab-inspector-title">SOURCE PIPELINE</div>`;

    const pipeline = document.createElement('div');
    pipeline.className = 'lab-source-pipeline';
    pipeline.innerHTML = `
      <div class="lab-pipeline-step"><b>PRODUCTION</b><br>${prodSource}</div>
      <div class="lab-pipeline-arrow">↓</div>
      <div class="lab-pipeline-step"><b>SELECTED</b><br>${previewId ?? '—'}</div>
      <div class="lab-pipeline-arrow">↓</div>
      <div class="lab-pipeline-step"><b>QA</b><br>${qaId ?? '(same as production)'}</div>
      <div class="lab-pipeline-arrow">↓</div>
      <div class="lab-pipeline-step"><b>VALIDATED</b><br>${validated?.sourceId ?? '—'}</div>
    `;
    section.appendChild(pipeline);

    // Clear QA button
    if (qaId) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'lab-clear-btn';
      clearBtn.textContent = 'CLEAR QA SOURCE';
      clearBtn.addEventListener('click', () => {
        state = clearQaSourceId(state, action.actionKey, stepIdx);
        saveLabStateToStorage(localStorage, state);
        render();
      });
      section.appendChild(clearBtn);
    }

    inspectorCol.appendChild(section);
  }

  function renderPresentation(action: LabAction, stepIdx: number): void {
    const step = action.vfxSteps[stepIdx];
    if (!step) return;

    const section = document.createElement('div');
    section.className = 'lab-inspector-section';
    section.innerHTML = `<div class="lab-inspector-title">PRESENTATION</div>`;

    const prodPres = getProductionPresentation(step);
    const qaPres = getQaPresentation(state, action.actionKey, stepIdx) ?? {};
    const effPres = getEffectivePresentation(state, action, stepIdx);
    const modified = isPresentationModified(qaPres, step);

    const statusDiv = document.createElement('div');
    statusDiv.className = 'lab-tuning-status';
    statusDiv.textContent = modified ? 'QA MODIFIED' : 'SAME AS PRODUCTION';
    statusDiv.classList.add(modified ? 'lab-status-modified' : 'lab-status-same');
    section.appendChild(statusDiv);

    const grid = document.createElement('div');
    grid.className = 'lab-tuning-grid';

    const paramDefs: { key: keyof LabPresentationOverride; label: string; step?: number; min?: number; max?: number; type: 'number' | 'select'; options?: string[] }[] = [
      { key: 'scale', label: 'Scale', step: 0.01, min: 0.1, max: 5, type: 'number' },
      { key: 'offsetX', label: 'Offset X', step: 0.01, min: -5, max: 5, type: 'number' },
      { key: 'offsetY', label: 'Offset Y', step: 0.01, min: -5, max: 5, type: 'number' },
      { key: 'duration', label: 'Duration', step: 0.05, min: 0.1, max: 5, type: 'number' },
      { key: 'opacity', label: 'Opacity', step: 0.01, min: 0, max: 1, type: 'number' },
      { key: 'fadeIn', label: 'Fade In', step: 0.01, min: 0, max: 1, type: 'number' },
      { key: 'fadeOut', label: 'Fade Out', step: 0.01, min: 0, max: 1, type: 'number' },
      { key: 'anchor', label: 'Anchor', type: 'select', options: ['source', 'target', 'midpoint', 'groundTarget', 'allTargets', 'sourceGround', 'targetGround', 'camera', 'screen'] },
      { key: 'layer', label: 'Layer', type: 'select', options: ['ground', 'impact'] },
      { key: 'blending', label: 'Blending', type: 'select', options: ['normal', 'additive'] },
      { key: 'direction', label: 'Direction', type: 'select', options: ['AUTO', 'none', 'face_target', 'source_to_target', 'align_line', 'align_cone', 'center_on_target', 'center_on_aoe_origin', 'source_to_destination'] },
    ];

    for (const def of paramDefs) {
      const item = document.createElement('div');
      item.className = 'lab-tuning-item';

      const label = document.createElement('label');
      label.textContent = def.label;
      item.appendChild(label);

      const prodVal = prodPres[def.key];
      const qaVal = qaPres[def.key];
      const effVal = effPres[def.key];

      const prodDiv = document.createElement('div');
      prodDiv.className = 'lab-prod-val';
      prodDiv.textContent = `PROD: ${prodVal ?? '—'}`;
      item.appendChild(prodDiv);

      if (def.type === 'number') {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = String(def.step ?? 0.01);
        if (def.min !== undefined) input.min = String(def.min);
        if (def.max !== undefined) input.max = String(def.max);
        input.value = effVal !== undefined ? String(effVal) : '';
        input.placeholder = String(prodVal ?? '');
        input.addEventListener('change', () => {
          const v = parseFloat(input.value);
          if (!isNaN(v)) {
            state = setQaPresentation(state, action.actionKey, stepIdx, { [def.key]: v });
            saveLabStateToStorage(localStorage, state);
            render();
          }
        });
        item.appendChild(input);
      } else {
        const select = document.createElement('select');
        for (const opt of def.options ?? []) {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        }
        select.value = String(effVal ?? 'AUTO');
        select.addEventListener('change', () => {
          state = setQaPresentation(state, action.actionKey, stepIdx, { [def.key]: select.value });
          saveLabStateToStorage(localStorage, state);
          render();
        });
        item.appendChild(select);
      }

      if (qaVal !== undefined && qaVal !== prodVal) {
        item.classList.add('lab-tuning-modified');
      }

      grid.appendChild(item);
    }

    section.appendChild(grid);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'lab-reset-btn';
    resetBtn.textContent = 'RESET STEP TO PRODUCTION';
    resetBtn.addEventListener('click', () => {
      state = resetQaStep(state, action.actionKey, stepIdx);
      saveLabStateToStorage(localStorage, state);
      render();
    });
    section.appendChild(resetBtn);

    inspectorCol.appendChild(section);
  }

  function renderPlaybackSection(action: LabAction, stepIdx: number, lifecycle: ProductionLifecycleStatus): void {
    const section = document.createElement('div');
    section.className = 'lab-inspector-section';
    section.innerHTML = `<div class="lab-inspector-title">PLAYBACK</div>`;

    const hasQaSource = Boolean(getQaSourceId(state, action.actionKey, stepIdx));
    const hasValidated = Boolean(getValidatedConfig(state, action.actionKey, stepIdx));
    const hasStage = Boolean(options.playback?.buildStageContext);
    const prodConfig = getProductionVisualConfig(action, stepIdx);
    const valConfig = getValidatedVisualConfig(state, action.actionKey, stepIdx);
    const productionMatchesValidated = prodConfig && valConfig
      ? configsSemanticallyEqual(prodConfig, valConfig)
      : false;

    // === QA PLAYBACK ===
    const qaHeader = document.createElement('div');
    qaHeader.className = 'lab-playback-group-header';
    qaHeader.textContent = 'QA';
    section.appendChild(qaHeader);

    const qaRow = document.createElement('div');
    qaRow.className = 'lab-btn-row';

    const playQaBtn = document.createElement('button');
    playQaBtn.className = 'lab-play-btn';
    playQaBtn.textContent = 'PLAY QA';
    playQaBtn.disabled = !options.playback || !hasQaSource;
    playQaBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = playQaOverride(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played QA: ${action.actionKey}`;
      }
    });
    qaRow.appendChild(playQaBtn);

    const playQaStageBtn = document.createElement('button');
    playQaStageBtn.className = 'lab-play-btn lab-play-stage-btn';
    playQaStageBtn.textContent = 'PLAY QA IN COMBAT STAGE';
    playQaStageBtn.disabled = !options.playback || !hasQaSource || !hasStage;
    playQaStageBtn.addEventListener('click', async () => {
      if (!options.playback) return;
      playQaStageBtn.disabled = true;
      playQaStageBtn.textContent = 'PLAYING IN STAGE...';
      const result = await playQaInCombatStage(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played QA in Combat Stage: ${action.actionKey}`;
      } else {
        statusLine.textContent = `Stage preview unavailable`;
      }
      playQaStageBtn.disabled = false;
      playQaStageBtn.textContent = 'PLAY QA IN COMBAT STAGE';
      render();
    });
    qaRow.appendChild(playQaStageBtn);
    section.appendChild(qaRow);

    // === VALIDATED PLAYBACK ===
    const valHeader = document.createElement('div');
    valHeader.className = 'lab-playback-group-header';
    valHeader.textContent = 'VALIDATED';
    section.appendChild(valHeader);

    const valRow = document.createElement('div');
    valRow.className = 'lab-btn-row';

    const playValBtn = document.createElement('button');
    playValBtn.className = 'lab-play-btn';
    playValBtn.textContent = 'PLAY VALIDATED';
    playValBtn.disabled = !options.playback || !hasValidated;
    playValBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = playValidated(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played VALIDATED: ${action.actionKey}`;
      }
    });
    valRow.appendChild(playValBtn);

    const playValStageBtn = document.createElement('button');
    playValStageBtn.className = 'lab-play-btn lab-play-validated-stage-btn';
    playValStageBtn.textContent = 'PLAY VALIDATED IN COMBAT STAGE';
    playValStageBtn.disabled = !options.playback || !hasValidated || !hasStage;
    playValStageBtn.addEventListener('click', async () => {
      if (!options.playback) return;
      playValStageBtn.disabled = true;
      playValStageBtn.textContent = 'PLAYING VALIDATED...';
      const result = await playValidatedInCombatStage(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played VALIDATED in Combat Stage: ${action.actionKey}`;
      } else {
        statusLine.textContent = `Validated stage preview unavailable`;
      }
      playValStageBtn.disabled = false;
      playValStageBtn.textContent = 'PLAY VALIDATED IN COMBAT STAGE';
      render();
    });
    valRow.appendChild(playValStageBtn);
    section.appendChild(valRow);

    // === PRODUCTION PLAYBACK ===
    const prodHeader = document.createElement('div');
    prodHeader.className = 'lab-playback-group-header';
    prodHeader.textContent = 'PRODUCTION';
    section.appendChild(prodHeader);

    const prodRow = document.createElement('div');
    prodRow.className = 'lab-btn-row';

    const playProdBtn = document.createElement('button');
    playProdBtn.className = 'lab-play-btn';
    playProdBtn.textContent = 'TEST PRODUCTION';
    playProdBtn.disabled = !options.playback;
    playProdBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = playProduction(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played PRODUCTION: ${action.actionKey}`;
      }
    });
    prodRow.appendChild(playProdBtn);

    const playProdStageBtn = document.createElement('button');
    playProdStageBtn.className = 'lab-play-btn lab-play-prod-stage-btn';
    playProdStageBtn.textContent = 'TEST PRODUCTION IN COMBAT STAGE';

    // V1E.1B: Disable production stage test when production != validated
    const prodTestDisabled = !options.playback || !hasStage || !productionMatchesValidated;
    playProdStageBtn.disabled = prodTestDisabled;

    if (!productionMatchesValidated && hasValidated) {
      const warning = document.createElement('div');
      warning.className = 'lab-prod-test-warning';
      warning.textContent = 'APPLY VALIDATED CONFIG FIRST';
      prodRow.appendChild(warning);
    }

    playProdStageBtn.addEventListener('click', async () => {
      if (!options.playback) return;
      playProdStageBtn.disabled = true;
      playProdStageBtn.textContent = 'TESTING PRODUCTION...';
      const result = await playProductionInCombatStage(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Tested PRODUCTION in Combat Stage: ${action.actionKey}`;
        // V1E.1B: Record that a production test was performed
        state = recordProductionTested(state, action, stepIdx);
        saveLabStateToStorage(localStorage, state);
      } else {
        statusLine.textContent = `Production stage test unavailable`;
      }
      playProdStageBtn.disabled = false;
      playProdStageBtn.textContent = 'TEST PRODUCTION IN COMBAT STAGE';
      render();
    });
    prodRow.appendChild(playProdStageBtn);
    section.appendChild(prodRow);

    // === REPLAY ===
    const replayRow = document.createElement('div');
    replayRow.className = 'lab-btn-row';

    const replayBtn = document.createElement('button');
    replayBtn.className = 'lab-play-btn';
    replayBtn.textContent = 'REPLAY';
    replayBtn.disabled = !options.playback || !lastPlaybackSnapshot;
    replayBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = replay(options.playback, state);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Replayed: ${result.snapshot.mode}`;
      }
    });
    replayRow.appendChild(replayBtn);
    section.appendChild(replayRow);

    if (lastPlaybackSnapshot) {
      const snapDiv = document.createElement('div');
      snapDiv.className = 'lab-snapshot-info';
      snapDiv.innerHTML = `<b>Last:</b> ${lastPlaybackSnapshot.mode} · ${lastPlaybackSnapshot.actionKey} step ${lastPlaybackSnapshot.stepIndex} · src: ${lastPlaybackSnapshot.source}`;
      section.appendChild(snapDiv);
    }

    inspectorCol.appendChild(section);
  }

  function renderLifecycleSection(action: LabAction, stepIdx: number, lifecycle: ProductionLifecycleStatus): void {
    const section = document.createElement('div');
    section.className = 'lab-inspector-section';
    section.innerHTML = `<div class="lab-inspector-title">LIFECYCLE</div>`;

    const validated = getValidatedConfig(state, action.actionKey, stepIdx);
    const stepStatus = getValidationStepStatus(state, action, stepIdx);

    // Status display
    const statusDiv = document.createElement('div');
    statusDiv.className = `lab-lifecycle-badge lab-lifecycle-${lifecycle.toLowerCase()}`;
    statusDiv.textContent = formatLifecycleStatus(lifecycle);
    section.appendChild(statusDiv);

    // Validation status
    const valStatusDiv = document.createElement('div');
    valStatusDiv.className = 'lab-validation-status';
    valStatusDiv.innerHTML = `<b>VFX:</b> ${stepStatus}`;
    section.appendChild(valStatusDiv);

    // VALIDATE CURRENT VFX button
    const btnRow = document.createElement('div');
    btnRow.className = 'lab-btn-row';

    const validateBtn = document.createElement('button');
    validateBtn.className = 'lab-validate-btn';
    validateBtn.textContent = 'VALIDATE CURRENT VFX';
    validateBtn.addEventListener('click', () => {
      const result = validateStepConfiguration(state, action, stepIdx);
      if (result.ok) {
        state = result.state;
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Validated: ${action.actionKey} step ${stepIdx}`;
        render();
      } else {
        statusLine.textContent = `Validation failed: ${result.error}`;
      }
    });
    btnRow.appendChild(validateBtn);

    if (validated) {
      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'lab-restore-btn';
      restoreBtn.textContent = 'RESTORE VALIDATED';
      restoreBtn.addEventListener('click', () => {
        state = restoreValidated(state, action, stepIdx);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Restored validated: ${action.actionKey} step ${stepIdx}`;
        render();
      });
      btnRow.appendChild(restoreBtn);

      const clearValBtn = document.createElement('button');
      clearValBtn.className = 'lab-clear-val-btn';
      clearValBtn.textContent = 'CLEAR VALIDATION';
      clearValBtn.addEventListener('click', () => {
        state = clearValidation(state, action.actionKey, stepIdx);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Cleared validation: ${action.actionKey} step ${stepIdx}`;
        render();
      });
      btnRow.appendChild(clearValBtn);
    }

    section.appendChild(btnRow);

    // Apply package (when VALIDATED_NOT_APPLIED)
    if (lifecycle === 'VALIDATED_NOT_APPLIED') {
      const pkg = generateApplyPackage(state, action, stepIdx);
      if (pkg) {
        const applyRow = document.createElement('div');
        applyRow.className = 'lab-btn-row';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'lab-apply-btn';
        copyBtn.textContent = 'COPY APPLY TASK';
        copyBtn.addEventListener('click', () => {
          const text = generateApplyTaskText(pkg);
          navigator.clipboard?.writeText(text).then(() => {
            statusLine.textContent = 'Apply task copied to clipboard';
          }).catch(() => {
            statusLine.textContent = 'Clipboard unavailable — see console';
            console.log(text);
          });
        });
        applyRow.appendChild(copyBtn);

        const exportBtn = document.createElement('button');
        exportBtn.className = 'lab-apply-btn';
        exportBtn.textContent = 'EXPORT APPLY PACKAGE';
        exportBtn.addEventListener('click', () => {
          const json = JSON.stringify(pkg, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `apply-${action.actionKey}-step${stepIdx}.json`;
          a.click();
          URL.revokeObjectURL(url);
          statusLine.textContent = 'Apply package exported';
        });
        applyRow.appendChild(exportBtn);

        section.appendChild(applyRow);
      }
    }

    // CONFIRM PRODUCTION VERIFIED (when APPLIED_NOT_VERIFIED or TESTED_NOT_CONFIRMED)
    const canConfirm = canConfirmProductionVerified(state, action, stepIdx);
    const productionState = getProductionState(state, action, stepIdx);
    if (productionState === 'APPLIED_NOT_TESTED' || productionState === 'TESTED_NOT_CONFIRMED') {
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'lab-confirm-verified-btn';
      confirmBtn.textContent = 'CONFIRM PRODUCTION VERIFIED';
      confirmBtn.disabled = !canConfirm;
      confirmBtn.addEventListener('click', () => {
        state = confirmProductionVerified(state, action, stepIdx);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Production verified: ${action.actionKey} step ${stepIdx}`;
        render();
      });
      section.appendChild(confirmBtn);

      if (!canConfirm) {
        const reasonDiv = document.createElement('div');
        reasonDiv.className = 'lab-confirm-reason';
        reasonDiv.textContent = productionState === 'APPLIED_NOT_TESTED'
          ? 'TEST PRODUCTION IN COMBAT STAGE FIRST'
          : 'PRODUCTION FINGERPRINT CHANGED — RE-TEST REQUIRED';
        section.appendChild(reasonDiv);
      }
    }

    // Clear verification (when PRODUCTION_VERIFIED or PRODUCTION_DRIFT)
    if (lifecycle === 'PRODUCTION_VERIFIED' || lifecycle === 'PRODUCTION_DRIFT') {
      const clearVerBtn = document.createElement('button');
      clearVerBtn.className = 'lab-clear-val-btn';
      clearVerBtn.textContent = 'CLEAR VERIFICATION';
      clearVerBtn.addEventListener('click', () => {
        state = clearProductionVerified(state, action.actionKey, stepIdx);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Cleared verification: ${action.actionKey} step ${stepIdx}`;
        render();
      });
      section.appendChild(clearVerBtn);
    }

    // V1E.1B: Clear test record (when TESTED_NOT_CONFIRMED or DRIFT)
    const stepKey = labStepKey(action.actionKey, stepIdx);
    if (state.testedFingerprintByActionStep?.[stepKey]) {
      const clearTestBtn = document.createElement('button');
      clearTestBtn.className = 'lab-clear-val-btn';
      clearTestBtn.textContent = 'CLEAR TEST RECORD';
      clearTestBtn.addEventListener('click', () => {
        state = clearProductionTested(state, action.actionKey, stepIdx);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Cleared test record: ${action.actionKey} step ${stepIdx}`;
        render();
      });
      section.appendChild(clearTestBtn);
    }

    // Notes
    const notesHeader = document.createElement('div');
    notesHeader.className = 'lab-notes-header';
    notesHeader.textContent = 'VISUAL NOTES';
    section.appendChild(notesHeader);

    const textarea = document.createElement('textarea');
    textarea.className = 'lab-notes-input';
    textarea.rows = 2;
    textarea.placeholder = 'Notes for this action/step...';
    textarea.value = getStepNotes(state, action.actionKey, stepIdx);
    textarea.addEventListener('change', () => {
      state = setStepNotes(state, action.actionKey, stepIdx, textarea.value);
      saveLabStateToStorage(localStorage, state);
      statusLine.textContent = 'Notes saved';
    });
    section.appendChild(textarea);

    inspectorCol.appendChild(section);
  }

  function renderCtaBar(action: LabAction): void {
    const stepIdx = getSelectedVisualStepIndex(state, action);
    const next = getNextRequiredAction(state, action, stepIdx);

    const cta = document.createElement('div');
    cta.className = 'lab-cta-content';

    cta.innerHTML = `
      <div class="lab-cta-label">NEXT REQUIRED ACTION</div>
      <div class="lab-cta-primary${next.noVfx ? ' lab-cta-novfx' : ''}">${next.instruction}</div>
      <div class="lab-cta-states">
        <span class="lab-cta-state lab-artistic-${next.artistic.toLowerCase()}">ART: ${formatArtisticState(next.artistic)}</span>
        <span class="lab-cta-state lab-production-${next.production.toLowerCase()}">PROD: ${formatProductionState(next.production)}</span>
      </div>
    `;

    ctaBar.appendChild(cta);
  }

  function renderDebugTools(action: LabAction): void {
    const container = debugToolsContainer;
    container.innerHTML = '';

    // V1E.3.4: SYSTEM / DEBUG TOOLS heading (not an accordion)
    const heading = document.createElement('div');
    heading.className = 'lab-debug-tools-heading';
    heading.textContent = 'SYSTEM / DEBUG TOOLS';
    container.appendChild(heading);

    // === Row 1: STATUS + AUDIT (side-by-side, always visible) ===
    const topGrid = document.createElement('div');
    topGrid.className = 'lab-debug-grid-two';

    // 1a. STATUS PANEL
    const progress = getValidationProgress(state);
    const prodProgress = getProductionProgress(state);
    const statusPanel = document.createElement('div');
    statusPanel.className = 'lab-debug-card';
    statusPanel.innerHTML = `
      <div class="lab-debug-card-title">ARTISTIC / PRODUCTION STATUS</div>
      <div class="lab-debug-card-body">
        <div class="lab-debug-status-section"><b>ARTISTIC</b></div>
        <div class="lab-debug-status-row">Hero: <b>${progress.heroValidated}</b> / ${progress.heroTotal}</div>
        <div class="lab-debug-status-row">Enemy/Boss: <b>${progress.enemyBossValidated}</b> / ${progress.enemyBossTotal}</div>
        <div class="lab-debug-status-row">All: <b>${progress.allValidated}</b> / ${progress.allTotal}</div>
        <div class="lab-debug-status-section"><b>PRODUCTION</b></div>
        <div class="lab-debug-status-row">Hero: <b>${prodProgress.heroVerified}</b> / ${prodProgress.heroTotal}</div>
        <div class="lab-debug-status-row">Enemy/Boss: <b>${prodProgress.enemyBossVerified}</b> / ${prodProgress.enemyBossTotal}</div>
      </div>
    `;
    topGrid.appendChild(statusPanel);

    // 1b. CLEAN RESET AUDIT PANEL
    const auditPanel = document.createElement('div');
    auditPanel.className = 'lab-debug-card';
    const audit = auditCleanArtisticWorkspace(state);
    auditPanel.innerHTML = `
      <div class="lab-debug-card-title">CLEAN RESET AUDIT</div>
      <div class="lab-debug-card-body">
        <div class="lab-reset-audit" id="lab-reset-audit">${renderAuditHtml(audit)}</div>
      </div>
    `;
    topGrid.appendChild(auditPanel);
    container.appendChild(topGrid);

    // === Row 2: QA HISTORY + RESOURCE/INTERNALS (side-by-side, both collapsible) ===
    const midGrid = document.createElement('div');
    midGrid.className = 'lab-debug-grid-two';

    // 2a. QA REVIEW HISTORY (default collapsed)
    const history = state.qaHistory[action.actionKey];
    const historyCount = history ? history.length : 0;
    const historySection = createDebugSubsection('qa_history', 'QA REVIEW HISTORY', false, historyCount);
    if (history && history.length > 0) {
      const list = document.createElement('div');
      list.className = 'lab-debug-history-list';
      for (const entry of history) {
        const item = document.createElement('div');
        item.className = 'lab-history-item';
        item.innerHTML = `<b>${entry.candidateId}</b> — ${entry.verdict}`;
        if (entry.notes) {
          item.innerHTML += `<br><span class="lab-history-notes">${entry.notes}</span>`;
        }
        list.appendChild(item);
      }
      historySection.body.appendChild(list);
    } else {
      const empty = document.createElement('div');
      empty.className = 'lab-debug-empty';
      empty.textContent = 'NO QA REVIEW HISTORY';
      historySection.body.appendChild(empty);
    }
    midGrid.appendChild(historySection.wrapper);

    // 2b. RESOURCE / INTERNALS (default collapsed)
    const internalsSection = createDebugSubsection('resource_internals', 'RESOURCE / INTERNALS', false);

    const stepIdx = getSelectedVisualStepIndex(state, action);
    const step = action.vfxSteps[stepIdx];
    const idsDiv = document.createElement('div');
    idsDiv.className = 'lab-debug-ids';
    idsDiv.innerHTML = `
      <div><b>actionKey:</b> ${action.actionKey}</div>
      <div><b>presetId:</b> ${action.currentPresetId ?? 'none'}</div>
      <div><b>stepIndex:</b> ${stepIdx}</div>
      <div><b>sourceId:</b> ${step?.sourceCandidateId ?? step?.spriteSheetId ?? 'none'}</div>
      <div><b>route:</b> ${action.route} (${action.routeReason ?? 'auto'})</div>
    `;
    internalsSection.body.appendChild(idsDiv);

    const prodConfig = getProductionVisualConfig(action, stepIdx);
    const valConfig = getValidatedVisualConfig(state, action.actionKey, stepIdx);
    if (prodConfig) {
      const fpDiv = document.createElement('div');
      fpDiv.className = 'lab-debug-ids';
      fpDiv.innerHTML = `<div><b>Production fingerprint:</b> ${computeConfigFingerprint(prodConfig)}</div>`;
      if (valConfig) {
        fpDiv.innerHTML += `<div><b>Validated fingerprint:</b> ${computeConfigFingerprint(valConfig)}</div>`;
        fpDiv.innerHTML += `<div><b>Match:</b> ${configsSemanticallyEqual(prodConfig, valConfig) ? 'YES' : 'NO'}</div>`;
      }
      const stepKey = labStepKey(action.actionKey, stepIdx);
      const testedFp = state.testedFingerprintByActionStep?.[stepKey];
      const verifiedFp = state.verifiedFingerprintByActionStep?.[stepKey];
      if (testedFp) {
        fpDiv.innerHTML += `<div><b>Tested fingerprint:</b> ${testedFp}</div>`;
        fpDiv.innerHTML += `<div><b>Test matches prod:</b> ${testedFp === computeConfigFingerprint(prodConfig) ? 'YES' : 'NO'}</div>`;
      }
      if (verifiedFp) {
        fpDiv.innerHTML += `<div><b>Verified fingerprint:</b> ${verifiedFp}</div>`;
      }
      internalsSection.body.appendChild(fpDiv);
    }

    const miniDiv = document.createElement('div');
    miniDiv.className = 'lab-stats-info';
    miniDiv.innerHTML = `
      <span>Active: <b>${miniPreviewStats.active}</b></span>
      <span>Loaded: <b>${miniPreviewStats.loaded}</b></span>
      <span>Failed: <b>${miniPreviewStats.failed}</b></span>
    `;
    internalsSection.body.appendChild(miniDiv);

    if (options.getStats) {
      const stats = options.getStats();
      const statsDiv = document.createElement('div');
      statsDiv.className = 'lab-stats-info';
      const mib = (stats.decodedBytesEstimate / (1024 * 1024)).toFixed(0);
      const maxMib = (stats.budget * 64).toFixed(0);
      statsDiv.innerHTML = `
        <span>Resources: <b>${stats.cachedResources}</b></span>
        <span>Pending: <b>${stats.pendingLoads}</b></span>
        <span>Usage: <b>${stats.fourKEquivalentUsage.toFixed(2)} / ${stats.budget.toFixed(1)}</b> 4K-eq</span>
        <span>Estimated: <b>${mib} / ${maxMib}</b> MiB</span>
        <span>Hits: <b>${stats.cacheHits}</b></span>
        <span>Loads: <b>${stats.loads}</b></span>
        <span>Evictions: <b>${stats.evictions}</b></span>
      `;
      internalsSection.body.appendChild(statsDiv);
    }

    midGrid.appendChild(internalsSection.wrapper);
    container.appendChild(midGrid);

    // === Row 3: WORKSPACE MAINTENANCE (full width, always visible) ===
    const footer = document.createElement('div');
    footer.className = 'lab-advanced-maintenance';

    const maintHeader = document.createElement('div');
    maintHeader.className = 'lab-maintenance-header';
    maintHeader.textContent = 'WORKSPACE MAINTENANCE';
    footer.appendChild(maintHeader);

    const maintDesc = document.createElement('div');
    maintDesc.className = 'lab-maintenance-desc';
    maintDesc.innerHTML = `<div>Reset all VFX Lab artistic / QA / validation / verification state.</div><div>Preserved: production VFX, production presets, production mappings, CartoonCoffee assets, Combat Stage, gameplay</div>`;
    footer.appendChild(maintDesc);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'lab-reset-workspace-btn';
    resetBtn.textContent = 'RESET ARTISTIC WORKSPACE';
    resetBtn.addEventListener('click', () => {
      const confirmed = window.confirm(
        'Reset all VFX Lab artistic/QA/validation data? Production VFX will NOT be changed.'
      );
      if (!confirmed) return;
      state = resetArtisticWorkspace(state);
      saveLabStateToStorage(localStorage, state);
      clearR2cAStateFromStorage(localStorage);
      currentActionKey = state.selectedActionKey ?? getLabActions()[0]?.actionKey ?? '';
      if (previewObserver) {
        previewObserver.disconnect();
        previewObserver = null;
      }
      render();
      const auditEl = document.getElementById('lab-reset-audit');
      if (auditEl) {
        const postAudit = auditCleanArtisticWorkspace(state);
        auditEl.innerHTML = renderAuditHtml(postAudit);
      }
      statusLine.textContent = postAuditStatus(state);
    });
    footer.appendChild(resetBtn);
    container.appendChild(footer);
  }

  function renderAuditHtml(audit: CleanWorkspaceAudit): string {
    const cleanClass = audit.isClean ? 'lab-semantic-clean-yes' : 'lab-semantic-clean-no';
    const cleanLabel = audit.isClean ? 'YES' : 'NO';
    return `
      <div class="lab-audit-row"><span>QA SOURCES</span><b>${audit.qaSources}</b></div>
      <div class="lab-audit-row"><span>QA OVERRIDES</span><b>${audit.qaPresentationOverrides}</b></div>
      <div class="lab-audit-row"><span>QA HISTORY</span><b>${audit.qaHistoryEntries}</b></div>
      <div class="lab-audit-row"><span>VALIDATED</span><b>${audit.validatedConfigs}</b></div>
      <div class="lab-audit-row"><span>TESTED</span><b>${audit.testedFingerprints}</b></div>
      <div class="lab-audit-row"><span>VERIFIED</span><b>${audit.verifiedFingerprints}</b></div>
      <div class="lab-audit-row"><span>QA WORKING VISUAL STEPS</span><b>${audit.qaWorkingVisualSteps}</b></div>
      <div class="lab-audit-semantic ${cleanClass}"><span>SEMANTIC CLEAN</span><span class="lab-semantic-badge ${cleanClass}">${cleanLabel}</span></div>
    `;
  }

  function createDebugSubsection(
    id: string,
    title: string,
    defaultOpen: boolean,
    count?: number,
  ): { wrapper: HTMLElement; body: HTMLElement } {
    const wrapper = document.createElement('div');
    wrapper.className = 'lab-debug-subsection';
    wrapper.dataset.subsection = id;
    wrapper.dataset.open = defaultOpen ? 'true' : 'false';

    const header = document.createElement('div');
    header.className = 'lab-debug-subsection-header';

    const toggle = document.createElement('span');
    toggle.className = 'lab-debug-subsection-toggle';
    toggle.textContent = defaultOpen ? '▼' : '▶';

    const label = document.createElement('span');
    label.className = 'lab-debug-subsection-label';
    label.textContent = title;

    header.append(toggle, label);

    if (count !== undefined) {
      const countSpan = document.createElement('span');
      countSpan.className = 'lab-debug-subsection-count';
      countSpan.textContent = String(count);
      header.appendChild(countSpan);
    }

    const subBody = document.createElement('div');
    subBody.className = 'lab-debug-subsection-body';
    subBody.style.display = defaultOpen ? '' : 'none';

    wrapper.append(header, subBody);

    header.addEventListener('click', () => {
      const isOpen = wrapper.dataset.open === 'true';
      const newOpen = !isOpen;
      wrapper.dataset.open = newOpen ? 'true' : 'false';
      toggle.textContent = newOpen ? '▼' : '▶';
      subBody.style.display = newOpen ? '' : 'none';
    });

    return { wrapper, body: subBody };
  }

  function postAuditStatus(state: LabState): string {
    const audit = auditCleanArtisticWorkspace(state);
    if (audit.isClean) return 'ARTISTIC WORKSPACE RESET COMPLETE — SEMANTIC CLEAN: YES';
    return 'RESET INCOMPLETE — SEMANTIC CLEAN: NO';
  }

  function formatLifecycleStatus(status: ProductionLifecycleStatus): string {
    switch (status) {
      case 'UNCONFIGURED': return 'UNCONFIGURED';
      case 'QA_WORKING': return 'QA WORKING';
      case 'VALIDATED_NOT_APPLIED': return 'VALIDATED · NOT APPLIED';
      case 'APPLIED_NOT_VERIFIED': return 'APPLIED · NOT VERIFIED';
      case 'PRODUCTION_VERIFIED': return 'PRODUCTION VERIFIED';
      case 'PRODUCTION_DRIFT': return 'PRODUCTION DRIFT';
      case 'NO_VFX': return 'NO VFX';
    }
  }

  function formatArtisticState(status: ArtisticState): string {
    switch (status) {
      case 'UNCONFIGURED': return 'UNCONFIGURED';
      case 'QA_WORKING': return 'QA WORKING';
      case 'VALIDATED': return 'VALIDATED';
      case 'VALIDATED_QA_MODIFIED': return 'VALIDATED · QA MODIFIED';
    }
  }

  function formatProductionState(status: ProductionState): string {
    switch (status) {
      case 'NOT_APPLIED': return 'NOT APPLIED';
      case 'APPLIED_NOT_TESTED': return 'APPLIED · NOT TESTED';
      case 'TESTED_NOT_CONFIRMED': return 'TESTED · NOT CONFIRMED';
      case 'VERIFIED': return 'VERIFIED';
      case 'DRIFT': return 'DRIFT';
    }
  }

  function renderCatalogue(container: HTMLElement): void {
    const body = container;
    body.innerHTML = '';

    // Result count (above filters, outside scroll)
    const countDiv = document.createElement('div');
    countDiv.className = 'lab-cat-count';
    countDiv.id = 'lab-cat-count';
    body.appendChild(countDiv);

    // View mode toggle (GRID / COMPACT)
    const viewModeRow = document.createElement('div');
    viewModeRow.className = 'lab-cat-view-mode-row';
    const viewLabel = document.createElement('span');
    viewLabel.className = 'lab-cat-view-label';
    viewLabel.textContent = 'VIEW';
    viewModeRow.appendChild(viewLabel);
    const gridBtn = document.createElement('button');
    gridBtn.className = 'lab-cat-view-btn';
    gridBtn.textContent = 'GRID';
    gridBtn.dataset.active = String(state.catalogueViewMode !== 'COMPACT');
    gridBtn.addEventListener('click', () => {
      state = { ...state, catalogueViewMode: 'GRID' };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
      updateViewModeButtons();
    });
    viewModeRow.appendChild(gridBtn);
    const compactBtn = document.createElement('button');
    compactBtn.className = 'lab-cat-view-btn';
    compactBtn.textContent = 'COMPACT';
    compactBtn.dataset.active = String(state.catalogueViewMode === 'COMPACT');
    compactBtn.addEventListener('click', () => {
      state = { ...state, catalogueViewMode: 'COMPACT' };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
      updateViewModeButtons();
    });
    viewModeRow.appendChild(compactBtn);
    body.appendChild(viewModeRow);

    function updateViewModeButtons(): void {
      gridBtn.dataset.active = String(state.catalogueViewMode !== 'COMPACT');
      compactBtn.dataset.active = String(state.catalogueViewMode === 'COMPACT');
    }

    // Nested FILTERS accordion (collapsed by default)
    const filtersWrapper = document.createElement('div');
    filtersWrapper.className = 'lab-accordion lab-nested-accordion';
    filtersWrapper.dataset.section = 'catalogue_filters';

    const filtersHeader = document.createElement('div');
    filtersHeader.className = 'lab-accordion-header lab-nested-header';
    filtersHeader.textContent = 'FILTERS';
    const filtersToggle = document.createElement('span');
    filtersToggle.className = 'lab-accordion-toggle';
    filtersHeader.appendChild(filtersToggle);

    const filtersBody = document.createElement('div');
    filtersBody.className = 'lab-accordion-body lab-nested-body';

    filtersWrapper.append(filtersHeader, filtersBody);

    // Toggle filters without full re-render (preserves scroll position)
    const updateFiltersVisual = () => {
      const isOpen = getAccordionOpen(state, 'catalogue_filters');
      filtersWrapper.classList.toggle('lab-accordion-open', isOpen);
      filtersWrapper.classList.toggle('lab-accordion-closed', !isOpen);
      filtersToggle.textContent = isOpen ? '▼' : '▶';
      filtersBody.style.display = isOpen ? '' : 'none';
    };
    filtersHeader.addEventListener('click', () => {
      const isOpen = getAccordionOpen(state, 'catalogue_filters');
      state = setAccordionOpen(state, 'catalogue_filters', !isOpen);
      saveLabStateToStorage(localStorage, state);
      updateFiltersVisual();
    });
    updateFiltersVisual();
    body.appendChild(filtersWrapper);

    // Search input inside filters
    const searchLabel = document.createElement('label');
    searchLabel.textContent = 'SEARCH';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'candidate ID or filename...';
    searchInput.value = state.search;
    searchInput.addEventListener('input', () => {
      state = { ...state, search: searchInput.value, cataloguePage: 1 };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
    });
    searchLabel.appendChild(searchInput);
    filtersBody.appendChild(searchLabel);

    // Filter selects inside filters
    const filterRow = document.createElement('div');
    filterRow.className = 'lab-filter-row';

    const formatSelect = createFilterSelect('FORMAT', [
      { value: 'ALL', label: 'All formats' },
      { value: '2048_16F', label: '2048 (16F)' },
      { value: '4096_64F', label: '4096 (64F)' },
      { value: 'OTHER', label: 'Other' },
    ], state.formatFilter, (val) => {
      state = { ...state, formatFilter: val as LabFormatFilter, cataloguePage: 1 };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
    });
    filterRow.appendChild(formatSelect);

    const availSelect = createFilterSelect('AVAILABILITY', [
      { value: 'ALL', label: 'All' },
      { value: 'READY', label: 'Ready' },
      { value: 'AVAILABLE_ON_DEMAND', label: 'Available on demand' },
      { value: 'UNSUPPORTED_NATIVE', label: 'Unsupported native' },
    ], state.availabilityFilter, (val) => {
      state = { ...state, availabilityFilter: val as LabAvailabilityFilter, cataloguePage: 1 };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
    });
    filterRow.appendChild(availSelect);

    const gifSelect = createFilterSelect('GIF', [
      { value: 'ALL', label: 'All GIF' },
      { value: 'HAS_GIF', label: 'Has GIF' },
      { value: 'NO_GIF', label: 'No GIF' },
    ], state.gifFilter ?? 'ALL', (val) => {
      state = { ...state, gifFilter: val as LabGifFilter, cataloguePage: 1 };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
    });
    filterRow.appendChild(gifSelect);

    const usageSelect = createFilterSelect('USAGE', [
      { value: 'ALL', label: 'All' },
      { value: 'USED', label: 'Used' },
      { value: 'UNUSED', label: 'Unused' },
      { value: 'CURRENT', label: 'Current action' },
    ], state.usageFilter, (val) => {
      state = { ...state, usageFilter: val as LabUsageFilter, cataloguePage: 1 };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
    });
    filterRow.appendChild(usageSelect);

    filtersBody.appendChild(filterRow);

    // Scrollable results container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'lab-cat-scroll';
    scrollContainer.id = 'lab-cat-scroll-inner';
    body.appendChild(scrollContainer);

    // Pager container (outside scroll, below results)
    const pagerContainer = document.createElement('div');
    pagerContainer.className = 'lab-cat-pager-container';
    pagerContainer.id = 'lab-cat-pager-inner';
    body.appendChild(pagerContainer);

    // Selection bar (outside scroll, below pager) — shows selected candidate + USE AS QA SOURCE
    const selectionBar = document.createElement('div');
    selectionBar.className = 'lab-cat-selection-bar';
    selectionBar.id = 'lab-cat-selection-bar';
    body.appendChild(selectionBar);

    renderCatalogueResults();
  }

  function renderCatalogueResults(): void {
    const scrollContainer = document.getElementById('lab-cat-scroll-inner');
    const pagerContainer = document.getElementById('lab-cat-pager-inner');
    const countDiv = document.getElementById('lab-cat-count');
    if (!scrollContainer || !pagerContainer || !countDiv) return;

    catalogueResult = searchCatalogue(catalogue, {
      search: state.search,
      formatFilter: state.formatFilter,
      availabilityFilter: state.availabilityFilter,
      usageFilter: state.usageFilter,
      gifFilter: state.gifFilter ?? 'ALL',
      page: state.cataloguePage,
      pageSize: LAB_PAGE_SIZE,
      currentActionKey,
    });

    countDiv.textContent = `${catalogueResult.totalFiltered} results · page ${catalogueResult.page}/${catalogueResult.pageCount}`;

    // Disconnect old observer before rebuilding
    if (previewObserver) {
      previewObserver.disconnect();
      previewObserver = null;
    }
    miniPreviewStats = { active: 0, loaded: 0, failed: 0 };

    scrollContainer.innerHTML = '';
    const isGrid = state.catalogueViewMode !== 'COMPACT';
    scrollContainer.classList.toggle('lab-cat-grid-mode', isGrid);
    scrollContainer.classList.toggle('lab-cat-compact-mode', !isGrid);

    for (const rec of catalogueResult.results) {
      const item = isGrid ? createGridCard(rec) : createCatalogueItem(rec);
      scrollContainer.appendChild(item);
    }

    // Set up IntersectionObserver for lazy GIF loading (grid mode only)
    if (isGrid) {
      setupPreviewObserver(scrollContainer);
    }

    pagerContainer.innerHTML = '';
    if (catalogueResult.pageCount > 1) {
      const pager = document.createElement('div');
      pager.className = 'lab-pager';

      const prevBtn = document.createElement('button');
      prevBtn.textContent = '◀ PREV';
      prevBtn.disabled = catalogueResult.page <= 1;
      prevBtn.addEventListener('click', () => {
        state = { ...state, cataloguePage: Math.max(1, catalogueResult.page - 1) };
        saveLabStateToStorage(localStorage, state);
        renderCatalogueResults();
      });
      pager.appendChild(prevBtn);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'NEXT ▶';
      nextBtn.disabled = catalogueResult.page >= catalogueResult.pageCount;
      nextBtn.addEventListener('click', () => {
        state = { ...state, cataloguePage: Math.min(catalogueResult.pageCount, catalogueResult.page + 1) };
        saveLabStateToStorage(localStorage, state);
        renderCatalogueResults();
      });
      pager.appendChild(nextBtn);

      pagerContainer.appendChild(pager);
    }

    updateMiniPreviewStats();
    updateCatalogueSelectionBar();
  }

  function setupPreviewObserver(scrollContainer: HTMLElement): void {
    if (typeof IntersectionObserver === 'undefined') return;
    previewObserver = new IntersectionObserver((entries) => {
      let activeCount = 0;
      // Count currently active
      const imgs = scrollContainer.querySelectorAll('img.lab-mini-gif[data-preview-url]');
      for (const img of imgs) {
        if ((img as HTMLImageElement).src) activeCount++;
      }
      for (const entry of entries) {
        const img = entry.target as HTMLImageElement;
        if (entry.isIntersecting) {
          if (activeCount < MAX_ACTIVE_MINI_PREVIEWS && !img.src && img.dataset.previewUrl) {
            img.src = img.dataset.previewUrl;
            miniPreviewStats.active++;
            miniPreviewStats.loaded++;
            activeCount++;
          }
        } else {
          // Unload when far outside viewport
          if (img.src) {
            img.src = '';
            miniPreviewStats.active = Math.max(0, miniPreviewStats.active - 1);
          }
        }
      }
      updateMiniPreviewStats();
    }, {
      root: scrollContainer,
      rootMargin: '150px',
      threshold: 0,
    });
    const imgs = scrollContainer.querySelectorAll('img.lab-mini-gif[data-preview-url]');
    for (const img of imgs) {
      previewObserver.observe(img);
    }
  }

  function updateMiniPreviewStats(): void {
    const el = document.getElementById('lab-mini-preview-stats');
    if (el) {
      el.innerHTML = `
        <span>Active: <b>${miniPreviewStats.active}</b></span>
        <span>Loaded: <b>${miniPreviewStats.loaded}</b></span>
        <span>Failed: <b>${miniPreviewStats.failed}</b></span>
      `;
    }
  }

  function createGridCard(rec: LabCatalogueRecord): HTMLElement {
    const card = document.createElement('div');
    card.className = 'lab-grid-card';
    card.style.cursor = 'pointer';
    card.dataset.candidateId = rec.candidateId;

    const availClass = rec.availability === 'READY'
      ? 'lab-avail-ready'
      : rec.availability === 'AVAILABLE_ON_DEMAND'
        ? 'lab-avail-on-demand'
        : 'lab-avail-unsupported';
    const availLabel = rec.availability === 'READY'
      ? 'READY'
      : rec.availability === 'AVAILABLE_ON_DEMAND'
        ? 'ON DEMAND'
        : 'UNSUPPORTED';

    // Check state markers
    const action = getCurrentAction();
    const stepIdx = action ? getSelectedVisualStepIndex(state, action) : 0;
    const qaId = action ? getQaSourceId(state, action.actionKey, stepIdx) : undefined;
    const validated = action ? getValidatedConfig(state, action.actionKey, stepIdx) : undefined;
    const isQaSource = qaId === rec.candidateId;
    const isValidated = validated?.sourceId === rec.candidateId;
    const isPreviewing = getPreviewCandidateId(state) === rec.candidateId;
    const prodSourceId = action?.vfxSteps[stepIdx]?.sourceCandidateId ?? action?.vfxSteps[stepIdx]?.spriteSheetId;
    const isProduction = prodSourceId === rec.candidateId;

    // Badges
    const badges: string[] = [];
    if (isPreviewing) badges.push('<span class="lab-badge lab-badge-preview">PREVIEWING</span>');
    if (isQaSource) badges.push('<span class="lab-badge lab-badge-qa">QA</span>');
    if (isValidated) badges.push('<span class="lab-badge lab-badge-validated">VALIDATED</span>');
    if (isProduction) badges.push('<span class="lab-badge lab-badge-prod">PROD</span>');

    // Mini preview area
    const previewArea = document.createElement('div');
    previewArea.className = 'lab-mini-preview-area';

    if (rec.hasGifPreview) {
      const inventoryRec = (inventoryJson as { results: InventoryJsonRecord[] }).results.find((r) => r.assetId === rec.candidateId);
      const preview = resolvePreview(rec.candidateId, inventoryRec);
      if (preview.hasPreview && preview.previewUrl) {
        const img = document.createElement('img');
        img.className = 'lab-mini-gif';
        img.dataset.previewUrl = preview.previewUrl;
        img.alt = `${rec.candidateId} — ${rec.sourceFilename}`;
        img.addEventListener('error', () => {
          const errDiv = document.createElement('div');
          errDiv.className = 'lab-mini-preview-error';
          errDiv.textContent = 'PREVIEW ERROR';
          img.replaceWith(errDiv);
          miniPreviewStats.failed++;
          miniPreviewStats.active = Math.max(0, miniPreviewStats.active - 1);
          updateMiniPreviewStats();
        });
        previewArea.appendChild(img);
      } else {
        const noGif = document.createElement('div');
        noGif.className = 'lab-mini-no-preview';
        noGif.textContent = 'NO GIF PREVIEW';
        previewArea.appendChild(noGif);
      }
    } else {
      const noGif = document.createElement('div');
      noGif.className = 'lab-mini-no-preview';
      noGif.textContent = 'NO GIF PREVIEW';
      previewArea.appendChild(noGif);
    }

    card.appendChild(previewArea);

    // Metadata area
    const metaDiv = document.createElement('div');
    metaDiv.className = 'lab-grid-card-meta';
    metaDiv.innerHTML = `
      <div class="lab-grid-card-id">${rec.candidateId}</div>
      <div class="lab-grid-card-file">${rec.sourceFilename}</div>
      <div class="lab-grid-card-info">
        <span>${rec.width}×${rec.height}</span>
        <span>${rec.nativeGrid} / ${rec.nativeFrameCount}f</span>
        <span class="${availClass}">${availLabel}</span>
        <span>${rec.hasGifPreview ? 'GIF' : 'NO GIF'}</span>
      </div>
      ${badges.length > 0 ? `<div class="lab-grid-card-badges">${badges.join('')}</div>` : ''}
    `;
    card.appendChild(metaDiv);

    // Click = PREVIEW ONLY (does NOT assign QA source, does NOT rebuild list)
    card.addEventListener('click', () => {
      state = setPreviewCandidateId(state, rec.candidateId);
      saveLabStateToStorage(localStorage, state);
      updateCataloguePreviewMarkers();
      updateCatalogueSelectionBar();
    });

    return card;
  }

  function createCatalogueItem(rec: LabCatalogueRecord): HTMLElement {
    const item = document.createElement('div');
    item.className = 'lab-cat-item';
    item.style.cursor = 'pointer';
    item.dataset.candidateId = rec.candidateId;

    const availClass = rec.availability === 'READY'
      ? 'lab-avail-ready'
      : rec.availability === 'AVAILABLE_ON_DEMAND'
        ? 'lab-avail-on-demand'
        : 'lab-avail-unsupported';
    const availLabel = rec.availability === 'READY'
      ? 'READY'
      : rec.availability === 'AVAILABLE_ON_DEMAND'
        ? 'AVAILABLE ON DEMAND'
        : 'UNSUPPORTED NATIVE';

    // Check if this candidate is the current QA source or validated
    const action = getCurrentAction();
    const stepIdx = action ? getSelectedVisualStepIndex(state, action) : 0;
    const qaId = action ? getQaSourceId(state, action.actionKey, stepIdx) : undefined;
    const validated = action ? getValidatedConfig(state, action.actionKey, stepIdx) : undefined;
    const isQaSource = qaId === rec.candidateId;
    const isValidated = validated?.sourceId === rec.candidateId;
    const isPreviewing = getPreviewCandidateId(state) === rec.candidateId;

    item.innerHTML = `
      <div class="lab-cat-id"><b>${rec.candidateId}</b>${isPreviewing ? ' ◀ PREVIEWING' : ''}${isQaSource ? ' ◀ QA' : ''}${isValidated ? ' ◀ VALIDATED' : ''}</div>
      <div class="lab-cat-file">${rec.sourceFilename}</div>
      <div class="lab-cat-meta">
        <span>${rec.width}×${rec.height}</span>
        <span>${rec.nativeGrid} / ${rec.nativeFrameCount}f</span>
        <span class="${availClass}">${availLabel}</span>
        <span>${rec.hasGifPreview ? 'GIF: YES' : 'GIF: NO'}</span>
      </div>
      ${rec.usedBy.length > 0 ? `<div class="lab-cat-used">Used by: ${rec.usedBy.join(', ')}</div>` : ''}
    `;

    // Click = PREVIEW ONLY (does NOT assign QA source, does NOT rebuild list)
    item.addEventListener('click', () => {
      state = setPreviewCandidateId(state, rec.candidateId);
      saveLabStateToStorage(localStorage, state);
      // Update preview markers in-place without rebuilding list (preserves scroll)
      updateCataloguePreviewMarkers();
      updateCatalogueSelectionBar();
    });

    return item;
  }

  function updateCataloguePreviewMarkers(): void {
    const scrollContainer = document.getElementById('lab-cat-scroll-inner');
    if (!scrollContainer) return;
    const previewId = getPreviewCandidateId(state);
    const action = getCurrentAction();
    const stepIdx = action ? getSelectedVisualStepIndex(state, action) : 0;
    const qaId = action ? getQaSourceId(state, action.actionKey, stepIdx) : undefined;
    const validated = action ? getValidatedConfig(state, action.actionKey, stepIdx) : undefined;
    const prodSourceId = action?.vfxSteps[stepIdx]?.sourceCandidateId ?? action?.vfxSteps[stepIdx]?.spriteSheetId;

    // Update compact items
    const items = scrollContainer.querySelectorAll('.lab-cat-item');
    for (const el of items) {
      const cid = (el as HTMLElement).dataset.candidateId;
      if (!cid) continue;
      const idDiv = el.querySelector('.lab-cat-id');
      if (!idDiv) continue;
      const isPreviewing = cid === previewId;
      const isQaSource = cid === qaId;
      const isValidated = validated?.sourceId === cid;
      const rec = catalogueResult.results.find((r) => r.candidateId === cid);
      const baseText = rec ? `<b>${rec.candidateId}</b>` : `<b>${cid}</b>`;
      const markers: string[] = [];
      if (isPreviewing) markers.push(' ◀ SELECTED');
      if (isQaSource) markers.push(' ◀ QA');
      if (isValidated) markers.push(' ◀ VALIDATED');
      idDiv.innerHTML = baseText + markers.join('');
    }

    // Update grid card badges
    const cards = scrollContainer.querySelectorAll('.lab-grid-card');
    for (const el of cards) {
      const cid = (el as HTMLElement).dataset.candidateId;
      if (!cid) continue;
      const badgeContainer = el.querySelector('.lab-grid-card-badges');
      const isPreviewing = cid === previewId;
      const isQaSource = cid === qaId;
      const isValidated = validated?.sourceId === cid;
      const isProduction = cid === prodSourceId;
      const badges: string[] = [];
      if (isPreviewing) badges.push('<span class="lab-badge lab-badge-preview">SELECTED</span>');
      if (isQaSource) badges.push('<span class="lab-badge lab-badge-qa">QA</span>');
      if (isValidated) badges.push('<span class="lab-badge lab-badge-validated">VALIDATED</span>');
      if (isProduction) badges.push('<span class="lab-badge lab-badge-prod">PROD</span>');
      if (badgeContainer) {
        badgeContainer.innerHTML = badges.join('');
      } else if (badges.length > 0) {
        const metaDiv = el.querySelector('.lab-grid-card-meta');
        if (metaDiv) {
          const newBadges = document.createElement('div');
          newBadges.className = 'lab-grid-card-badges';
          newBadges.innerHTML = badges.join('');
          metaDiv.appendChild(newBadges);
        }
      }
    }
  }

  function updateCatalogueSelectionBar(): void {
    const bar = document.getElementById('lab-cat-selection-bar');
    if (!bar) return;
    bar.innerHTML = '';
    const previewId = getPreviewCandidateId(state);
    if (!previewId) {
      bar.innerHTML = '<div class="lab-cat-selection-hint">Click a catalogue card to select.</div>';
      return;
    }
    const rec = catalogue.find((r) => r.candidateId === previewId);
    if (!rec) {
      bar.innerHTML = '<div class="lab-cat-selection-hint">Candidate not found.</div>';
      return;
    }
    const infoDiv = document.createElement('div');
    infoDiv.className = 'lab-cat-selection-info';
    infoDiv.innerHTML = `<b>SELECTED:</b> ${rec.candidateId} — ${rec.sourceFilename}`;
    bar.appendChild(infoDiv);
    const action = getCurrentAction();
    if (action && rec.availability !== 'UNSUPPORTED_NATIVE') {
      const useBtn = document.createElement('button');
      useBtn.className = 'lab-use-qa-btn';
      useBtn.textContent = rec.availability === 'READY' ? 'USE AS QA SOURCE' : 'ACQUIRE & USE AS QA SOURCE';
      useBtn.addEventListener('click', async () => {
        const stepIdx = getSelectedVisualStepIndex(state, action);
        if (rec.availability === 'AVAILABLE_ON_DEMAND') {
          acquisitionStatus[rec.candidateId] = 'ACQUIRING';
          useBtn.textContent = 'ACQUIRING...';
          useBtn.disabled = true;
          const result: AcquireResult = await acquireCandidate(rec.candidateId);
          if (!result.ok) {
            delete acquisitionStatus[rec.candidateId];
            useBtn.textContent = 'RETRY ACQUIRE';
            useBtn.disabled = false;
            statusLine.textContent = `Acquisition failed: ${result.error ?? 'unknown'}`;
            return;
          }
          delete acquisitionStatus[rec.candidateId];
        }
        state = setQaSourceId(state, action.actionKey, stepIdx, rec.candidateId);
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `QA source set: ${rec.candidateId}`;
        render();
      });
      bar.appendChild(useBtn);
    }
  }

  function createFilterSelect(
    labelText: string,
    options: { value: string; label: string }[],
    currentValue: string,
    onChange: (val: string) => void,
  ): HTMLElement {
    const label = document.createElement('label');
    label.textContent = labelText;
    const select = document.createElement('select');
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    }
    select.value = currentValue;
    select.addEventListener('change', () => onChange(select.value));
    label.appendChild(select);
    return label;
  }

  function onExport(): void {
    const snapshot = exportLabSnapshot(state);
    const json = serializeSnapshot(snapshot);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r2c-combat-vfx-lab-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    statusLine.textContent = `Snapshot exported: ${Object.keys(snapshot.actions).length} actions`;
  }

  function onExportValidated(): void {
    const config = exportValidatedConfig(state);
    const json = serializeValidatedConfig(config);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r2c-combat-vfx-validated-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const validatedCount = Object.keys(config.actions).length;
    statusLine.textContent = `Validated config exported: ${validatedCount} actions · complete=${config.complete} · heroComplete=${config.heroComplete}`;
  }

  actionSelect.addEventListener('change', () => {
    currentActionKey = actionSelect.value;
    state = { ...state, selectedActionKey: currentActionKey };
    saveLabStateToStorage(localStorage, state);
    render();
  });

  // V1E.1B: Use requestAnimationFrame for stable first render — ensures
  // CSS is applied before DOM construction, preventing layout shift and
  // column overflow/clipping on initial paint.
  requestAnimationFrame(() => render());

  // V1E.2: Escape key expands Lab from minimized mode
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && getDisplayMode(state) === 'MINIMIZED') {
      state = setDisplayMode(state, 'EXPANDED');
      saveLabStateToStorage(localStorage, state);
      render();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  return () => {
    if (previewObserver) {
      previewObserver.disconnect();
      previewObserver = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    root.remove();
  };
}

function addLabStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{position:fixed;z-index:10050;right:18px;bottom:18px;width:min(460px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow-y:auto;background:rgba(5,14,30,.95);border:1px solid #5488a6;border-radius:12px;box-shadow:0 15px 45px rgba(0,0,0,.52);padding:14px;color:#d7e7ee;font:12px/1.35 system-ui,sans-serif;backdrop-filter:blur(9px);display:flex;flex-direction:column}
    #${ROOT_ID} h2{margin:0;color:#9fe5ff;font-size:13px;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
    #${ROOT_ID} .lab-subtitle{display:block;margin:2px 0 8px;color:#8fa5b2;font-size:10px;flex-shrink:0}
    /* V1E.2: Header row + minimize button */
    #${ROOT_ID} .lab-header-row{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-shrink:0}
    #${ROOT_ID} .lab-minimize-btn{font-size:10px;padding:4px 10px;border-color:#395d77;background:#0c2134;white-space:nowrap;flex-shrink:0}
    #${ROOT_ID} .lab-minimize-btn:hover{border-color:#52b9d2;background:#0f3b52;color:#9fe5ff}
    /* V1E.2: Minimized test dock */
    #${ROOT_ID}.lab-minimized{width:clamp(340px,24vw,430px);max-width:calc(100vw - 24px);padding:10px;right:16px;bottom:16px}
    #${ROOT_ID} .lab-minimized-dock{display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0}
    #${ROOT_ID} .lab-dock-header{display:flex;justify-content:space-between;align-items:center;gap:8px}
    #${ROOT_ID} .lab-dock-title{color:#9fe5ff;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    #${ROOT_ID} .lab-dock-open-btn{font-size:10px;padding:4px 10px;border-color:#52b9d2;background:#0f3b52;color:#9fe5ff;white-space:nowrap;flex-shrink:0}
    #${ROOT_ID} .lab-dock-open-btn:hover{background:#1a5a72}
    #${ROOT_ID} .lab-dock-no-action{color:#7a96a6;font-style:italic;font-size:11px;text-align:center;padding:12px 0}
    #${ROOT_ID} .lab-dock-context{padding:6px 8px;border:1px solid #2a4a60;border-radius:6px;background:rgba(8,18,30,.4)}
    #${ROOT_ID} .lab-dock-action-name{color:#9fe5ff;font-size:13px;font-weight:700;margin-bottom:2px}
    #${ROOT_ID} .lab-dock-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:10px;color:#b9d9e7}
    #${ROOT_ID} .lab-dock-owner{color:#8fa5b2;font-weight:700;white-space:nowrap}
    #${ROOT_ID} .lab-dock-visual{white-space:nowrap}
    #${ROOT_ID} .lab-dock-badges{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}
    #${ROOT_ID} .lab-dock-playback{display:flex;flex-direction:column;gap:5px}
    #${ROOT_ID} .lab-dock-play-btn{width:100%;font-size:11px;font-weight:700;padding:7px 8px;text-align:center}
    #${ROOT_ID} .lab-dock-play-btn:disabled{opacity:.5}
    #${ROOT_ID} .lab-dock-nav{display:flex;gap:6px}
    #${ROOT_ID} .lab-dock-nav .lab-nav-btn{flex:1;text-align:center}
    #${ROOT_ID} .lab-dock-status{font-size:10px;color:#8fa5b2;text-align:center;min-height:14px}
    #${ROOT_ID} .lab-section{margin:10px 0;padding:10px;border:1px solid #2a4a60;border-radius:8px;background:rgba(12,28,44,.5)}
    #${ROOT_ID} label{display:grid;gap:4px;margin:6px 0;color:#b6d3e0;font-size:11px;font-weight:700}
    #${ROOT_ID} select,#${ROOT_ID} button,#${ROOT_ID} input{border:1px solid #395d77;border-radius:7px;background:#0c2134;color:#eff8ff;font:inherit;padding:7px}
    #${ROOT_ID} select,#${ROOT_ID} input{width:100%}
    #${ROOT_ID} button{cursor:pointer;font-weight:700;letter-spacing:.02em}
    #${ROOT_ID} button:hover:not(:disabled){border-color:#84dfff;background:#123550}
    #${ROOT_ID} button:disabled{cursor:default;opacity:.45}
    #${ROOT_ID} .lab-prod-header,#${ROOT_ID} .lab-qa-header,#${ROOT_ID} .lab-cat-header,#${ROOT_ID} .lab-history-header{color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
    #${ROOT_ID} .lab-prod-info,#${ROOT_ID} .lab-qa-info{display:grid;gap:3px;color:#b9d9e7;font-size:11px}
    #${ROOT_ID} .lab-prod-info b,#${ROOT_ID} .lab-qa-info b{color:#f1c76c}
    #${ROOT_ID} .lab-step-info{margin-top:4px;padding-top:4px;border-top:1px solid #2a4a60;color:#a7c5d3;font-size:11px}
    #${ROOT_ID} .lab-step-info b{color:#9fe5ff}
    #${ROOT_ID} .lab-no-vfx{color:#7a96a6;font-style:italic}
    #${ROOT_ID} .lab-clear-btn{margin-top:6px;border-color:#a6423a;background:#2a1010}
    #${ROOT_ID} .lab-cat-count{color:#8fa5b2;font-size:10px;margin-bottom:6px}
    #${ROOT_ID} .lab-avail-ready{color:#5fd17a}
    #${ROOT_ID} .lab-avail-on-demand{color:#ff9a4a}
    #${ROOT_ID} .lab-cat-used{color:#728c9b;font-size:9px;margin-top:1px}
    #${ROOT_ID} .lab-select-btn{margin-top:5px;width:100%;border-color:#52b9d2;background:#0f3b52}
    #${ROOT_ID} .lab-pager{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    #${ROOT_ID} .lab-history-list{display:grid;gap:4px}
    #${ROOT_ID} .lab-history-item{padding:5px;border-left:2px solid #66cfea;background:rgba(27,57,76,.32);color:#b9d9e7;font-size:11px}
    #${ROOT_ID} .lab-history-notes{color:#728c9b;font-size:10px}
    #${ROOT_ID} .lab-export-btn{width:100%;border-color:#3a8c4a;background:#0d2f1a;font-size:13px;padding:10px}
    #${ROOT_ID} .lab-status{display:block;min-height:16px;margin-top:8px;color:#8fa5b2;font-size:11px}
    #${ROOT_ID} .lab-playback-header,#${ROOT_ID} .lab-tuning-header,#${ROOT_ID} .lab-stats-header{color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
    #${ROOT_ID} .lab-route-info{color:#b9d9e7;font-size:11px;margin-bottom:6px}
    #${ROOT_ID} .lab-route-info b{color:#f1c76c}
    #${ROOT_ID} .lab-preset-info{padding:6px 8px;border:1px solid #2a4a60;border-radius:5px;background:rgba(12,28,44,.3);color:#b9d9e7;font-size:11px;margin-bottom:6px}
    #${ROOT_ID} .lab-preset-info b{color:#9fe5ff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
    #${ROOT_ID} .lab-current-vfx{padding:5px 8px;border:1px solid #3a5c70;border-radius:5px;background:rgba(20,40,56,.3);color:#f1c76c;font-size:12px;margin-bottom:6px}
    #${ROOT_ID} .lab-current-vfx b{color:#9fe5ff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
    #${ROOT_ID} .lab-no-spritesheet{padding:5px 8px;color:#7a96a6;font-size:11px;font-style:italic;margin-bottom:6px}
    #${ROOT_ID} .lab-vfx-spritesheet-selector{display:block;margin-bottom:6px;font-size:10px;color:#9fe5ff;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
    #${ROOT_ID} .lab-vfx-spritesheet-selector select{margin-top:3px;font-size:11px}
    #${ROOT_ID} .lab-btn-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
    #${ROOT_ID} .lab-play-btn{border-color:#3a7c9a;background:#0d2f3a}
    #${ROOT_ID} .lab-stage-btn-row{margin-top:8px;border-top:1px solid #1e3a50;padding-top:8px;grid-template-columns:1fr auto;align-items:center}
    #${ROOT_ID} .lab-play-stage-btn{border-color:#c47a2a;background:#3a2410;font-weight:700;letter-spacing:.04em}
    #${ROOT_ID} .lab-play-stage-btn:hover:not(:disabled){background:#4a3018}
    #${ROOT_ID} .lab-stage-hint{color:#7a96a6;font-size:10px;font-style:italic}
    #${ROOT_ID} .lab-snapshot-info{margin-top:6px;color:#8fa5b2;font-size:10px}
    #${ROOT_ID} .lab-tuning-status{font-size:11px;font-weight:700;margin-bottom:8px;padding:3px 6px;border-radius:4px;display:inline-block}
    #${ROOT_ID} .lab-status-same{background:rgba(83,209,122,.15);color:#5fd17a}
    #${ROOT_ID} .lab-status-modified{background:rgba(255,154,74,.15);color:#ff9a4a}
    #${ROOT_ID} .lab-tuning-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    #${ROOT_ID} .lab-tuning-item{padding:5px;border:1px solid #2a4a60;border-radius:5px;background:rgba(12,28,44,.3)}
    #${ROOT_ID} .lab-tuning-item.lab-tuning-modified{border-color:#ff9a4a;background:rgba(255,154,74,.06)}
    #${ROOT_ID} .lab-tuning-item label{font-size:10px;margin:0}
    #${ROOT_ID} .lab-prod-val{font-size:9px;color:#728c9b;margin-bottom:2px}
    #${ROOT_ID} .lab-tuning-item input,#${ROOT_ID} .lab-tuning-item select{font-size:11px;padding:4px}
    #${ROOT_ID} .lab-reset-btn{margin-top:8px;width:100%;border-color:#a6423a;background:#2a1010}
    #${ROOT_ID} .lab-stats-info{display:grid;grid-template-columns:1fr 1fr;gap:3px;color:#b9d9e7;font-size:10px}
    #${ROOT_ID} .lab-stats-info b{color:#9fe5ff}
    #${ROOT_ID} .lab-acquire-error{border-color:#a6423a;background:#2a1010}
    #${ROOT_ID} .lab-validation-header,#${ROOT_ID} .lab-notes-header,#${ROOT_ID} .lab-progress-header{color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
    #${ROOT_ID} .lab-validation-status{color:#b9d9e7;font-size:11px;margin-bottom:6px}
    #${ROOT_ID} .lab-validation-status b{color:#f1c76c}
    #${ROOT_ID} .lab-validation-sources{display:grid;gap:2px;color:#a7c5d3;font-size:10px;margin-bottom:8px}
    #${ROOT_ID} .lab-validation-sources b{color:#9fe5ff}
    #${ROOT_ID} .lab-validation-btn-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px}
    #${ROOT_ID} .lab-validate-btn{border-color:#3a8c4a;background:#0d2f1a}
    #${ROOT_ID} .lab-restore-btn{border-color:#3a7c9a;background:#0d2f3a}
    #${ROOT_ID} .lab-clear-val-btn{border-color:#a6423a;background:#2a1010}
    #${ROOT_ID} .lab-next-btn{width:100%;border-color:#52b9d2;background:#0f3b52;margin-top:4px}
    #${ROOT_ID} .lab-notes-input{width:100%;border:1px solid #395d77;border-radius:7px;background:#0c2134;color:#eff8ff;font:inherit;padding:7px;resize:vertical}
    #${ROOT_ID} .lab-progress-info{display:grid;gap:3px;color:#b9d9e7;font-size:10px}
    #${ROOT_ID} .lab-progress-info b{color:#9fe5ff}
    #${ROOT_ID} .lab-progress-row{margin-top:6px;color:#f1c76c;font-weight:700;font-size:10px}
    #${ROOT_ID} .lab-progress-unresolved{margin-top:6px;color:#ff9a4a;font-size:10px}
    #${ROOT_ID} .lab-export-validated-btn{width:100%;border-color:#5a3a8c;background:#1a0d2f;font-size:13px;padding:10px;margin-top:6px}
    #${ROOT_ID} .lab-accordion-controls{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
    #${ROOT_ID} .lab-accordion-btn{font-size:10px;padding:5px;border-color:#395d77;background:#0c2134}
    #${ROOT_ID} .lab-accordion{margin:6px 0;border:1px solid #2a4a60;border-radius:8px;overflow:hidden}
    #${ROOT_ID} .lab-accordion-header{padding:8px 10px;background:rgba(20,40,60,.6);color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none}
    #${ROOT_ID} .lab-accordion-header:hover{background:rgba(30,55,80,.7)}
    #${ROOT_ID} .lab-accordion-toggle{font-size:10px;color:#66cfea}
    #${ROOT_ID} .lab-accordion-body{padding:10px}
    #${ROOT_ID} .lab-accordion-closed .lab-accordion-body{display:none}
    #${ROOT_ID} .lab-source-ids{display:grid;gap:2px;color:#a7c5d3;font-size:10px;margin-bottom:8px;padding:6px;border:1px solid #2a4a60;border-radius:5px;background:rgba(12,28,44,.3)}
    #${ROOT_ID} .lab-source-ids b{color:#9fe5ff}
    #${ROOT_ID} .lab-gif-meta{display:grid;gap:2px;color:#b9d9e7;font-size:11px;margin-bottom:8px}
    #${ROOT_ID} .lab-gif-meta b{color:#f1c76c}
    #${ROOT_ID} .lab-gif-image{width:100%;border:1px solid #2a4a60;border-radius:6px;background:#0a1520}
    #${ROOT_ID} .lab-gif-unavailable{padding:20px;text-align:center;color:#7a96a6;font-style:italic;border:1px dashed #2a4a60;border-radius:6px}
    #${ROOT_ID} .lab-use-qa-btn{margin-top:4px;width:100%;border-color:#52b9d2;background:#0f3b52;font-size:11px;padding:6px}
    #${ROOT_ID} .lab-avail-unsupported{color:#a6423a}
    #${ROOT_ID} .lab-filter-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    #${ROOT_ID} .lab-cat-scroll{overflow-y:auto;max-height:50vh;min-height:200px;border:1px solid #2a4a60;border-radius:6px;padding:6px;margin-top:8px;background:rgba(8,18,30,.3)}
    #${ROOT_ID} .lab-cat-pager-container{margin-top:6px}
    #${ROOT_ID} .lab-cat-selection-bar{margin-top:6px;padding:6px 8px;border:1px solid #2a4a60;border-radius:6px;background:rgba(12,28,44,.5)}
    #${ROOT_ID} .lab-cat-selection-info{color:#b9d9e7;font-size:10px;margin-bottom:4px;word-break:break-all}
    #${ROOT_ID} .lab-cat-selection-info b{color:#9fe5ff}
    #${ROOT_ID} .lab-cat-selection-hint{color:#7a96a6;font-style:italic;font-size:10px;text-align:center}
    #${ROOT_ID} .lab-nested-accordion{margin:6px 0;border:1px solid #1e3a50;border-radius:6px;overflow:hidden}
    #${ROOT_ID} .lab-nested-header{padding:6px 8px;background:rgba(15,30,45,.5);font-size:10px}
    #${ROOT_ID} .lab-nested-body{padding:8px}
    #${ROOT_ID} .lab-cat-item{padding:5px 7px;border:1px solid #2a4a60;border-radius:5px;background:rgba(12,28,44,.4);margin-bottom:3px}
    #${ROOT_ID} .lab-cat-id{color:#9fe5ff;font-size:10px}
    #${ROOT_ID} .lab-cat-file{color:#a7c5d3;font-size:9px;word-break:break-all}
    #${ROOT_ID} .lab-cat-meta{display:flex;gap:6px;margin-top:2px;font-size:9px;color:#8fa5b2;flex-wrap:wrap}
    #${ROOT_ID} .lab-cat-view-mode-row{display:flex;align-items:center;gap:4px;margin-bottom:6px}
    #${ROOT_ID} .lab-cat-view-label{font-size:10px;font-weight:700;color:#8fa5b2;letter-spacing:.06em}
    #${ROOT_ID} .lab-cat-view-btn{font-size:10px;padding:3px 8px;border-color:#395d77;background:#0c2134}
    #${ROOT_ID} .lab-cat-view-btn[data-active="true"]{border-color:#52b9d2;background:#0f3b52;color:#9fe5ff}
    #${ROOT_ID} .lab-cat-grid-mode{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}
    #${ROOT_ID} .lab-cat-compact-mode{display:block}
    #${ROOT_ID} .lab-grid-card{border:1px solid #2a4a60;border-radius:6px;background:rgba(12,28,44,.5);overflow:hidden;transition:border-color .15s}
    #${ROOT_ID} .lab-grid-card:hover{border-color:#52b9d2}
    #${ROOT_ID} .lab-mini-preview-area{height:130px;background:#0a1520;display:flex;align-items:center;justify-content:center;overflow:hidden}
    #${ROOT_ID} .lab-mini-gif{width:100%;height:100%;object-fit:contain}
    #${ROOT_ID} .lab-mini-no-preview{color:#7a96a6;font-style:italic;font-size:10px;text-align:center}
    #${ROOT_ID} .lab-mini-preview-error{color:#a6423a;font-size:10px;text-align:center;font-weight:700}
    #${ROOT_ID} .lab-grid-card-meta{padding:5px 7px}
    #${ROOT_ID} .lab-grid-card-id{color:#9fe5ff;font-size:10px;font-weight:700}
    #${ROOT_ID} .lab-grid-card-file{color:#a7c5d3;font-size:9px;word-break:break-all;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #${ROOT_ID} .lab-grid-card-info{display:flex;gap:4px;margin-top:2px;font-size:8px;color:#8fa5b2;flex-wrap:wrap}
    #${ROOT_ID} .lab-grid-card-badges{display:flex;gap:3px;margin-top:3px;flex-wrap:wrap}
    #${ROOT_ID} .lab-badge{font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;letter-spacing:.03em}
    #${ROOT_ID} .lab-badge-preview{background:rgba(82,185,210,.2);color:#52b9d2}
    #${ROOT_ID} .lab-badge-qa{background:rgba(241,199,108,.2);color:#f1c76c}
    #${ROOT_ID} .lab-badge-validated{background:rgba(83,209,122,.2);color:#5fd17a}
    #${ROOT_ID} .lab-badge-prod{background:rgba(166,66,58,.2);color:#e07060}
    /* V1E.1C Workbench Layout */
    #${ROOT_ID}{width:min(960px,calc(100vw - 36px))}
    #${ROOT_ID} .lab-action-bar{margin-bottom:8px;padding:8px 10px;border:1px solid #2a4a60;border-radius:8px;background:rgba(12,28,44,.5);flex:0 0 auto;min-height:0}
    #${ROOT_ID} .lab-action-context{width:100%;min-width:0}
    #${ROOT_ID} .lab-action-main-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;margin-bottom:6px}
    #${ROOT_ID} .lab-action-select-wrap{min-width:0}
    #${ROOT_ID} .lab-action-select-wrap select{width:100%}
    #${ROOT_ID} .lab-action-nav{display:flex;flex-direction:row;gap:6px;flex-shrink:0}
    #${ROOT_ID} .lab-nav-btn{font-size:10px;padding:6px 10px;border-color:#395d77;background:#0c2134;white-space:nowrap}
    #${ROOT_ID} .lab-nav-next{border-color:#52b9d2;background:#0f3b52;color:#9fe5ff}
    #${ROOT_ID} .lab-action-meta-row{display:flex;gap:6px 12px;flex-wrap:wrap;align-items:center}
    #${ROOT_ID} .lab-action-meta-items{display:flex;gap:6px 10px;flex-wrap:wrap;align-items:center;font-size:10px;color:#b9d9e7}
    #${ROOT_ID} .lab-action-meta-items b{color:#f1c76c}
    #${ROOT_ID} .lab-action-owner-chip{color:#9fe5ff;font-weight:700;white-space:nowrap}
    #${ROOT_ID} .lab-action-preset-chip{white-space:nowrap}
    #${ROOT_ID} .lab-action-visual-chip{white-space:nowrap}
    #${ROOT_ID} .lab-action-progress-chip{white-space:nowrap;font-size:9px;color:#8fa5b2}
    #${ROOT_ID} .lab-action-progress-chip b{color:#9fe5ff}
    #${ROOT_ID} .lab-action-badges{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
    #${ROOT_ID} .lab-badge-artistic,#${ROOT_ID} .lab-badge-production{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;letter-spacing:.03em;white-space:nowrap}
    #${ROOT_ID} .lab-artistic-unconfigured{background:rgba(122,150,166,.15);color:#7a96a6}
    #${ROOT_ID} .lab-artistic-qa_working{background:rgba(255,154,74,.15);color:#ff9a4a}
    #${ROOT_ID} .lab-artistic-validated{background:rgba(83,209,122,.15);color:#5fd17a}
    #${ROOT_ID} .lab-artistic-validated_qa_modified{background:rgba(241,199,108,.15);color:#f1c76c}
    #${ROOT_ID} .lab-production-not_applied{background:rgba(122,150,166,.15);color:#7a96a6}
    #${ROOT_ID} .lab-production-applied_not_tested{background:rgba(82,185,210,.15);color:#52b9d2}
    #${ROOT_ID} .lab-production-tested_not_confirmed{background:rgba(82,185,210,.25);color:#84dfff}
    #${ROOT_ID} .lab-production-verified{background:rgba(83,209,122,.15);color:#5fd17a}
    #${ROOT_ID} .lab-production-drift{background:rgba(166,66,58,.2);color:#e07060}
    #${ROOT_ID} .lab-queue-bar{display:flex;align-items:center;gap:4px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto}
    #${ROOT_ID} .lab-queue-label{font-size:10px;font-weight:700;color:#8fa5b2;letter-spacing:.06em;margin-right:4px}
    #${ROOT_ID} .lab-queue-btn{font-size:10px;padding:4px 8px;border-color:#395d77;background:#0c2134}
    #${ROOT_ID} .lab-queue-active{border-color:#52b9d2;background:#0f3b52;color:#9fe5ff}
    #${ROOT_ID} .lab-workbench{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,0.85fr);gap:10px;margin-bottom:8px;min-height:0;flex-shrink:0}
    #${ROOT_ID} .lab-col-catalogue{border:1px solid #2a4a60;border-radius:8px;padding:8px;background:rgba(8,18,30,.3);min-height:0;overflow-y:auto;max-height:calc(100vh - 320px)}
    #${ROOT_ID} .lab-col-inspector{border:1px solid #2a4a60;border-radius:8px;padding:8px;background:rgba(12,28,44,.3);min-height:0;overflow-y:auto;max-height:calc(100vh - 320px)}
    #${ROOT_ID} .lab-cta-bar{margin-bottom:8px;padding:10px;border:1px solid #3a5c70;border-radius:8px;background:rgba(20,40,56,.5);text-align:center;flex-shrink:0;position:sticky;bottom:0;z-index:10;backdrop-filter:blur(6px)}
    #${ROOT_ID} .lab-cta-label{font-size:9px;font-weight:800;color:#8fa5b2;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
    #${ROOT_ID} .lab-cta-primary{font-size:13px;font-weight:700;color:#9fe5ff;letter-spacing:.04em}
    #${ROOT_ID} .lab-cta-novfx{color:#7a96a6;font-style:italic}
    #${ROOT_ID} .lab-cta-states{display:flex;gap:6px;justify-content:center;margin-top:4px;flex-wrap:wrap}
    #${ROOT_ID} .lab-cta-state{font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px}
    #${ROOT_ID} .lab-cta-secondary{font-size:11px;color:#8fa5b2;margin-top:4px}
    #${ROOT_ID} .lab-inspector-section{margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #1e3a50}
    #${ROOT_ID} .lab-inspector-section:last-child{border-bottom:none}
    #${ROOT_ID} .lab-inspector-title{color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
    #${ROOT_ID} .lab-playback-group-header{color:#8fa5b2;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:8px 0 4px;padding-bottom:2px;border-bottom:1px solid #1e3a50}
    #${ROOT_ID} .lab-playback-group-header:first-of-type{margin-top:4px}
    #${ROOT_ID} .lab-source-pipeline{display:grid;gap:2px;padding:6px;border:1px solid #2a4a60;border-radius:5px;background:rgba(12,28,44,.3)}
    #${ROOT_ID} .lab-pipeline-step{padding:4px 6px;border-radius:4px;background:rgba(8,18,30,.4);font-size:10px;color:#b9d9e7}
    #${ROOT_ID} .lab-pipeline-step b{color:#9fe5ff;font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:2px}
    #${ROOT_ID} .lab-pipeline-arrow{text-align:center;color:#5488a6;font-size:10px}
    #${ROOT_ID} .lab-lifecycle-badge{font-size:11px;font-weight:700;padding:4px 8px;border-radius:4px;display:inline-block;margin:4px 0}
    #${ROOT_ID} .lab-lifecycle-unconfigured{background:rgba(122,150,166,.15);color:#7a96a6}
    #${ROOT_ID} .lab-lifecycle-qa_working{background:rgba(255,154,74,.15);color:#ff9a4a}
    #${ROOT_ID} .lab-lifecycle-validated_not_applied{background:rgba(241,199,108,.15);color:#f1c76c}
    #${ROOT_ID} .lab-lifecycle-applied_not_verified{background:rgba(82,185,210,.15);color:#52b9d2}
    #${ROOT_ID} .lab-lifecycle-production_verified{background:rgba(83,209,122,.15);color:#5fd17a}
    #${ROOT_ID} .lab-lifecycle-production_drift{background:rgba(166,66,58,.2);color:#e07060}
    #${ROOT_ID} .lab-lifecycle-no_vfx{background:rgba(122,150,166,.1);color:#7a96a6;font-style:italic}
    #${ROOT_ID} .lab-apply-btn{border-color:#5a3a8c;background:#1a0d2f;font-size:11px}
    #${ROOT_ID} .lab-apply-btn:hover:not(:disabled){background:#2a154a}
    #${ROOT_ID} .lab-confirm-verified-btn{width:100%;border-color:#3a8c4a;background:#0d2f1a;font-size:12px;font-weight:700;padding:8px;margin-top:6px}
    #${ROOT_ID} .lab-confirm-verified-btn:hover:not(:disabled){background:#1a4a2a}
    #${ROOT_ID} .lab-confirm-reason{color:#ff9a4a;font-size:10px;font-weight:700;padding:3px 6px;margin-top:4px;border:1px solid rgba(255,154,74,.3);border-radius:4px;background:rgba(255,154,74,.08)}
    #${ROOT_ID} .lab-prod-test-warning{color:#ff9a4a;font-size:10px;font-weight:700;padding:4px 6px;border:1px solid rgba(255,154,74,.3);border-radius:4px;background:rgba(255,154,74,.08);margin-bottom:4px;grid-column:1/-1}
    #${ROOT_ID} .lab-play-validated-stage-btn{border-color:#3a8c4a;background:#0d2f1a;font-weight:700}
    #${ROOT_ID} .lab-play-validated-stage-btn:hover:not(:disabled){background:#1a4a2a}
    #${ROOT_ID} .lab-play-prod-stage-btn{border-color:#c47a2a;background:#3a2410;font-weight:700}
    #${ROOT_ID} .lab-play-prod-stage-btn:hover:not(:disabled){background:#4a3018}
    #${ROOT_ID} .lab-debug-ids{display:grid;gap:2px;color:#728c9b;font-size:9px;padding:6px;border:1px solid #1e3a50;border-radius:5px;background:rgba(8,18,30,.3);margin-top:6px;word-break:break-all}
    #${ROOT_ID} .lab-debug-ids b{color:#8fa5b2}
    /* V1E.3: Reset Artistic Workspace */
    #${ROOT_ID} .lab-reset-section{margin-top:10px;padding-top:8px;border-top:1px solid #2a4a60}
    #${ROOT_ID} .lab-reset-workspace-btn{width:100%;border-color:#a6423a;background:#2a1010;font-size:11px;font-weight:700;padding:8px;color:#e07060}
    #${ROOT_ID} .lab-reset-workspace-btn:hover{background:#3a1818;border-color:#c45a4a}
    /* V1E.3.4: System / Debug Tools — standalone sibling panels, no outer accordion */
    #${ROOT_ID} .lab-debug-tools{display:flex;flex-direction:column;gap:10px;margin-top:10px}
    #${ROOT_ID} .lab-debug-tools-heading{color:#9fe5ff;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 0;border-bottom:1px solid #2a4a60}
    #${ROOT_ID} .lab-debug-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #${ROOT_ID} .lab-debug-card{border:1px solid #2a4a60;border-radius:8px;background:rgba(12,28,44,.3);overflow:hidden}
    #${ROOT_ID} .lab-debug-card-title{padding:6px 10px;background:rgba(15,30,45,.5);color:#9fe5ff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
    #${ROOT_ID} .lab-debug-card-body{padding:8px 10px}
    #${ROOT_ID} .lab-debug-status-section{color:#f1c76c;font-weight:700;font-size:10px;margin-top:4px;margin-bottom:2px}
    #${ROOT_ID} .lab-debug-status-section:first-child{margin-top:0}
    #${ROOT_ID} .lab-debug-status-row{color:#b9d9e7;font-size:10px;line-height:1.5}
    #${ROOT_ID} .lab-debug-status-row b{color:#9fe5ff}
    #${ROOT_ID} .lab-debug-subsection{border:1px solid #1e3a50;border-radius:6px;overflow:hidden}
    #${ROOT_ID} .lab-debug-subsection-header{padding:6px 10px;background:rgba(15,30,45,.5);color:#9fe5ff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none}
    #${ROOT_ID} .lab-debug-subsection-header:hover{background:rgba(20,40,60,.6)}
    #${ROOT_ID} .lab-debug-subsection-toggle{font-size:9px;color:#66cfea;min-width:10px}
    #${ROOT_ID} .lab-debug-subsection-label{flex:1}
    #${ROOT_ID} .lab-debug-subsection-count{color:#8fa5b2;font-size:10px;font-weight:700}
    #${ROOT_ID} .lab-debug-subsection-body{padding:8px 10px}
    #${ROOT_ID} .lab-debug-empty{color:#7a96a6;font-size:10px;font-style:italic}
    #${ROOT_ID} .lab-debug-history-list{max-height:200px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;padding-right:4px;display:grid;gap:4px}
    #${ROOT_ID} .lab-reset-audit{display:grid;gap:3px}
    #${ROOT_ID} .lab-audit-row{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#b9d9e7;padding:2px 0}
    #${ROOT_ID} .lab-audit-row b{color:#9fe5ff;font-weight:700}
    #${ROOT_ID} .lab-audit-semantic{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:5px;margin-top:4px;font-size:11px;font-weight:800}
    #${ROOT_ID} .lab-audit-semantic span:first-child{letter-spacing:.06em;text-transform:uppercase}
    #${ROOT_ID} .lab-semantic-clean-yes{background:rgba(83,209,122,.12);color:#5fd17a;border:1px solid rgba(83,209,122,.3)}
    #${ROOT_ID} .lab-semantic-clean-no{background:rgba(255,154,74,.12);color:#ff9a4a;border:1px solid rgba(255,154,74,.3)}
    #${ROOT_ID} .lab-semantic-badge{padding:2px 8px;border-radius:4px;font-weight:900}
    #${ROOT_ID} .lab-semantic-badge.lab-semantic-clean-yes{background:rgba(83,209,122,.2);color:#5fd17a}
    #${ROOT_ID} .lab-semantic-badge.lab-semantic-clean-no{background:rgba(255,154,74,.2);color:#ff9a4a}
    #${ROOT_ID} .lab-advanced-maintenance{padding:10px;border:1px solid #2a4a60;border-radius:8px;background:rgba(20,30,40,.4)}
    #${ROOT_ID} .lab-maintenance-header{color:#e07060;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
    #${ROOT_ID} .lab-maintenance-desc{color:#8fa5b2;font-size:10px;margin-bottom:8px;line-height:1.4;display:grid;gap:2px}
    @media(max-width:700px){#${ROOT_ID} .lab-workbench{grid-template-columns:1fr}#${ROOT_ID} .lab-col-catalogue,#${ROOT_ID} .lab-col-inspector{max-height:40vh}#${ROOT_ID} .lab-action-main-row{grid-template-columns:1fr}#${ROOT_ID} .lab-action-nav{justify-content:flex-end}#${ROOT_ID} .lab-debug-grid-two{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

export function isVfxLabEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return isLabEnabled(params);
}
