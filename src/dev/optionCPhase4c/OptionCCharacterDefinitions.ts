/**
 * Phase 4C-GLM — Character Definitions
 *
 * Contains:
 *   1. Kestrel (GOLD_REFERENCE) — mirrors Phase 4B exactly
 *   2. Alistair (FINAL_PRODUCTION_CANDIDATE key-pose authority) — greatsword knight
 *   3. Marian (SCALING_DRAFT) — crosier cleric
 *   4. Elara (SCALING_DRAFT) — grimoire dark mage
 *   5. Morvan (SCALING_DRAFT, DEFERRED_POST_DEMO) — scythe dark knight
 *
 * SELECTED_BATCH (CODEX_P0_ACTIVE_BATCH) = Alistair, Marian, Elara.
 * Morvan's structural definition is preserved for future use but is NOT in
 * the active batch (DEFERRED_POST_DEMO).
 *
 * Unproduced characters use canonical pixel art as SCALING_DRAFT placeholders.
 * Alistair has a DEV-only Sunburst/max master and four static key-pose authorities;
 * these are not full animation sheets.
 * The runtime may use a documented temporary canonical/draft representation.
 */

import type {
  OptionCCharacterDefinition,
  OptionCAnimationMetadata,
  OptionCCodexHandoffSlot,
} from './OptionCCharacterSchema';
import { registerCharacterDefinition } from './OptionCManifestResolver';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const PHASE4B_ROOT = '/assets/dev/option-c/phase4b';
const ALISTAIR_CANDIDATE_ROOT = '/assets/dev/option-c/phase4c/alistair/normalized';
const CANONICAL_ROOT = '/assets/characters/pixel/full';

function kestrelFrames(state: 'idle' | 'dash' | 'attack' | 'skill'): readonly string[] {
  return Array.from(
    { length: 8 },
    (_, i) => `${PHASE4B_ROOT}/kestrel/${state}/frame-${String(i + 1).padStart(2, '0')}.png`,
  );
}

/**
 * Draft characters have no real Option C animation sheets.
 * We create a single-frame "idle" placeholder using the canonical portrait
 * so the runtime pipeline can be stress-tested structurally.
 * This is explicitly marked ART_PENDING_CODEX.
 */
function draftIdleFrames(characterId: string): readonly string[] {
  return [`${CANONICAL_ROOT}/${characterId}.png`];
}

function alistairKeyPose(state: 'idle' | 'dash' | 'attack' | 'skill'): readonly string[] {
  return [`${ALISTAIR_CANDIDATE_ROOT}/alistair-${state}.png`];
}

// ---------------------------------------------------------------------------
// 1. Kestrel — GOLD_REFERENCE (mirrors Phase 4B exactly)
// ---------------------------------------------------------------------------

const kestrelIdleMeta: OptionCAnimationMetadata = {
  state: 'idle',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 8,
  frameDurationMs: 190,
  loop: true,
  oneShot: false,
  footBaseline: 466,
  pivotX: 256,
  pivotY: 466,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'withSurface',
  frames: kestrelFrames('idle'),
};

const kestrelDashMeta: OptionCAnimationMetadata = {
  state: 'dash',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 8,
  frameDurationMs: 82,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 466,
  pivotX: 256,
  pivotY: 466,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: kestrelFrames('dash'),
};

const kestrelAttackMeta: OptionCAnimationMetadata = {
  state: 'attack',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 8,
  frameDurationMs: 105,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 466,
  pivotX: 256,
  pivotY: 466,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: kestrelFrames('attack'),
};

const kestrelSkillMeta: OptionCAnimationMetadata = {
  state: 'skill',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 8,
  frameDurationMs: 125,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 466,
  pivotX: 256,
  pivotY: 466,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: kestrelFrames('skill'),
};

const kestrelCodexSlots: readonly OptionCCodexHandoffSlot[] = [
  { slotName: 'characterMaster', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static master', canonicalReference: '/assets/characters/pixel/masters/archer.png', kestrelReference: 'self', fileDestination: 'public/assets/dev/option-c/phase4c/kestrel/master.png', runtimeSemanticKey: 'character:archer:master' },
  { slotName: 'idleSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 8], timingMetadata: '190ms/frame, loop', canonicalReference: '/assets/characters/pixel/masters/archer.png', kestrelReference: 'self', fileDestination: 'public/assets/dev/option-c/phase4b/kestrel/idle/', runtimeSemanticKey: 'character:archer:surface:*:state:idle' },
  { slotName: 'dashSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 10], timingMetadata: '82ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/archer.png', kestrelReference: 'self', fileDestination: 'public/assets/dev/option-c/phase4b/kestrel/dash/', runtimeSemanticKey: 'character:archer:surface:*:state:dash' },
  { slotName: 'attackSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '105ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/archer.png', kestrelReference: 'self', fileDestination: 'public/assets/dev/option-c/phase4b/kestrel/attack/', runtimeSemanticKey: 'character:archer:surface:*:state:attack' },
  { slotName: 'skillSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '125ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/archer.png', kestrelReference: 'self', fileDestination: 'public/assets/dev/option-c/phase4b/kestrel/skill/', runtimeSemanticKey: 'character:archer:surface:*:state:skill' },
];

export const KESTREL_DEFINITION: OptionCCharacterDefinition = Object.freeze({
  identity: {
    id: 'archer',
    displayName: 'Kestrel',
    canonicalSource: '/assets/characters/pixel/masters/archer.png',
    weapon: 'longbow',
    archetype: 'archer',
    silhouetteClass: 'lithe_ranged',
    bodyClass: 'lithe',
    headProfile: 'Deep forest-green pointed hood with old-gold trim',
    maskProfile: 'Closed green cloth mask beneath hood; no exposed face',
    paletteFamily: ['forest green', 'leather brown', 'night blue'],
    equipmentProfile: 'Longbow, quiver, light leather armor',
    tableauRequirements: 'LEFT/RIGHT/CENTER, hooded silhouette, bow visible',
    strategicRequirements: 'Mobile grid position, lithe silhouette, range 4',
    combatStageRequirements: 'Bow draw animation, arrow release VFX, dash mobility',
    animationStates: ['idle', 'dash', 'attack', 'skill'] as const,
  },
  sources: {
    canonical: '/assets/characters/pixel/masters/archer.png',
    phase4bRoot: PHASE4B_ROOT + '/kestrel',
  },
  masterStatus: 'GOLD_REFERENCE',
  surfaceAssets: {
    tableau: `${PHASE4B_ROOT}/kestrel/idle/frame-01.png`,
    strategic: `${PHASE4B_ROOT}/kestrel/idle/frame-01.png`,
    combatStage: `${PHASE4B_ROOT}/kestrel/idle/frame-01.png`,
  },
  animations: [kestrelIdleMeta, kestrelDashMeta, kestrelAttackMeta, kestrelSkillMeta],
  anchors: {
    footCenter: { x: 256, y: 466 },
    bodyCenter: { x: 256, y: 256 },
    headReference: { x: 256, y: 120 },
    weaponReference: { x: 320, y: 280 },
  },
  scales: { tableau: 0.92, strategic: 1, combatStage: 1, draftScale: false },
  mirrorPolicy: 'runtime',
  loadingPolicy: 'eager',
  runtimeStatus: 'GOLD_REFERENCE',
  qaStatus: {
    registryValidated: true,
    manifestResolved: true,
    animationValidated: true,
    anchorValidated: true,
    scaleValidated: true,
    selectiveLoadingValidated: true,
    labWired: true,
    backwardCompatible: true,
  },
  codexHandoffSlots: kestrelCodexSlots,
});

// ---------------------------------------------------------------------------
// 2. Alistair (warrior) — FINAL_PRODUCTION_CANDIDATE key-pose authority
// ---------------------------------------------------------------------------

const alistairIdleMeta: OptionCAnimationMetadata = {
  state: 'idle',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1, // Static key pose only; full animation generation is out of scope.
  frameDurationMs: 190,
  loop: true,
  oneShot: false,
  footBaseline: 470,
  pivotX: 256,
  pivotY: 470,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'withSurface',
  frames: alistairKeyPose('idle'),
};

const alistairAttackMeta: OptionCAnimationMetadata = {
  state: 'attack',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 105,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 470,
  pivotX: 256,
  pivotY: 470,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: alistairKeyPose('attack'),
};

const alistairSkillMeta: OptionCAnimationMetadata = {
  state: 'skill',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 125,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 470,
  pivotX: 256,
  pivotY: 470,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: alistairKeyPose('skill'),
};

const alistairDashMeta: OptionCAnimationMetadata = {
  state: 'dash',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 82,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 470,
  pivotX: 256,
  pivotY: 470,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: alistairKeyPose('dash'),
};

const alistairCodexSlots: readonly OptionCCodexHandoffSlot[] = [
  { slotName: 'characterMaster', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static master', canonicalReference: '/assets/characters/pixel/masters/alistair.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/frame-01.png', fileDestination: 'public/assets/dev/option-c/phase4c/alistair/normalized/alistair-master.png', runtimeSemanticKey: 'character:warrior:master' },
  { slotName: 'idleKeyPose', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static key-pose authority; no animation sequence', canonicalReference: '/assets/characters/pixel/masters/alistair.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/', fileDestination: 'public/assets/dev/option-c/phase4c/alistair/normalized/alistair-idle.png', runtimeSemanticKey: 'character:warrior:surface:*:state:idle' },
  { slotName: 'dashKeyPose', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static key-pose authority; no animation sequence', canonicalReference: '/assets/characters/pixel/masters/alistair.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/dash/', fileDestination: 'public/assets/dev/option-c/phase4c/alistair/normalized/alistair-dash.png', runtimeSemanticKey: 'character:warrior:surface:*:state:dash' },
  { slotName: 'attackKeyPose', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static key-pose authority; no animation sequence', canonicalReference: '/assets/characters/pixel/masters/alistair.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/attack/', fileDestination: 'public/assets/dev/option-c/phase4c/alistair/normalized/alistair-attack.png', runtimeSemanticKey: 'character:warrior:surface:*:state:attack' },
  { slotName: 'skillKeyPose', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static Tourbillon d’Acier key-pose authority; no animation sequence', canonicalReference: '/assets/characters/pixel/masters/alistair.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/skill/', fileDestination: 'public/assets/dev/option-c/phase4c/alistair/normalized/alistair-skill.png', runtimeSemanticKey: 'character:warrior:surface:*:state:skill' },
];

export const ALISTAIR_DEFINITION: OptionCCharacterDefinition = Object.freeze({
  identity: {
    id: 'warrior',
    displayName: 'Alistair',
    canonicalSource: '/assets/characters/pixel/masters/alistair.png',
    weapon: 'greatsword',
    archetype: 'knight',
    silhouetteClass: 'heavy_frontline',
    bodyClass: 'heavy',
    headProfile: 'Closed angular vented steel helm with burgundy plume; face fully concealed',
    maskProfile: 'Closed faceplate; no skin, hair, or eyes visible',
    paletteFamily: ['burgundy', 'gunmetal', 'silver', 'restrained gold'],
    equipmentProfile: 'Heavy blackened plate and mail, crimson scarf/cape/tabard, two-handed greatsword; no shield',
    tableauRequirements: 'LEFT or RIGHT standing pose, wide stance, facing speaker',
    strategicRequirements: 'Frontline grid position, heavy silhouette readable at distance',
    combatStageRequirements: 'Melee range 1, readable two-handed greatsword arc, clean center impact corridor',
    animationStates: ['idle', 'dash', 'attack', 'skill'] as const,
  },
  sources: {
    canonical: '/assets/characters/pixel/masters/alistair.png',
  },
  masterStatus: 'FINAL_PRODUCTION_CANDIDATE',
  surfaceAssets: {
    tableau: `${ALISTAIR_CANDIDATE_ROOT}/alistair-idle.png`,
    strategic: `${ALISTAIR_CANDIDATE_ROOT}/alistair-idle.png`,
    combatStage: `${ALISTAIR_CANDIDATE_ROOT}/alistair-idle.png`,
  },
  animations: [alistairIdleMeta, alistairDashMeta, alistairAttackMeta, alistairSkillMeta],
  anchors: {
    footCenter: { x: 256, y: 470 },
    bodyCenter: { x: 242, y: 294 },
    headReference: { x: 215, y: 176 },
    weaponReference: { x: 211, y: 257 },
  },
  scales: { tableau: 0.99, strategic: 1.16, combatStage: 1.16, draftScale: false },
  mirrorPolicy: 'runtime',
  loadingPolicy: 'lazy',
  runtimeStatus: 'FINAL_PRODUCTION_CANDIDATE',
  qaStatus: {
    registryValidated: true,
    manifestResolved: true,
    animationValidated: false, // Key poses only; full animation validation intentionally remains false.
    anchorValidated: true,
    scaleValidated: true,
    selectiveLoadingValidated: true,
    labWired: true,
    backwardCompatible: true,
  },
  codexHandoffSlots: alistairCodexSlots,
});

// ---------------------------------------------------------------------------
// 3. Marian (white_mage) — SCALING_DRAFT
// ---------------------------------------------------------------------------

const marianIdleMeta: OptionCAnimationMetadata = {
  state: 'idle',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 190,
  loop: true,
  oneShot: false,
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'withSurface',
  frames: draftIdleFrames('marian'),
};

const marianAttackMeta: OptionCAnimationMetadata = {
  state: 'attack',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 105,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('marian'),
};

const marianCastMeta: OptionCAnimationMetadata = {
  state: 'cast',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 125,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('marian'),
};

const marianDashMeta: OptionCAnimationMetadata = {
  state: 'dash',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 82,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('marian'),
};

const marianCodexSlots: readonly OptionCCodexHandoffSlot[] = [
  { slotName: 'characterMaster', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static master', canonicalReference: '/assets/characters/pixel/masters/white_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/frame-01.png', fileDestination: 'public/assets/dev/option-c/phase4c/marian/master.png', runtimeSemanticKey: 'character:white_mage:master' },
  { slotName: 'idleSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 8], timingMetadata: '190ms/frame, loop', canonicalReference: '/assets/characters/pixel/masters/white_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/', fileDestination: 'public/assets/dev/option-c/phase4c/marian/idle/', runtimeSemanticKey: 'character:white_mage:surface:*:state:idle' },
  { slotName: 'dashSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 10], timingMetadata: '82ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/white_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/dash/', fileDestination: 'public/assets/dev/option-c/phase4c/marian/dash/', runtimeSemanticKey: 'character:white_mage:surface:*:state:dash' },
  { slotName: 'attackSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '105ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/white_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/attack/', fileDestination: 'public/assets/dev/option-c/phase4c/marian/attack/', runtimeSemanticKey: 'character:white_mage:surface:*:state:attack' },
  { slotName: 'skillSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '125ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/white_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/skill/', fileDestination: 'public/assets/dev/option-c/phase4c/marian/cast/', runtimeSemanticKey: 'character:white_mage:surface:*:state:cast' },
];

export const MARIAN_DEFINITION: OptionCCharacterDefinition = Object.freeze({
  identity: {
    id: 'white_mage',
    displayName: 'Marian',
    canonicalSource: '/assets/characters/pixel/masters/white_mage.png',
    weapon: 'crosier',
    archetype: 'cleric',
    silhouetteClass: 'robed_caster',
    bodyClass: 'robed',
    headProfile: 'White hood/veil with gold circlet, serene expression',
    maskProfile: 'White/gold lightcaster mask; masked identity',
    paletteFamily: ['white', 'gold', 'silver'],
    equipmentProfile: 'Crosier staff, flowing white robes',
    tableauRequirements: 'LEFT or RIGHT standing pose, staff visible, calm posture',
    strategicRequirements: 'Backline grid position, robed silhouette distinct from armored units',
    combatStageRequirements: 'Staff cast animation, heal VFX alignment at staff tip',
    animationStates: ['idle', 'dash', 'attack', 'cast'] as const,
  },
  sources: {
    canonical: '/assets/characters/pixel/masters/white_mage.png',
  },
  masterStatus: 'SCALING_DRAFT',
  surfaceAssets: {
    tableau: '/assets/characters/pixel/masters/white_mage.png',
    strategic: '/assets/characters/pixel/masters/white_mage.png',
    combatStage: '/assets/characters/pixel/masters/white_mage.png',
  },
  animations: [marianIdleMeta, marianDashMeta, marianAttackMeta, marianCastMeta],
  anchors: {
    footCenter: { x: 256, y: 465 },
    bodyCenter: { x: 256, y: 256 },
    headReference: { x: 256, y: 110 },
    weaponReference: { x: 200, y: 260 },
  },
  scales: { tableau: 0.86, strategic: 1, combatStage: 1, draftScale: true },
  mirrorPolicy: 'runtime',
  loadingPolicy: 'lazy',
  runtimeStatus: 'ART_PENDING_CODEX',
  qaStatus: {
    registryValidated: true,
    manifestResolved: true,
    animationValidated: false,
    anchorValidated: true,
    scaleValidated: true,
    selectiveLoadingValidated: true,
    labWired: false,
    backwardCompatible: true,
  },
  codexHandoffSlots: marianCodexSlots,
});

// ---------------------------------------------------------------------------
// 4. Elara (dark_mage) — SCALING_DRAFT
// ---------------------------------------------------------------------------

const elaraIdleMeta: OptionCAnimationMetadata = {
  state: 'idle',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1, // ART_PENDING_CODEX — single canonical placeholder
  frameDurationMs: 190,
  loop: true,
  oneShot: false,
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'withSurface',
  frames: draftIdleFrames('elara'),
};

const elaraAttackMeta: OptionCAnimationMetadata = {
  state: 'attack',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 105,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('elara'),
};

const elaraCastMeta: OptionCAnimationMetadata = {
  state: 'cast',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 125,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('elara'),
};

const elaraDashMeta: OptionCAnimationMetadata = {
  state: 'dash',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 82,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 465,
  pivotX: 256,
  pivotY: 465,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('elara'),
};

const elaraCodexSlots: readonly OptionCCodexHandoffSlot[] = [
  { slotName: 'characterMaster', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static master', canonicalReference: '/assets/characters/pixel/masters/dark_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/frame-01.png', fileDestination: 'public/assets/dev/option-c/phase4c/elara/master.png', runtimeSemanticKey: 'character:dark_mage:master' },
  { slotName: 'idleSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 8], timingMetadata: '190ms/frame, loop', canonicalReference: '/assets/characters/pixel/masters/dark_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/', fileDestination: 'public/assets/dev/option-c/phase4c/elara/idle/', runtimeSemanticKey: 'character:dark_mage:surface:*:state:idle' },
  { slotName: 'dashSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 10], timingMetadata: '82ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/dark_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/dash/', fileDestination: 'public/assets/dev/option-c/phase4c/elara/dash/', runtimeSemanticKey: 'character:dark_mage:surface:*:state:dash' },
  { slotName: 'attackSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '105ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/dark_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/attack/', fileDestination: 'public/assets/dev/option-c/phase4c/elara/attack/', runtimeSemanticKey: 'character:dark_mage:surface:*:state:attack' },
  { slotName: 'skillSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '125ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/masters/dark_mage.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/skill/', fileDestination: 'public/assets/dev/option-c/phase4c/elara/cast/', runtimeSemanticKey: 'character:dark_mage:surface:*:state:cast' },
];

export const ELARA_DEFINITION: OptionCCharacterDefinition = Object.freeze({
  identity: {
    id: 'dark_mage',
    displayName: 'Elara',
    canonicalSource: '/assets/characters/pixel/masters/dark_mage.png',
    weapon: 'grimoire',
    archetype: 'mage',
    silhouetteClass: 'robed_arcane',
    bodyClass: 'robed',
    headProfile: 'Pointed wizard hat, arcane glow',
    maskProfile: 'Hat shadow, no mask',
    paletteFamily: ['arcane blue', 'cyan', 'gold'],
    equipmentProfile: 'Grimoire tome, glowing staff',
    tableauRequirements: 'LEFT or RIGHT standing pose, staff glowing, hat readable',
    strategicRequirements: 'Backline grid position, pointed hat distinguishes from Marian',
    combatStageRequirements: 'Grimoire open cast animation, magic VFX from tome',
    animationStates: ['idle', 'dash', 'attack', 'cast'] as const,
  },
  sources: {
    canonical: '/assets/characters/pixel/masters/dark_mage.png',
  },
  masterStatus: 'SCALING_DRAFT',
  surfaceAssets: {
    tableau: '/assets/characters/pixel/masters/dark_mage.png',
    strategic: '/assets/characters/pixel/masters/dark_mage.png',
    combatStage: '/assets/characters/pixel/masters/dark_mage.png',
  },
  animations: [elaraIdleMeta, elaraDashMeta, elaraAttackMeta, elaraCastMeta],
  anchors: {
    footCenter: { x: 256, y: 465 },
    bodyCenter: { x: 256, y: 256 },
    headReference: { x: 256, y: 110 },
    weaponReference: { x: 320, y: 250 },
  },
  scales: { tableau: 0.86, strategic: 1, combatStage: 1, draftScale: true },
  mirrorPolicy: 'runtime',
  loadingPolicy: 'lazy',
  runtimeStatus: 'ART_PENDING_CODEX',
  qaStatus: {
    registryValidated: true,
    manifestResolved: true,
    animationValidated: false,
    anchorValidated: true,
    scaleValidated: true,
    selectiveLoadingValidated: true,
    labWired: false,
    backwardCompatible: true,
  },
  codexHandoffSlots: elaraCodexSlots,
});

// ---------------------------------------------------------------------------
// 5. Morvan (dark_knight) — SCALING_DRAFT (DEFERRED_POST_DEMO)
// ---------------------------------------------------------------------------

const morvanIdleMeta: OptionCAnimationMetadata = {
  state: 'idle',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 190,
  loop: true,
  oneShot: false,
  footBaseline: 468,
  pivotX: 256,
  pivotY: 468,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'withSurface',
  frames: draftIdleFrames('morvan'),
};

const morvanAttackMeta: OptionCAnimationMetadata = {
  state: 'attack',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 105,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 468,
  pivotX: 256,
  pivotY: 468,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('morvan'),
};

const morvanCastMeta: OptionCAnimationMetadata = {
  state: 'cast',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 125,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 468,
  pivotX: 256,
  pivotY: 468,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('morvan'),
};

const morvanDashMeta: OptionCAnimationMetadata = {
  state: 'dash',
  frameWidth: 512,
  frameHeight: 512,
  frameCount: 1,
  frameDurationMs: 82,
  loop: false,
  oneShot: true,
  returnState: 'idle',
  footBaseline: 468,
  pivotX: 256,
  pivotY: 468,
  mirrorAllowed: true,
  surfaceScale: 1,
  preloadPolicy: 'onDemand',
  frames: draftIdleFrames('morvan'),
};

const morvanCodexSlots: readonly OptionCCodexHandoffSlot[] = [
  { slotName: 'characterMaster', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [1, 1], timingMetadata: 'static master', canonicalReference: '/assets/characters/pixel/full/morvan.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/frame-01.png', fileDestination: 'public/assets/dev/option-c/phase4c/morvan/master.png', runtimeSemanticKey: 'character:dark_knight:master' },
  { slotName: 'idleSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 8], timingMetadata: '190ms/frame, loop', canonicalReference: '/assets/characters/pixel/full/morvan.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/idle/', fileDestination: 'public/assets/dev/option-c/phase4c/morvan/idle/', runtimeSemanticKey: 'character:dark_knight:surface:*:state:idle' },
  { slotName: 'dashSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [6, 10], timingMetadata: '82ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/full/morvan.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/dash/', fileDestination: 'public/assets/dev/option-c/phase4c/morvan/dash/', runtimeSemanticKey: 'character:dark_knight:surface:*:state:dash' },
  { slotName: 'attackSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '105ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/full/morvan.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/attack/', fileDestination: 'public/assets/dev/option-c/phase4c/morvan/attack/', runtimeSemanticKey: 'character:dark_knight:surface:*:state:attack' },
  { slotName: 'skillSheet', expectedDimensions: [512, 512], transparent: true, anchor: 'FOOT_CENTER', surfaceScale: 1, frameCountRange: [8, 12], timingMetadata: '125ms/frame, oneShot->idle', canonicalReference: '/assets/characters/pixel/full/morvan.png', kestrelReference: '/assets/dev/option-c/phase4b/kestrel/skill/', fileDestination: 'public/assets/dev/option-c/phase4c/morvan/cast/', runtimeSemanticKey: 'character:dark_knight:surface:*:state:cast' },
];

export const MORVAN_DEFINITION: OptionCCharacterDefinition = Object.freeze({
  identity: {
    id: 'dark_knight',
    displayName: 'Morvan',
    canonicalSource: '/assets/characters/pixel/full/morvan.png',
    weapon: 'scythe',
    archetype: 'knight',
    silhouetteClass: 'heavy_dark',
    bodyClass: 'heavy',
    headProfile: 'Dark helm/cowl, menacing',
    maskProfile: 'Cowl/helm shadow',
    paletteFamily: ['dark gold', 'black', 'wine'],
    equipmentProfile: 'Scythe, dark armor',
    tableauRequirements: 'LEFT or RIGHT, dark imposing silhouette, scythe visible',
    strategicRequirements: 'Frontline grid position, dark palette distinguishes from all',
    combatStageRequirements: 'Scythe sweep attack, cursed blade cast, void step dash',
    animationStates: ['idle', 'dash', 'attack', 'cast'] as const,
  },
  sources: {
    canonical: '/assets/characters/pixel/full/morvan.png',
  },
  masterStatus: 'SCALING_DRAFT',
  surfaceAssets: {
    tableau: '/assets/characters/pixel/full/morvan.png',
    strategic: '/assets/characters/pixel/full/morvan.png',
    combatStage: '/assets/characters/pixel/full/morvan.png',
  },
  animations: [morvanIdleMeta, morvanDashMeta, morvanAttackMeta, morvanCastMeta],
  anchors: {
    footCenter: { x: 256, y: 468 },
    bodyCenter: { x: 256, y: 256 },
    headReference: { x: 256, y: 115 },
    weaponReference: { x: 340, y: 290 },
  },
  scales: { tableau: 0.90, strategic: 1, combatStage: 1, draftScale: true },
  mirrorPolicy: 'runtime',
  loadingPolicy: 'lazy',
  runtimeStatus: 'ART_PENDING_CODEX',
  qaStatus: {
    registryValidated: true,
    manifestResolved: true,
    animationValidated: false,
    anchorValidated: true,
    scaleValidated: true,
    selectiveLoadingValidated: true,
    labWired: false,
    backwardCompatible: true,
  },
  codexHandoffSlots: morvanCodexSlots,
});

// ---------------------------------------------------------------------------
// Selected batch (CODEX_P0_ACTIVE_BATCH = Alistair, Marian, Elara)
// Morvan is DEFERRED_POST_DEMO — structural definition preserved but not active.
// ---------------------------------------------------------------------------

export const SELECTED_BATCH: readonly OptionCCharacterDefinition[] = Object.freeze([
  ALISTAIR_DEFINITION,
  MARIAN_DEFINITION,
  ELARA_DEFINITION,
]);

export const ALL_PHASE4C_DEFINITIONS: readonly OptionCCharacterDefinition[] = Object.freeze([
  KESTREL_DEFINITION,
  ALISTAIR_DEFINITION,
  MARIAN_DEFINITION,
  ELARA_DEFINITION,
  MORVAN_DEFINITION,
]);

// ---------------------------------------------------------------------------
// Register all definitions with the manifest resolver
// ---------------------------------------------------------------------------

let phase4cRegistered = false;

export function ensurePhase4cRegistered(): void {
  if (phase4cRegistered) return;
  for (const def of ALL_PHASE4C_DEFINITIONS) {
    registerCharacterDefinition(def);
  }
  phase4cRegistered = true;
}

// Auto-register on module load (works in vitest; browser labs also call
// ensurePhase4cRegistered() explicitly as a safety net for Vite dev).
ensurePhase4cRegistered();
