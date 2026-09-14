import type { BackgroundSceneConfig } from '../../render/BackgroundLayerSystem';
import type { SpriteFrameAnimationDefinition } from '../../render/SpriteFrameAnimation';

export type OptionCAnimationState = 'idle' | 'dash' | 'attack' | 'skill';
export type OptionCProofSurface = 'travel' | 'tableau' | 'strategic' | 'combat-stage';
export type OptionCTableauState = 'active' | 'listening' | 'mirrored' | 'center' | 'right';

const ROOT = '/assets/dev/option-c/phase4b';

function frames(state: OptionCAnimationState): readonly string[] {
  return Array.from(
    { length: 8 },
    (_, index) => `${ROOT}/kestrel/${state}/frame-${String(index + 1).padStart(2, '0')}.png`,
  );
}

export const OPTION_C_PHASE4B_ASSETS = Object.freeze({
  root: ROOT,
  environments: Object.freeze({
    travel: `${ROOT}/environment/forest-road-travel.png`,
    tableau: `${ROOT}/environment/forest-road-tableau.png`,
    strategic: `${ROOT}/environment/forest-road-strategic.png`,
    combatStage: `${ROOT}/environment/forest-road-combat-stage.png`,
  }),
  animations: Object.freeze({
    idle: frames('idle'),
    dash: frames('dash'),
    attack: frames('attack'),
    skill: frames('skill'),
  }),
});

export const OPTION_C_ANIMATION_DEFINITIONS: readonly SpriteFrameAnimationDefinition<OptionCAnimationState>[] = Object.freeze([
  { state: 'idle', frames: OPTION_C_PHASE4B_ASSETS.animations.idle, frameDurationMs: 190, loop: true },
  { state: 'dash', frames: OPTION_C_PHASE4B_ASSETS.animations.dash, frameDurationMs: 82, loop: false, returnState: 'idle' },
  { state: 'attack', frames: OPTION_C_PHASE4B_ASSETS.animations.attack, frameDurationMs: 105, loop: false, returnState: 'idle' },
  { state: 'skill', frames: OPTION_C_PHASE4B_ASSETS.animations.skill, frameDurationMs: 125, loop: false, returnState: 'idle' },
]);

export const OPTION_C_REQUIRED_IMAGE_URLS = Object.freeze([
  ...Object.values(OPTION_C_PHASE4B_ASSETS.environments),
  ...Object.values(OPTION_C_PHASE4B_ASSETS.animations).flat(),
]);

function paintedBackground(
  id: string,
  texture: string,
  position: [number, number, number],
  size: [number, number],
): BackgroundSceneConfig {
  return {
    id,
    enabled: true,
    layers: [{
      id: `${id}-backdrop`,
      texture,
      position,
      size,
      parallax: 0,
      opacity: 1,
      fallback: ['#1d2b24', '#07100d'],
    }],
  };
}

export const OPTION_C_STRATEGIC_BACKGROUND = paintedBackground(
  'option-c-phase4b-forest-road-strategic',
  OPTION_C_PHASE4B_ASSETS.environments.strategic,
  [0, -0.28, -30],
  [36, 20.25],
);

export const OPTION_C_COMBAT_STAGE_BACKGROUND = paintedBackground(
  'option-c-phase4b-forest-road-combat-stage',
  OPTION_C_PHASE4B_ASSETS.environments.combatStage,
  [0, 0.35, -8],
  [17.8, 10],
);

export function isOptionCAnimationState(value: string | null): value is OptionCAnimationState {
  return value === 'idle' || value === 'dash' || value === 'attack' || value === 'skill';
}

export function isOptionCProofSurface(value: string | null): value is OptionCProofSurface {
  return value === 'travel' || value === 'tableau' || value === 'strategic' || value === 'combat-stage';
}

export function isOptionCTableauState(value: string | null): value is OptionCTableauState {
  return value === 'active'
    || value === 'listening'
    || value === 'mirrored'
    || value === 'center'
    || value === 'right';
}
