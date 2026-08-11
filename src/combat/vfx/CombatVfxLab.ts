/**
 * R2C-LAB V1C — Combat VFX Presentation Lab core data/state layer.
 *
 * This module owns the pure Lab data: action inventory derived from
 * authoritative game data, production VFX source resolution, CartoonCoffee
 * catalogue metadata model, search/filter/pagination helpers, QA working-source
 * state, validated configuration snapshots, R2C-A migration, QA history,
 * and deterministic snapshot + final validated JSON export.
 *
 * It does NOT touch the DOM, load textures, or mutate production registries.
 */

import { skillById } from '../../game/skills';
import { units, weaponById } from '../../game/catalog';
import type { SkillDefinition, UnitDefinition } from '../../game/types';
import { ENEMY_SKILL_IDS, getSkillPresentation } from '../skillPresentation';
import { BASIC_ATTACK_VFX_MAPPINGS, getActionVfxAuditRows } from './VfxActionRegistry';
import { getVfxPreset } from './VfxPresets';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import type { VfxStep, VfxAnchor, VfxOrientation } from './VfxTypes';
import { resolvePresentationRoute } from '../stage/combatStageProfiles';
import type { ActionSpecForStage, ActionPresentationRoute } from '../stage/combatStageProfiles';
import runtimeManifest from '../../../docs/reports/vfx-megapack-r2-selected-runtime-assets.json';
import { hasGifPreview as candidateHasGifPreview } from './VfxPreviewResolver';

// ============================================================ Types

export type LabOwnerType = 'HERO' | 'ENEMY' | 'BOSS';
export type LabSlot = 'BASIC' | 'SKILL_1' | 'SKILL_2' | 'SKILL_3' | 'ULTIMATE';
export type LabRoute = 'STAGE' | 'TACTICAL';
export type LabSourceStatus = 'CARTOONCOFFEE' | 'LEGACY' | 'NO_VFX' | 'UNRESOLVED';
export type LabCatalogueAvailability = 'READY' | 'AVAILABLE_ON_DEMAND' | 'UNSUPPORTED_NATIVE';
export type LabAcquisitionStatus = 'READY' | 'AVAILABLE_ON_DEMAND' | 'ACQUIRING' | 'ERROR' | 'UNSUPPORTED_NATIVE';
export type LabCatalogueFormat = '2048_16F' | '4096_64F' | 'OTHER';
export type LabUsageFilter = 'ALL' | 'USED' | 'UNUSED' | 'CURRENT';
export type LabAvailabilityFilter = 'ALL' | 'READY' | 'AVAILABLE_ON_DEMAND' | 'UNSUPPORTED_NATIVE';
export type LabFormatFilter = 'ALL' | '2048_16F' | '4096_64F' | 'OTHER';
export type LabGifFilter = 'ALL' | 'HAS_GIF' | 'NO_GIF';
export type LabAccordionSection =
  | 'action_progress'
  | 'megapack_library'
  | 'playback'
  | 'sources'
  | 'tuning'
  | 'validation_notes'
  | 'resource_debug'
  | 'catalogue_filters';

export const DEFAULT_ACCORDION_OPEN: readonly LabAccordionSection[] = [
  'action_progress',
  'megapack_library',
];

export const ALL_ACCORDION_SECTIONS: readonly LabAccordionSection[] = [
  'action_progress',
  'megapack_library',
  'playback',
  'sources',
  'tuning',
  'validation_notes',
  'resource_debug',
  'catalogue_filters',
];

export interface LabVfxStep {
  stepIndex: number;
  stepType: string;
  spriteSheetId?: string;
  sourceCandidateId?: string;
  sourceFilename?: string;
  sourceCollection?: string;
  assetGeneration?: 'legacy' | 'megapack-native';
  presentation?: LabPresentationOverride;
  /** Production step duration in seconds. */
  duration?: number;
  /** Production step anchor. */
  anchor?: VfxAnchor;
  /** Production step orientation/direction. */
  orientation?: VfxOrientation;
}

/**
 * V1D.4.2: A visual spritesheet step derived from a preset's step list.
 * Only `spriteSheet` type steps appear — technical steps (screenShake, hitStop,
 * screenFlash, etc.) are excluded from the artistic VFX selection workflow.
 *
 * `visualIndex` is UI-only (0-based ordinal among spriteSheet steps).
 * `stepIndex` is the real underlying preset step index — authoritative for
 * QA state, validation, and persisted configuration.
 */
export interface VisualSpriteSheetStep {
  visualIndex: number;
  stepIndex: number;
  spriteSheetId: string;
}

export interface LabPresentationOverride {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  duration?: number;
  opacity?: number;
  anchor?: VfxAnchor;
  layer?: 'ground' | 'impact';
  blending?: 'normal' | 'additive';
  fadeIn?: number;
  fadeOut?: number;
  direction?: VfxOrientation | 'AUTO';
}

export interface LabAction {
  actionKey: string;
  displayName: string;
  ownerId?: string;
  ownerDisplayName?: string;
  ownerType: LabOwnerType;
  slot?: LabSlot;
  apCost?: number;
  route: LabRoute;
  routeReason?: string;
  routeFamily?: string;
  currentPresetId?: string;
  sourceStatus: LabSourceStatus;
  vfxSteps: LabVfxStep[];
}

export interface LabCatalogueRecord {
  candidateId: string;
  assetId: string;
  sourceFilename: string;
  sourceRelativePath: string;
  collection: string;
  width: number;
  height: number;
  nativeGrid: string;
  nativeFrameCount: number;
  nativeCellWidth: number;
  nativeCellHeight: number;
  classificationStatus: string;
  format: LabCatalogueFormat;
  availability: LabCatalogueAvailability;
  usedBy: string[];
  hasGifPreview: boolean;
}

export interface LabCatalogueResult {
  page: number;
  pageCount: number;
  totalFiltered: number;
  results: LabCatalogueRecord[];
}

export interface LabQaHistoryEntry {
  candidateId: string;
  verdict: string;
  notes?: string;
  timestamp?: number;
  direction?: string;
}

export interface LabState {
  selectedActionKey?: string;
  selectedStepByAction: Record<string, number>;
  qaSourceByActionStep: Record<string, string>;
  qaPresentationByActionStep: Record<string, LabPresentationOverride>;
  notesByActionStep: Record<string, string>;
  validatedByActionStep: Record<string, ValidatedStepConfiguration>;
  search: string;
  formatFilter: LabFormatFilter;
  availabilityFilter: LabAvailabilityFilter;
  usageFilter: LabUsageFilter;
  cataloguePage: number;
  qaHistory: Record<string, LabQaHistoryEntry[]>;
  /** R2C-LAB V1D: candidate currently being previewed (NOT assigned to QA). */
  previewCandidateId?: string;
  /** R2C-LAB V1D: accordion section open/closed state (UI-only, not in validated JSON). */
  accordionState?: Record<string, boolean>;
  /** R2C-LAB V1D: GIF preview filter. */
  gifFilter?: LabGifFilter;
  /** R2C-LAB V1D.4: catalogue display mode (GRID or COMPACT). UI-only, not in validated JSON. */
  catalogueViewMode?: 'GRID' | 'COMPACT';
}

export interface LabSnapshotStep {
  production: {
    sourceId?: string;
    presentation?: LabPresentationOverride;
  };
  qa?: {
    sourceId?: string;
    presentation?: LabPresentationOverride;
  };
  status: 'SAME_AS_PRODUCTION' | 'QA_MODIFIED' | 'UNRESOLVED' | 'NO_VFX';
}

// ============================================================ V1C Validated Configuration

/**
 * Immutable snapshot of a validated QA configuration for one action+step.
 *
 * Created by validateStepConfiguration().  Stored in LabState.validatedByActionStep.
 * Editing QA working state after validation does NOT mutate this snapshot.
 */
export interface ValidatedStepConfiguration {
  actionKey: string;
  stepIndex: number;
  sourceId: string;
  presentation: LabPresentationOverride;
  validatedAt: number;
  notes?: string;
}

export type LabValidationStepStatus =
  | 'NOT_CONFIGURED'
  | 'QA_MODIFIED'
  | 'VALIDATED'
  | 'VALIDATED_BUT_MODIFIED'
  | 'NO_VFX';

export type LabValidationActionStatus =
  | 'UNCONFIGURED'
  | 'PARTIAL'
  | 'VALIDATED'
  | 'MODIFIED_AFTER_VALIDATION'
  | 'NO_VFX';

export type LabActionFilter =
  | 'ALL'
  | 'UNVALIDATED'
  | 'QA_MODIFIED'
  | 'VALIDATED'
  | 'VALIDATED_BUT_MODIFIED'
  | 'UNRESOLVED_SOURCE';

// ============================================================ V1C Final Export Schema

export interface ValidatedConfigExport {
  version: 1;
  kind: 'r2c-combat-vfx-validated-config';
  generatedAt: string;
  complete: boolean;
  heroComplete: boolean;
  summary: {
    labActions: number;
    heroActions: number;
    enemyBossActions: number;
    vfxConfigurableActions: number;
    validatedActions: number;
    validatedSteps: number;
    unresolvedActions: number;
    modifiedAfterValidation: number;
    unresolvedActionKeys: string[];
  };
  actions: Record<string, {
    route: LabRoute;
    steps: Record<string, {
      production: {
        sourceId?: string;
      };
      validated: {
        sourceId: string;
        presentation: LabPresentationOverride;
        notes?: string;
      };
      diff?: {
        sourceChanged: boolean;
        presentationChanged: boolean;
        changedFields: string[];
      };
    }>;
  }>;
}

export interface LabSnapshot {
  version: 2;
  kind: 'r2c-combat-vfx-lab-snapshot';
  generatedAt: string;
  actions: Record<string, {
    ownerType: LabOwnerType;
    slot?: LabSlot;
    route: LabRoute;
    currentPresetId?: string;
    sourceStatus: LabSourceStatus;
    steps: Record<string, LabSnapshotStep>;
  }>;
}

// ============================================================ Constants

export const LAB_STORAGE_KEY = 'r2c-combat-vfx-lab-state';
export const LAB_PAGE_SIZE = 50;

/**
 * Authoritative set of candidate IDs whose PNGs are genuinely resolvable
 * through the current DEV runtime.  Built from the selected runtime assets
 * manifest — the same manifest that sync-runtime-vfx.mjs uses to copy files
 * into public/assets/vfx/megapack-runtime/.
 *
 * A sourceCandidateId on a VFX_SPRITE_SHEETS entry alone does NOT prove
 * that the PNG is resolvable; the runtime manifest is the ground truth.
 */
const RUNTIME_MANIFEST_CANDIDATE_IDS = new Set<string>(
  (runtimeManifest as { assets: readonly { candidateId: string }[] }).assets.map((a) => a.candidateId),
);

/**
 * Pure availability resolver.  Determines whether a CartoonCoffee catalogue
 * candidate is genuinely playable through current DEV preview infrastructure.
 *
 * READY               — candidate PNG exists in the runtime directory (per manifest)
 * AVAILABLE_ON_DEMAND — valid native format; PNG can be synced on demand
 * UNSUPPORTED_NATIVE  — atypical native format (not 2048×2048 or 4096×4096)
 */
export function resolveLabCandidateAvailability(
  candidateId: string,
  format: LabCatalogueFormat,
): LabCatalogueAvailability {
  if (format === 'OTHER') return 'UNSUPPORTED_NATIVE';
  if (RUNTIME_MANIFEST_CANDIDATE_IDS.has(candidateId)) return 'READY';
  return 'AVAILABLE_ON_DEMAND';
}

// ============================================================ Action Inventory

function toActionSpec(skill: SkillDefinition): ActionSpecForStage {
  return {
    key: skill.id,
    type: skill.type,
    offensive: skill.offensive,
    support: skill.support,
    self: skill.self,
    radius: skill.radius,
    range: skill.range as readonly [number, number] | [number, number] | undefined,
    mode: skill.mode,
    dest: skill.dest,
    targetMode: skill.targetMode,
    healPercent: skill.healPercent,
    flatHeal: skill.flatHeal,
    apRestore: Boolean(skill.apRestore),
    cure: skill.cure,
    status: skill.status,
    ap: skill.ap,
    shape: skill.shape,
    effects: skill.effects as readonly { kind: string; target?: string }[] | undefined,
  };
}

function resolveRoute(actionKey: string, skill?: SkillDefinition | null): ActionPresentationRoute {
  if (!skill) return { route: 'tactical', reason: 'no-skill', family: 'NONE' };
  const presentation = getSkillPresentation({ key: actionKey });
  return resolvePresentationRoute(toActionSpec(skill), presentation);
}

function buildStepsFromPreset(presetId: string | undefined): LabVfxStep[] {
  if (!presetId) return [];
  const preset = getVfxPreset(presetId);
  if (!preset) return [];
  return preset.steps.map((step: VfxStep, index: number) => {
    const sheetId = step.spriteSheet;
    const def = sheetId ? VFX_SPRITE_SHEETS[sheetId] : undefined;
    const ov = step.spritePresentation;
    return {
      stepIndex: index,
      stepType: step.type,
      spriteSheetId: sheetId,
      sourceCandidateId: def?.sourceCandidateId,
      sourceFilename: def?.sourceFilename,
      sourceCollection: def?.sourceCollection,
      assetGeneration: def?.assetGeneration,
      duration: step.duration,
      anchor: step.anchor,
      orientation: step.orientation,
      presentation: ov ? {
        scale: ov.scaleMultiplier,
        opacity: ov.opacityMultiplier,
        fadeIn: ov.fadeIn,
        fadeOut: ov.fadeOut,
        layer: ov.layer,
        blending: ov.blending,
      } : undefined,
    };
  });
}

function resolveSourceStatus(steps: LabVfxStep[]): LabSourceStatus {
  if (steps.length === 0) return 'NO_VFX';
  const hasCartoonCoffee = steps.some((s) => s.assetGeneration === 'megapack-native' && s.sourceCandidateId);
  if (hasCartoonCoffee) return 'CARTOONCOFFEE';
  // R2C-C.1: Legacy 1280/5×5/25f assets have been deleted.
  // Any step with a spriteSheetId but no resolvable definition is UNRESOLVED.
  const hasUnresolvedSpriteSheet = steps.some((s) => s.spriteSheetId && !s.sourceCandidateId);
  if (hasUnresolvedSpriteSheet) return 'UNRESOLVED';
  return 'UNRESOLVED';
}

function buildBasicActionForUnit(unit: UnitDefinition): LabAction | null {
  const weapon = weaponById.get(unit.allowedWeaponIds[0] ?? '');
  if (!weapon) return null;
  const mapping = BASIC_ATTACK_VFX_MAPPINGS.find((m) => m.weaponType === weapon.type);
  if (!mapping) return null;
  const skill = skillById.get(mapping.actionId);
  const route = resolveRoute(mapping.actionId, skill);
  const steps = buildStepsFromPreset(mapping.presetId);
  return {
    actionKey: mapping.actionId,
    displayName: 'Attaque de base',
    ownerId: unit.id,
    ownerDisplayName: unit.name,
    ownerType: 'HERO',
    slot: 'BASIC',
    apCost: 1,
    route: route.route === 'stage' ? 'STAGE' : 'TACTICAL',
    routeReason: route.reason,
    routeFamily: route.family,
    currentPresetId: mapping.presetId,
    sourceStatus: resolveSourceStatus(steps),
    vfxSteps: steps,
  };
}

function buildSkillAction(actionKey: string, unit: UnitDefinition, slot: LabSlot): LabAction {
  const skill = skillById.get(actionKey);
  const displayName = skill?.name ?? actionKey;
  const route = resolveRoute(actionKey, skill);
  const presentation = getSkillPresentation({ key: actionKey });
  const presetId = presentation?.vfxPreset;
  const steps = buildStepsFromPreset(presetId);
  return {
    actionKey,
    displayName,
    ownerId: unit.id,
    ownerDisplayName: unit.name,
    ownerType: 'HERO',
    slot,
    apCost: skill?.ap,
    route: route.route === 'stage' ? 'STAGE' : 'TACTICAL',
    routeReason: route.reason,
    routeFamily: route.family,
    currentPresetId: presetId,
    sourceStatus: resolveSourceStatus(steps),
    vfxSteps: steps,
  };
}

function buildHeroActions(): LabAction[] {
  const actions: LabAction[] = [];
  for (const unit of units) {
    const basic = buildBasicActionForUnit(unit);
    if (basic) actions.push(basic);
    const skillIds = unit.skillIds;
    const slots: LabSlot[] = ['SKILL_1', 'SKILL_2', 'SKILL_3', 'ULTIMATE'];
    for (let i = 0; i < skillIds.length && i < 4; i++) {
      actions.push(buildSkillAction(skillIds[i]!, unit, slots[i]!));
    }
  }
  return actions;
}

function buildEnemyBossActions(): LabAction[] {
  const actions: LabAction[] = [];
  for (const skillId of ENEMY_SKILL_IDS) {
    const skill = skillById.get(skillId);
    const displayName = skill?.name ?? skillId;
    const ownerType: LabOwnerType = skillId.startsWith('boss_') ? 'BOSS' : 'ENEMY';
    const ownerDisplayName = ownerType === 'BOSS' ? 'Boss' : 'Enemy';
    const route = resolveRoute(skillId, skill);
    const presentation = getSkillPresentation({ key: skillId });
    const presetId = presentation?.vfxPreset;
    const steps = buildStepsFromPreset(presetId);
    actions.push({
      actionKey: skillId,
      displayName,
      ownerType,
      ownerDisplayName,
      apCost: skill?.ap,
      route: route.route === 'stage' ? 'STAGE' : 'TACTICAL',
      routeReason: route.reason,
      routeFamily: route.family,
      currentPresetId: presetId,
      sourceStatus: resolveSourceStatus(steps),
      vfxSteps: steps,
    });
  }
  return actions;
}

const _heroActions = buildHeroActions();
const _enemyBossActions = buildEnemyBossActions();
const _allActions = [..._heroActions, ..._enemyBossActions];
const _actionByKey = new Map(_allActions.map((a) => [a.actionKey, a]));

export function getLabActions(): readonly LabAction[] {
  return _allActions;
}

export function getLabAction(actionKey: string): LabAction | undefined {
  return _actionByKey.get(actionKey);
}

export function getHeroActions(): readonly LabAction[] {
  return _heroActions;
}

export function getEnemyBossActions(): readonly LabAction[] {
  return _enemyBossActions;
}

export function getActionCount(): { heroBasic: number; heroSkills: number; heroTotal: number; enemyBoss: number; total: number } {
  const heroBasic = _heroActions.filter((a) => a.slot === 'BASIC').length;
  const heroSkills = _heroActions.filter((a) => a.slot !== 'BASIC').length;
  return {
    heroBasic,
    heroSkills,
    heroTotal: _heroActions.length,
    enemyBoss: _enemyBossActions.length,
    total: _allActions.length,
  };
}

// ============================================================ Catalogue

function classifyFormat(width: number, height: number): LabCatalogueFormat {
  if (width === 2048 && height === 2048) return '2048_16F';
  if (width === 4096 && height === 4096) return '4096_64F';
  return 'OTHER';
}

function classifyAvailability(candidateId: string, format: LabCatalogueFormat): LabCatalogueAvailability {
  return resolveLabCandidateAvailability(candidateId, format);
}

export interface InventoryJsonRecord {
  assetId: string;
  collection: string;
  sourceFilename: string;
  relativePath: string;
  width: number;
  height: number;
  nativeGrid: string;
  nativeFrameCount: number;
  nativeCellWidth: number;
  nativeCellHeight: number;
  classificationStatus: string;
}

export interface InventoryJson {
  results: InventoryJsonRecord[];
}

let _catalogueCache: LabCatalogueRecord[] | null = null;

function buildUsageMap(): Map<string, string[]> {
  const usageMap = new Map<string, string[]>();
  const auditRows = getActionVfxAuditRows();
  for (const row of auditRows) {
    for (const sheetId of row.spriteSheetIds) {
      const def = VFX_SPRITE_SHEETS[sheetId as keyof typeof VFX_SPRITE_SHEETS];
      if (def?.sourceCandidateId) {
        const existing = usageMap.get(def.sourceCandidateId) ?? [];
        if (!existing.includes(row.actionId)) {
          existing.push(row.actionId);
          usageMap.set(def.sourceCandidateId, existing);
        }
      }
    }
  }
  return usageMap;
}

export function buildCatalogue(inventory: InventoryJson): LabCatalogueRecord[] {
  const usageMap = buildUsageMap();
  return inventory.results.map((rec) => {
    const candidateId = rec.assetId;
    const format = classifyFormat(rec.width, rec.height);
    const availability = classifyAvailability(candidateId, format);
    return {
      candidateId,
      assetId: rec.assetId,
      sourceFilename: rec.sourceFilename,
      sourceRelativePath: rec.relativePath,
      collection: rec.collection,
      width: rec.width,
      height: rec.height,
      nativeGrid: rec.nativeGrid,
      nativeFrameCount: rec.nativeFrameCount,
      nativeCellWidth: rec.nativeCellWidth,
      nativeCellHeight: rec.nativeCellHeight,
      classificationStatus: rec.classificationStatus,
      format,
      availability,
      usedBy: usageMap.get(candidateId) ?? [],
      hasGifPreview: candidateHasGifPreview(candidateId),
    };
  });
}

export function getCatalogue(inventory: InventoryJson): LabCatalogueRecord[] {
  if (!_catalogueCache) {
    _catalogueCache = buildCatalogue(inventory);
  }
  return _catalogueCache;
}

export function resetCatalogueCache(): void {
  _catalogueCache = null;
}

export function getCatalogueCounts(catalogue: readonly LabCatalogueRecord[]): {
  total: number;
  format2048: number;
  format4096: number;
  other: number;
  ready: number;
  availableOnDemand: number;
  unsupported: number;
  /** Legacy alias for backwards-compatible tests. */
  playable: number;
  /** Legacy alias for backwards-compatible tests. */
  metadataOnly: number;
} {
  let format2048 = 0, format4096 = 0, other = 0;
  let ready = 0, availableOnDemand = 0, unsupported = 0;
  for (const rec of catalogue) {
    if (rec.format === '2048_16F') format2048++;
    else if (rec.format === '4096_64F') format4096++;
    else other++;
    if (rec.availability === 'READY') ready++;
    else if (rec.availability === 'AVAILABLE_ON_DEMAND') availableOnDemand++;
    else unsupported++;
  }
  return { total: catalogue.length, format2048, format4096, other, ready, availableOnDemand, unsupported, playable: ready, metadataOnly: availableOnDemand };
}

// ============================================================ Search / Filter / Pagination

export function searchCatalogue(
  catalogue: readonly LabCatalogueRecord[],
  query: {
    search?: string;
    formatFilter?: LabFormatFilter;
    availabilityFilter?: LabAvailabilityFilter;
    usageFilter?: LabUsageFilter;
    gifFilter?: LabGifFilter;
    page?: number;
    pageSize?: number;
    currentActionKey?: string;
  },
): LabCatalogueResult {
  const search = (query.search ?? '').trim().toLowerCase();
  const formatFilter = query.formatFilter ?? 'ALL';
  const availabilityFilter = query.availabilityFilter ?? 'ALL';
  const usageFilter = query.usageFilter ?? 'ALL';
  const gifFilter = query.gifFilter ?? 'ALL';
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? LAB_PAGE_SIZE;
  const currentActionKey = query.currentActionKey;

  let filtered = catalogue;

  if (search) {
    filtered = filtered.filter((r) =>
      r.candidateId.toLowerCase().includes(search) ||
      r.sourceFilename.toLowerCase().includes(search),
    );
  }

  if (formatFilter !== 'ALL') {
    filtered = filtered.filter((r) => r.format === formatFilter);
  }

  if (availabilityFilter !== 'ALL') {
    filtered = filtered.filter((r) => r.availability === availabilityFilter);
  }

  if (gifFilter === 'HAS_GIF') {
    filtered = filtered.filter((r) => r.hasGifPreview);
  } else if (gifFilter === 'NO_GIF') {
    filtered = filtered.filter((r) => !r.hasGifPreview);
  }

  if (usageFilter === 'USED') {
    filtered = filtered.filter((r) => r.usedBy.length > 0);
  } else if (usageFilter === 'UNUSED') {
    filtered = filtered.filter((r) => r.usedBy.length === 0);
  } else if (usageFilter === 'CURRENT' && currentActionKey) {
    filtered = filtered.filter((r) => r.usedBy.includes(currentActionKey));
  }

  const totalFiltered = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);

  return { page: safePage, pageCount, totalFiltered, results };
}

// ============================================================ QA State

export function createDefaultLabState(): LabState {
  const accordionState: Record<string, boolean> = {};
  for (const sec of ALL_ACCORDION_SECTIONS) {
    accordionState[sec] = DEFAULT_ACCORDION_OPEN.includes(sec);
  }
  return {
    selectedStepByAction: {},
    qaSourceByActionStep: {},
    qaPresentationByActionStep: {},
    notesByActionStep: {},
    validatedByActionStep: {},
    search: '',
    formatFilter: 'ALL',
    availabilityFilter: 'ALL',
    usageFilter: 'ALL',
    cataloguePage: 1,
    qaHistory: {},
    previewCandidateId: undefined,
    accordionState,
    gifFilter: 'ALL',
    catalogueViewMode: 'GRID',
  };
}

export function labStepKey(actionKey: string, stepIndex: number): string {
  return `${actionKey}::${stepIndex}`;
}

export function getQaSourceId(state: LabState, actionKey: string, stepIndex: number): string | undefined {
  return state.qaSourceByActionStep[labStepKey(actionKey, stepIndex)];
}

export function setQaSourceId(state: LabState, actionKey: string, stepIndex: number, sourceId: string): LabState {
  const key = labStepKey(actionKey, stepIndex);
  return {
    ...state,
    qaSourceByActionStep: { ...state.qaSourceByActionStep, [key]: sourceId },
  };
}

export function clearQaSourceId(state: LabState, actionKey: string, stepIndex: number): LabState {
  const key = labStepKey(actionKey, stepIndex);
  const newQa = { ...state.qaSourceByActionStep };
  delete newQa[key];
  return { ...state, qaSourceByActionStep: newQa };
}

// ============================================================ V1D Preview State

export function getPreviewCandidateId(state: LabState): string | undefined {
  return state.previewCandidateId;
}

export function setPreviewCandidateId(state: LabState, candidateId: string): LabState {
  return { ...state, previewCandidateId: candidateId };
}

export function clearPreviewCandidateId(state: LabState): LabState {
  return { ...state, previewCandidateId: undefined };
}

// ============================================================ V1D Accordion State

export function getAccordionOpen(state: LabState, section: LabAccordionSection): boolean {
  return state.accordionState?.[section] ?? DEFAULT_ACCORDION_OPEN.includes(section);
}

export function setAccordionOpen(state: LabState, section: LabAccordionSection, open: boolean): LabState {
  return {
    ...state,
    accordionState: { ...state.accordionState, [section]: open },
  };
}

export function expandAllAccordions(state: LabState): LabState {
  const accordionState: Record<string, boolean> = {};
  for (const sec of ALL_ACCORDION_SECTIONS) accordionState[sec] = true;
  return { ...state, accordionState };
}

export function collapseAllAccordions(state: LabState): LabState {
  const accordionState: Record<string, boolean> = {};
  for (const sec of ALL_ACCORDION_SECTIONS) accordionState[sec] = false;
  return { ...state, accordionState };
}

export function getSelectedStep(state: LabState, actionKey: string): number {
  return state.selectedStepByAction[actionKey] ?? 0;
}

export function setSelectedStep(state: LabState, actionKey: string, stepIndex: number): LabState {
  return { ...state, selectedStepByAction: { ...state.selectedStepByAction, [actionKey]: stepIndex } };
}

// ============================================================ V1D.4.2 Visual SpriteSheet Steps

/**
 * Derives the ordered list of visual spritesheet steps from a LabAction's preset.
 * Only `spriteSheet` type steps are included — technical steps (screenShake,
 * hitStop, screenFlash, etc.) are excluded from the artistic VFX workflow.
 *
 * Preserves the real underlying `stepIndex` for each visual step.
 * `visualIndex` is UI-only (0-based ordinal among spriteSheet steps).
 */
export function getVisualSpriteSheetSteps(action: LabAction): VisualSpriteSheetStep[] {
  const result: VisualSpriteSheetStep[] = [];
  let visualIndex = 0;
  for (const step of action.vfxSteps) {
    if (step.stepType === 'spriteSheet' && step.spriteSheetId) {
      result.push({ visualIndex, stepIndex: step.stepIndex, spriteSheetId: step.spriteSheetId });
      visualIndex++;
    }
  }
  return result;
}

/**
 * Returns the count of visual spritesheet steps for an action.
 */
export function getVisualSpriteSheetCount(action: LabAction): number {
  return getVisualSpriteSheetSteps(action).length;
}

/**
 * Returns the real stepIndex for the currently selected visual spritesheet.
 *
 * If the current selectedStep points to a spriteSheet step, returns it directly.
 * If it points to a technical step (or is out of range), auto-corrects to the
 * first spriteSheet step. Returns 0 if there are no spriteSheet steps.
 *
 * Does NOT mutate state — callers should call setSelectedStep if correction
 * is needed.
 */
export function getSelectedVisualStepIndex(state: LabState, action: LabAction): number {
  const visualSteps = getVisualSpriteSheetSteps(action);
  if (visualSteps.length === 0) return 0;
  const currentStep = getSelectedStep(state, action.actionKey);
  const match = visualSteps.find((vs) => vs.stepIndex === currentStep);
  if (match) return match.stepIndex;
  return visualSteps[0]!.stepIndex;
}

export function getQaStatus(state: LabState, action: LabAction, stepIndex: number): 'SAME_AS_PRODUCTION' | 'QA_MODIFIED' | 'UNRESOLVED' | 'NO_VFX' {
  const step = action.vfxSteps[stepIndex];
  if (!step) return 'NO_VFX';
  const qaId = getQaSourceId(state, action.actionKey, stepIndex);
  const qaPres = getQaPresentation(state, action.actionKey, stepIndex);
  if (qaId || (qaPres && isPresentationModified(qaPres, step))) return 'QA_MODIFIED';
  const history = state.qaHistory[action.actionKey];
  if (history && history.length > 0) return 'UNRESOLVED';
  return 'SAME_AS_PRODUCTION';
}

// ============================================================ Presentation Overrides

export function getQaPresentation(state: LabState, actionKey: string, stepIndex: number): LabPresentationOverride | undefined {
  return state.qaPresentationByActionStep[labStepKey(actionKey, stepIndex)];
}

export function setQaPresentation(state: LabState, actionKey: string, stepIndex: number, override: Partial<LabPresentationOverride>): LabState {
  const key = labStepKey(actionKey, stepIndex);
  const existing = state.qaPresentationByActionStep[key] ?? {};
  return {
    ...state,
    qaPresentationByActionStep: {
      ...state.qaPresentationByActionStep,
      [key]: { ...existing, ...override },
    },
  };
}

export function clearQaPresentation(state: LabState, actionKey: string, stepIndex: number): LabState {
  const key = labStepKey(actionKey, stepIndex);
  const newPres = { ...state.qaPresentationByActionStep };
  delete newPres[key];
  return { ...state, qaPresentationByActionStep: newPres };
}

export function resetQaStep(state: LabState, actionKey: string, stepIndex: number): LabState {
  let newState = clearQaSourceId(state, actionKey, stepIndex);
  newState = clearQaPresentation(newState, actionKey, stepIndex);
  return newState;
}

export function getProductionPresentation(step: LabVfxStep): LabPresentationOverride {
  const pres = step.presentation ?? {};
  return {
    scale: pres.scale,
    offsetX: 0,
    offsetY: 0,
    duration: step.duration,
    opacity: pres.opacity,
    anchor: step.anchor,
    layer: pres.layer,
    blending: pres.blending,
    fadeIn: pres.fadeIn,
    fadeOut: pres.fadeOut,
    direction: step.orientation ?? 'AUTO',
  };
}

export function getEffectivePresentation(state: LabState, action: LabAction, stepIndex: number): LabPresentationOverride {
  const step = action.vfxSteps[stepIndex];
  if (!step) return {};
  const prod = getProductionPresentation(step);
  const qa = getQaPresentation(state, action.actionKey, stepIndex);
  if (!qa) return prod;
  return { ...prod, ...qa };
}

export function isPresentationModified(qa: LabPresentationOverride, step: LabVfxStep): boolean {
  const prod = getProductionPresentation(step);
  const keys: (keyof LabPresentationOverride)[] = ['scale', 'offsetX', 'offsetY', 'duration', 'opacity', 'anchor', 'layer', 'blending', 'fadeIn', 'fadeOut', 'direction'];
  for (const key of keys) {
    const qaVal = qa[key];
    const prodVal = prod[key];
    if (qaVal !== undefined && qaVal !== prodVal) return true;
  }
  return false;
}

// ============================================================ V1C Notes

export function getStepNotes(state: LabState, actionKey: string, stepIndex: number): string {
  return state.notesByActionStep[labStepKey(actionKey, stepIndex)] ?? '';
}

export function setStepNotes(state: LabState, actionKey: string, stepIndex: number, notes: string): LabState {
  const key = labStepKey(actionKey, stepIndex);
  return {
    ...state,
    notesByActionStep: { ...state.notesByActionStep, [key]: notes },
  };
}

export function clearStepNotes(state: LabState, actionKey: string, stepIndex: number): LabState {
  const key = labStepKey(actionKey, stepIndex);
  const newNotes = { ...state.notesByActionStep };
  delete newNotes[key];
  return { ...state, notesByActionStep: newNotes };
}

// ============================================================ V1C Validation

/**
 * Returns the validated configuration for an action+step, or undefined.
 */
export function getValidatedConfig(state: LabState, actionKey: string, stepIndex: number): ValidatedStepConfiguration | undefined {
  return state.validatedByActionStep[labStepKey(actionKey, stepIndex)];
}

/**
 * Validates the current QA working configuration for an action+step.
 *
 * Captures an IMMUTABLE snapshot of:
 *   - QA source (or production source if no QA override)
 *   - Effective presentation (production + QA overrides merged)
 *   - Current notes
 *
 * Requirements (B1):
 *   - valid action with VFX steps
 *   - valid step index
 *   - source resolved (QA or production)
 *   - native format supported
 *
 * Does NOT modify production (B2).
 * Revalidation replaces prior snapshot (D).
 */
export function validateStepConfiguration(state: LabState, action: LabAction, stepIndex: number): { state: LabState; ok: boolean; error?: string } {
  const step = action.vfxSteps[stepIndex];
  if (!step) return { state, ok: false, error: 'Invalid step index' };
  if (action.sourceStatus === 'NO_VFX') return { state, ok: false, error: 'Action has no VFX' };

  const qaSourceId = getQaSourceId(state, action.actionKey, stepIndex);
  const sourceId = qaSourceId ?? step.sourceCandidateId ?? step.spriteSheetId;
  if (!sourceId) return { state, ok: false, error: 'No source resolved' };

  const effectivePres = getEffectivePresentation(state, action, stepIndex);
  const notes = getStepNotes(state, action.actionKey, stepIndex);

  const validated: ValidatedStepConfiguration = {
    actionKey: action.actionKey,
    stepIndex,
    sourceId,
    presentation: { ...effectivePres },
    validatedAt: Date.now(),
    notes: notes || undefined,
  };

  const key = labStepKey(action.actionKey, stepIndex);
  return {
    state: {
      ...state,
      validatedByActionStep: {
        ...state.validatedByActionStep,
        [key]: validated,
      },
    },
    ok: true,
  };
}

/**
 * Clears validation for an action+step (G).
 * Does NOT reset QA working configuration.
 */
export function clearValidation(state: LabState, actionKey: string, stepIndex: number): LabState {
  const key = labStepKey(actionKey, stepIndex);
  const newValidated = { ...state.validatedByActionStep };
  delete newValidated[key];
  return { ...state, validatedByActionStep: newValidated };
}

/**
 * Restores validated values back into QA working state (E).
 * Does NOT affect production.
 */
export function restoreValidated(state: LabState, action: LabAction, stepIndex: number): LabState {
  const validated = getValidatedConfig(state, action.actionKey, stepIndex);
  if (!validated) return state;

  let newState = state;
  const step = action.vfxSteps[stepIndex];
  const prodSourceId = step?.sourceCandidateId ?? step?.spriteSheetId;

  if (validated.sourceId !== prodSourceId) {
    newState = setQaSourceId(newState, action.actionKey, stepIndex, validated.sourceId);
  } else {
    newState = clearQaSourceId(newState, action.actionKey, stepIndex);
  }

  const prodPres = step ? getProductionPresentation(step) : {};
  const presDiff = computePresentationDiff(prodPres, validated.presentation);
  if (presDiff.changedFields.length > 0) {
    newState = clearQaPresentation(newState, action.actionKey, stepIndex);
    const overrides: LabPresentationOverride = {};
    for (const field of presDiff.changedFields) {
      const val = validated.presentation[field as keyof LabPresentationOverride];
      if (val !== undefined) {
        (overrides as Record<string, unknown>)[field] = val;
      }
    }
    if (Object.keys(overrides).length > 0) {
      newState = setQaPresentation(newState, action.actionKey, stepIndex, overrides);
    }
  } else {
    newState = clearQaPresentation(newState, action.actionKey, stepIndex);
  }

  if (validated.notes) {
    newState = setStepNotes(newState, action.actionKey, stepIndex, validated.notes);
  }

  return newState;
}

// ============================================================ V1C Validation Status

/**
 * Computes the validation status for a single step (C).
 *
 * NOT_CONFIGURED — no QA change and no validation
 * QA_MODIFIED — QA working config differs from production and no matching validation
 * VALIDATED — current QA working config exactly equals validated snapshot
 * VALIDATED_BUT_MODIFIED — validation exists but working QA config has changed since
 * NO_VFX — step has no VFX
 */
export function getValidationStepStatus(state: LabState, action: LabAction, stepIndex: number): LabValidationStepStatus {
  const step = action.vfxSteps[stepIndex];
  if (!step) return 'NO_VFX';
  if (action.sourceStatus === 'NO_VFX') return 'NO_VFX';
  // V1D.4.2: Technical steps (screenShake, hitStop, etc.) are not artistically
  // configurable and do NOT participate in visual VFX validation.
  if (step.stepType !== 'spriteSheet') return 'NO_VFX';

  const validated = getValidatedConfig(state, action.actionKey, stepIndex);
  const qaModified = isQaStepModified(state, action, stepIndex);

  if (!validated) {
    return qaModified ? 'QA_MODIFIED' : 'NOT_CONFIGURED';
  }

  // Validation exists — check if current QA matches validated snapshot
  const currentSource = getQaSourceId(state, action.actionKey, stepIndex) ?? step.sourceCandidateId ?? step.spriteSheetId;
  const currentPres = getEffectivePresentation(state, action, stepIndex);
  const currentNotes = getStepNotes(state, action.actionKey, stepIndex);

  const sourceMatches = currentSource === validated.sourceId;
  const presMatches = presentationsEqual(currentPres, validated.presentation);
  const notesMatch = (currentNotes || undefined) === validated.notes;

  if (sourceMatches && presMatches && notesMatch) {
    return 'VALIDATED';
  }
  return 'VALIDATED_BUT_MODIFIED';
}

/**
 * Computes the validation status for an entire action (I).
 *
 * UNCONFIGURED — no steps have any QA changes or validation
 * PARTIAL — some but not all VFX steps are validated
 * VALIDATED — all VFX-relevant steps are validated and current
 * MODIFIED_AFTER_VALIDATION — at least one step was validated but has since been modified
 * NO_VFX — action has no VFX steps
 */
export function getValidationActionStatus(state: LabState, action: LabAction): LabValidationActionStatus {
  if (action.vfxSteps.length === 0 || action.sourceStatus === 'NO_VFX') return 'NO_VFX';

  // V1D.4.2: Only visual spriteSheet steps participate in artistic validation.
  // Technical steps (screenShake, hitStop, etc.) do NOT count toward the
  // validation denominator.
  const visualSteps = getVisualSpriteSheetSteps(action);
  if (visualSteps.length === 0) return 'NO_VFX';

  let validatedCount = 0;
  let modifiedAfterCount = 0;
  let configuredCount = 0;
  const totalSteps = visualSteps.length;

  for (const vs of visualSteps) {
    const status = getValidationStepStatus(state, action, vs.stepIndex);
    if (status === 'VALIDATED') validatedCount++;
    if (status === 'VALIDATED_BUT_MODIFIED') { modifiedAfterCount++; validatedCount++; }
    if (status === 'QA_MODIFIED' || status === 'VALIDATED_BUT_MODIFIED') configuredCount++;
  }

  if (modifiedAfterCount > 0) return 'MODIFIED_AFTER_VALIDATION';
  if (validatedCount === totalSteps) return 'VALIDATED';
  if (validatedCount > 0) return 'PARTIAL';
  if (configuredCount > 0) return 'PARTIAL';
  return 'UNCONFIGURED';
}

// ============================================================ V1C Progress

export interface LabValidationProgress {
  heroValidated: number;
  heroTotal: number;
  enemyBossValidated: number;
  enemyBossTotal: number;
  allValidated: number;
  allTotal: number;
  vfxConfigurable: number;
  noVfx: number;
  modifiedAfterValidation: number;
  unresolvedActions: number;
  unresolvedActionKeys: string[];
}

export function getValidationProgress(state: LabState): LabValidationProgress {
  let heroValidated = 0, heroTotal = 0;
  let enemyBossValidated = 0, enemyBossTotal = 0;
  let allValidated = 0, allTotal = 0;
  let vfxConfigurable = 0, noVfx = 0;
  let modifiedAfterValidation = 0;
  let unresolvedActions = 0;
  const unresolvedActionKeys: string[] = [];

  for (const action of _allActions) {
    allTotal++;
    const isHero = action.ownerType === 'HERO';
    if (isHero) heroTotal++;
    else enemyBossTotal++;

    const status = getValidationActionStatus(state, action);
    if (status === 'NO_VFX') {
      noVfx++;
      continue;
    }
    vfxConfigurable++;

    if (status === 'VALIDATED') {
      allValidated++;
      if (isHero) heroValidated++;
      else enemyBossValidated++;
    }
    if (status === 'MODIFIED_AFTER_VALIDATION') modifiedAfterValidation++;

    // V1D.4.2: Check for unresolved source only on visual spriteSheet steps.
    // Technical steps (screenShake, hitStop, etc.) do NOT count as unresolved sources.
    const visualSteps = getVisualSpriteSheetSteps(action);
    let hasUnresolved = false;
    for (const vs of visualSteps) {
      const qaStatus = getQaStatus(state, action, vs.stepIndex);
      if (qaStatus === 'UNRESOLVED') {
        hasUnresolved = true;
        break;
      }
    }
    if (hasUnresolved) {
      unresolvedActions++;
      unresolvedActionKeys.push(action.actionKey);
    }
  }

  return {
    heroValidated,
    heroTotal,
    enemyBossValidated,
    enemyBossTotal,
    allValidated,
    allTotal,
    vfxConfigurable,
    noVfx,
    modifiedAfterValidation,
    unresolvedActions,
    unresolvedActionKeys,
  };
}

// ============================================================ V1C Navigation

/**
 * Finds the next action requiring validation, searching forward from currentActionKey.
 * Wraps once. Returns null if all actions are validated.
 *
 * V1D.4.2: Also returns the stepIndex of the first unvalidated visual spriteSheet
 * step within that action, so the UI can auto-navigate to it.
 */
export function findNextToValidate(
  state: LabState,
  currentActionKey: string,
): { actionKey: string; stepIndex: number } | null {
  const sorted = [..._allActions].sort((a, b) => a.actionKey.localeCompare(b.actionKey));
  const currentIdx = sorted.findIndex((a) => a.actionKey === currentActionKey);
  if (currentIdx === -1) {
    if (sorted.length === 0) return null;
    const firstAction = sorted[0]!;
    const firstStep = findFirstUnvalidatedVisualStep(state, firstAction);
    return firstStep !== null ? { actionKey: firstAction.actionKey, stepIndex: firstStep } : null;
  }

  // Search forward from currentIdx+1, then wrap to 0..currentIdx
  for (let i = 1; i <= sorted.length; i++) {
    const idx = (currentIdx + i) % sorted.length;
    if (idx === currentIdx) break;
    const action = sorted[idx];
    if (!action) continue;
    const status = getValidationActionStatus(state, action);
    if (status !== 'VALIDATED' && status !== 'NO_VFX') {
      const stepIdx = findFirstUnvalidatedVisualStep(state, action);
      return { actionKey: action.actionKey, stepIndex: stepIdx ?? 0 };
    }
  }
  return null;
}

/**
 * V1D.4.2: Returns the stepIndex of the first unvalidated visual spriteSheet
 * step within an action, or null if all are validated.
 */
function findFirstUnvalidatedVisualStep(state: LabState, action: LabAction): number | null {
  const visualSteps = getVisualSpriteSheetSteps(action);
  for (const vs of visualSteps) {
    const status = getValidationStepStatus(state, action, vs.stepIndex);
    if (status !== 'VALIDATED' && status !== 'NO_VFX') {
      return vs.stepIndex;
    }
  }
  return null;
}

// ============================================================ V1C Final Export

/**
 * Exports ONLY validated configurations as authoritative corrections.
 * Unvalidated QA changes are excluded.
 */
export function exportValidatedConfig(state: LabState): ValidatedConfigExport {
  const progress = getValidationProgress(state);
  const sortedActions = [..._allActions].sort((a, b) => a.actionKey.localeCompare(b.actionKey));

  const actions: ValidatedConfigExport['actions'] = {};
  let validatedSteps = 0;

  for (const action of sortedActions) {
    if (action.sourceStatus === 'NO_VFX') continue;
    // V1D.4.2: Only export visual spriteSheet steps — technical steps are
    // not artistically configurable and should not appear in validated config.
    const visualSteps = getVisualSpriteSheetSteps(action);

    const steps: ValidatedConfigExport['actions'][string]['steps'] = {};
    for (const vs of visualSteps) {
      const step = action.vfxSteps[vs.stepIndex];
      if (!step) continue;
      const validated = getValidatedConfig(state, action.actionKey, vs.stepIndex);
      if (!validated) continue;

      validatedSteps++;
      const prodSourceId = step.sourceCandidateId ?? step.spriteSheetId;
      const prodPres = getProductionPresentation(step);
      const diff = computePresentationDiff(prodPres, validated.presentation);
      const sourceChanged = validated.sourceId !== prodSourceId;

      steps[String(vs.stepIndex)] = {
        production: {
          sourceId: prodSourceId,
        },
        validated: {
          sourceId: validated.sourceId,
          presentation: validated.presentation,
          notes: validated.notes,
        },
        diff: {
          sourceChanged,
          presentationChanged: diff.changedFields.length > 0,
          changedFields: sourceChanged ? ['source', ...diff.changedFields] : diff.changedFields,
        },
      };
    }

    if (Object.keys(steps).length > 0) {
      actions[action.actionKey] = {
        route: action.route,
        steps,
      };
    }
  }

  const heroComplete = progress.heroValidated === progress.heroTotal && progress.heroTotal > 0;
  const complete = progress.allValidated === progress.vfxConfigurable && progress.vfxConfigurable > 0;

  return {
    version: 1,
    kind: 'r2c-combat-vfx-validated-config',
    generatedAt: new Date().toISOString(),
    complete,
    heroComplete,
    summary: {
      labActions: _allActions.length,
      heroActions: _heroActions.length,
      enemyBossActions: _enemyBossActions.length,
      vfxConfigurableActions: progress.vfxConfigurable,
      validatedActions: progress.allValidated,
      validatedSteps,
      unresolvedActions: progress.unresolvedActions,
      modifiedAfterValidation: progress.modifiedAfterValidation,
      unresolvedActionKeys: progress.unresolvedActionKeys,
    },
    actions,
  };
}

export function serializeValidatedConfig(config: ValidatedConfigExport): string {
  return JSON.stringify(config, null, 2);
}

// ============================================================ V1C Helpers

function isQaStepModified(state: LabState, action: LabAction, stepIndex: number): boolean {
  const step = action.vfxSteps[stepIndex];
  if (!step) return false;
  const qaId = getQaSourceId(state, action.actionKey, stepIndex);
  const qaPres = getQaPresentation(state, action.actionKey, stepIndex);
  if (qaId && qaId !== (step.sourceCandidateId ?? step.spriteSheetId)) return true;
  if (qaPres && isPresentationModified(qaPres, step)) return true;
  return false;
}

function presentationsEqual(a: LabPresentationOverride, b: LabPresentationOverride): boolean {
  const keys: (keyof LabPresentationOverride)[] = ['scale', 'offsetX', 'offsetY', 'duration', 'opacity', 'anchor', 'layer', 'blending', 'fadeIn', 'fadeOut', 'direction'];
  for (const key of keys) {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal !== bVal) return false;
  }
  return true;
}

function computePresentationDiff(prod: LabPresentationOverride, validated: LabPresentationOverride): { changedFields: string[] } {
  const keys: (keyof LabPresentationOverride)[] = ['scale', 'offsetX', 'offsetY', 'duration', 'opacity', 'anchor', 'layer', 'blending', 'fadeIn', 'fadeOut', 'direction'];
  const changedFields: string[] = [];
  for (const key of keys) {
    const prodVal = prod[key];
    const valVal = validated[key];
    if (valVal !== undefined && valVal !== prodVal) {
      changedFields.push(key);
    }
  }
  return { changedFields };
}

// ============================================================ Serialization

export function serializeLabState(state: LabState): string {
  return JSON.stringify(state);
}

export function deserializeLabState(raw: string): LabState | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      selectedActionKey: parsed.selectedActionKey,
      selectedStepByAction: parsed.selectedStepByAction ?? {},
      qaSourceByActionStep: parsed.qaSourceByActionStep ?? {},
      qaPresentationByActionStep: parsed.qaPresentationByActionStep ?? {},
      notesByActionStep: parsed.notesByActionStep ?? {},
      validatedByActionStep: parsed.validatedByActionStep ?? {},
      search: parsed.search ?? '',
      formatFilter: parsed.formatFilter ?? 'ALL',
      availabilityFilter: parsed.availabilityFilter ?? 'ALL',
      usageFilter: parsed.usageFilter ?? 'ALL',
      cataloguePage: parsed.cataloguePage ?? 1,
      qaHistory: parsed.qaHistory ?? {},
    };
  } catch {
    return null;
  }
}

// ============================================================ R2C-A Migration

export interface R2cAFinalSelection {
  candidateId: string;
  verdict: 'LOCK' | 'PRESENTATION_TUNE_ONLY';
}

export interface R2cAState {
  finalSelections: Record<string, R2cAFinalSelection>;
  decisions: Record<string, { actionKey: string; candidateId: string; verdict: string; notes: string; direction?: string; timestamp?: number }>;
}

/**
 * Generic migration from R2C-A review state to Lab state.
 *
 * 1. finalSelections → seed QA working source (accepted candidates only)
 * 2. decisions       → populate QA history (all verdicts including REJECT)
 *
 * No action-specific special cases.  Actions with only REJECT decisions
 * and no finalSelection naturally remain unresolved: no QA source is set,
 * but QA history is populated, so getQaStatus returns UNRESOLVED.
 */
export function migrateFromR2cA(r2caState: R2cAState | null, labState: LabState): LabState {
  const newQa = { ...labState.qaSourceByActionStep };
  const newHistory = { ...labState.qaHistory };

  if (r2caState?.finalSelections) {
    for (const [actionKey, selection] of Object.entries(r2caState.finalSelections)) {
      const action = _actionByKey.get(actionKey);
      if (!action) continue;
      if (action.vfxSteps.length === 0) continue;
      const stepKey = labStepKey(actionKey, 0);
      if (newQa[stepKey]) continue;
      newQa[stepKey] = selection.candidateId;
    }
  }

  if (r2caState?.decisions) {
    for (const decision of Object.values(r2caState.decisions)) {
      const actionKey = decision.actionKey;
      const history = newHistory[actionKey] ?? [];
      const exists = history.some(
        (h) => h.candidateId === decision.candidateId && h.verdict === decision.verdict,
      );
      if (!exists) {
        history.push({
          candidateId: decision.candidateId,
          verdict: decision.verdict,
          notes: decision.notes || undefined,
          timestamp: decision.timestamp,
          direction: decision.direction,
        });
        newHistory[actionKey] = history;
      }
    }
  }

  return { ...labState, qaSourceByActionStep: newQa, qaHistory: newHistory };
}

export function loadLabStateFromStorage(storage: Storage): LabState {
  const raw = storage.getItem(LAB_STORAGE_KEY);
  if (raw) {
    const parsed = deserializeLabState(raw);
    if (parsed) return parsed;
  }
  return createDefaultLabState();
}

export function saveLabStateToStorage(storage: Storage, state: LabState): void {
  storage.setItem(LAB_STORAGE_KEY, serializeLabState(state));
}

export function loadR2cAStateFromStorage(storage: Storage): R2cAState | null {
  try {
    const raw = storage.getItem('r2ca-qa-state');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      finalSelections: parsed.finalSelections ?? {},
      decisions: parsed.decisions ?? {},
    };
  } catch {
    return null;
  }
}

export function migrateLabStateIfNeeded(storage: Storage): LabState {
  const existing = storage.getItem(LAB_STORAGE_KEY);
  if (existing) {
    const parsed = deserializeLabState(existing);
    if (parsed) return parsed;
  }
  const r2caState = loadR2cAStateFromStorage(storage);
  const base = createDefaultLabState();
  const migrated = migrateFromR2cA(r2caState, base);
  saveLabStateToStorage(storage, migrated);
  return migrated;
}

// ============================================================ Snapshot Export

export function exportLabSnapshot(state: LabState): LabSnapshot {
  const actions: LabSnapshot['actions'] = {};
  const sortedActions = [..._allActions].sort((a, b) => a.actionKey.localeCompare(b.actionKey));
  for (const action of sortedActions) {
    const steps: LabSnapshot['actions'][string]['steps'] = {};
    // V1D.4.2: Only include visual spriteSheet steps in the snapshot.
    // Technical steps are not artistically configurable.
    const visualSteps = getVisualSpriteSheetSteps(action);
    for (const vs of visualSteps) {
      const step = action.vfxSteps[vs.stepIndex];
      if (!step) continue;
      const qaId = getQaSourceId(state, action.actionKey, vs.stepIndex);
      const qaPres = getQaPresentation(state, action.actionKey, vs.stepIndex);
      const status = getQaStatus(state, action, vs.stepIndex);
      const prodPres = getProductionPresentation(step);
      const stepEntry: LabSnapshotStep = {
        production: {
          sourceId: step.sourceCandidateId,
          presentation: prodPres,
        },
        status,
      };
      if (qaId || qaPres) {
        stepEntry.qa = {
          sourceId: qaId,
          presentation: qaPres ?? {},
        };
      }
      steps[String(vs.stepIndex)] = stepEntry;
    }
    actions[action.actionKey] = {
      ownerType: action.ownerType,
      slot: action.slot,
      route: action.route,
      currentPresetId: action.currentPresetId,
      sourceStatus: action.sourceStatus,
      steps,
    };
  }
  return {
    version: 2,
    kind: 'r2c-combat-vfx-lab-snapshot',
    generatedAt: new Date().toISOString(),
    actions,
  };
}

export function serializeSnapshot(snapshot: LabSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

// ============================================================ Helpers

export function isLabEnabled(params: URLSearchParams): boolean {
  return params.get('vfxlab') === '1';
}

export function getHeroGroups(): { unitId: string; unitName: string; className: string; actions: LabAction[] }[] {
  const groups: { unitId: string; unitName: string; className: string; actions: LabAction[] }[] = [];
  for (const unit of units) {
    const actions = _heroActions.filter((a) => a.ownerId === unit.id);
    if (actions.length > 0) {
      groups.push({ unitId: unit.id, unitName: unit.name, className: unit.className, actions });
    }
  }
  return groups;
}

export function getEnemyGroups(): { label: string; actions: LabAction[] }[] {
  const enemyActions = _enemyBossActions.filter((a) => a.ownerType === 'ENEMY');
  const bossActions = _enemyBossActions.filter((a) => a.ownerType === 'BOSS');
  const groups: { label: string; actions: LabAction[] }[] = [];
  if (enemyActions.length) groups.push({ label: 'Enemies', actions: enemyActions });
  if (bossActions.length) groups.push({ label: 'Bosses', actions: bossActions });
  return groups;
}

export function isActionKeyUnique(): boolean {
  const seen = new Set<string>();
  for (const action of _allActions) {
    if (seen.has(action.actionKey)) return false;
    seen.add(action.actionKey);
  }
  return true;
}
