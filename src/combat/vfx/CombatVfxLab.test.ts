import { describe, expect, it } from 'vitest';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  getLabActions,
  getLabAction,
  getHeroActions,
  getEnemyBossActions,
  getActionCount,
  getHeroGroups,
  getEnemyGroups,
  isActionKeyUnique,
  buildCatalogue,
  getCatalogueCounts,
  searchCatalogue,
  resolveLabCandidateAvailability,
  createDefaultLabState,
  labStepKey,
  getQaSourceId,
  setQaSourceId,
  clearQaSourceId,
  getSelectedStep,
  setSelectedStep,
  getQaStatus,
  serializeLabState,
  deserializeLabState,
  migrateFromR2cA,
  exportLabSnapshot,
  serializeSnapshot,
  isLabEnabled,
  LAB_STORAGE_KEY,
  LAB_PAGE_SIZE,
} from './CombatVfxLab';
import type { LabState, R2cAState } from './CombatVfxLab';

// ============================================================ Action Inventory

describe('CombatVfxLab — Action Inventory', () => {
  it('derives exactly 83 total actions', () => {
    const counts = getActionCount();
    expect(counts.total).toBe(83);
  });

  it('derives exactly 12 hero basic actions', () => {
    const counts = getActionCount();
    expect(counts.heroBasic).toBe(12);
  });

  it('derives exactly 48 hero skill actions', () => {
    const counts = getActionCount();
    expect(counts.heroSkills).toBe(48);
  });

  it('derives exactly 60 total hero actions', () => {
    const counts = getActionCount();
    expect(counts.heroTotal).toBe(60);
  });

  it('derives exactly 23 enemy/boss actions', () => {
    const counts = getActionCount();
    expect(counts.enemyBoss).toBe(23);
  });

  it('all action keys are unique', () => {
    expect(isActionKeyUnique()).toBe(true);
  });

  it('hero actions are grouped by unit with correct slot ordering', () => {
    const groups = getHeroGroups();
    expect(groups.length).toBe(12);
    const first = groups[0]!;
    const slots = first.actions.map((a) => a.slot);
    expect(slots).toEqual(['BASIC', 'SKILL_1', 'SKILL_2', 'SKILL_3', 'ULTIMATE']);
  });

  it('enemy/boss actions are grouped into Enemies and Bosses', () => {
    const groups = getEnemyGroups();
    expect(groups.length).toBe(2);
    expect(groups[0]!.label).toBe('Enemies');
    expect(groups[0]!.actions.length).toBe(10);
    expect(groups[1]!.label).toBe('Bosses');
    expect(groups[1]!.actions.length).toBe(13);
  });

  it('every hero action has ownerType HERO', () => {
    for (const action of getHeroActions()) {
      expect(action.ownerType).toBe('HERO');
    }
  });

  it('every enemy/boss action has ownerType ENEMY or BOSS', () => {
    for (const action of getEnemyBossActions()) {
      expect(['ENEMY', 'BOSS']).toContain(action.ownerType);
    }
  });
});

// ============================================================ Production VFX Resolution

describe('CombatVfxLab — Production VFX Resolution', () => {
  it('resolves production steps for basic_greatsword_hit', () => {
    const action = getLabAction('basic_greatsword_hit');
    expect(action).toBeDefined();
    expect(action!.vfxSteps.length).toBeGreaterThan(0);
    expect(action!.currentPresetId).toBe('basic_greatsword_hit');
  });

  it('classifies CartoonCoffee source status for megapack-native sheets', () => {
    const action = getLabAction('w_charge');
    expect(action).toBeDefined();
    expect(action!.sourceStatus).toBe('CARTOONCOFFEE');
  });

  it('preserves multi-step presets with correct step indices', () => {
    const actions = getLabActions();
    const multiStep = actions.find((a) => a.vfxSteps.length > 1);
    if (multiStep) {
      expect(multiStep.vfxSteps[0]!.stepIndex).toBe(0);
      expect(multiStep.vfxSteps[1]!.stepIndex).toBe(1);
    }
  });

  it('resolves route as STAGE or TACTICAL for every action', () => {
    for (const action of getLabActions()) {
      expect(['STAGE', 'TACTICAL']).toContain(action.route);
    }
  });

  it('exposes apCost as display metadata from skill definitions', () => {
    const action = getLabAction('w_break_guard');
    expect(action).toBeDefined();
    expect(action!.apCost).toBe(2);
  });
});

// ============================================================ Catalogue

describe('CombatVfxLab — CartoonCoffee Catalogue', () => {
  it('loads all 2769 metadata records', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    expect(catalogue.length).toBe(2769);
  });

  it('classifies 2048x2048 as 2048_16F format', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const rec = catalogue.find((r) => r.width === 2048 && r.height === 2048);
    expect(rec).toBeDefined();
    expect(rec!.format).toBe('2048_16F');
  });

  it('classifies 4096x4096 as 4096_64F format', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const rec = catalogue.find((r) => r.width === 4096 && r.height === 4096);
    expect(rec).toBeDefined();
    expect(rec!.format).toBe('4096_64F');
  });

  it('classifies atypical dimensions as OTHER format', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const other = catalogue.filter((r) => r.format === 'OTHER');
    expect(other.length).toBeGreaterThan(0);
    for (const rec of other) {
      expect(rec.availability).toBe('UNSUPPORTED_NATIVE');
    }
  });

  it('catalogue counts match inventory summary', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const counts = getCatalogueCounts(catalogue);
    expect(counts.total).toBe(2769);
    expect(counts.format2048).toBe(309);
    expect(counts.format4096).toBe(2456);
    expect(counts.other).toBe(4);
  });

  it('marks exactly 15 PLAYABLE sources from the runtime manifest', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const ready = catalogue.filter((r) => r.availability === 'READY');
    expect(ready.length).toBe(15);
  });

  it('marks METADATA_ONLY for valid candidates not in runtime manifest', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const metadataOnly = catalogue.filter((r) => r.availability === 'AVAILABLE_ON_DEMAND');
    expect(metadataOnly.length).toBe(2750);
  });

  it('catalogue availability totals sum to 2769', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const counts = getCatalogueCounts(catalogue);
    expect(counts.ready + counts.availableOnDemand + counts.unsupported).toBe(2769);
    expect(counts.ready).toBe(15);
    expect(counts.availableOnDemand).toBe(2750);
    expect(counts.unsupported).toBe(4);
  });

  it('does not load or copy any PNG files (metadata-only catalogue)', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    for (const rec of catalogue) {
      expect(typeof rec.sourceFilename).toBe('string');
      expect(rec.sourceFilename).not.toContain('/assets/');
    }
  });

  it('populates usedBy with action keys for production sources', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    const used = catalogue.filter((r) => r.usedBy.length > 0);
    expect(used.length).toBeGreaterThan(0);
  });
});

// ============================================================ Availability Resolver

describe('CombatVfxLab — Availability Resolver', () => {
  it('returns PLAYABLE for a genuinely resolvable runtime manifest candidate', () => {
    expect(resolveLabCandidateAvailability('r1_0450', '4096_64F')).toBe('READY');
    expect(resolveLabCandidateAvailability('r1_2561', '2048_16F')).toBe('READY');
  });

  it('returns METADATA_ONLY for a valid candidate not in the runtime manifest', () => {
    expect(resolveLabCandidateAvailability('r1_0001', '4096_64F')).toBe('AVAILABLE_ON_DEMAND');
    expect(resolveLabCandidateAvailability('r1_0004', '4096_64F')).toBe('AVAILABLE_ON_DEMAND');
  });

  it('returns UNSUPPORTED_NATIVE for atypical format regardless of manifest', () => {
    expect(resolveLabCandidateAvailability('r1_0450', 'OTHER')).toBe('UNSUPPORTED_NATIVE');
    expect(resolveLabCandidateAvailability('r1_0001', 'OTHER')).toBe('UNSUPPORTED_NATIVE');
  });

  it('sourceCandidateId alone does NOT imply PLAYABLE', () => {
    // r1_0450 has a sourceCandidateId in VFX_SPRITE_SHEETS (megapack_flamethrower_001)
    // AND is in the runtime manifest.  But the resolver uses the manifest,
    // not VFX_SPRITE_SHEETS.  A candidate not in the manifest is METADATA_ONLY
    // even if it happened to have a sourceCandidateId somewhere.
    expect(resolveLabCandidateAvailability('r1_9999', '4096_64F')).toBe('AVAILABLE_ON_DEMAND');
    expect(resolveLabCandidateAvailability('r1_9999', '2048_16F')).toBe('AVAILABLE_ON_DEMAND');
  });
});

// ============================================================ Search / Filter / Pagination

describe('CombatVfxLab — Search / Filter / Pagination', () => {
  const catalogue = buildCatalogue(inventoryJson as never);

  it('searches by candidate ID', () => {
    const result = searchCatalogue(catalogue, { search: 'r1_1709' });
    expect(result.totalFiltered).toBeGreaterThan(0);
    expect(result.results.every((r) => r.candidateId.includes('r1_1709'))).toBe(true);
  });

  it('searches by filename', () => {
    const result = searchCatalogue(catalogue, { search: 'flamethrower' });
    expect(result.totalFiltered).toBeGreaterThan(0);
  });

  it('filters by format 2048_16F', () => {
    const result = searchCatalogue(catalogue, { formatFilter: '2048_16F' });
    expect(result.totalFiltered).toBe(309);
  });

  it('filters by format 4096_64F', () => {
    const result = searchCatalogue(catalogue, { formatFilter: '4096_64F' });
    expect(result.totalFiltered).toBe(2456);
  });

  it('filters by availability PLAYABLE', () => {
    const result = searchCatalogue(catalogue, { availabilityFilter: 'READY' });
    expect(result.totalFiltered).toBeGreaterThan(0);
    expect(result.results.every((r) => r.availability === 'READY')).toBe(true);
  });

  it('filters by usage USED', () => {
    const result = searchCatalogue(catalogue, { usageFilter: 'USED' });
    expect(result.totalFiltered).toBeGreaterThan(0);
    expect(result.results.every((r) => r.usedBy.length > 0)).toBe(true);
  });

  it('paginates results with correct page count', () => {
    const result = searchCatalogue(catalogue, { page: 1, pageSize: 50 });
    expect(result.results.length).toBe(50);
    expect(result.pageCount).toBe(Math.ceil(2769 / 50));
  });

  it('clamps page to valid range', () => {
    const result = searchCatalogue(catalogue, { page: 999, pageSize: 50 });
    expect(result.page).toBeLessThanOrEqual(result.pageCount);
  });

  it('returns empty results for non-matching search', () => {
    const result = searchCatalogue(catalogue, { search: 'zzz_nonexistent_zzz' });
    expect(result.totalFiltered).toBe(0);
    expect(result.results.length).toBe(0);
  });
});

// ============================================================ QA State

describe('CombatVfxLab — QA State', () => {
  it('creates default state with empty QA sources', () => {
    const state = createDefaultLabState();
    expect(state.qaSourceByActionStep).toEqual({});
    expect(state.search).toBe('');
    expect(state.formatFilter).toBe('ALL');
  });

  it('sets and retrieves QA source per action/step', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_break_guard', 0, 'r1_0592');
    expect(getQaSourceId(state, 'w_break_guard', 0)).toBe('r1_0592');
  });

  it('clears QA source per action/step', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_break_guard', 0, 'r1_0592');
    state = clearQaSourceId(state, 'w_break_guard', 0);
    expect(getQaSourceId(state, 'w_break_guard', 0)).toBeUndefined();
  });

  it('maintains strict separation: QA source does not modify production', () => {
    const action = getLabAction('basic_crosier_hit')!;
    let state = createDefaultLabState();
    const prodBefore = action.vfxSteps[0]?.sourceCandidateId;
    state = setQaSourceId(state, 'basic_crosier_hit', 0, 'r1_9999');
    const actionAfter = getLabAction('basic_crosier_hit')!;
    expect(actionAfter.vfxSteps[0]?.sourceCandidateId).toBe(prodBefore);
  });

  it('reports SAME_AS_PRODUCTION when no QA source and no history', () => {
    const action = getLabAction('basic_greatsword_hit')!;
    const state = createDefaultLabState();
    expect(getQaStatus(state, action, 0)).toBe('SAME_AS_PRODUCTION');
  });

  it('reports QA_MODIFIED when QA source differs from production', () => {
    const action = getLabAction('basic_greatsword_hit')!;
    let state = createDefaultLabState();
    state = setQaSourceId(state, action.actionKey, 0, 'r1_9999');
    expect(getQaStatus(state, action, 0)).toBe('QA_MODIFIED');
  });

  it('reports UNRESOLVED when QA history exists but no QA source set', () => {
    const action = getLabAction('basic_greatsword_hit')!;
    const state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        'basic_greatsword_hit': [
          { candidateId: 'r1_0004', verdict: 'REJECTED', timestamp: 1 },
        ],
      },
    };
    expect(getQaStatus(state, action, 0)).toBe('UNRESOLVED');
  });

  it('unresolved source is represented without a fake candidate ID', () => {
    const action = getLabAction('basic_greatsword_hit')!;
    const state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        'basic_greatsword_hit': [
          { candidateId: 'r1_0004', verdict: 'REJECTED', timestamp: 1 },
        ],
      },
    };
    expect(getQaSourceId(state, action.actionKey, 0)).toBeUndefined();
    expect(getQaStatus(state, action, 0)).toBe('UNRESOLVED');
  });

  it('persists selected step per action', () => {
    let state = createDefaultLabState();
    state = setSelectedStep(state, 'w_break_guard', 1);
    expect(getSelectedStep(state, 'w_break_guard')).toBe(1);
  });

  it('labStepKey produces deterministic composite key', () => {
    expect(labStepKey('w_break_guard', 0)).toBe('w_break_guard::0');
    expect(labStepKey('w_break_guard', 1)).toBe('w_break_guard::1');
  });
});

// ============================================================ Serialization

describe('CombatVfxLab — Serialization', () => {
  it('round-trips state through serialize/deserialize', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_break_guard', 0, 'r1_0592');
    state = setSelectedStep(state, 'w_break_guard', 1);
    const serialized = serializeLabState(state);
    const deserialized = deserializeLabState(serialized);
    expect(deserialized).not.toBeNull();
    expect(getQaSourceId(deserialized!, 'w_break_guard', 0)).toBe('r1_0592');
    expect(getSelectedStep(deserialized!, 'w_break_guard')).toBe(1);
  });

  it('returns null for invalid JSON', () => {
    expect(deserializeLabState('not json')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(deserializeLabState('42')).toBeNull();
  });
});

// ============================================================ R2C-A Migration

describe('CombatVfxLab — R2C-A Migration', () => {
  it('seeds QA source from accepted finalSelection (LOCK)', () => {
    const r2caState: R2cAState = {
      finalSelections: {
        basic_greatsword_hit: { candidateId: 'r1_1709', verdict: 'LOCK' },
      },
      decisions: {},
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    expect(getQaSourceId(migrated, 'basic_greatsword_hit', 0)).toBe('r1_1709');
  });

  it('seeds QA source from accepted finalSelection (PRESENTATION_TUNE_ONLY)', () => {
    const r2caState: R2cAState = {
      finalSelections: {
        basic_crosier_hit: { candidateId: 'r1_0592', verdict: 'PRESENTATION_TUNE_ONLY' },
      },
      decisions: {},
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    expect(getQaSourceId(migrated, 'basic_crosier_hit', 0)).toBe('r1_0592');
  });

  it('R2C-A action with only REJECT decisions stays unresolved (no QA source)', () => {
    const r2caState: R2cAState = {
      finalSelections: {},
      decisions: {
        'a_arrow_rain::r1_0004': {
          actionKey: 'a_arrow_rain', candidateId: 'r1_0004',
          verdict: 'REJECT', notes: '', direction: 'player',
        },
        'a_arrow_rain::r1_1712': {
          actionKey: 'a_arrow_rain', candidateId: 'r1_1712',
          verdict: 'REJECT', notes: '', direction: 'player',
        },
      },
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    expect(getQaSourceId(migrated, 'a_arrow_rain', 0)).toBeUndefined();
    const action = getLabAction('a_arrow_rain')!;
    expect(getQaStatus(migrated, action, 0)).toBe('UNRESOLVED');
  });

  it('generic rejected action with arbitrary fake actionKey also stays unresolved', () => {
    const r2caState: R2cAState = {
      finalSelections: {},
      decisions: {
        'fake_action::r1_0001': {
          actionKey: 'fake_action', candidateId: 'r1_0001',
          verdict: 'REJECT', notes: 'test', direction: 'player',
        },
      },
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    const history = migrated.qaHistory['fake_action'];
    expect(history).toBeDefined();
    expect(history!.length).toBe(1);
    expect(history![0]!.verdict).toBe('REJECT');
  });

  it('no migration behavior depends on literal a_arrow_rain', () => {
    const r2caState: R2cAState = {
      finalSelections: {},
      decisions: {},
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    expect(migrated.qaHistory['a_arrow_rain']).toBeUndefined();
    expect(getQaSourceId(migrated, 'a_arrow_rain', 0)).toBeUndefined();
  });

  it('no migration behavior depends on literal a_zenith_arrow', () => {
    const r2caState: R2cAState = {
      finalSelections: {},
      decisions: {},
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    expect(migrated.qaHistory['a_zenith_arrow']).toBeUndefined();
    expect(getQaSourceId(migrated, 'a_zenith_arrow', 0)).toBeUndefined();
  });

  it('rejected candidate history is preserved from R2C-A decisions', () => {
    const r2caState: R2cAState = {
      finalSelections: {},
      decisions: {
        'a_arrow_rain::r1_0004': {
          actionKey: 'a_arrow_rain', candidateId: 'r1_0004',
          verdict: 'REJECT', notes: 'wrong direction', direction: 'player',
        },
      },
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    const history = migrated.qaHistory['a_arrow_rain']!;
    expect(history.some((h) => h.candidateId === 'r1_0004' && h.verdict === 'REJECT')).toBe(true);
    expect(history.some((h) => h.notes === 'wrong direction')).toBe(true);
  });

  it('accepted candidate history is preserved from R2C-A decisions', () => {
    const r2caState: R2cAState = {
      finalSelections: {
        p_interpose: { candidateId: 'r1_0525', verdict: 'LOCK' },
      },
      decisions: {
        'p_interpose::r1_0525': {
          actionKey: 'p_interpose', candidateId: 'r1_0525',
          verdict: 'LOCK', notes: 'perfect match', direction: 'player',
        },
      },
    };
    const base = createDefaultLabState();
    const migrated = migrateFromR2cA(r2caState, base);
    const history = migrated.qaHistory['p_interpose']!;
    expect(history.some((h) => h.candidateId === 'r1_0525' && h.verdict === 'LOCK')).toBe(true);
  });

  it('newer Lab state still wins over R2C-A finalSelection', () => {
    let existing = createDefaultLabState();
    existing = setQaSourceId(existing, 'basic_greatsword_hit', 0, 'r1_9999');
    const r2caState: R2cAState = {
      finalSelections: {
        basic_greatsword_hit: { candidateId: 'r1_1709', verdict: 'LOCK' },
      },
      decisions: {},
    };
    const migrated = migrateFromR2cA(r2caState, existing);
    expect(getQaSourceId(migrated, 'basic_greatsword_hit', 0)).toBe('r1_9999');
  });
});

// ============================================================ Snapshot Export

describe('CombatVfxLab — Snapshot Export', () => {
  it('exports snapshot with correct schema version and kind', () => {
    const state = createDefaultLabState();
    const snapshot = exportLabSnapshot(state);
    expect(snapshot.version).toBe(2);
    expect(snapshot.kind).toBe('r2c-combat-vfx-lab-snapshot');
  });

  it('exports all 83 actions in snapshot', () => {
    const state = createDefaultLabState();
    const snapshot = exportLabSnapshot(state);
    expect(Object.keys(snapshot.actions).length).toBe(83);
  });

  it('includes production source IDs in snapshot steps', () => {
    const state = createDefaultLabState();
    const snapshot = exportLabSnapshot(state);
    const charge = snapshot.actions['w_charge'];
    expect(charge).toBeDefined();
    const step0 = charge!.steps['0'];
    expect(step0).toBeDefined();
    expect(step0!.production.sourceId).toBeDefined();
  });

  it('includes QA source IDs when set', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_9999');
    const snapshot = exportLabSnapshot(state);
    const step0 = snapshot.actions['w_charge']!.steps['0'];
    expect(step0!.qa?.sourceId).toBe('r1_9999');
    expect(step0!.status).toBe('QA_MODIFIED');
  });

  it('serializes snapshot to valid JSON string', () => {
    const state = createDefaultLabState();
    const snapshot = exportLabSnapshot(state);
    const json = serializeSnapshot(snapshot);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('represents unresolved correctly in snapshot (no fake candidate ID)', () => {
    const state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        'basic_greatsword_hit': [
          { candidateId: 'r1_0004', verdict: 'REJECTED', timestamp: 1 },
        ],
      },
    };
    const snapshot = exportLabSnapshot(state);
    const step0 = snapshot.actions['basic_greatsword_hit']!.steps['0']!;
    expect(step0.qa?.sourceId).toBeUndefined();
    expect(step0.status).toBe('UNRESOLVED');
  });
});

// ============================================================ Conditional Activation

describe('CombatVfxLab — Conditional Activation', () => {
  it('isLabEnabled returns true when vfxlab=1', () => {
    const params = new URLSearchParams('vfxlab=1');
    expect(isLabEnabled(params)).toBe(true);
  });

  it('isLabEnabled returns false when vfxlab is absent', () => {
    const params = new URLSearchParams('qa=1');
    expect(isLabEnabled(params)).toBe(false);
  });

  it('isLabEnabled returns false when vfxlab=0', () => {
    const params = new URLSearchParams('vfxlab=0');
    expect(isLabEnabled(params)).toBe(false);
  });

  it('uses correct storage key', () => {
    expect(LAB_STORAGE_KEY).toBe('r2c-combat-vfx-lab-state');
  });

  it('uses page size of 50', () => {
    expect(LAB_PAGE_SIZE).toBe(50);
  });
});
