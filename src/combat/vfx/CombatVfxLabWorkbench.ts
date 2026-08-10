/**
 * R2C-LAB V1C — Combat VFX Presentation Lab Workbench UI.
 *
 * Permanent dev-only panel for VFX designers. Installed only when
 * `vfxlab=1` is present in the combat iframe URL.
 *
 * V1C adds: validation snapshots, PLAY VALIDATED, action-level status,
 * global progress, NEXT TO VALIDATE navigation, visual notes, and
 * deterministic final validated JSON export.
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
} from './CombatVfxLab';
import type {
  LabAction,
  LabState,
  LabCatalogueRecord,
  LabFormatFilter,
  LabAvailabilityFilter,
  LabUsageFilter,
  LabCatalogueResult,
  LabPresentationOverride,
  LabValidationStepStatus,
  LabValidationActionStatus,
  LabValidationProgress,
  ValidatedStepConfiguration,
  ValidatedConfigExport,
} from './CombatVfxLab';
import type { VfxAnchor, VfxOrientation } from './VfxTypes';
import type { VfxResourceStats } from './VfxResourceManager';
import { acquireCandidate } from './LabAcquisition';
import type { AcquireResult } from './LabAcquisition';
import type { LabPlaybackContext, LabPlaybackSnapshot } from './LabPlayback';
import { playProduction, playQaOverride, playValidated, replay, getLastPlaybackSnapshot } from './LabPlayback';

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

  addLabStyle();

  const root = document.createElement('aside');
  root.id = ROOT_ID;
  root.setAttribute('aria-label', 'Combat VFX Presentation Lab');

  const title = document.createElement('h2');
  title.textContent = 'Combat VFX Lab';
  const subtitle = document.createElement('span');
  subtitle.className = 'lab-subtitle';
  subtitle.textContent = `V1C — ${actionCounts.total} actions · ${counts.total} catalogue records · DEV ONLY`;
  root.append(title, subtitle);

  const actionSection = document.createElement('div');
  actionSection.className = 'lab-section';
  const actionLabel = document.createElement('label');
  actionLabel.textContent = 'ACTION';
  const actionSelect = document.createElement('select');
  populateActionSelect(actionSelect);
  actionSelect.value = currentActionKey;
  actionLabel.appendChild(actionSelect);
  actionSection.appendChild(actionLabel);
  root.appendChild(actionSection);

  const stepSection = document.createElement('div');
  stepSection.className = 'lab-section';
  root.appendChild(stepSection);

  const prodSection = document.createElement('div');
  prodSection.className = 'lab-section';
  root.appendChild(prodSection);

  const qaSection = document.createElement('div');
  qaSection.className = 'lab-section';
  root.appendChild(qaSection);

  const playbackSection = document.createElement('div');
  playbackSection.className = 'lab-section';
  root.appendChild(playbackSection);

  const validationSection = document.createElement('div');
  validationSection.className = 'lab-section';
  root.appendChild(validationSection);

  const tuningSection = document.createElement('div');
  tuningSection.className = 'lab-section';
  root.appendChild(tuningSection);

  const notesSection = document.createElement('div');
  notesSection.className = 'lab-section';
  root.appendChild(notesSection);

  const progressSection = document.createElement('div');
  progressSection.className = 'lab-section';
  root.appendChild(progressSection);

  const statsSection = document.createElement('div');
  statsSection.className = 'lab-section';
  root.appendChild(statsSection);

  const catalogueSection = document.createElement('div');
  catalogueSection.className = 'lab-section';
  root.appendChild(catalogueSection);

  const historySection = document.createElement('div');
  historySection.className = 'lab-section';
  root.appendChild(historySection);

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

  function render(): void {
    const action = getCurrentAction();
    if (!action) {
      stepSection.innerHTML = '';
      prodSection.innerHTML = '';
      qaSection.innerHTML = '';
      playbackSection.innerHTML = '';
      validationSection.innerHTML = '';
      tuningSection.innerHTML = '';
      notesSection.innerHTML = '';
      progressSection.innerHTML = '';
      statsSection.innerHTML = '';
      historySection.innerHTML = '';
      renderCatalogue();
      return;
    }

    renderStepSelector(action);
    renderProduction(action);
    renderQaSource(action);
    renderPlayback(action);
    renderValidation(action);
    renderTuning(action);
    renderNotes(action);
    renderProgress();
    renderStats();
    renderHistory(action);
    renderCatalogue();
  }

  function renderStepSelector(action: LabAction): void {
    stepSection.innerHTML = '';
    if (action.vfxSteps.length <= 1) return;
    const label = document.createElement('label');
    label.textContent = 'VFX STEP';
    const select = document.createElement('select');
    const currentStep = getSelectedStep(state, action.actionKey);
    for (let i = 0; i < action.vfxSteps.length; i++) {
      const step = action.vfxSteps[i]!;
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Step ${i}: ${step.stepType}${step.spriteSheetId ? ` (${step.spriteSheetId})` : ''}`;
      select.appendChild(opt);
    }
    select.value = String(currentStep);
    select.addEventListener('change', () => {
      state = setSelectedStep(state, action.actionKey, parseInt(select.value, 10));
      saveLabStateToStorage(localStorage, state);
      render();
    });
    label.appendChild(select);
    stepSection.appendChild(label);
  }

  function renderProduction(action: LabAction): void {
    prodSection.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'lab-prod-header';
    header.textContent = 'PRODUCTION STATE';
    prodSection.appendChild(header);

    const info = document.createElement('div');
    info.className = 'lab-prod-info';

    const stepIdx = getSelectedStep(state, action.actionKey);
    const step = action.vfxSteps[stepIdx];

    const routeDiv = document.createElement('div');
    routeDiv.innerHTML = `<b>Route:</b> ${action.route}${action.routeReason ? ` (${action.routeReason})` : ''}`;
    info.appendChild(routeDiv);

    const presetDiv = document.createElement('div');
    presetDiv.innerHTML = `<b>Preset:</b> ${action.currentPresetId ?? 'none'}`;
    info.appendChild(presetDiv);

    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = `<b>Source status:</b> ${action.sourceStatus}`;
    info.appendChild(statusDiv);

    if (step) {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'lab-step-info';
      stepDiv.innerHTML = `<b>Step ${step.stepIndex}:</b> ${step.stepType}`;
      if (step.spriteSheetId) {
        stepDiv.innerHTML += `<br><b>Sprite sheet:</b> ${step.spriteSheetId}`;
      }
      if (step.sourceCandidateId) {
        stepDiv.innerHTML += `<br><b>Source candidate:</b> ${step.sourceCandidateId}`;
      }
      if (step.sourceFilename) {
        stepDiv.innerHTML += `<br><b>Source file:</b> ${step.sourceFilename}`;
      }
      if (step.assetGeneration) {
        stepDiv.innerHTML += `<br><b>Generation:</b> ${step.assetGeneration}`;
      }
      info.appendChild(stepDiv);
    } else {
      const noVfx = document.createElement('div');
      noVfx.textContent = 'No VFX steps for this action.';
      noVfx.className = 'lab-no-vfx';
      info.appendChild(noVfx);
    }

    prodSection.appendChild(info);
  }

  function renderQaSource(action: LabAction): void {
    qaSection.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'lab-qa-header';
    header.textContent = 'QA WORKING STATE';
    qaSection.appendChild(header);

    const stepIdx = getSelectedStep(state, action.actionKey);
    const qaId = getQaSourceId(state, action.actionKey, stepIdx);
    const qaStatus = getQaStatus(state, action, stepIdx);

    const info = document.createElement('div');
    info.className = 'lab-qa-info';
    info.innerHTML = `<b>QA status:</b> ${qaStatus}`;
    if (qaId) {
      info.innerHTML += `<br><b>QA source:</b> ${qaId}`;
    } else if (qaStatus === 'UNRESOLVED') {
      info.innerHTML += `<br><b>QA source:</b> (unresolved — no accepted source)`;
    } else {
      info.innerHTML += `<br><b>QA source:</b> (not set — same as production)`;
    }
    qaSection.appendChild(info);

    if (qaId) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'lab-clear-btn';
      clearBtn.textContent = 'CLEAR QA SOURCE';
      clearBtn.addEventListener('click', () => {
        state = clearQaSourceId(state, action.actionKey, stepIdx);
        saveLabStateToStorage(localStorage, state);
        render();
      });
      qaSection.appendChild(clearBtn);
    }
  }

  function renderPlayback(action: LabAction): void {
    playbackSection.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'lab-playback-header';
    header.textContent = 'PLAYBACK';
    playbackSection.appendChild(header);

    const routeDiv = document.createElement('div');
    routeDiv.className = 'lab-route-info';
    routeDiv.innerHTML = `<b>ROUTE:</b> ${action.route} · ${action.routeReason ?? 'automatic'}`;
    playbackSection.appendChild(routeDiv);

    const btnRow = document.createElement('div');
    btnRow.className = 'lab-btn-row';

    const playProdBtn = document.createElement('button');
    playProdBtn.className = 'lab-play-btn';
    playProdBtn.textContent = 'PLAY PRODUCTION';
    playProdBtn.disabled = !options.playback;
    playProdBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = playProduction(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played PRODUCTION: ${action.actionKey}`;
      }
    });
    btnRow.appendChild(playProdBtn);

    const playQaBtn = document.createElement('button');
    playQaBtn.className = 'lab-play-btn';
    playQaBtn.textContent = 'PLAY QA';
    playQaBtn.disabled = !options.playback;
    playQaBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = playQaOverride(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played QA: ${action.actionKey}`;
      }
    });
    btnRow.appendChild(playQaBtn);

    const playValBtn = document.createElement('button');
    playValBtn.className = 'lab-play-btn';
    playValBtn.textContent = 'PLAY VALIDATED';
    playValBtn.disabled = !options.playback || !getValidatedConfig(state, action.actionKey, getSelectedStep(state, action.actionKey));
    playValBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = playValidated(options.playback, state, action.actionKey);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Played VALIDATED: ${action.actionKey}`;
      }
    });
    btnRow.appendChild(playValBtn);

    const replayBtn = document.createElement('button');
    replayBtn.className = 'lab-play-btn';
    replayBtn.textContent = 'REPLAY';
    replayBtn.disabled = !options.playback || !lastPlaybackSnapshot;
    replayBtn.addEventListener('click', () => {
      if (!options.playback) return;
      const result = replay(options.playback, state);
      if (result.snapshot) {
        lastPlaybackSnapshot = result.snapshot;
        statusLine.textContent = `Replayed: ${result.snapshot.mode} — ${result.snapshot.actionKey}`;
      }
    });
    btnRow.appendChild(replayBtn);

    playbackSection.appendChild(btnRow);

    if (lastPlaybackSnapshot) {
      const snapDiv = document.createElement('div');
      snapDiv.className = 'lab-snapshot-info';
      snapDiv.innerHTML = `<b>Last:</b> ${lastPlaybackSnapshot.mode} · ${lastPlaybackSnapshot.actionKey} step ${lastPlaybackSnapshot.stepIndex} · src: ${lastPlaybackSnapshot.source}`;
      playbackSection.appendChild(snapDiv);
    }
  }

  function renderValidation(action: LabAction): void {
    validationSection.innerHTML = '';
    const stepIdx = getSelectedStep(state, action.actionKey);
    const step = action.vfxSteps[stepIdx];
    if (!step) return;

    const header = document.createElement('div');
    header.className = 'lab-validation-header';
    header.textContent = 'VALIDATION';
    validationSection.appendChild(header);

    const stepStatus = getValidationStepStatus(state, action, stepIdx);
    const actionStatus = getValidationActionStatus(state, action);

    const statusDiv = document.createElement('div');
    statusDiv.className = 'lab-validation-status';
    statusDiv.innerHTML = `<b>Step:</b> ${stepStatus} · <b>Action:</b> ${actionStatus}`;
    validationSection.appendChild(statusDiv);

    // Source display: PRODUCTION / QA WORKING / VALIDATED
    const validated = getValidatedConfig(state, action.actionKey, stepIdx);
    const qaSource = getQaSourceId(state, action.actionKey, stepIdx);
    const prodSource = step.sourceCandidateId ?? step.spriteSheetId ?? 'none';

    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'lab-validation-sources';
    sourceDiv.innerHTML = `
      <div><b>PRODUCTION SOURCE:</b> ${prodSource}</div>
      <div><b>QA WORKING SOURCE:</b> ${qaSource ?? prodSource}</div>
      <div><b>VALIDATED SOURCE:</b> ${validated?.sourceId ?? '—'}</div>
    `;
    validationSection.appendChild(sourceDiv);

    // Validation buttons
    const btnRow = document.createElement('div');
    btnRow.className = 'lab-validation-btn-row';

    const validateBtn = document.createElement('button');
    validateBtn.className = 'lab-validate-btn';
    validateBtn.textContent = 'VALIDATE CONFIGURATION';
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

    validationSection.appendChild(btnRow);

    // NEXT TO VALIDATE
    const nextBtn = document.createElement('button');
    nextBtn.className = 'lab-next-btn';
    nextBtn.textContent = 'NEXT TO VALIDATE';
    nextBtn.addEventListener('click', () => {
      const nextKey = findNextToValidate(state, currentActionKey);
      if (nextKey) {
        currentActionKey = nextKey;
        actionSelect.value = nextKey;
        state = { ...state, selectedActionKey: nextKey };
        saveLabStateToStorage(localStorage, state);
        statusLine.textContent = `Next: ${nextKey}`;
        render();
      } else {
        statusLine.textContent = 'All actions validated!';
      }
    });
    validationSection.appendChild(nextBtn);
  }

  function renderNotes(action: LabAction): void {
    notesSection.innerHTML = '';
    const stepIdx = getSelectedStep(state, action.actionKey);
    const step = action.vfxSteps[stepIdx];
    if (!step) return;

    const header = document.createElement('div');
    header.className = 'lab-notes-header';
    header.textContent = 'VISUAL NOTES';
    notesSection.appendChild(header);

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
    notesSection.appendChild(textarea);
  }

  function renderProgress(): void {
    progressSection.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'lab-progress-header';
    header.textContent = 'VALIDATION PROGRESS';
    progressSection.appendChild(header);

    const progress = getValidationProgress(state);
    const info = document.createElement('div');
    info.className = 'lab-progress-info';
    info.innerHTML = `
      <div class="lab-progress-row"><b>HERO ACTIONS</b></div>
      <div>Validated: <b>${progress.heroValidated}</b> / ${progress.heroTotal}</div>
      <div class="lab-progress-row"><b>ENEMY/BOSS ACTIONS</b></div>
      <div>Validated: <b>${progress.enemyBossValidated}</b> / ${progress.enemyBossTotal}</div>
      <div class="lab-progress-row"><b>ALL LAB ACTIONS</b></div>
      <div>Validated: <b>${progress.allValidated}</b> / ${progress.allTotal}</div>
      <div class="lab-progress-row"><b>BREAKDOWN</b></div>
      <div>VFX-configurable: <b>${progress.vfxConfigurable}</b></div>
      <div>No-VFX/not-applicable: <b>${progress.noVfx}</b></div>
      <div>Modified after validation: <b>${progress.modifiedAfterValidation}</b></div>
      <div>Unresolved source: <b>${progress.unresolvedActions}</b></div>
    `;
    progressSection.appendChild(info);

    if (progress.unresolvedActionKeys.length > 0) {
      const unresolvedDiv = document.createElement('div');
      unresolvedDiv.className = 'lab-progress-unresolved';
      unresolvedDiv.innerHTML = `<b>Unresolved:</b> ${progress.unresolvedActionKeys.join(', ')}`;
      progressSection.appendChild(unresolvedDiv);
    }
  }

  function renderTuning(action: LabAction): void {
    tuningSection.innerHTML = '';
    const stepIdx = getSelectedStep(state, action.actionKey);
    const step = action.vfxSteps[stepIdx];
    if (!step) {
      tuningSection.innerHTML = '<div class="lab-no-vfx">No VFX step to tune.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'lab-tuning-header';
    header.textContent = 'PRESENTATION PARAMETERS';
    tuningSection.appendChild(header);

    const prodPres = getProductionPresentation(step);
    const qaPres = getQaPresentation(state, action.actionKey, stepIdx) ?? {};
    const effPres = getEffectivePresentation(state, action, stepIdx);
    const modified = isPresentationModified(qaPres, step);

    const statusDiv = document.createElement('div');
    statusDiv.className = 'lab-tuning-status';
    statusDiv.textContent = modified ? 'QA MODIFIED' : 'SAME AS PRODUCTION';
    statusDiv.classList.add(modified ? 'lab-status-modified' : 'lab-status-same');
    tuningSection.appendChild(statusDiv);

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

    tuningSection.appendChild(grid);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'lab-reset-btn';
    resetBtn.textContent = 'RESET STEP TO PRODUCTION';
    resetBtn.addEventListener('click', () => {
      state = resetQaStep(state, action.actionKey, stepIdx);
      saveLabStateToStorage(localStorage, state);
      render();
    });
    tuningSection.appendChild(resetBtn);
  }

  function renderStats(): void {
    statsSection.innerHTML = '';
    if (!options.getStats) return;
    const header = document.createElement('div');
    header.className = 'lab-stats-header';
    header.textContent = 'VFX CACHE';
    statsSection.appendChild(header);

    const stats = options.getStats();
    const info = document.createElement('div');
    info.className = 'lab-stats-info';
    const mib = (stats.decodedBytesEstimate / (1024 * 1024)).toFixed(0);
    const maxMib = (stats.budget * 64).toFixed(0);
    info.innerHTML = `
      <span>Resources: <b>${stats.cachedResources}</b></span>
      <span>Pending: <b>${stats.pendingLoads}</b></span>
      <span>Usage: <b>${stats.fourKEquivalentUsage.toFixed(2)} / ${stats.budget.toFixed(1)}</b> 4K-eq</span>
      <span>Estimated: <b>${mib} / ${maxMib}</b> MiB</span>
      <span>Hits: <b>${stats.cacheHits}</b></span>
      <span>Loads: <b>${stats.loads}</b></span>
      <span>Evictions: <b>${stats.evictions}</b></span>
    `;
    statsSection.appendChild(info);
  }

  function renderHistory(action: LabAction): void {
    historySection.innerHTML = '';
    const history = state.qaHistory[action.actionKey];
    if (!history || history.length === 0) return;

    const header = document.createElement('div');
    header.className = 'lab-history-header';
    header.textContent = 'QA HISTORY';
    historySection.appendChild(header);

    const list = document.createElement('div');
    list.className = 'lab-history-list';
    for (const entry of history) {
      const item = document.createElement('div');
      item.className = 'lab-history-item';
      item.innerHTML = `<b>${entry.candidateId}</b> — ${entry.verdict}`;
      if (entry.notes) {
        item.innerHTML += `<br><span class="lab-history-notes">${entry.notes}</span>`;
      }
      list.appendChild(item);
    }
    historySection.appendChild(list);
  }

  function renderCatalogue(): void {
    catalogueSection.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'lab-cat-header';
    header.textContent = 'CARTOONCOFFEE CATALOGUE';
    catalogueSection.appendChild(header);

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
    catalogueSection.appendChild(searchLabel);

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
    ], state.availabilityFilter, (val) => {
      state = { ...state, availabilityFilter: val as LabAvailabilityFilter, cataloguePage: 1 };
      saveLabStateToStorage(localStorage, state);
      renderCatalogueResults();
    });
    filterRow.appendChild(availSelect);

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

    catalogueSection.appendChild(filterRow);

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'lab-cat-results';
    resultsContainer.id = 'lab-cat-results-inner';
    catalogueSection.appendChild(resultsContainer);

    renderCatalogueResults();
  }

  function renderCatalogueResults(): void {
    const container = document.getElementById('lab-cat-results-inner');
    if (!container) return;

    catalogueResult = searchCatalogue(catalogue, {
      search: state.search,
      formatFilter: state.formatFilter,
      availabilityFilter: state.availabilityFilter,
      usageFilter: state.usageFilter,
      page: state.cataloguePage,
      pageSize: LAB_PAGE_SIZE,
      currentActionKey,
    });

    container.innerHTML = '';

    const countDiv = document.createElement('div');
    countDiv.className = 'lab-cat-count';
    countDiv.textContent = `${catalogueResult.totalFiltered} results · page ${catalogueResult.page}/${catalogueResult.pageCount}`;
    container.appendChild(countDiv);

    for (const rec of catalogueResult.results) {
      const item = createCatalogueItem(rec);
      container.appendChild(item);
    }

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

      container.appendChild(pager);
    }
  }

  function createCatalogueItem(rec: LabCatalogueRecord): HTMLElement {
    const item = document.createElement('div');
    item.className = 'lab-cat-item';

    const isReady = rec.availability === 'READY';
    const availClass = isReady ? 'lab-avail-ready' : 'lab-avail-on-demand';
    const availLabel = rec.availability === 'READY'
      ? 'READY'
      : rec.availability === 'AVAILABLE_ON_DEMAND'
        ? 'AVAILABLE ON DEMAND'
        : 'UNSUPPORTED NATIVE';

    item.innerHTML = `
      <div class="lab-cat-id"><b>${rec.candidateId}</b></div>
      <div class="lab-cat-file">${rec.sourceFilename}</div>
      <div class="lab-cat-meta">
        <span>${rec.width}×${rec.height}</span>
        <span>${rec.nativeGrid} / ${rec.nativeFrameCount}f</span>
        <span class="${availClass}">${availLabel}</span>
      </div>
      ${rec.usedBy.length > 0 ? `<div class="lab-cat-used">Used by: ${rec.usedBy.join(', ')}</div>` : ''}
    `;

    if (isReady || rec.availability === 'AVAILABLE_ON_DEMAND') {
      const acqStatus = acquisitionStatus[rec.candidateId];
      const selectBtn = document.createElement('button');
      selectBtn.className = 'lab-select-btn';
      if (acqStatus === 'ACQUIRING') {
        selectBtn.textContent = 'ACQUIRING...';
        selectBtn.disabled = true;
      } else if (acqStatus === 'ERROR') {
        selectBtn.textContent = 'RETRY ACQUIRE';
        selectBtn.className = 'lab-select-btn lab-acquire-error';
      } else {
        selectBtn.textContent = isReady ? 'SET AS QA SOURCE' : 'ACQUIRE & SET AS QA SOURCE';
      }
      selectBtn.addEventListener('click', async () => {
        const action = getCurrentAction();
        if (!action) return;
        const stepIdx = getSelectedStep(state, action.actionKey);

        if (rec.availability === 'AVAILABLE_ON_DEMAND' && !acqStatus) {
          acquisitionStatus[rec.candidateId] = 'ACQUIRING';
          renderCatalogueResults();
          const result: AcquireResult = await acquireCandidate(rec.candidateId);
          if (result.ok) {
            delete acquisitionStatus[rec.candidateId];
            state = setQaSourceId(state, action.actionKey, stepIdx, rec.candidateId);
            saveLabStateToStorage(localStorage, state);
            statusLine.textContent = `Acquired: ${rec.candidateId}`;
            render();
          } else {
            acquisitionStatus[rec.candidateId] = 'ERROR';
            statusLine.textContent = `Acquisition failed: ${result.error ?? 'unknown error'}`;
            renderCatalogueResults();
          }
        } else if (acqStatus === 'ERROR') {
          delete acquisitionStatus[rec.candidateId];
          acquisitionStatus[rec.candidateId] = 'ACQUIRING';
          renderCatalogueResults();
          const result: AcquireResult = await acquireCandidate(rec.candidateId);
          if (result.ok) {
            delete acquisitionStatus[rec.candidateId];
            state = setQaSourceId(state, action.actionKey, stepIdx, rec.candidateId);
            saveLabStateToStorage(localStorage, state);
            statusLine.textContent = `Acquired: ${rec.candidateId}`;
            render();
          } else {
            acquisitionStatus[rec.candidateId] = 'ERROR';
            statusLine.textContent = `Retry failed: ${result.error ?? 'unknown error'}`;
            renderCatalogueResults();
          }
        } else {
          state = setQaSourceId(state, action.actionKey, stepIdx, rec.candidateId);
          saveLabStateToStorage(localStorage, state);
          render();
        }
      });
      item.appendChild(selectBtn);
    }

    return item;
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

  render();

  return () => {
    root.remove();
  };
}

function addLabStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{position:fixed;z-index:10050;right:18px;bottom:18px;width:min(460px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow-y:auto;background:rgba(5,14,30,.95);border:1px solid #5488a6;border-radius:12px;box-shadow:0 15px 45px rgba(0,0,0,.52);padding:14px;color:#d7e7ee;font:12px/1.35 system-ui,sans-serif;backdrop-filter:blur(9px)}
    #${ROOT_ID} h2{margin:0;color:#9fe5ff;font-size:14px;letter-spacing:.08em;text-transform:uppercase}
    #${ROOT_ID} .lab-subtitle{display:block;margin:4px 0 12px;color:#8fa5b2;font-size:11px}
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
    #${ROOT_ID} .lab-filter-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
    #${ROOT_ID} .lab-cat-results{margin-top:8px}
    #${ROOT_ID} .lab-cat-count{color:#8fa5b2;font-size:10px;margin-bottom:6px}
    #${ROOT_ID} .lab-cat-item{padding:7px;border:1px solid #2a4a60;border-radius:6px;background:rgba(12,28,44,.4);margin-bottom:5px}
    #${ROOT_ID} .lab-cat-id{color:#9fe5ff;font-size:11px}
    #${ROOT_ID} .lab-cat-file{color:#a7c5d3;font-size:10px;word-break:break-all}
    #${ROOT_ID} .lab-cat-meta{display:flex;gap:8px;margin-top:3px;font-size:10px;color:#8fa5b2}
    #${ROOT_ID} .lab-avail-ready{color:#5fd17a}
    #${ROOT_ID} .lab-avail-on-demand{color:#ff9a4a}
    #${ROOT_ID} .lab-cat-used{color:#728c9b;font-size:10px;margin-top:2px}
    #${ROOT_ID} .lab-select-btn{margin-top:5px;width:100%;border-color:#52b9d2;background:#0f3b52}
    #${ROOT_ID} .lab-pager{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
    #${ROOT_ID} .lab-history-list{display:grid;gap:4px}
    #${ROOT_ID} .lab-history-item{padding:5px;border-left:2px solid #66cfea;background:rgba(27,57,76,.32);color:#b9d9e7;font-size:11px}
    #${ROOT_ID} .lab-history-notes{color:#728c9b;font-size:10px}
    #${ROOT_ID} .lab-export-btn{width:100%;border-color:#3a8c4a;background:#0d2f1a;font-size:13px;padding:10px}
    #${ROOT_ID} .lab-status{display:block;min-height:16px;margin-top:8px;color:#8fa5b2;font-size:11px}
    #${ROOT_ID} .lab-playback-header,#${ROOT_ID} .lab-tuning-header,#${ROOT_ID} .lab-stats-header{color:#9fe5ff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
    #${ROOT_ID} .lab-route-info{color:#b9d9e7;font-size:11px;margin-bottom:6px}
    #${ROOT_ID} .lab-route-info b{color:#f1c76c}
    #${ROOT_ID} .lab-btn-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
    #${ROOT_ID} .lab-play-btn{border-color:#3a7c9a;background:#0d2f3a}
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
  `;
  document.head.appendChild(style);
}

export function isVfxLabEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return isLabEnabled(params);
}
