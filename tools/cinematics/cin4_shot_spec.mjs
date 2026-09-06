import { access } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

export const CANONICAL_FACING = 'SCREEN_RIGHT';
export const FACINGS = Object.freeze(['SCREEN_LEFT', 'SCREEN_RIGHT']);
export const ROLES = Object.freeze(['PRIMARY', 'SECONDARY', 'BACKGROUND']);
export const MIRROR_POLICIES = Object.freeze(['ALLOW', 'WARN', 'FORBID']);
export const TIERS = Object.freeze(['MICRO', 'JOURNEY', 'HERO']);
export const SOURCE_TYPES = Object.freeze(['ROOT_SOURCE', 'CHAIN_SOURCE', 'CUT_SOURCE']);
export const CONTINUITY_OUT = Object.freeze(['DELIBERATE_CUT', 'LAST_FRAME', 'END']);
export const CAMERA_MODES = Object.freeze([
  'STATIC',
  'SLOW_PUSH',
  'SLOW_PULL',
  'PAN_SMALL_LEFT',
  'PAN_SMALL_RIGHT',
  'TRACK_SMALL_LEFT',
  'TRACK_SMALL_RIGHT',
  'SUBJECT_FOCUS_LEFT',
  'SUBJECT_FOCUS_RIGHT',
  'WIDE_HOLD',
  'CLOSE_FOCUS',
]);
export const ACTION_RISK = Object.freeze({
  STAND: 'SAFE',
  IDLE_BREATH: 'SAFE',
  OBSERVE: 'SAFE',
  LOOK: 'SAFE',
  SMALL_HEAD_TURN: 'SAFE',
  SHIFT_STANCE: 'SAFE',
  REACT_SMALL: 'SAFE',
  STEP_FORWARD: 'MODERATE',
  WALK_SLOW: 'MODERATE',
  STOP: 'MODERATE',
  RAISE_HAND: 'MODERATE',
  LOWER_HAND: 'MODERATE',
  READY_STANCE: 'MODERATE',
  LOWER_WEAPON: 'MODERATE',
  RAISE_WEAPON_PARTIAL: 'MODERATE',
  ENTER_FRAME: 'MODERATE',
  EXIT_FRAME: 'MODERATE',
});
export const PROP_KINDS = Object.freeze(['SEALED_ARTEFACT']);

const CHARACTER_ROOT = 'public/assets/characters/pixel/full/';
const LOOK_TARGETS = new Set(['NONE', 'CAMERA', 'PLAYER_PARTY', 'OFFSCREEN_LEFT', 'OFFSCREEN_RIGHT']);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertWithin(base, target, label, errors) {
  const rel = relative(base, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return;
  errors.push(`${label} must remain inside ${base}.`);
}

function validateLookTarget(value, characterIds, ownerId) {
  if (LOOK_TARGETS.has(value)) return null;
  const characterMatch = /^CHARACTER:([a-z0-9_-]+)$/u.exec(value);
  if (characterMatch) {
    if (characterMatch[1] === ownerId) return 'cannot target the same character';
    return characterIds.has(characterMatch[1]) ? null : `references missing character '${characterMatch[1]}'`;
  }
  if (/^(?:ENVIRONMENT|EVENT_FOCUS):[A-Za-z0-9_-]+$/u.test(value)) return null;
  return 'must use an approved lookTarget value';
}

export function sourcePathForShot(spec, shot) {
  if (shot.source.type === 'CHAIN_SOURCE') return shot.source.path;
  return shot.source.output;
}

export async function validateShotSpec(input, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isRecord(input)) return { valid: false, errors: ['Shot spec must be an object.'], warnings };
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!/^[a-z0-9_-]+$/u.test(input.sequenceId ?? '')) errors.push('sequenceId must be a lowercase stable ID.');
  if (!/^[a-z0-9_-]+$/u.test(input.cinematicId ?? '')) errors.push('cinematicId must be a lowercase stable ID.');
  if (!TIERS.includes(input.tier)) errors.push(`tier must be one of ${TIERS.join(', ')}.`);
  if ((input.canonicalFacing ?? CANONICAL_FACING) !== CANONICAL_FACING) errors.push(`canonicalFacing must be ${CANONICAL_FACING}.`);
  if (!['768P', '2K'].includes(input.resolution)) errors.push('resolution must be 768P or 2K.');
  if (!isRecord(input.frame) || input.frame.width !== 1920 || input.frame.height !== 1080) errors.push('frame must be 1920x1080.');
  if (!Array.isArray(input.shots) || input.shots.length === 0) errors.push('shots must be a non-empty array.');
  if (errors.length && !Array.isArray(input.shots)) return { valid: false, errors, warnings };

  const shotIds = new Set();
  const sequenceRoot = options.projectRoot && input.sequenceId
    ? resolve(options.projectRoot, 'tmp', 'cinematics', 'cin4', input.sequenceId)
    : null;
  for (const [shotIndex, shot] of (input.shots ?? []).entries()) {
    const prefix = `shots[${shotIndex}]`;
    if (!isRecord(shot)) {
      errors.push(`${prefix} must be an object.`);
      continue;
    }
    if (!/^[a-z0-9_-]+$/u.test(shot.shotId ?? '')) errors.push(`${prefix}.shotId is invalid.`);
    else if (shotIds.has(shot.shotId)) errors.push(`${prefix}.shotId '${shot.shotId}' is duplicated.`);
    else shotIds.add(shot.shotId);
    if (!isRecord(shot.source) || !SOURCE_TYPES.includes(shot.source?.type)) {
      errors.push(`${prefix}.source.type must be one of ${SOURCE_TYPES.join(', ')}.`);
    } else if (shot.source.type === 'CHAIN_SOURCE') {
      if (!shot.source.fromShotId || !shotIds.has(shot.source.fromShotId)) errors.push(`${prefix} CHAIN_SOURCE requires an earlier fromShotId.`);
      if (typeof shot.source.path !== 'string' || !shot.source.path) errors.push(`${prefix} CHAIN_SOURCE requires source.path.`);
      const previous = input.shots[shotIndex - 1];
      if (previous?.shotId !== shot.source.fromShotId || previous?.continuityOut !== 'LAST_FRAME') {
        errors.push(`${prefix} CHAIN_SOURCE must depend on the immediately preceding LAST_FRAME shot.`);
      }
    } else if (typeof shot.source.output !== 'string' || !shot.source.output) {
      errors.push(`${prefix} ${shot.source.type} requires source.output.`);
    }
    if (!CONTINUITY_OUT.includes(shot.continuityOut)) errors.push(`${prefix}.continuityOut is invalid.`);
    if (shotIndex === input.shots.length - 1 && shot.continuityOut !== 'END') errors.push(`${prefix} final shot continuityOut must be END.`);
    if (!CAMERA_MODES.includes(shot.camera?.mode)) errors.push(`${prefix}.camera.mode is invalid.`);
    if (!Number.isInteger(shot.durationSeconds) || shot.durationSeconds < 4 || shot.durationSeconds > 15) errors.push(`${prefix}.durationSeconds must be an integer from 4 to 15.`);
    if (typeof shot.environment !== 'string' || !shot.environment) errors.push(`${prefix}.environment is required.`);
    if (!Array.isArray(shot.characters) || shot.characters.length === 0) {
      errors.push(`${prefix}.characters must be non-empty.`);
      continue;
    }
    if (shot.props !== undefined && !Array.isArray(shot.props)) errors.push(`${prefix}.props must be an array when present.`);
    const propIds = new Set();
    for (const prop of (Array.isArray(shot.props) ? shot.props : [])) {
      const label = `${prefix}.${prop?.id ?? 'prop'}`;
      if (!/^[a-z0-9_-]+$/u.test(prop?.id ?? '')) errors.push(`${label}.id is invalid.`);
      else if (propIds.has(prop.id)) errors.push(`${prefix} duplicates prop '${prop.id}'.`);
      else propIds.add(prop.id);
      if (!PROP_KINDS.includes(prop?.kind)) errors.push(`${label}.kind is invalid.`);
      if (!Number.isFinite(prop?.position?.x) || prop.position.x < 0 || prop.position.x > 1) errors.push(`${label}.position.x must be normalized from 0 to 1.`);
      if (!Number.isFinite(prop?.position?.groundY) || prop.position.groundY < 0 || prop.position.groundY > 1) errors.push(`${label}.position.groundY must be normalized from 0 to 1.`);
      if (!Number.isInteger(prop?.sizePx) || prop.sizePx < 24 || prop.sizePx > 256) errors.push(`${label}.sizePx must be an integer from 24 to 256.`);
    }
    const characterIds = new Set();
    for (const character of shot.characters) {
      if (!/^[a-z0-9_-]+$/u.test(character?.id ?? '')) errors.push(`${prefix} contains an invalid character id.`);
      else if (characterIds.has(character.id)) errors.push(`${prefix} duplicates character '${character.id}'.`);
      else characterIds.add(character.id);
    }
    const depths = new Set();
    for (const character of shot.characters) {
      const label = `${prefix}.${character?.id ?? 'character'}`;
      if (typeof character?.asset !== 'string' || !character.asset.startsWith(CHARACTER_ROOT)) errors.push(`${label}.asset must be under ${CHARACTER_ROOT}.`);
      if (!FACINGS.includes(character?.facing)) errors.push(`${label}.facing is invalid.`);
      if (!ROLES.includes(character?.role)) errors.push(`${label}.role is invalid.`);
      if (!MIRROR_POLICIES.includes(character?.mirrorPolicy)) errors.push(`${label}.mirrorPolicy is invalid.`);
      if (!(character?.action in ACTION_RISK)) errors.push(`${label}.action is invalid.`);
      if (!Number.isFinite(character?.position?.x) || character.position.x < 0 || character.position.x > 1) errors.push(`${label}.position.x must be normalized from 0 to 1.`);
      if (!Number.isFinite(character?.position?.groundY) || character.position.groundY < 0 || character.position.groundY > 1) errors.push(`${label}.position.groundY must be normalized from 0 to 1.`);
      if (!Number.isInteger(character?.heightPx) || character.heightPx < 64 || character.heightPx > 1400) errors.push(`${label}.heightPx must be an integer from 64 to 1400.`);
      if (!Number.isInteger(character?.depth)) errors.push(`${label}.depth must be an integer.`);
      else if (depths.has(character.depth)) warnings.push(`${prefix} reuses depth ${character.depth}; ordering falls back to character ID.`);
      else depths.add(character.depth);
      if (typeof character?.lookTarget !== 'string') errors.push(`${label}.lookTarget is required.`);
      else {
        const lookError = validateLookTarget(character.lookTarget, characterIds, character.id);
        if (lookError) errors.push(`${label}.lookTarget ${lookError}.`);
      }
      if (character?.facing !== CANONICAL_FACING && character?.mirrorPolicy === 'FORBID') errors.push(`${label} forbids the mirror required for ${character.facing}.`);
      if (character?.facing !== CANONICAL_FACING && character?.mirrorPolicy === 'WARN') warnings.push(`${label} mirrors an asymmetric canonical asset.`);
      if (character?.position?.x < 0.08 || character?.position?.x > 0.92) warnings.push(`${label} is close to the horizontal frame edge.`);
    }
    if (shot.characters.length === 2 && shot.characters[0]?.facing === shot.characters[1]?.facing) warnings.push(`${prefix} stages two characters facing the same screen direction.`);

    if (options.projectRoot) {
      if (shot.environment) {
        const environmentPath = resolve(options.projectRoot, shot.environment);
        assertWithin(options.projectRoot, environmentPath, `${prefix}.environment`, errors);
        try { await access(environmentPath); } catch { errors.push(`${prefix}.environment does not exist.`); }
      }
      for (const character of shot.characters) {
        if (!character?.asset) continue;
        const assetPath = resolve(options.projectRoot, character.asset);
        assertWithin(resolve(options.projectRoot, CHARACTER_ROOT), assetPath, `${prefix}.${character.id}.asset`, errors);
        try { await access(assetPath); } catch { errors.push(`${prefix}.${character.id}.asset does not exist.`); }
      }
      const sourcePath = sourcePathForShot(input, shot);
      if (sourcePath && sequenceRoot) {
        const resolvedSource = resolve(options.projectRoot, sourcePath);
        assertWithin(sequenceRoot, resolvedSource, `${prefix}.source path`, errors);
        if (options.requireSources) {
          try { await access(resolvedSource); } catch { errors.push(`${prefix}.source file does not exist.`); }
        }
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function buildShotPrompt(spec, shot) {
  const characters = [...shot.characters]
    .sort((left, right) => right.depth - left.depth || left.id.localeCompare(right.id))
    .map((character) => `${character.id} is ${character.role}, already facing ${character.facing}, attending to ${character.lookTarget}, with action ${character.action} (${ACTION_RISK[character.action]} risk)`)
    .join('; ');
  const props = (shot.props ?? []).map((prop) => `${prop.id} is an authored ${prop.kind} fixed at (${prop.position.x}, ${prop.position.groundY})`).join('; ');
  return [
    spec.artDirection,
    `Shot ${shot.shotId}: ${shot.purpose}`,
    `Framing: ${shot.framing}. Camera intent: ${shot.camera.mode} with conservative amplitude.`,
    `Staging: ${characters}.`,
    ...(props ? [`Deterministic props already present in the source: ${props}. Preserve their identity, position, and ownership ambiguity.`] : []),
    `Action intent: ${shot.promptIntent}`,
    'The supplied first frame is authoritative. Preserve exactly every character identity, face or head, hair or helmet, armor, clothing, cape or tabard, weapon, body proportions, color palette, facing direction, spatial relationship, and environment identity. Animate the existing composition; do not redesign it.',
    'Preserve the exact facing direction already shown in the first frame. Do not turn either character around, reverse screen direction, rotate a body 180 degrees, cross the established axis, or swap character sides.',
    `End-state intent: ${shot.endIntent}. Finish stable, sharp, nonblank, nonverdict, and suitable for ${shot.continuityOut === 'LAST_FRAME' ? 'last-frame chaining' : 'an editorial cut or deterministic dialogue handoff'}.`,
    'No speech, lip sync, subtitles, text, UI, watermark, photorealism, live action, realistic 3D conversion, extra characters, duplicated limbs, duplicated weapons, anatomy melting, combat, attack, projectile, explosion, camera orbit, whip pan, large rotation, aggressive zoom, heavy blur, black ending, white ending, or style drift.',
  ].join(' ');
}
