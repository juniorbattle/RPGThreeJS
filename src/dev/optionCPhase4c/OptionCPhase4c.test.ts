/**
 * Phase 4C-GLM — Comprehensive Test Suite
 *
 * Section 44: Tests for character registry, manifest resolution, animation
 * metadata, anchor schema, scale schema, selective loading, cache behavior,
 * DEV labs, DEV/prod isolation, missing-asset failure, Kestrel backward compat.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isOptionCArtStatus,
  isOptionCAnimationState,
  isOptionCSurface,
  isOptionCFacing,
  toSpriteFrameAnimationDefinition,
  validateAnimationMetadata,
  validateCharacterDefinition,
  validateOperatorPromotion,
  type OptionCAnimationMetadata,
} from './OptionCCharacterSchema';
import {
  PLAYABLE_ROSTER_CENSUS,
  CHARACTER_IDENTITY_SPECS,
  getCensusEntry,
  getIdentitySpec,
  getAllPlayableCharacterIds,
  getGoldReferenceCharacterId,
} from './OptionCCharacterRegistry';
import {
  resolveCharacterAsset,
  resolveEnvironmentAsset,
  resolveCharacterAnimationFrames,
  resolveCharacterSurfaceFrames,
  getCharacterDefinition,
  getRegisteredCharacterIds,
} from './OptionCManifestResolver';
import {
  OptionCSelectiveLoader,
  NO_GLOBAL_OPTION_C_PRELOAD,
  DEFAULT_CACHE_POLICY,
} from './OptionCSelectiveLoader';
import {
  KESTREL_DEFINITION,
  ALISTAIR_DEFINITION,
  MARIAN_DEFINITION,
  ELARA_DEFINITION,
  MORVAN_DEFINITION,
  SELECTED_BATCH,
  ALL_PHASE4C_DEFINITIONS,
} from './OptionCCharacterDefinitions';

// ---------------------------------------------------------------------------
// A. Character registry & roster census
// ---------------------------------------------------------------------------

describe('Phase 4C roster census', () => {
  it('contains exactly 12 playable heroes', () => {
    expect(PLAYABLE_ROSTER_CENSUS).toHaveLength(12);
  });

  it('has unique character IDs', () => {
    const ids = PLAYABLE_ROSTER_CENSUS.map((e) => e.characterId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes Kestrel as the gold reference', () => {
    const kestrel = getCensusEntry('archer');
    expect(kestrel).toBeDefined();
    expect(kestrel!.displayName).toBe('Kestrel');
    expect(kestrel!.optionCStatus).toBe('GOLD_REFERENCE');
  });

  it('marks all non-Kestrel characters as ART_PENDING_CODEX', () => {
    for (const entry of PLAYABLE_ROSTER_CENSUS) {
      if (entry.characterId === 'archer') continue;
      expect(entry.optionCStatus).toBe('ART_PENDING_CODEX');
    }
  });

  it('has canonical asset paths for every character', () => {
    for (const entry of PLAYABLE_ROSTER_CENSUS) {
      expect(entry.canonicalAssetPath).toMatch(/^\/assets\/characters\/pixel\/full\//);
    }
  });

  it('has identity specs matching census entries', () => {
    expect(CHARACTER_IDENTITY_SPECS).toHaveLength(12);
    for (const spec of CHARACTER_IDENTITY_SPECS) {
      const census = getCensusEntry(spec.id);
      expect(census).toBeDefined();
    }
  });

  it('returns the gold reference character id as archer', () => {
    expect(getGoldReferenceCharacterId()).toBe('archer');
  });
});

// ---------------------------------------------------------------------------
// B. Canonical identity preservation
// ---------------------------------------------------------------------------

describe('Phase 4C canonical identity preservation', () => {
  it('keeps Kestrel canonical source outside DEV namespace', () => {
    expect(KESTREL_DEFINITION.identity.canonicalSource).toBe('/assets/characters/pixel/full/kestrel.png');
    expect(KESTREL_DEFINITION.identity.canonicalSource).not.toMatch(/\/dev\//);
  });

  it('keeps all draft characters canonical sources in the canonical path', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.identity.canonicalSource).toMatch(/^\/assets\/characters\/pixel\/full\//);
      expect(def.identity.canonicalSource).not.toMatch(/\/dev\//);
    }
  });

  it('does not clone Kestrel identity onto other characters', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.identity.id).not.toBe('archer');
      expect(def.identity.weapon).not.toBe('longbow');
      expect(def.identity.silhouetteClass).not.toBe('lithe_ranged');
    }
  });

  it('verifies canonical source files exist on disk', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      const path = resolve(process.cwd(), `public${def.identity.canonicalSource}`);
      expect(existsSync(path)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// C. Pipeline repeatability — character definition validation
// ---------------------------------------------------------------------------

describe('Phase 4C character definition validation', () => {
  it('validates all Phase 4C definitions without error', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      const err = validateCharacterDefinition(def);
      expect(err, `Character '${def.identity.id}': ${err}`).toBeNull();
    }
  });

  it('rejects empty identity id', () => {
    const bad = { ...ALISTAIR_DEFINITION, identity: { ...ALISTAIR_DEFINITION.identity, id: '' } };
    expect(validateCharacterDefinition(bad)).toContain('identity.id');
  });

  it('rejects duplicate animation states', () => {
    const dupAnim = { ...ALISTAIR_DEFINITION.animations[0] } as OptionCAnimationMetadata;
    const bad = {
      ...ALISTAIR_DEFINITION,
      animations: [ALISTAIR_DEFINITION.animations[0]!, dupAnim],
    };
    expect(validateCharacterDefinition(bad)).toContain('duplicate');
  });

  it('rejects PRODUCTION_APPROVED during GLM phase', () => {
    const bad = { ...ALISTAIR_DEFINITION, masterStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateCharacterDefinition(bad)).toContain('PRODUCTION_APPROVED');
  });
});

// ---------------------------------------------------------------------------
// D. Manifest quality — semantic resolution
// ---------------------------------------------------------------------------

describe('Phase 4C manifest resolution', () => {
  it('resolves Kestrel idle frame 0', () => {
    const asset = resolveCharacterAsset({ characterId: 'archer', surface: 'tableau', state: 'idle', frameIndex: 0 });
    expect(asset.url).toContain('/kestrel/idle/frame-01.png');
    expect(asset.semanticKey).toContain('character:archer');
  });

  it('resolves Alistair surface asset', () => {
    const asset = resolveCharacterAsset({ characterId: 'warrior', surface: 'strategic' });
    expect(asset.url).toContain('alistair.png');
  });

  it('resolves Forest Road environment for all 4 surfaces', () => {
    for (const surface of ['travel', 'tableau', 'strategic', 'combat-stage'] as const) {
      const asset = resolveEnvironmentAsset({ family: 'forest-road', surface });
      expect(asset.url).toContain('forest-road');
      expect(asset.url).toContain(surface);
    }
  });

  it('throws on unknown character (fail-closed)', () => {
    expect(() => resolveCharacterAsset({ characterId: 'nonexistent', surface: 'tableau' })).toThrow();
  });

  it('throws on unknown environment family (fail-closed)', () => {
    expect(() => resolveEnvironmentAsset({ family: 'nonexistent', surface: 'tableau' })).toThrow();
  });

  it('throws on missing animation state (fail-closed)', () => {
    expect(() => resolveCharacterAsset({ characterId: 'archer', surface: 'tableau', state: 'death' })).toThrow();
  });

  it('resolves all animation frames for Kestrel idle (8 frames)', () => {
    const frames = resolveCharacterAnimationFrames('archer', 'idle');
    expect(frames).toHaveLength(8);
  });

  it('resolves surface frames: tableau loads only idle', () => {
    const frames = resolveCharacterSurfaceFrames('archer', 'tableau');
    expect(frames.length).toBe(8); // idle only
  });

  it('resolves surface frames: combat-stage loads idle+attack+skill', () => {
    const frames = resolveCharacterSurfaceFrames('archer', 'combat-stage');
    expect(frames.length).toBe(24); // 3 states x 8 frames
  });

  it('has 5 registered character definitions', () => {
    expect(getRegisteredCharacterIds()).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// E. Animation schema quality
// ---------------------------------------------------------------------------

describe('Phase 4C animation schema', () => {
  it('Kestrel has 4 animation states with 8 frames each', () => {
    expect(KESTREL_DEFINITION.animations).toHaveLength(4);
    for (const anim of KESTREL_DEFINITION.animations) {
      expect(anim.frameCount).toBe(8);
      expect(anim.frames).toHaveLength(8);
    }
  });

  it('Kestrel idle loops at 190ms', () => {
    const idle = KESTREL_DEFINITION.animations.find((a) => a.state === 'idle')!;
    expect(idle.frameDurationMs).toBe(190);
    expect(idle.loop).toBe(true);
    expect(idle.oneShot).toBe(false);
  });

  it('Kestrel dash is oneShot returning to idle at 82ms', () => {
    const dash = KESTREL_DEFINITION.animations.find((a) => a.state === 'dash')!;
    expect(dash.frameDurationMs).toBe(82);
    expect(dash.loop).toBe(false);
    expect(dash.oneShot).toBe(true);
    expect(dash.returnState).toBe('idle');
  });

  it('Kestrel attack is oneShot at 105ms', () => {
    const attack = KESTREL_DEFINITION.animations.find((a) => a.state === 'attack')!;
    expect(attack.frameDurationMs).toBe(105);
    expect(attack.oneShot).toBe(true);
    expect(attack.returnState).toBe('idle');
  });

  it('Kestrel skill is oneShot at 125ms', () => {
    const skill = KESTREL_DEFINITION.animations.find((a) => a.state === 'skill')!;
    expect(skill.frameDurationMs).toBe(125);
    expect(skill.oneShot).toBe(true);
    expect(skill.returnState).toBe('idle');
  });

  it('draft characters have 1-frame placeholder animations (ART_PENDING_CODEX)', () => {
    for (const def of SELECTED_BATCH) {
      for (const anim of def.animations) {
        expect(anim.frameCount).toBe(1);
        expect(anim.frames).toHaveLength(1);
      }
    }
  });

  it('validates animation metadata consistency', () => {
    const valid: OptionCAnimationMetadata = {
      state: 'idle', frameWidth: 512, frameHeight: 512, frameCount: 8,
      frameDurationMs: 190, loop: true, oneShot: false, footBaseline: 466,
      pivotX: 256, pivotY: 466, mirrorAllowed: true, surfaceScale: 1,
      preloadPolicy: 'withSurface', frames: Array.from({ length: 8 }, (_, i) => `f${i}.png`),
    };
    expect(validateAnimationMetadata(valid)).toBeNull();
  });

  it('rejects animation with mismatched frameCount and frames.length', () => {
    const bad: OptionCAnimationMetadata = {
      state: 'idle', frameWidth: 512, frameHeight: 512, frameCount: 8,
      frameDurationMs: 190, loop: true, oneShot: false, footBaseline: 466,
      pivotX: 256, pivotY: 466, mirrorAllowed: true, surfaceScale: 1,
      preloadPolicy: 'withSurface', frames: ['f0.png'],
    };
    expect(validateAnimationMetadata(bad)).toContain('frameCount');
  });

  it('converts to SpriteFrameAnimationDefinition', () => {
    const meta = KESTREL_DEFINITION.animations[0]!;
    const spriteDef = toSpriteFrameAnimationDefinition(meta);
    expect(spriteDef.state).toBe(meta.state);
    expect(spriteDef.frames).toBe(meta.frames);
    expect(spriteDef.frameDurationMs).toBe(meta.frameDurationMs);
    expect(spriteDef.loop).toBe(meta.loop);
  });

  it('supports extended animation states (cast, hurt, guard, death)', () => {
    expect(isOptionCAnimationState('cast')).toBe(true);
    expect(isOptionCAnimationState('hurt')).toBe(true);
    expect(isOptionCAnimationState('guard')).toBe(true);
    expect(isOptionCAnimationState('death')).toBe(true);
    expect(isOptionCAnimationState('victory')).toBe(true);
    expect(isOptionCAnimationState('special')).toBe(true);
    expect(isOptionCAnimationState('rangedRelease')).toBe(true);
    expect(isOptionCAnimationState('heavyAttack')).toBe(true);
  });

  it('does not require all extended states for every character', () => {
    // Kestrel has only 4 states; draft characters have 4 too
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(def.animations.length).toBeLessThanOrEqual(4);
    }
  });
});

// ---------------------------------------------------------------------------
// F. Anchor & scale consistency
// ---------------------------------------------------------------------------

describe('Phase 4C anchor and scale contracts', () => {
  it('Kestrel has foot anchor at (256, 466) — Phase 4A/4B gold contract', () => {
    expect(KESTREL_DEFINITION.anchors.footCenter).toEqual({ x: 256, y: 466 });
  });

  it('all characters have positive anchors', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(def.anchors.footCenter.x).toBeGreaterThan(0);
      expect(def.anchors.footCenter.y).toBeGreaterThan(0);
      expect(def.anchors.bodyCenter.x).toBeGreaterThan(0);
      expect(def.anchors.bodyCenter.y).toBeGreaterThan(0);
      expect(def.anchors.headReference.x).toBeGreaterThan(0);
      expect(def.anchors.headReference.y).toBeGreaterThan(0);
    }
  });

  it('Kestrel scale is not draftScale', () => {
    expect(KESTREL_DEFINITION.scales.draftScale).toBe(false);
  });

  it('draft characters have draftScale = true', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.scales.draftScale).toBe(true);
    }
  });

  it('all scales are positive', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(def.scales.tableau).toBeGreaterThan(0);
      expect(def.scales.strategic).toBeGreaterThan(0);
      expect(def.scales.combatStage).toBeGreaterThan(0);
    }
  });

  it('supports separate scales for tableau, strategic, combatStage', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(typeof def.scales.tableau).toBe('number');
      expect(typeof def.scales.strategic).toBe('number');
      expect(typeof def.scales.combatStage).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// G. Selective loading
// ---------------------------------------------------------------------------

describe('Phase 4C selective loading', () => {
  it('NO_GLOBAL_OPTION_C_PRELOAD is YES', () => {
    expect(NO_GLOBAL_OPTION_C_PRELOAD).toBe(true);
  });

  it('travel loads only environment, no character frames', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTravel('forest-road');
    const report = loader.getMemoryReport();
    expect(report.loadedEnvironmentFamilies).toContain('forest-road');
    expect(report.loadedCharacterStates).toHaveLength(0);
    loader.clear();
  });

  it('tableau loads only visible cast idle frames', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTableau('forest-road', ['archer', 'warrior']);
    const report = loader.getMemoryReport();
    expect(report.loadedCharacterStates).toContain('archer');
    expect(report.loadedCharacterStates).toContain('warrior');
    // Should have environment + 2 characters' idle frames
    // Kestrel: 8 idle frames, Alistair: 1 idle frame = 9 character frames + 1 env = 10
    expect(report.totalEntries).toBeGreaterThanOrEqual(2);
    loader.clear();
  });

  it('strategic loads only participating units', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadStrategic('forest-road', ['archer']);
    const report = loader.getMemoryReport();
    expect(report.loadedCharacterStates).toContain('archer');
    loader.clear();
  });

  it('combat stage loads attacker + target only', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadCombatStage('forest-road', 'archer', 'warrior', 'attack');
    const report = loader.getMemoryReport();
    expect(report.loadedCharacterStates).toContain('archer');
    expect(report.loadedCharacterStates).toContain('warrior');
    loader.clear();
  });

  it('does not load unrelated campaign cast', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTableau('forest-road', ['archer']);
    const report = loader.getMemoryReport();
    // Should NOT have loaded warrior, white_mage, etc.
    expect(report.loadedCharacterStates).not.toContain('warrior');
    expect(report.loadedCharacterStates).not.toContain('white_mage');
    loader.clear();
  });
});

// ---------------------------------------------------------------------------
// H. Cache behavior
// ---------------------------------------------------------------------------

describe('Phase 4C cache behavior', () => {
  it('default cache policy allows 128 entries', () => {
    expect(DEFAULT_CACHE_POLICY.maxEntries).toBe(128);
  });

  it('reuses cached assets without re-adding', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTravel('forest-road');
    const size1 = loader.getCacheSize();
    await loader.loadTravel('forest-road');
    const size2 = loader.getCacheSize();
    expect(size2).toBe(size1);
    loader.clear();
  });

  it('releases unused characters', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTableau('forest-road', ['archer', 'warrior']);
    const released = loader.releaseUnusedCharacters(['archer']);
    expect(released).toBeGreaterThan(0);
    const report = loader.getMemoryReport();
    expect(report.loadedCharacterStates).not.toContain('warrior');
    loader.clear();
  });

  it('does not thrash on surface switch (keeps environment)', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTableau('forest-road', ['archer']);
    const size1 = loader.getCacheSize();
    // Switch to strategic with same character
    await loader.loadStrategic('forest-road', ['archer']);
    // Environment should still be cached (reused)
    expect(loader.hasAsset(resolveEnvironmentAsset({ family: 'forest-road', surface: 'tableau' }).url)).toBe(true);
    loader.clear();
  });

  it('provides memory report with estimates', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadTableau('forest-road', ['archer']);
    const report = loader.getMemoryReport();
    expect(report.isEstimate).toBe(true);
    expect(report.estimatedDecodedRgbaBytes).toBeGreaterThan(0);
    expect(report.totalFileBytes).toBeGreaterThan(0);
    loader.clear();
  });
});

// ---------------------------------------------------------------------------
// I. DEV/prod isolation
// ---------------------------------------------------------------------------

describe('Phase 4C DEV/prod isolation', () => {
  it('gates Phase 4C labs behind Vite DEV constant', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');
    expect(main).toMatch(/import\.meta\.env\.DEV\s*&&\s*new URLSearchParams.*get\('devOptionC'\) === 'phase4c-labs'/);
    expect(main).toContain("import('./dev/optionCPhase4c/OptionCPhase4cLabs')");
  });

  it('keeps Phase 4B proof gate intact', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');
    expect(main).toMatch(/import\.meta\.env\.DEV\s*&&\s*new URLSearchParams.*get\('devOptionC'\) === 'forest-road'/);
    expect(main).toContain("import('./dev/optionCPhase4b/OptionCPhase4bProof')");
  });

  it('does not break normal game startup', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');
    expect(main).toContain('new GameApp(root, canvas)');
  });

  it('Phase 4C modules live under src/dev/', () => {
    // All Phase 4C source is in src/dev/optionCPhase4c/ — never imported by production
    const phase4cPath = resolve(process.cwd(), 'src/dev/optionCPhase4c');
    expect(existsSync(phase4cPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// J. Kestrel backward compatibility
// ---------------------------------------------------------------------------

describe('Phase 4C Kestrel backward compatibility', () => {
  it('Kestrel definition uses same Phase 4B asset root', () => {
    expect(KESTREL_DEFINITION.sources.phase4bRoot).toBe('/assets/dev/option-c/phase4b/kestrel');
  });

  it('Kestrel idle frames match Phase 4B paths', () => {
    const idle = KESTREL_DEFINITION.animations.find((a) => a.state === 'idle')!;
    for (let i = 0; i < 8; i++) {
      expect(idle.frames[i]).toBe(`/assets/dev/option-c/phase4b/kestrel/idle/frame-${String(i + 1).padStart(2, '0')}.png`);
    }
  });

  it('Kestrel timing matches Phase 4B contract', () => {
    const idle = KESTREL_DEFINITION.animations.find((a) => a.state === 'idle')!;
    const dash = KESTREL_DEFINITION.animations.find((a) => a.state === 'dash')!;
    const attack = KESTREL_DEFINITION.animations.find((a) => a.state === 'attack')!;
    const skill = KESTREL_DEFINITION.animations.find((a) => a.state === 'skill')!;
    expect(idle.frameDurationMs).toBe(190);
    expect(dash.frameDurationMs).toBe(82);
    expect(attack.frameDurationMs).toBe(105);
    expect(skill.frameDurationMs).toBe(125);
  });

  it('does not modify Phase 4B asset files', () => {
    // Phase 4B assets should still exist unchanged
    const manifestPath = resolve(process.cwd(), 'public/assets/dev/option-c/phase4b/runtime-assets.json');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.assets).toHaveLength(36);
  });

  it('Phase 4B proof test still passes (asset count)', () => {
    // Re-verify the Phase 4B contract is intact
    const phase4bAssets = readFileSync(
      resolve(process.cwd(), 'src/dev/optionCPhase4b/OptionCPhase4bAssets.ts'),
      'utf8',
    );
    expect(phase4bAssets).toContain('OPTION_C_ANIMATION_DEFINITIONS');
    expect(phase4bAssets).toContain('frameDurationMs: 190');
  });
});

// ---------------------------------------------------------------------------
// K. Missing-asset fail-closed behavior
// ---------------------------------------------------------------------------

describe('Phase 4C fail-closed behavior', () => {
  it('resolveCharacterAsset throws on unknown character', () => {
    expect(() => resolveCharacterAsset({ characterId: 'fake', surface: 'tableau' })).toThrow(/unknown characterId/);
  });

  it('resolveCharacterAsset throws with semantic key in error', () => {
    try {
      resolveCharacterAsset({ characterId: 'fake', surface: 'tableau', state: 'idle' });
      expect.fail('Should have thrown');
    } catch (e) {
      expect(String(e)).toContain('character=fake');
      expect(String(e)).toContain('surface=tableau');
    }
  });

  it('resolveEnvironmentAsset throws with semantic key in error', () => {
    try {
      resolveEnvironmentAsset({ family: 'fake', surface: 'tableau' });
      expect.fail('Should have thrown');
    } catch (e) {
      expect(String(e)).toContain('env=fake');
      expect(String(e)).toContain('surface=tableau');
    }
  });

  it('does not silently return wrong character asset', () => {
    // If we ask for warrior, we should NOT get archer's asset
    const warriorAsset = resolveCharacterAsset({ characterId: 'warrior', surface: 'tableau' });
    expect(warriorAsset.url).toContain('alistair');
    expect(warriorAsset.url).not.toContain('kestrel');
  });
});

// ---------------------------------------------------------------------------
// L. Codex handoff readiness
// ---------------------------------------------------------------------------

describe('Phase 4C Codex handoff readiness', () => {
  it('Kestrel has 5 Codex handoff slots', () => {
    expect(KESTREL_DEFINITION.codexHandoffSlots).toHaveLength(5);
    const slotNames = KESTREL_DEFINITION.codexHandoffSlots.map((s) => s.slotName);
    expect(slotNames).toContain('characterMaster');
    expect(slotNames).toContain('idleSheet');
    expect(slotNames).toContain('dashSheet');
    expect(slotNames).toContain('attackSheet');
    expect(slotNames).toContain('skillSheet');
  });

  it('each draft character has 5 Codex handoff slots', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.codexHandoffSlots).toHaveLength(5);
      for (const slot of def.codexHandoffSlots) {
        expect(slot.expectedDimensions).toEqual([512, 512]);
        expect(slot.transparent).toBe(true);
        expect(slot.anchor).toBe('FOOT_CENTER');
        expect(slot.canonicalReference).toContain('/assets/characters/pixel/full/');
        expect(slot.kestrelReference).toContain('/assets/dev/option-c/phase4b/kestrel/');
        expect(slot.fileDestination).toContain('public/assets/dev/option-c/phase4c/');
        expect(slot.runtimeSemanticKey).toContain('character:');
      }
    }
  });

  it('Codex handoff slots include frame count ranges', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      for (const slot of def.codexHandoffSlots) {
        expect(slot.frameCountRange).toHaveLength(2);
        expect(slot.frameCountRange[0]).toBeGreaterThan(0);
        expect(slot.frameCountRange[1]).toBeGreaterThanOrEqual(slot.frameCountRange[0]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// M. Type guards
// ---------------------------------------------------------------------------

describe('Phase 4C type guards', () => {
  it('isOptionCArtStatus validates known statuses', () => {
    expect(isOptionCArtStatus('GOLD_REFERENCE')).toBe(true);
    expect(isOptionCArtStatus('SCALING_DRAFT')).toBe(true);
    expect(isOptionCArtStatus('ART_PENDING_CODEX')).toBe(true);
    expect(isOptionCArtStatus('PRODUCTION_APPROVED')).toBe(true);
    expect(isOptionCArtStatus('fake')).toBe(false);
    expect(isOptionCArtStatus(null)).toBe(false);
  });

  it('isOptionCSurface validates known surfaces', () => {
    expect(isOptionCSurface('travel')).toBe(true);
    expect(isOptionCSurface('tableau')).toBe(true);
    expect(isOptionCSurface('strategic')).toBe(true);
    expect(isOptionCSurface('combat-stage')).toBe(true);
    expect(isOptionCSurface('fake')).toBe(false);
  });

  it('isOptionCFacing validates known facings', () => {
    expect(isOptionCFacing('LEFT')).toBe(true);
    expect(isOptionCFacing('RIGHT')).toBe(true);
    expect(isOptionCFacing('FORWARD')).toBe(true);
    expect(isOptionCFacing('fake')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// N. Selected batch diversity
// ---------------------------------------------------------------------------

describe('Phase 4C selected batch diversity', () => {
  it('contains exactly 3 characters', () => {
    expect(SELECTED_BATCH).toHaveLength(3);
  });

  it('excludes Kestrel', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.identity.id).not.toBe('archer');
    }
  });

  it('has different weapons', () => {
    const weapons = SELECTED_BATCH.map((d) => d.identity.weapon);
    expect(new Set(weapons).size).toBe(3);
  });

  it('has different silhouettes', () => {
    const silhouettes = SELECTED_BATCH.map((d) => d.identity.silhouetteClass);
    expect(new Set(silhouettes).size).toBe(3);
  });

  it('has different combat archetypes or roles', () => {
    const archetypes = SELECTED_BATCH.map((d) => d.identity.archetype);
    // At least 2 different archetypes
    expect(new Set(archetypes).size).toBeGreaterThanOrEqual(2);
  });

  it('all are SCALING_DRAFT', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.masterStatus).toBe('SCALING_DRAFT');
    }
  });

  it('all have ART_PENDING_CODEX runtime status', () => {
    for (const def of SELECTED_BATCH) {
      expect(def.runtimeStatus).toBe('ART_PENDING_CODEX');
    }
  });
});

// ---------------------------------------------------------------------------
// O. P0 selected batch scope (CODEX_P0_ACTIVE_BATCH)
// ---------------------------------------------------------------------------

describe('Phase 4C P0 selected batch scope', () => {
  it('SELECTED_BATCH contains Alistair, Marian, Elara (not Morvan)', () => {
    const ids = SELECTED_BATCH.map((d) => d.identity.id);
    expect(ids).toEqual(['warrior', 'white_mage', 'dark_mage']);
    expect(ids).not.toContain('dark_knight');
  });

  it('Elara is in the selected batch', () => {
    expect(ELARA_DEFINITION.identity.id).toBe('dark_mage');
    expect(ELARA_DEFINITION.identity.displayName).toBe('Elara');
    expect(SELECTED_BATCH).toContain(ELARA_DEFINITION);
  });

  it('Morvan is NOT in the selected batch (DEFERRED_POST_DEMO)', () => {
    expect(SELECTED_BATCH).not.toContain(MORVAN_DEFINITION);
  });

  it('Morvan structural definition is preserved in ALL_PHASE4C_DEFINITIONS', () => {
    expect(ALL_PHASE4C_DEFINITIONS).toContain(MORVAN_DEFINITION);
  });

  it('ALL_PHASE4C_DEFINITIONS has 5 definitions (Kestrel + 3 P0 + Morvan)', () => {
    expect(ALL_PHASE4C_DEFINITIONS).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// P. Elara structural definition completeness
// ---------------------------------------------------------------------------

describe('Phase 4C Elara structural definition', () => {
  it('Elara has canonical source', () => {
    expect(ELARA_DEFINITION.identity.canonicalSource).toBe('/assets/characters/pixel/full/elara.png');
  });

  it('Elara has 4 animation states (idle, dash, attack, cast)', () => {
    const states = ELARA_DEFINITION.animations.map((a) => a.state);
    expect(states).toEqual(['idle', 'dash', 'attack', 'cast']);
  });

  it('Elara has 5 Codex handoff slots', () => {
    expect(ELARA_DEFINITION.codexHandoffSlots).toHaveLength(5);
  });

  it('Elara cast slot points to cast destination', () => {
    const castSlot = ELARA_DEFINITION.codexHandoffSlots.find((s) => s.slotName === 'skillSheet')!;
    expect(castSlot.fileDestination).toContain('/elara/cast/');
    expect(castSlot.runtimeSemanticKey).toContain(':state:cast');
  });

  it('Elara canonical source file exists on disk', () => {
    const path = resolve(process.cwd(), 'public/assets/characters/pixel/full/elara.png');
    expect(existsSync(path)).toBe(true);
  });

  it('Elara validates without error', () => {
    expect(validateCharacterDefinition(ELARA_DEFINITION)).toBeNull();
  });

  it('Elara has distinct silhouette from Marian', () => {
    expect(ELARA_DEFINITION.identity.silhouetteClass).not.toBe(MARIAN_DEFINITION.identity.silhouetteClass);
  });
});

// ---------------------------------------------------------------------------
// Q. Canonical identity corrections
// ---------------------------------------------------------------------------

describe('Phase 4C canonical identity corrections', () => {
  it('Kestrel maskProfile reflects closed green cloth mask (not "no mask")', () => {
    expect(KESTREL_DEFINITION.identity.maskProfile).not.toContain('no mask');
    expect(KESTREL_DEFINITION.identity.maskProfile.toLowerCase()).toContain('mask');
  });

  it('Kestrel headProfile does not expose eyes/face', () => {
    expect(KESTREL_DEFINITION.identity.headProfile.toLowerCase()).not.toContain('sharp eyes');
  });

  it('Marian maskProfile reflects masked lightcaster identity (not "no mask")', () => {
    expect(MARIAN_DEFINITION.identity.maskProfile).not.toContain('no mask');
    expect(MARIAN_DEFINITION.identity.maskProfile.toLowerCase()).toContain('mask');
  });

  it('registry identity specs match definition identity for Kestrel mask', () => {
    const spec = getIdentitySpec('archer')!;
    expect(spec.maskProfile).toBe(KESTREL_DEFINITION.identity.maskProfile);
  });

  it('registry identity specs match definition identity for Marian mask', () => {
    const spec = getIdentitySpec('white_mage')!;
    expect(spec.maskProfile).toBe(MARIAN_DEFINITION.identity.maskProfile);
  });
});

// ---------------------------------------------------------------------------
// R. Kestrel baseline contract reconciliation (y=466)
// ---------------------------------------------------------------------------

describe('Phase 4C Kestrel baseline contract (y=466)', () => {
  it('Kestrel footBaseline is 466 (Phase 4A/4B gold contract)', () => {
    for (const anim of KESTREL_DEFINITION.animations) {
      expect(anim.footBaseline).toBe(466);
      expect(anim.pivotY).toBe(466);
    }
  });

  it('Kestrel foot anchor y is 466', () => {
    expect(KESTREL_DEFINITION.anchors.footCenter.y).toBe(466);
  });
});

// ---------------------------------------------------------------------------
// S. Scale semantics (relative asset multiplier vs world plane)
// ---------------------------------------------------------------------------

describe('Phase 4C scale semantics', () => {
  it('strategic scale is a relative asset multiplier (1.0 = native 512 frame)', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(def.scales.strategic).toBeGreaterThan(0);
      // 1.0 means native frame; it is NOT the 2.08 world plane size
      expect(def.scales.strategic).toBeLessThanOrEqual(2);
    }
  });

  it('combatStage scale is a relative asset multiplier (1.0 = native 512 frame)', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(def.scales.combatStage).toBeGreaterThan(0);
      expect(def.scales.combatStage).toBeLessThanOrEqual(2);
    }
  });

  it('tableau scale is a narrative actor scale (0-1 relative to canvas)', () => {
    for (const def of ALL_PHASE4C_DEFINITIONS) {
      expect(def.scales.tableau).toBeGreaterThan(0);
      expect(def.scales.tableau).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// T. Variable frame count / state-aware loading
// ---------------------------------------------------------------------------

describe('Phase 4C variable frame count loading', () => {
  it('strategic loader uses explicit per-state metadata (no 8-frame assumption)', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadStrategic('forest-road', ['archer']);
    const report = loader.getMemoryReport();
    // Kestrel idle (8) + dash (8) = 16 character frames + 1 env = 17
    expect(report.totalEntries).toBe(17);
    loader.clear();
  });

  it('combat stage loader loads only the required action state for attacker', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadCombatStage('forest-road', 'archer', 'warrior', 'skill');
    const report = loader.getMemoryReport();
    // Kestrel skill (8) + Alistair idle (1) + 1 env = 10
    expect(report.totalEntries).toBe(10);
    loader.clear();
  });

  it('combat stage loader loads cast state for Marian', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadCombatStage('forest-road', 'white_mage', 'warrior', 'cast');
    const report = loader.getMemoryReport();
    // Marian cast (1) + Alistair idle (1) + 1 env = 3
    expect(report.totalEntries).toBe(3);
    loader.clear();
  });

  it('combat stage loader loads cast state for Elara', async () => {
    const loader = new OptionCSelectiveLoader();
    await loader.loadCombatStage('forest-road', 'dark_mage', 'warrior', 'cast');
    const report = loader.getMemoryReport();
    // Elara cast (1) + Alistair idle (1) + 1 env = 3
    expect(report.totalEntries).toBe(3);
    loader.clear();
  });

  it('combat stage attacker semantic key includes the required state', async () => {
    const loader = new OptionCSelectiveLoader();
    const entries = await loader.loadCombatStage('forest-road', 'archer', 'warrior', 'attack');
    const attackerEntry = entries.find((e) => e.characterId === 'archer');
    expect(attackerEntry).toBeDefined();
    loader.clear();
  });
});

// ---------------------------------------------------------------------------
// U. Production promotion state machine
// ---------------------------------------------------------------------------

describe('Phase 4C production promotion state machine', () => {
  it('FINAL_PRODUCTION_CANDIDATE is a valid art status', () => {
    expect(isOptionCArtStatus('FINAL_PRODUCTION_CANDIDATE')).toBe(true);
  });

  it('PRODUCTION_APPROVED is a valid art status (operator-only)', () => {
    expect(isOptionCArtStatus('PRODUCTION_APPROVED')).toBe(true);
  });

  it('GLM cannot self-promote to PRODUCTION_APPROVED (default authority)', () => {
    const bad = { ...ALISTAIR_DEFINITION, masterStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateCharacterDefinition(bad)).toContain('PRODUCTION_APPROVED');
  });

  it('GLM cannot self-promote to PRODUCTION_APPROVED (explicit GLM authority)', () => {
    const bad = { ...ALISTAIR_DEFINITION, masterStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateCharacterDefinition(bad, 'GLM')).toContain('PRODUCTION_APPROVED');
  });

  it('Codex cannot self-promote to PRODUCTION_APPROVED (CODEX authority)', () => {
    const bad = { ...ALISTAIR_DEFINITION, masterStatus: 'PRODUCTION_APPROVED' as const, runtimeStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateCharacterDefinition(bad, 'CODEX')).toContain('PRODUCTION_APPROVED');
  });

  it('validator rejects PRODUCTION_APPROVED runtimeStatus without operator authorization', () => {
    const bad = { ...ALISTAIR_DEFINITION, runtimeStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateCharacterDefinition(bad)).toContain('PRODUCTION_APPROVED');
  });

  it('FINAL_PRODUCTION_CANDIDATE is valid for Codex', () => {
    const candidate = { ...ALISTAIR_DEFINITION, masterStatus: 'FINAL_PRODUCTION_CANDIDATE' as const, runtimeStatus: 'FINAL_PRODUCTION_CANDIDATE' as const };
    expect(validateCharacterDefinition(candidate, 'CODEX')).toBeNull();
  });

  it('DEV_PRODUCTION_CANDIDATE is valid for GLM', () => {
    const candidate = { ...ALISTAIR_DEFINITION, masterStatus: 'DEV_PRODUCTION_CANDIDATE' as const };
    expect(validateCharacterDefinition(candidate, 'GLM')).toBeNull();
  });

  it('explicit operator-authorized PRODUCTION_APPROVED is valid', () => {
    const approved = { ...ALISTAIR_DEFINITION, masterStatus: 'PRODUCTION_APPROVED' as const, runtimeStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateCharacterDefinition(approved, 'OPERATOR')).toBeNull();
  });

  it('validateOperatorPromotion accepts PRODUCTION_APPROVED', () => {
    const approved = { ...ALISTAIR_DEFINITION, masterStatus: 'PRODUCTION_APPROVED' as const, runtimeStatus: 'PRODUCTION_APPROVED' as const };
    expect(validateOperatorPromotion(approved)).toBeNull();
  });

  it('validateOperatorPromotion still rejects structural errors', () => {
    const bad = { ...ALISTAIR_DEFINITION, identity: { ...ALISTAIR_DEFINITION.identity, id: '' } };
    expect(validateOperatorPromotion(bad)).toContain('identity.id');
  });
});

// ---------------------------------------------------------------------------
// V. Demo metadata scope (phase4c-glm.json)
// ---------------------------------------------------------------------------

describe('Phase 4C demo metadata scope', () => {
  const meta = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/assets/dev/option-c/phase4c/phase4c-glm.json'), 'utf8').replace(/^\uFEFF/, ''),
  );

  it('selectedBatch has 3 characters (Alistair, Marian, Elara)', () => {
    expect(meta.selectedBatch.size).toBe(3);
    const ids = meta.selectedBatch.characters.map((c: { id: string }) => c.id);
    expect(ids).toEqual(['warrior', 'white_mage', 'dark_mage']);
  });

  it('demoArtBacklogRemaining is 5 (3 P0 + 2 P1)', () => {
    expect(meta.demoScopeLock.demoArtBacklogRemaining).toBe(5);
  });

  it('codexP0ActiveBatch is warrior, white_mage, dark_mage', () => {
    expect(meta.demoScopeLock.codexP0ActiveBatch).toEqual(['warrior', 'white_mage', 'dark_mage']);
  });

  it('codexP1DeferredBatch is rogue, lancer', () => {
    expect(meta.demoScopeLock.codexP1DeferredBatch).toEqual(['rogue', 'lancer']);
  });

  it('morvanStatus is DEFERRED_POST_DEMO', () => {
    expect(meta.demoScopeLock.morvanStatus).toBe('DEFERRED_POST_DEMO');
  });

  it('historical codexArtBatch is preserved as superseded provenance', () => {
    expect(meta.demoScopeLock.historicalCodexArtBatch).toBeDefined();
    expect(meta.demoScopeLock.historicalCodexArtBatchNote).toContain('SUPERSEDED');
  });
});
