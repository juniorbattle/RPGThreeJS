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
  addSlot,
  removeSlot,
  replaceSlotCandidate,
  moveSlotUp,
  moveSlotDown,
  updateSlotProfile,
  setChoreography,
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
} from './VfxPresetComposer';
import type {
  VfxPresetDraft,
  VfxSizeProfile,
  VfxTimingProfile,
  VfxPlacementProfile,
  VfxChoreography,
  VfxTechnicalPolish,
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
  getCandidateCadence,
  isSlotPlayable,
  unplayableSlotCandidates,
  playDraftVisualsOnly,
  playDraftFull,
  playDraftInCombatStage,
} from './VfxComposerPlayback';
import type { ComposerPlaybackContext, ComposerStore, ComposerDisplayMode } from './VfxComposerPlayback';
import { resolvePreview } from './VfxPreviewResolver';
import { filterDefaultComposerCatalogue } from './VfxSourceSuitability';

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
  let store: ComposerStore = loadComposerStore(localStorage);
  const actions = getLabActions();
  let currentActionKey = store.selectedActionKey ?? actions[0]?.actionKey ?? '';
  let catalogueOpen = false;
  let catalogueSearch = '';
  let cataloguePage = 1;
  let advancedOpen = false;
  let replaceTargetSlotId: string | null = null;
  let displayMode: ComposerDisplayMode = loadComposerUiPrefs(localStorage).displayMode;

  function setDisplayMode(mode: ComposerDisplayMode): void {
    displayMode = mode;
    saveComposerUiPrefs(localStorage, { displayMode });
    render();
  }

  addComposerStyle();

  const root = document.createElement('aside');
  root.id = COMPOSER_ROOT_ID;
  document.body.appendChild(root);

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
    root.appendChild(renderVisualSlots(draft));
    if (catalogueOpen) root.appendChild(renderCataloguePicker(draft));
    root.appendChild(renderComposition(draft));
    root.appendChild(renderTechnicalPolish(draft));
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

    const actionRow = document.createElement('div');
    actionRow.className = 'cmp-row';
    const actionLabel = document.createElement('label');
    actionLabel.textContent = 'ACTION';
    const select = document.createElement('select');
    select.className = 'cmp-action-select';
    for (const action of actions) {
      const opt = document.createElement('option');
      opt.value = action.actionKey;
      opt.textContent = `${action.displayName} (${action.actionKey})`;
      select.appendChild(opt);
    }
    select.value = currentActionKey;
    select.addEventListener('change', () => {
      currentActionKey = select.value;
      store = setSelectedActionKey(store, currentActionKey);
      catalogueOpen = false;
      replaceTargetSlotId = null;
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

  function renderVisualSlots(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section';
    section.dataset.section = 'visual_slots';

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = `VISUAL SPRITESHEETS (${draft.visualSlots.length})`;
    section.appendChild(heading);

    if (draft.visualSlots.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'cmp-empty';
      empty.textContent = 'No spritesheets yet. Use + ADD SPRITESHEET below.';
      section.appendChild(empty);
    }

    draft.visualSlots.forEach((slot, index) => {
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
        card.appendChild(img);
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

      const profiles = document.createElement('div');
      profiles.className = 'cmp-slot-profiles';
      profiles.appendChild(buildProfileControl<VfxSizeProfile>(
        'SIZE', VFX_SIZE_PROFILES, slot.sizeProfile,
        (value) => mutate(updateSlotProfile(draft, slot.id, { sizeProfile: value })),
      ));
      profiles.appendChild(buildProfileControl<VfxTimingProfile>(
        'TIMING', VFX_TIMING_PROFILES, slot.timingProfile,
        (value) => mutate(updateSlotProfile(draft, slot.id, { timingProfile: value })),
      ));
      profiles.appendChild(buildProfileControl<VfxPlacementProfile>(
        'PLACEMENT', VFX_PLACEMENT_PROFILES, slot.placementProfile,
        (value) => mutate(updateSlotProfile(draft, slot.id, { placementProfile: value })),
      ));
      card.appendChild(profiles);

      const actionsRow = document.createElement('div');
      actionsRow.className = 'cmp-slot-actions';
      actionsRow.appendChild(buildButton('REMOVE', 'cmp-slot-remove', () => {
        mutate(removeSlot(draft, slot.id));
      }));
      actionsRow.appendChild(buildButton('REPLACE', 'cmp-slot-replace', () => {
        replaceTargetSlotId = slot.id;
        catalogueOpen = true;
        cataloguePage = 1;
        render();
      }));
      const up = buildButton('MOVE UP', 'cmp-slot-up', () => mutate(moveSlotUp(draft, slot.id)));
      up.disabled = index === 0;
      actionsRow.appendChild(up);
      const down = buildButton('MOVE DOWN', 'cmp-slot-down', () => mutate(moveSlotDown(draft, slot.id)));
      down.disabled = index === draft.visualSlots.length - 1;
      actionsRow.appendChild(down);
      card.appendChild(actionsRow);

      section.appendChild(card);
    });

    const addBtn = buildButton('+ ADD SPRITESHEET', 'cmp-add-slot', () => {
      replaceTargetSlotId = null;
      catalogueOpen = !catalogueOpen;
      cataloguePage = 1;
      render();
    });
    section.appendChild(addBtn);

    return section;
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
      card.appendChild(img);
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
        statusLine.textContent = `Replaced slot with ${record.candidateId}`;
        mutate(next);
      } else {
        statusLine.textContent = `Added ${record.candidateId} to preset`;
        mutate(addSlot(draft, record.candidateId));
      }
    }));

    return card;
  }

  function renderComposition(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section';
    section.dataset.section = 'composition';

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = 'COMPOSITION';
    section.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'cmp-choreo-row';
    for (const choreography of VFX_CHOREOGRAPHIES) {
      const compat = choreographyCompatibility(choreography, draft.visualSlots.length);
      const btn = buildButton(choreography.replace(/_/g, ' '), 'cmp-choreo-btn', () => {
        mutate(setChoreography(draft, choreography));
      });
      if (draft.choreography === choreography) btn.classList.add('cmp-active');
      if (!compat.compatible) {
        btn.disabled = true;
        btn.title = compat.reason ?? '';
      }
      row.appendChild(btn);
    }
    section.appendChild(row);

    const compat = choreographyCompatibility(draft.choreography, draft.visualSlots.length);
    if (!compat.compatible) {
      const warn = document.createElement('div');
      warn.className = 'cmp-warn';
      warn.textContent = compat.reason ?? '';
      section.appendChild(warn);
    }

    section.appendChild(renderTimeline(draft));
    return section;
  }

  /** Shows the computed choreography start times — read-only, never editable. */
  function renderTimeline(draft: VfxPresetDraft): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cmp-timeline';
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: getCandidateCadence });
    compiled.slots.forEach((slot, index) => {
      const line = document.createElement('div');
      line.className = 'cmp-timeline-row';
      line.dataset.slotId = slot.slotId;
      line.dataset.startTime = String(slot.startTime);
      line.dataset.duration = String(slot.duration);
      line.textContent = `SLOT ${index + 1}  start ${slot.startTime.toFixed(2)}s  ·  ${slot.duration.toFixed(2)}s  ·  h${slot.finalDisplayHeight.toFixed(2)}`;
      wrapper.appendChild(line);
    });
    const total = document.createElement('div');
    total.className = 'cmp-timeline-total';
    total.textContent = `TOTAL ${compiled.totalDuration.toFixed(2)}s`;
    wrapper.appendChild(total);
    return wrapper;
  }

  function renderTechnicalPolish(draft: VfxPresetDraft): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cmp-section';
    section.dataset.section = 'technical_polish';

    const heading = document.createElement('div');
    heading.className = 'cmp-section-heading';
    heading.textContent = 'TECHNICAL POLISH';
    section.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'cmp-polish-row';
    for (const level of VFX_TECHNICAL_POLISH_LEVELS) {
      const btn = buildButton(level, 'cmp-polish-btn', () => {
        mutate(setTechnicalPolish(draft, level));
      });
      if (draft.technicalPolish === level) btn.classList.add('cmp-active');
      row.appendChild(btn);
    }
    section.appendChild(row);

    const hint = document.createElement('div');
    hint.className = 'cmp-hint';
    hint.textContent = 'Screen flash / shake / hit-stop. Never rendered by PLAY VISUALS ONLY.';
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
      const result = playDraftVisualsOnly(options.playback, draft);
      const skipped = unplayableSlotCandidates(draft).length;
      statusLine.textContent = result.played
        ? `Played visuals only: ${result.snapshot?.slotCount} slot(s), 0 technical effects${skipped > 0 ? ` · ${skipped} not previewable` : ''}`
        : `Not played: ${result.reason}`;
    });
    visualsBtn.disabled = draft.visualSlots.length === 0;
    section.appendChild(visualsBtn);

    const fullBtn = buildButton('PLAY FULL PRESET', 'cmp-play-full', () => {
      if (!options.playback) { statusLine.textContent = 'Playback unavailable.'; return; }
      const result = playDraftFull(options.playback, draft);
      statusLine.textContent = result.played
        ? `Played full preset: ${result.snapshot?.slotCount} slot(s), ${result.snapshot?.technicalEffectCount} technical effect(s)`
        : `Not played: ${result.reason}`;
    });
    fullBtn.disabled = draft.visualSlots.length === 0;
    section.appendChild(fullBtn);

    const stageBtn = buildButton('PLAY IN COMBAT STAGE', 'cmp-play-stage', () => {
      if (!options.playback) { statusLine.textContent = 'Playback unavailable.'; return; }
      statusLine.textContent = 'Opening Combat Stage…';
      stageBtn.disabled = true;
      playDraftInCombatStage(options.playback, draft, 'full_preset')
        .then((result) => {
          statusLine.textContent = result.played
            ? `Stage playback: ${result.snapshot?.slotCount} slot(s), ${result.snapshot?.technicalEffectCount} technical effect(s)`
            : `Stage unavailable: ${result.reason ?? 'unknown'}`;
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
      statusLine.textContent = `Draft saved: ${draft.actionKey} (${draft.visualSlots.length} slots)`;
    }));

    return section;
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

    section.appendChild(body);
    return section;
  }

  // ---------------------------------------------------------------- helpers

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
      const btn = buildButton(value, 'cmp-profile-btn', () => onChange(value));
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
    #${COMPOSER_ROOT_ID} .cmp-empty{color:#7a96a6;font-size:11px;font-style:italic;padding:4px 0}
    #${COMPOSER_ROOT_ID} .cmp-slot-card{margin-bottom:8px;padding:7px;border:1px solid #2f5468;border-radius:5px;background:rgba(20,42,58,.55)}
    #${COMPOSER_ROOT_ID} .cmp-slot-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-slot-num{color:#f1c76c;font-size:10px;font-weight:800;letter-spacing:.06em}
    #${COMPOSER_ROOT_ID} .cmp-slot-cid{color:#9fe5ff;font-size:11px;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-slot-preview{display:block;width:100%;height:78px;object-fit:contain;background:#050d15;border-radius:4px;margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-slot-filename{color:#728c9b;font-size:9px;word-break:break-all;margin-bottom:5px}
    #${COMPOSER_ROOT_ID} .cmp-slot-unplayable{border-color:#8c5a3a}
    #${COMPOSER_ROOT_ID} .cmp-slot-flag{margin-bottom:5px;padding:2px 4px;border-radius:3px;background:rgba(255,154,74,.14);color:#ff9a4a;font-size:9px;font-weight:700}
    #${COMPOSER_ROOT_ID} .cmp-profile{margin-bottom:4px}
    #${COMPOSER_ROOT_ID} .cmp-profile-label{display:block;color:#8fa5b2;font-size:9px;font-weight:700;letter-spacing:.06em;margin-bottom:2px}
    #${COMPOSER_ROOT_ID} .cmp-profile-group{display:flex;gap:3px}
    #${COMPOSER_ROOT_ID} .cmp-profile-btn{flex:1;font-size:10px;padding:3px 2px}
    #${COMPOSER_ROOT_ID} .cmp-slot-actions{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:5px}
    #${COMPOSER_ROOT_ID} .cmp-slot-remove{border-color:#8c3a3a;background:#2f0d0d}
    #${COMPOSER_ROOT_ID} .cmp-add-slot{width:100%;border-color:#3a8c4a;background:#0d2f1a;font-weight:700;padding:6px}
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
  `;
  document.head.appendChild(style);
}
