import { skillById } from '../../game/skills';
import { getSkillPresentation } from '../skillPresentation';
import { resolvePresentationRoute, type ActionPresentationRoute, type ActionSpecForStage } from '../stage/combatStageProfiles';
import type { DevVfxReviewPlaybackOptions, DevVfxReviewSpriteSheetDefinition } from './VfxSystem';

/**
 * R2C-A is deliberately a source-review catalogue, never a production VFX
 * registry.  Its commercial images remain in the ignored held directory and
 * are only addressable while the local review workbench is enabled.
 */
export type HeldCandidateVerdict = 'LOCK' | 'REJECT' | 'NEEDS_ALT' | 'PRESENTATION_TUNE_ONLY';
export type HeldCandidateCategory = 'basic_attack' | 'hero_skill';

export interface MegaPackHeldReviewEntry {
  actionId: string;
  displayName: string;
  owner: string;
  category: HeldCandidateCategory;
  sourceId: string;
  sourceFilename: string;
  source: DevVfxReviewSpriteSheetDefinition;
  actionSpec: ActionSpecForStage;
  route: ActionPresentationRoute['route'];
  routeReason: ActionPresentationRoute['reason'];
  routeFamily: ActionPresentationRoute['family'];
  playback: DevVfxReviewPlaybackOptions;
  provisionalVerdict: HeldCandidateVerdict;
  rationale: string;
}

const HELD_ROOT = '/assets/vfx/megapack-runtime/r2c-a-held/';

type CandidateSource = {
  id: string;
  filename: string;
  sourceFilename: string;
  width: 2048 | 4096;
  height: 2048 | 4096;
  cols: 4 | 8;
  rows: 4 | 8;
  frameCount: 16 | 64;
};

const CANDIDATES = {
  r1_0004: { id: 'r1_0004', filename: 'r1_0004.png', sourceFilename: 'Arrow_Indicator_V4_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0005: { id: 'r1_0005', filename: 'r1_0005.png', sourceFilename: 'Arrow_Indicator_V5_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0300: { id: 'r1_0300', filename: 'r1_0300.png', sourceFilename: 'Circle Cut Out_V1_spritesheet.png', width: 2048, height: 2048, cols: 4, rows: 4, frameCount: 16 },
  r1_0453: { id: 'r1_0453', filename: 'r1_0453.png', sourceFilename: 'Flamethrower_002_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0483: { id: 'r1_0483', filename: 'r1_0483.png', sourceFilename: 'Healing_V5_A_Heal_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0494: { id: 'r1_0494', filename: 'r1_0494.png', sourceFilename: 'Healing_V7_A_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0677: { id: 'r1_0677', filename: 'r1_0677.png', sourceFilename: 'Positive_Buff_V3_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0679: { id: 'r1_0679', filename: 'r1_0679.png', sourceFilename: 'Positive_Buff_V5_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0707: { id: 'r1_0707', filename: 'r1_0707.png', sourceFilename: 'Power_Up_v10_A_Wind Rings_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0943: { id: 'r1_0943', filename: 'r1_0943.png', sourceFilename: 'Projectile_Fire_Ball_Lv4_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_0961: { id: 'r1_0961', filename: 'r1_0961.png', sourceFilename: 'Projectile_Wind_Ball_Lv1_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_1709: { id: 'r1_1709', filename: 'r1_1709.png', sourceFilename: 'Impact_Cut_V6_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_1718: { id: 'r1_1718', filename: 'r1_1718.png', sourceFilename: 'Stab_V3_spritesheet.png', width: 2048, height: 2048, cols: 4, rows: 4, frameCount: 16 },
  r1_1728: { id: 'r1_1728', filename: 'r1_1728.png', sourceFilename: 'Blood_Burst_v10_spritesheet.png', width: 4096, height: 4096, cols: 8, rows: 8, frameCount: 64 },
  r1_2599: { id: 'r1_2599', filename: 'r1_2599.png', sourceFilename: 'Jump_Wind_White_v1_spritesheet.png', width: 2048, height: 2048, cols: 4, rows: 4, frameCount: 16 },
  r1_2600: { id: 'r1_2600', filename: 'r1_2600.png', sourceFilename: 'Jump_Wind_White_v2_spritesheet.png', width: 2048, height: 2048, cols: 4, rows: 4, frameCount: 16 },
} as const satisfies Record<string, CandidateSource>;

function heldSource(candidateId: keyof typeof CANDIDATES, blending: 'normal' | 'additive' = 'additive'): DevVfxReviewSpriteSheetDefinition {
  const candidate = CANDIDATES[candidateId];
  return {
    id: `held_${candidate.id}`,
    url: `${HELD_ROOT}${candidate.filename}`,
    sheetWidthPx: candidate.width,
    sheetHeightPx: candidate.height,
    cols: candidate.cols,
    rows: candidate.rows,
    frameCount: candidate.frameCount,
    frameDurationMs: candidate.frameCount === 64 ? 28 : 54,
    align: 'center',
    blending,
  };
}

function skillSpec(actionId: string): ActionSpecForStage {
  const skill = skillById.get(actionId);
  if (!skill) throw new Error(`[MegaPackHeldReview] Missing declared skill ${actionId}.`);
  // The gameplay skill model represents AP restoration as a number while the
  // Stage resolver only needs a boolean support flag. Keep this dev review
  // bridge presentation-only by adapting that one shared field locally.
  const { apRestore: _apRestore, ...stageCompatibleSkill } = skill;
  return { ...stageCompatibleSkill, key: actionId };
}

function basicSpec(actionId: string, kind: 'melee' | 'projectile'): ActionSpecForStage {
  return {
    key: actionId,
    type: kind === 'projectile' ? 'ranged' : 'phys',
    offensive: true,
    range: kind === 'projectile' ? [2, 4] : [1, 1],
    targetMode: 'enemy',
    ap: 1,
  };
}

function reviewEntry(
  config: Omit<MegaPackHeldReviewEntry, 'route' | 'routeReason' | 'routeFamily'>,
): MegaPackHeldReviewEntry {
  const route = resolvePresentationRoute(config.actionSpec, getSkillPresentation(config.actionSpec));
  return { ...config, route: route.route, routeReason: route.reason, routeFamily: route.family };
}

const billboard = (scale: number, opacity = 0.98): DevVfxReviewPlaybackOptions => ({
  mode: 'billboard', anchor: 'target', scale, opacity, heightOffset: 0.2,
});
const projectile = (scale: number, opacity = 1): DevVfxReviewPlaybackOptions => ({
  mode: 'projectile', anchor: 'source', targetAnchor: 'target', scale, opacity, heightOffset: 0.45,
});

/**
 * The complete held set.  This function is intentionally the only place where
 * ignored commercial source URLs are constructed; its caller is gated to a
 * localhost-only `?r2ca=1` workbench.
 */
export function getMegaPackHeldReviewEntries(): readonly MegaPackHeldReviewEntry[] {
  return Object.freeze([
    reviewEntry({
      actionId: 'basic_greatsword_hit', displayName: 'Greatsword attack', owner: 'Basic attack', category: 'basic_attack',
      sourceId: 'r1_1709', sourceFilename: CANDIDATES.r1_1709.sourceFilename, source: heldSource('r1_1709'), actionSpec: basicSpec('basic_greatsword_hit', 'melee'), playback: billboard(2.15),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'Readable native cut; impact window and anchor need scene calibration before source lock.',
    }),
    reviewEntry({
      actionId: 'basic_crosier_hit', displayName: 'Attaque de crosse', owner: 'Attaque de base', category: 'basic_attack',
      sourceId: 'r1_0483', sourceFilename: CANDIDATES.r1_0483.sourceFilename, source: heldSource('r1_0483'), actionSpec: basicSpec('basic_crosier_hit', 'melee'), playback: billboard(1.9),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The heal is readable but does not carry the semantics of a crosier strike.',
    }),
    reviewEntry({
      actionId: 'basic_longbow_hit', displayName: 'Longbow shot', owner: 'Basic attack', category: 'basic_attack',
      sourceId: 'r1_0961', sourceFilename: CANDIDATES.r1_0961.sourceFilename, source: heldSource('r1_0961'), actionSpec: basicSpec('basic_longbow_hit', 'projectile'), playback: projectile(1.46),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The travel is clean, but the arrow and piercing identity remains insufficient.',
    }),
    reviewEntry({
      actionId: 'basic_hand_cannon_hit', displayName: 'Tir de canon portatif', owner: 'Attaque de base', category: 'basic_attack',
      sourceId: 'r1_0943', sourceFilename: CANDIDATES.r1_0943.sourceFilename, source: heldSource('r1_0943'), actionSpec: basicSpec('basic_hand_cannon_hit', 'projectile'), playback: projectile(1.72),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The fire projectile reads; recoil and impact must confirm a cannon identity rather than a spell.',
    }),
    reviewEntry({
      actionId: 'p_interpose', displayName: 'Interposition', owner: 'Paladin', category: 'hero_skill',
      sourceId: 'r1_2599', sourceFilename: CANDIDATES.r1_2599.sourceFilename, source: heldSource('r1_2599'), actionSpec: skillSpec('p_interpose'), playback: billboard(2.05),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The wind jump is a visual base but does not clearly communicate protection or interception.',
    }),
    reviewEntry({
      actionId: 'd_blood_pact', displayName: 'Blood pact', owner: 'Duelist', category: 'hero_skill',
      sourceId: 'r1_1728', sourceFilename: CANDIDATES.r1_1728.sourceFilename, source: heldSource('r1_1728', 'normal'), actionSpec: skillSpec('d_blood_pact'), playback: billboard(2.15, 0.96),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The blood burst is semantically accurate; a short residue duration remains to validate.',
    }),
    reviewEntry({
      actionId: 'l_griffon_jump', displayName: 'Griffon jump', owner: 'Lancer', category: 'hero_skill',
      sourceId: 'r1_2600', sourceFilename: CANDIDATES.r1_2600.sourceFilename, source: heldSource('r1_2600'), actionSpec: skillSpec('l_griffon_jump'), playback: billboard(2.18),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The jump reads well; contact point and height must be adjusted in scene.',
    }),
    reviewEntry({
      actionId: 'l_firmament_lance', displayName: 'Firmament lance', owner: 'Lancer', category: 'hero_skill',
      sourceId: 'r1_1718', sourceFilename: CANDIDATES.r1_1718.sourceFilename, source: heldSource('r1_1718'), actionSpec: skillSpec('l_firmament_lance'), playback: projectile(2.14),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The 4x4 stab is coherent for a lance; trajectory and cadence need tuning.',
    }),
    reviewEntry({
      actionId: 'n_flame_wave', displayName: 'Flame wave', owner: 'Necromancer', category: 'hero_skill',
      sourceId: 'r1_0453', sourceFilename: CANDIDATES.r1_0453.sourceFilename, source: heldSource('r1_0453'), actionSpec: skillSpec('n_flame_wave'), playback: projectile(2.35),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'r1_0453 is the dedicated Flame Wave source; r1_0450 remains reserved for Dragon Breath.',
    }),
    reviewEntry({
      actionId: 'w_sanctuary', displayName: 'Sanctuary', owner: 'Priestess', category: 'hero_skill',
      sourceId: 'r1_0677', sourceFilename: CANDIDATES.r1_0677.sourceFilename, source: heldSource('r1_0677'), actionSpec: skillSpec('w_sanctuary'), playback: billboard(2.3, 0.94),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The positive loop is suitable; ground centering and support linger need calibration.',
    }),
    reviewEntry({
      actionId: 'w_miracle', displayName: 'Miracle', owner: 'Priestess', category: 'hero_skill',
      sourceId: 'r1_0494', sourceFilename: CANDIDATES.r1_0494.sourceFilename, source: heldSource('r1_0494'), actionSpec: skillSpec('w_miracle'), playback: billboard(2.55, 1),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The high intensity heal supports an ultimate; lift and exit remain to confirm.',
    }),
    reviewEntry({
      actionId: 'e_absolute_harmony', displayName: 'Absolute harmony', owner: 'Scholar', category: 'hero_skill',
      sourceId: 'r1_0679', sourceFilename: CANDIDATES.r1_0679.sourceFilename, source: heldSource('r1_0679'), actionSpec: skillSpec('e_absolute_harmony'), playback: billboard(2.48, 0.96),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The buff is clean but lacks the singularity of a support ultimate.',
    }),
    reviewEntry({
      actionId: 'a_hawk_leap', displayName: 'Hawk leap', owner: 'Archer', category: 'hero_skill',
      sourceId: 'r1_0707', sourceFilename: CANDIDATES.r1_0707.sourceFilename, source: heldSource('r1_0707'), actionSpec: skillSpec('a_hawk_leap'), playback: billboard(2.05),
      provisionalVerdict: 'PRESENTATION_TUNE_ONLY', rationale: 'The wind rings reinforce a leap; the departure motion remains a presentation concern.',
    }),
    reviewEntry({
      actionId: 'a_arrow_rain', displayName: 'Arrow rain', owner: 'Archer', category: 'hero_skill',
      sourceId: 'r1_0004', sourceFilename: CANDIDATES.r1_0004.sourceFilename, source: heldSource('r1_0004'), actionSpec: skillSpec('a_arrow_rain'), playback: billboard(2.5),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The arrow indicator cannot express a multi-impact rain on its own.',
    }),
    reviewEntry({
      actionId: 'a_zenith_arrow', displayName: 'Zenith arrow', owner: 'Archer', category: 'hero_skill',
      sourceId: 'r1_0005', sourceFilename: CANDIDATES.r1_0005.sourceFilename, source: heldSource('r1_0005'), actionSpec: skillSpec('a_zenith_arrow'), playback: projectile(2.45),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The indicator is a useful start but does not carry ultimate-level power.',
    }),
    reviewEntry({
      actionId: 'ro_jaw_trap', displayName: 'Jaw trap', owner: 'Ranger', category: 'hero_skill',
      sourceId: 'r1_0300', sourceFilename: CANDIDATES.r1_0300.sourceFilename, source: heldSource('r1_0300', 'normal'), actionSpec: skillSpec('ro_jaw_trap'), playback: billboard(1.92, 0.96),
      provisionalVerdict: 'NEEDS_ALT', rationale: 'The circle is too generic to evoke a physical jaw trap.',
    }),
  ]);
}

export const MEGAPACK_HELD_REVIEW_ROOT = HELD_ROOT;
