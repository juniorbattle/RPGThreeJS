import type { BackgroundSceneConfig } from '../../render/BackgroundLayerSystem';

/**
 * R0A placeholder Stage backdrops.
 *
 * Intentionally NOT final painted art — a solid/gradient fallback only
 * (see BackgroundLayerSystem's fallbackTexture, used when `texture` is
 * omitted). This proves camera framing / horizon / ground line and keeps
 * the config shape ready for a future paired painted background:
 *
 *   environmentId -> tacticalBackground (existing combatBackgroundFor)
 *                 -> stageBackground   (this module)
 *
 * Codex will later add a `texture` per layer here once final frontal art
 * exists. Do not add texture URLs in R0A.
 */
export interface CombatStageEnvironmentBackgrounds {
  /** Key into combatBackgroundFor — informational pairing only, not consumed here. */
  tacticalBackground: string;
  stageBackground: BackgroundSceneConfig;
}

function placeholderStageBackground(id: string, fallback: [string, string]): BackgroundSceneConfig {
  return {
    id: `${id}-stage-placeholder`,
    enabled: true,
    layers: [
      {
        id: `${id}-stage-placeholder-backdrop`,
        position: [0, 0.35, -8],
        size: [17, 9.5],
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
    stageBackground: placeholderStageBackground('forest-route', ['#2c3c33', '#0d1712']),
  },
  bois_clair_burning: {
    tacticalBackground: 'bois_clair_burning',
    stageBackground: placeholderStageBackground('bois-clair-burning', ['#4a2219', '#160b09']),
  },
  lion_sanctum: {
    tacticalBackground: 'lion_sanctum',
    stageBackground: placeholderStageBackground('lion-sanctum', ['#2c263b', '#0b0b16']),
  },
});

/** Resolves the placeholder Stage background for a tactical environment/scene id. */
export function combatStageBackgroundFor(environmentId?: string): BackgroundSceneConfig {
  const entry =
    (environmentId && STAGE_ENVIRONMENTS[environmentId]) || STAGE_ENVIRONMENTS[DEFAULT_ENVIRONMENT_ID]!;
  return entry.stageBackground;
}

export function combatStageEnvironmentIds(): readonly string[] {
  return Object.keys(STAGE_ENVIRONMENTS);
}
