import { assets } from '../../render/assetManifest';
import type { BackgroundSceneConfig } from '../../render/BackgroundLayerSystem';

/** Paired tactical and frontal painted backgrounds for one environment. */
export interface CombatStageEnvironmentBackgrounds {
  /** Key into combatBackgroundFor; informational pairing only, not consumed here. */
  tacticalBackground: string;
  stageBackground: BackgroundSceneConfig;
}

/**
 * A painted stage background is camera-local and non-interactive. It is used
 * only by the CombatStage cinematic and remains distinct from tactical art.
 */
function paintedStageBackground(
  id: string,
  texture: string,
  fallback: [string, string],
): BackgroundSceneConfig {
  return {
    id: `${id}-stage-painted`,
    enabled: true,
    layers: [
      {
        id: `${id}-stage-painted-backdrop`,
        texture,
        position: [0, 0.35, -8],
        size: [17.8, 10],
        parallax: 0,
        opacity: 1,
        fallback,
      },
    ],
  };
}

const DEFAULT_ENVIRONMENT_ID = 'forest_route';

const STAGE_ENVIRONMENTS: Readonly<Record<string, CombatStageEnvironmentBackgrounds>> = Object.freeze({
  forest_route: {
    tacticalBackground: 'forest_route',
    stageBackground: paintedStageBackground(
      'forest-route',
      assets.combatStageScenes.forest_route,
      ['#2c3c33', '#0d1712'],
    ),
  },
  bois_clair_burning: {
    tacticalBackground: 'bois_clair_burning',
    stageBackground: paintedStageBackground(
      'bois-clair-burning',
      assets.combatStageScenes.bois_clair_burning,
      ['#4a2219', '#160b09'],
    ),
  },
  lion_sanctum: {
    tacticalBackground: 'lion_sanctum',
    stageBackground: paintedStageBackground(
      'lion-sanctum',
      assets.combatStageScenes.lion_sanctum,
      ['#2f3228', '#0b100d'],
    ),
  },
});

/** Resolves the frontal painted Stage background for a tactical environment/scene id. */
export function combatStageBackgroundFor(environmentId?: string): BackgroundSceneConfig {
  const entry =
    (environmentId && STAGE_ENVIRONMENTS[environmentId]) || STAGE_ENVIRONMENTS[DEFAULT_ENVIRONMENT_ID]!;
  return entry.stageBackground;
}

export function combatStageEnvironmentIds(): readonly string[] {
  return Object.keys(STAGE_ENVIRONMENTS);
}
