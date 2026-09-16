import { assets } from '../../render/assetManifest';
import type {
  BackgroundSceneConfig,
  CombatStageGroundingConfig,
} from '../../render/BackgroundLayerSystem';

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
  positionY: number,
  size: [number, number],
  grounding: CombatStageGroundingConfig,
): BackgroundSceneConfig {
  return {
    id: `${id}-stage-painted`,
    enabled: true,
    combatStageGrounding: grounding,
    layers: [
      {
        id: `${id}-stage-painted-backdrop`,
        texture,
        position: [0, positionY, -8],
        size,
        parallax: 0,
        opacity: 1,
        fallback,
        failOnError: true,
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
      0.18,
      [13.17, 7.4],
      { contactShadowOpacity: 0.76, contactShadowScale: 1.2, contactShadowPitch: -1.2 },
    ),
  },
  bois_clair_burning: {
    tacticalBackground: 'bois_clair_burning',
    stageBackground: paintedStageBackground(
      'bois-clair-burning',
      assets.combatStageScenes.bois_clair_burning,
      ['#4a2219', '#160b09'],
      -0.04,
      [13.17, 7.4],
      { contactShadowOpacity: 0.82, contactShadowScale: 1.2, contactShadowPitch: -1.2 },
    ),
  },
  lion_sanctum: {
    tacticalBackground: 'lion_sanctum',
    stageBackground: paintedStageBackground(
      'lion-sanctum',
      assets.combatStageScenes.lion_sanctum,
      ['#2f3228', '#0b100d'],
      0.6,
      [13.17, 7.4],
      { contactShadowOpacity: 0.76, contactShadowScale: 1.28, contactShadowPitch: -1.2 },
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
