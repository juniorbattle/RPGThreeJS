/**
 * Phase 4C-GLM — Production Manifest Resolver
 *
 * Semantic resolution so raw filesystem paths never scatter across components.
 * (Section 30)
 *
 *   resolveCharacterAsset({ characterId, surface, state })
 *   resolveEnvironmentAsset({ family, surface, variant })
 */

import type { OptionCSurface, OptionCAnimationState } from './OptionCCharacterSchema';
import type { OptionCCharacterDefinition } from './OptionCCharacterSchema';

// ---------------------------------------------------------------------------
// Environment family registry
// ---------------------------------------------------------------------------

export interface OptionCEnvironmentFamily {
  readonly familyId: string;
  readonly displayName: string;
  readonly surfaces: Readonly<Record<OptionCSurface, string>>;
  readonly artStatus: 'GOLD_REFERENCE' | 'SCALING_DRAFT' | 'ART_PENDING_CODEX';
}

export const FOREST_ROAD_FAMILY: OptionCEnvironmentFamily = Object.freeze({
  familyId: 'forest-road',
  displayName: 'Forest Road',
  surfaces: Object.freeze({
    travel: '/assets/dev/option-c/phase4b/environment/forest-road-travel.png',
    tableau: '/assets/dev/option-c/phase4b/environment/forest-road-tableau.png',
    strategic: '/assets/dev/option-c/phase4b/environment/forest-road-strategic.png',
    'combat-stage': '/assets/dev/option-c/phase4b/environment/forest-road-combat-stage.png',
  }),
  artStatus: 'GOLD_REFERENCE',
});

const ENVIRONMENT_FAMILIES = new Map<string, OptionCEnvironmentFamily>([
  ['forest-road', FOREST_ROAD_FAMILY],
]);

// ---------------------------------------------------------------------------
// Character definition registry (populated by OptionCCharacterDefinitions)
// ---------------------------------------------------------------------------

const CHARACTER_DEFINITIONS = new Map<string, OptionCCharacterDefinition>();

export function registerCharacterDefinition(def: OptionCCharacterDefinition): void {
  CHARACTER_DEFINITIONS.set(def.identity.id, def);
}

export function getCharacterDefinition(characterId: string): OptionCCharacterDefinition | undefined {
  return CHARACTER_DEFINITIONS.get(characterId);
}

export function getRegisteredCharacterIds(): readonly string[] {
  return Array.from(CHARACTER_DEFINITIONS.keys());
}

// ---------------------------------------------------------------------------
// Semantic resolvers (Section 30)
// ---------------------------------------------------------------------------

export interface ResolveCharacterAssetQuery {
  characterId: string;
  surface: OptionCSurface;
  state?: OptionCAnimationState;
  frameIndex?: number;
}

export interface ResolveEnvironmentAssetQuery {
  family: string;
  surface: OptionCSurface;
  variant?: string;
}

export interface ResolvedAsset {
  readonly url: string;
  readonly semanticKey: string;
  readonly characterId?: string;
  readonly surface: OptionCSurface;
  readonly state?: OptionCAnimationState;
  readonly frameIndex?: number;
  readonly exists: boolean;
}

/**
 * Resolve a character asset by semantic key.
 *
 * Fail-closed: if the character is registered but the specific surface/state
 * is missing, this throws with the exact semantic key.  It never silently
 * returns a different character's asset.  (Section 31)
 */
export function resolveCharacterAsset(query: ResolveCharacterAssetQuery): ResolvedAsset {
  const def = CHARACTER_DEFINITIONS.get(query.characterId);
  if (!def) {
    throw new Error(
      `resolveCharacterAsset: unknown characterId '${query.characterId}' ` +
      `(semantic key: character=${query.characterId}, surface=${query.surface}, state=${query.state ?? 'none'})`,
    );
  }

  // Surface-level asset (tableau/strategic/combat-stage portrait)
  if (query.state === undefined) {
    const surfaceMap: Record<OptionCSurface, string> = {
      travel: def.surfaceAssets.tableau, // travel uses tableau representation
      tableau: def.surfaceAssets.tableau,
      strategic: def.surfaceAssets.strategic,
      'combat-stage': def.surfaceAssets.combatStage,
    };
    const url = surfaceMap[query.surface];
    if (!url) {
      throw new Error(
        `resolveCharacterAsset: no surface asset for character='${query.characterId}' surface='${query.surface}' ` +
        `(semantic key: character=${query.characterId}, surface=${query.surface})`,
      );
    }
    return {
      url,
      semanticKey: `character:${query.characterId}:surface:${query.surface}`,
      characterId: query.characterId,
      surface: query.surface,
      exists: true,
    };
  }

  // Animation frame asset
  const anim = def.animations.find((a) => a.state === query.state);
  if (!anim) {
    throw new Error(
      `resolveCharacterAsset: no animation state '${query.state}' for character='${query.characterId}' ` +
      `(semantic key: character=${query.characterId}, surface=${query.surface}, state=${query.state})`,
    );
  }
  const frameIndex = query.frameIndex ?? 0;
  if (frameIndex < 0 || frameIndex >= anim.frames.length) {
    throw new Error(
      `resolveCharacterAsset: frame index ${frameIndex} out of range for ` +
      `character='${query.characterId}' state='${query.state}' (0..${anim.frames.length - 1})`,
    );
  }
  const url = anim.frames[frameIndex]!;
  return {
    url,
    semanticKey: `character:${query.characterId}:surface:${query.surface}:state:${query.state}:frame:${frameIndex}`,
    characterId: query.characterId,
    surface: query.surface,
    state: query.state,
    frameIndex,
    exists: true,
  };
}

/**
 * Resolve an environment asset by family + surface.
 */
export function resolveEnvironmentAsset(query: ResolveEnvironmentAssetQuery): ResolvedAsset {
  const family = ENVIRONMENT_FAMILIES.get(query.family);
  if (!family) {
    throw new Error(
      `resolveEnvironmentAsset: unknown environment family '${query.family}' ` +
      `(semantic key: env=${query.family}, surface=${query.surface})`,
    );
  }
  const url = family.surfaces[query.surface];
  if (!url) {
    throw new Error(
      `resolveEnvironmentAsset: no surface '${query.surface}' for family='${query.family}' ` +
      `(semantic key: env=${query.family}, surface=${query.surface})`,
    );
  }
  return {
    url,
    semanticKey: `env:${query.family}:surface:${query.surface}`,
    surface: query.surface,
    exists: true,
  };
}

/**
 * Resolve all animation frame URLs for a character+state (for preloading).
 */
export function resolveCharacterAnimationFrames(
  characterId: string,
  state: OptionCAnimationState,
): readonly string[] {
  const def = CHARACTER_DEFINITIONS.get(characterId);
  if (!def) {
    throw new Error(`resolveCharacterAnimationFrames: unknown characterId '${characterId}'`);
  }
  const anim = def.animations.find((a) => a.state === state);
  if (!anim) {
    throw new Error(
      `resolveCharacterAnimationFrames: no animation state '${state}' for character='${characterId}'`,
    );
  }
  return anim.frames;
}

/**
 * Resolve all frame URLs needed for a character on a given surface.
 * For tableau: just the idle animation (static representation).
 * For strategic: idle + dash (movement).
 * For combat-stage: idle + attack + skill (action states).
 */
export function resolveCharacterSurfaceFrames(
  characterId: string,
  surface: OptionCSurface,
): readonly string[] {
  const def = CHARACTER_DEFINITIONS.get(characterId);
  if (!def) {
    throw new Error(`resolveCharacterSurfaceFrames: unknown characterId '${characterId}'`);
  }
  const statesForSurface: OptionCAnimationState[] = surface === 'tableau'
    ? ['idle']
    : surface === 'strategic'
      ? ['idle', 'dash']
      : surface === 'combat-stage'
        ? ['idle', 'attack', 'skill']
        : ['idle'];
  const urls: string[] = [];
  for (const state of statesForSurface) {
    const anim = def.animations.find((a) => a.state === state);
    if (anim) urls.push(...anim.frames);
  }
  return urls;
}
