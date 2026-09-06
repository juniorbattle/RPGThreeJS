import * as THREE from 'three';
import { BackgroundLayerSystem } from '../../render/BackgroundLayerSystem';
import { combatStageBackgroundFor } from './combatStageBackgrounds';
import {
  resolveCombatStageProfile,
  resolveStageSideAssignment,
  resolveStageSlotCoordinate,
  stageDirectionSign,
  type CombatStageProfile,
  type StagePhaseTiming,
  type StageSlotId,
  type StageFactionSide,
  type StageSideAssignment,
} from './combatStageProfiles';
import type { VfxAnchor, VfxUnitLike } from '../vfx/VfxTypes';
import {
  EMPTY_COMPILED_CASTER_MOTION,
  sampleUnitMotionOffset,
  unitMotionHasEffectForActor,
  type CombatActorRole,
  type CompiledCasterMotion,
  type CompiledCasterMotionStep,
  type MutableVec3,
} from '../vfx/CasterMotion';
import {
  COMBAT_POSES,
  resolveCombatPoseSet,
  resolveCombatPoseUnitId,
  type CombatPose,
  type CombatPoseSet,
} from './CombatPoseRegistry';
import {
  disposeCombatPoseTextureCache,
  disposeCombatPoseVisual,
  preloadCombatPoseSet,
  setCombatUnitPose as applyCombatUnitPose,
  type CombatPoseVisualUnit,
} from './CombatPoseVisual';

/**
 * Combat Execution Stage (R0A).
 *
 * Presentation-only. Never mutates tactical unit state (gx/gz/grid/occupant),
 * never touches the tactical camera object, and never duplicates gameplay
 * resolution. The authoritative action pipeline in legacyCombatRuntime.js
 * still owns signalImpact/finishImpact/onResolveImpact; this class only
 * decides *where* (which scene/camera) the existing VfxSystem renders into,
 * and drives lightweight presentation-only actor proxies.
 */

/**
 * Player/hero sprites have transparent bottom padding (same as tactical
 * heroGroundOffset). This sinks the proxy plane so hero feet rest on the
 * Stage ground plane, matching enemy grounding. Enemy sprites do not need
 * this correction.
 */
const STAGE_HERO_GROUND_OFFSET = 0.05;

/**
 * R0C.1B — Light global vertical sink applied to ALL Stage proxies (both
 * player and enemy) to improve visual grounding against the painted
 * background. Applied after the hero ground offset, so both factions
 * shift down equally without altering their relative difference.
 */
const STAGE_PROXY_Y_SINK = 0.08;

/**
 * R0C.2 — Reduced tilt-shift strength for the Combat Stage. The tactical
 * view uses 0.5; the Stage uses a milder value so the frontal composition
 * retains subtle depth-of-field character without blurring the focused
 * foreground sprites. Zero would create a visual rupture at transitions.
 */
const STAGE_TILT_SHIFT = 0.22;

/**
 * Phase B — world-unit gap used by the CASTER MOTION TARGET_FRONT /
 * TARGET_BACK destinations. FRONT stops this far short of the target, BACK
 * overshoots this far past it. Clamped to half the caster→target distance so
 * short compositions can never invert the movement direction.
 */
const CASTER_MOTION_FLANK_OFFSET = 0.6;

/**
 * R0C.2 — Fog and lighting parameters matching the tactical scene to
 * preserve colorimetric continuity across the Stage transition. These
 * are applied once to the Stage scene in the constructor.
 */
const STAGE_FOG_COLOR = 0x52635c;
const STAGE_FOG_DENSITY = 0.01;
const STAGE_HEMI_SKY = 0xcfd8ca;
const STAGE_HEMI_GROUND = 0x313d36;
const STAGE_HEMI_INTENSITY = 0.86;
const STAGE_SUN_COLOR = 0xffead1;
const STAGE_SUN_INTENSITY = 1.78;
const STAGE_SUN_DIR = new THREE.Vector3(-9, 15, 9);
const STAGE_FILL_COLOR = 0xd5b184;
const STAGE_FILL_INTENSITY = 0.48;
const STAGE_FILL_DIR = new THREE.Vector3(10, 6, 8);

/** Minimal duck-typed shape read from a live tactical unit's sprite mesh. Never mutated. */
export interface StageSpriteSource {
  spr?: {
    material?: { map?: THREE.Texture | null } | null;
    geometry?: { parameters?: { width?: number; height?: number } } | null;
  } | null;
  blob?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null;
  /** Explicit canonical ID, when a caller already has one. */
  combatPoseUnitId?: string | null;
  /** Existing campaign/catalog identities; resolved only through explicit registry aliases. */
  unitId?: string | null;
  definitionId?: string | null;
  visualProfileId?: string | null;
  campaignId?: string | null;
  portrait?: string | null;
  name?: string;
  /** Authoritative gameplay team field ('player' or 'foe'). Read-only — never mutated. */
  team?: string;
  /** Authoritative alive status. Read-only — used to style KO target proxies. */
  alive?: boolean;
  /** Authoritative downed status. Read-only — used to style KO target proxies. */
  downed?: boolean;
}

/** The subset of EffectComposer's RenderPass this module needs to mutate. */
export interface RenderPassLike {
  scene: THREE.Scene;
  camera: THREE.Camera;
}

export interface UniformLike {
  value: number;
}

export interface CombatStageOptions {
  renderPass: RenderPassLike;
  tacticalScene: THREE.Scene;
  tacticalCamera: THREE.Camera;
  tiltShiftStrength: UniformLike;
  width: number;
  height: number;
}

export interface CombatStageEnterOptions {
  reducedGraphics?: boolean;
  environmentId?: string;
  profile?: CombatStageProfile;
  /** Acting unit's team ('player' or 'foe'). Determines faction-side assignment. */
  sourceTeam?: string;
  /** When true, attacker stays anchored at its home slot (boss/elite). */
  stationaryAttacker?: boolean;
}

export interface StageVfxContextOverride {
  scene: THREE.Scene;
  camera: THREE.Camera;
  targetPoint: THREE.Vector3;
  sourceUnit: VfxUnitLike;
  targetUnits: readonly VfxUnitLike[];
}

export interface StageAftermathStatus {
  name: string;
  color: string;
}

export interface StageAftermathEntry {
  unit: unknown;
  ko: boolean;
  revived: boolean;
  statusesApplied: readonly StageAftermathStatus[];
  statusesRemoved: readonly string[];
  healed: boolean;
}

export interface StageAftermathSnapshot {
  attacker: StageAftermathEntry;
  targets: readonly StageAftermathEntry[];
  isUltimate: boolean;
}

export interface CombatPoseQaState {
  index: number;
  total: number;
  unitId: string;
  unitName: string;
  pose: CombatPose;
}

interface StageActorProxy extends CombatPoseVisualUnit {
  /** Compatibility alias for the existing Stage sprite/KO presentation code. */
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  groundVisual: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null;
  source: StageSpriteSource;
  poseUnitId: string | null;
  startSlot: StageSlotId;
  impactSlot: StageSlotId;
  isAttacker: boolean;
  baseHeight: number;
  faction: StageFactionSide;
  isKO: boolean;
}

/** Faction-aware slot vector — mirrors X when source is enemy (RIGHT side). */
function resolvedSlotVec(slot: StageSlotId, mirrorX: boolean): THREE.Vector3 {
  const p = resolveStageSlotCoordinate(slot, mirrorX);
  return new THREE.Vector3(p.x, p.y, p.z);
}

function easeOutCubic(p: number): number {
  const t = Math.min(1, Math.max(0, p));
  return 1 - Math.pow(1 - t, 3);
}

/** 0 -> 1 -> 0 punch envelope for impact/hit-reaction pulses. */
function punchEnvelope(p: number): number {
  const t = Math.min(1, Math.max(0, p));
  return Math.sin(t * Math.PI);
}

export class CombatStage {
  /** Dedicated Stage scene. Never shared with tactical. */
  readonly scene = new THREE.Scene();
  /** Dedicated, fixed frontal orthographic camera. Never orbits, never reused for tactical. */
  readonly camera: THREE.OrthographicCamera;

  private readonly renderPass: RenderPassLike;
  private readonly tacticalScene: THREE.Scene;
  private readonly tacticalCamera: THREE.Camera;
  private readonly tiltShiftStrength: UniformLike;
  private readonly backgroundLayers: BackgroundLayerSystem;
  private readonly maskEl: HTMLDivElement | null;

  private width: number;
  private height: number;
  private readonly baseFrustumHalfHeight = 2.6;

  private active = false;
  private activeProfile: CombatStageProfile | null = null;
  private sideAssignment: StageSideAssignment | null = null;
  private stationaryAttacker = false;
  private savedTiltShift = 0;
  /** True only once renderPass/tiltShift have actually been swapped away from tactical. */
  private renderPassSwapped = false;
  private reducedGraphics = false;
  private sessionToken = 0;

  private attackerProxy: StageActorProxy | null = null;
  private targetProxies: StageActorProxy[] = [];
  private attackerUnitRef: unknown = null;
  private targetUnitRefs: unknown[] = [];
  private poseQaSelection = 0;

  private vfxSourceProxy: VfxUnitLike | null = null;
  private vfxProxyMap = new Map<unknown, VfxUnitLike>();

  private motionStartedAtMs = 0;
  private impactAtMs: number | null = null;

  /** One actor-aware plan; CASTER and TARGET use the same sampler and clock. */
  private unitMotion: CompiledCasterMotion = EMPTY_COMPILED_CASTER_MOTION;
  private unitMotionStartedAtMs = 0;
  private readonly activatedUnitMotionStepIds = new Set<string>();
  /** Reused per frame so actor sampling allocates nothing. */
  private readonly casterMotionOffset: MutableVec3 = { x: 0, y: 0, z: 0 };
  private readonly targetMotionOffset: MutableVec3 = { x: 0, y: 0, z: 0 };
  private readonly unitAnchorDelta = new THREE.Vector3();
  private koFadingProxies = new Set<StageActorProxy>();
  private koFadeStartMs = 0;
  private aftermathActive = false;

  constructor(options: CombatStageOptions) {
    this.renderPass = options.renderPass;
    this.tacticalScene = options.tacticalScene;
    this.tacticalCamera = options.tacticalCamera;
    this.tiltShiftStrength = options.tiltShiftStrength;
    this.width = options.width;
    this.height = options.height;

    this.scene.name = 'CombatStageScene';
    // R0C.2: Match tactical scene lighting for visual filter parity.
    this.scene.fog = new THREE.FogExp2(STAGE_FOG_COLOR, STAGE_FOG_DENSITY);
    this.scene.add(new THREE.HemisphereLight(STAGE_HEMI_SKY, STAGE_HEMI_GROUND, STAGE_HEMI_INTENSITY));
    const stageSun = new THREE.DirectionalLight(STAGE_SUN_COLOR, STAGE_SUN_INTENSITY);
    stageSun.position.copy(STAGE_SUN_DIR);
    this.scene.add(stageSun);
    const stageFill = new THREE.DirectionalLight(STAGE_FILL_COLOR, STAGE_FILL_INTENSITY);
    stageFill.position.copy(STAGE_FILL_DIR);
    this.scene.add(stageFill);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    this.camera.position.set(0, 1.35, 6);
    this.camera.lookAt(0, 1.1, 0);
    this.camera.updateProjectionMatrix();
    this.applyFrustum(this.baseFrustumHalfHeight);

    this.backgroundLayers = new BackgroundLayerSystem(this.scene);
    this.maskEl = typeof document !== 'undefined' ? this.buildMaskElement() : null;
  }

  // ---------------------------------------------------------------- public

  isActive(): boolean {
    return this.active;
  }

  getActiveProfileId(): CombatStageProfile['id'] | null {
    return this.activeProfile ? this.activeProfile.id : null;
  }

  handleResize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.applyFrustum(this.activeProfile ? this.activeProfile.cameraFrustumHalfHeight : this.baseFrustumHalfHeight);
  }

  /**
   * Activates the Stage for any combat action. Uses the provided profile or
   * falls back to explicit profile resolution. Returns false only for
   * null/empty specs (true non-action situations).
   */
  async enter(
    attacker: StageSpriteSource,
    targets: StageSpriteSource[],
    spec: { key?: string } | null | undefined,
    options: CombatStageEnterOptions = {},
  ): Promise<boolean> {
    const profile = options.profile ?? resolveCombatStageProfile(spec);
    if (!profile) return false;

    const token = ++this.sessionToken;
    this.activeProfile = profile;
    this.reducedGraphics = Boolean(options.reducedGraphics);
    this.stationaryAttacker = Boolean(options.stationaryAttacker);
    this.sideAssignment = resolveStageSideAssignment(profile, options.sourceTeam ?? attacker.team ?? 'player');
    const mirrorX = this.sideAssignment.mirrorX;

    await this.fadeMask(1, profile.transitionInMs);
    if (token !== this.sessionToken) {
      // Interrupted (e.g. runtime disposed) while fading in. Restore silently.
      await this.fadeMask(0, 0);
      return false;
    }

    try {
      this.savedTiltShift = this.tiltShiftStrength.value;
      this.tiltShiftStrength.value = STAGE_TILT_SHIFT;
      this.renderPass.scene = this.scene;
      this.renderPass.camera = this.camera;
      this.renderPassSwapped = true;
      this.applyFrustum(profile.cameraFrustumHalfHeight);

      await this.backgroundLayers.load(combatStageBackgroundFor(options.environmentId));

      this.disposeProxies();
      this.attackerUnitRef = attacker;
      this.targetUnitRefs = [];
      const sourceFaction = this.sideAssignment.sourceSide;
      this.attackerProxy = this.createProxy(attacker, profile.actorStartSlot, profile.actorImpactSlot, true, sourceFaction);

      this.targetProxies = [];
      const targetFaction = this.sideAssignment.targetSide;
      const nonAttackerTargets = targets.filter((t) => t !== attacker);
      for (let i = 0; i < nonAttackerTargets.length; i++) {
        const slot = profile.targetSlots[Math.min(i, profile.targetSlots.length - 1)] ?? profile.targetSlot;
        const proxy = this.createProxy(nonAttackerTargets[i], slot, slot, false, targetFaction);
        if (proxy) {
          this.targetProxies.push(proxy);
          this.targetUnitRefs.push(nonAttackerTargets[i]);
        }
      }

      const actorProxies = this.actorProxies();
      const posedProxies = actorProxies.filter((proxy) => proxy.poseSet !== null);
      await Promise.all(posedProxies.map((proxy) => preloadCombatPoseSet(proxy.poseSet!)));
      await Promise.all(posedProxies.map((proxy) => applyCombatUnitPose(proxy, 'prepare')));
      if (token !== this.sessionToken) return false;
      this.poseQaSelection = 0;

      this.vfxProxyMap.clear();
      const sourceProxy = this.createVfxUnitProxy(profile.castAnchorSlot, mirrorX);
      this.vfxSourceProxy = sourceProxy;
      this.vfxProxyMap.set(attacker, sourceProxy);
      let slotIdx = 0;
      for (const t of targets) {
        if (t === attacker) continue;
        const slot = profile.targetSlots[Math.min(slotIdx, profile.targetSlots.length - 1)] ?? profile.targetSlot;
        if (slot === profile.castAnchorSlot) {
          this.vfxProxyMap.set(t, sourceProxy);
        } else {
          this.vfxProxyMap.set(t, this.createVfxUnitProxy(slot, mirrorX));
        }
        slotIdx++;
      }

      this.motionStartedAtMs = performance.now();
      this.impactAtMs = null;
      // Each session starts motion-free. A linked plan is installed only when
      // the action authors Unit Motion + Pose steps.
      this.clearUnitMotion();
      this.unitMotionStartedAtMs = this.motionStartedAtMs;
      this.active = true;
    } catch (error) {
      console.warn('[CombatStage] enter() failed — restoring tactical view.', error);
      this.forceRestoreTactical();
      await this.fadeMask(0, profile.transitionInMs);
      return false;
    }

    await this.fadeMask(0, profile.transitionInMs);
    return true;
  }

  /** Called at the exact VISUAL IMPACT moment, immediately before authoritative resolution begins. */
  notifyImpact(): void {
    if (!this.active) return;
    this.impactAtMs = performance.now();
  }

  /**
   * Presentation-only aftermath: reads the authoritative post-resolution unit
   * state from the snapshot and presents visible consequences on Stage proxies
   * BEFORE Stage exit. Never performs gameplay resolution — only visual changes.
   *
   * - KO units: proxy mesh fades to low opacity (animated via tick).
   * - Status applied/removed: float text at proxy position (via callback).
   * - Heal: float text at proxy position (via callback).
   * - Aftermath hold: profile-aware duration based on consequence severity.
   */
  async presentResolvedAftermath(
    snapshot: StageAftermathSnapshot,
    floatTextFn?: (unit: unknown, text: string, color: string, big?: boolean) => void,
  ): Promise<void> {
    if (!this.active) return;
    this.aftermathActive = true;

    const allEntries = [snapshot.attacker, ...snapshot.targets];
    const hasKO = allEntries.some((e) => e.ko);
    const hasRevive = allEntries.some((e) => e.revived);
    const hasStatus = allEntries.some((e) => e.statusesApplied.length > 0 || e.statusesRemoved.length > 0);

    // KO proxy fade — mark proxies for animated fade in updateActorMotion
    if (hasKO) {
      this.koFadeStartMs = performance.now();
      for (const entry of allEntries) {
        if (entry.ko) {
          const proxy = this.findProxyForUnit(entry.unit);
          if (proxy) {
            proxy.mesh.material.transparent = true;
            proxy.isKO = true;
            this.koFadingProxies.add(proxy);
          }
        }
      }
    }

    // Revive transition: animate KO proxy → living appearance
    if (hasRevive) {
      for (const entry of allEntries) {
        if (entry.revived) {
          const proxy = this.findProxyForUnit(entry.unit);
          if (proxy && proxy.isKO) {
            proxy.isKO = false;
            proxy.mesh.material.transparent = true;
            // Animate from KO appearance to living
            const startOp = proxy.mesh.material.opacity;
            const dur = this.reducedGraphics ? 150 : 300;
            const startMs = performance.now();
            const animate = () => {
              const p = Math.min(1, (performance.now() - startMs) / dur);
              proxy.mesh.material.opacity = startOp + (1 - startOp) * easeOutCubic(p);
              // Red → white color interpolation
              const r = 1 - 0.65 * easeOutCubic(p);
              const g = 0.35 + 0.65 * easeOutCubic(p);
              const b = 0.29 + 0.71 * easeOutCubic(p);
              proxy.mesh.material.color.setRGB(r, g, b);
              if (p < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
        }
      }
    }

    // Status / KO / revive feedback via Stage-aware float text (owned by Stage)
    if (floatTextFn) {
      for (const entry of allEntries) {
        if (entry.revived) {
          floatTextFn(entry.unit, 'RANIMÉ', '#7ed957', true);
        } else if (entry.ko) {
          floatTextFn(entry.unit, 'K.O.', '#ff5a4a', true);
        }
        for (const s of entry.statusesApplied) {
          floatTextFn(entry.unit, s.name.toUpperCase(), s.color, true);
        }
        for (const s of entry.statusesRemoved) {
          floatTextFn(entry.unit, 'PURIFIÉ', '#7ed957', true);
        }
      }
    }

    // Aftermath hold — presentation-driven, profile-aware
    let holdMs = 0;
    if (hasKO) holdMs += this.reducedGraphics ? 250 : 400;
    if (hasRevive) holdMs += this.reducedGraphics ? 200 : 350;
    if (hasStatus) holdMs += this.reducedGraphics ? 100 : 200;
    if (snapshot.isUltimate && (hasKO || hasStatus || hasRevive)) holdMs += this.reducedGraphics ? 150 : 300;

    if (holdMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, holdMs));
    }
    this.aftermathActive = false;
  }

  /** Non-null only while an eligible Stage session is active. Consumed by makeActionVfxContext. */
  getVfxContextOverride(): StageVfxContextOverride | null {
    if (!this.active || !this.activeProfile || !this.vfxSourceProxy || !this.sideAssignment) return null;
    const mirrorX = this.sideAssignment.mirrorX;
    const targetProxies = Array.from(this.vfxProxyMap.values()).filter((p) => p !== this.vfxSourceProxy);
    if (this.activeProfile.casterIncludedInTargets) {
      return {
        scene: this.scene,
        camera: this.camera,
        targetPoint: resolvedSlotVec(this.activeProfile.impactAnchorSlot, mirrorX),
        sourceUnit: this.vfxSourceProxy,
        targetUnits: [this.vfxSourceProxy, ...targetProxies],
      };
    }
    return {
      scene: this.scene,
      camera: this.camera,
      targetPoint: resolvedSlotVec(this.activeProfile.impactAnchorSlot, mirrorX),
      sourceUnit: this.vfxSourceProxy,
      targetUnits: targetProxies.length ? targetProxies : [this.vfxSourceProxy],
    };
  }

  /** Maps a real tactical unit to its Stage-space VfxUnitLike proxy, or null if not staged. */
  getVfxUnitProxy(unit: unknown): VfxUnitLike | null {
    if (!this.active) return null;
    return this.vfxProxyMap.get(unit) ?? null;
  }

  /** Returns the active profile's phase timing, or null when no Stage session is active. */
  getActivePhaseTiming(): StagePhaseTiming | null {
    if (!this.active || !this.activeProfile) return null;
    return this.activeProfile.phases;
  }

  /** Returns resolved profile info for QA/debug display, or null when inactive. */
  getActiveProfileInfo(): { id: string; layout: string; explicit: boolean; targetCount: number; sourceSlot: string; impactAnchor: string; sourceSide: string; targetSide: string; directionSign: number; stationaryAttacker: boolean } | null {
    if (!this.active || !this.activeProfile || !this.sideAssignment) return null;
    return {
      id: this.activeProfile.id,
      layout: this.activeProfile.layout,
      explicit: !this.activeProfile.generic,
      targetCount: this.targetProxies.length,
      sourceSlot: this.activeProfile.actorStartSlot,
      impactAnchor: this.activeProfile.impactAnchorSlot,
      sourceSide: this.sideAssignment.sourceSide,
      targetSide: this.sideAssignment.targetSide,
      directionSign: stageDirectionSign(this.sideAssignment),
      stationaryAttacker: this.stationaryAttacker,
    };
  }

  /** Returns the active faction-side assignment, or null when inactive. */
  getActiveSideAssignment(): StageSideAssignment | null {
    return this.active ? this.sideAssignment : null;
  }

  async setCombatUnitPose(unit: unknown, pose: CombatPose): Promise<boolean> {
    const proxy = this.findProxyForUnit(unit);
    if (!proxy) {
      if (import.meta.env.DEV) console.warn('[CombatPose] Unit is not present on the active Combat Stage.');
      return false;
    }
    const result = await applyCombatUnitPose(proxy, pose);
    return result.pose !== null;
  }

  getPoseQaState(): CombatPoseQaState | null {
    const proxies = this.poseQaProxies();
    if (!proxies.length) return null;
    this.poseQaSelection %= proxies.length;
    const proxy = proxies[this.poseQaSelection]!;
    return {
      index: this.poseQaSelection,
      total: proxies.length,
      unitId: proxy.poseUnitId!,
      unitName: proxy.source.name ?? proxy.poseUnitId!,
      pose: proxy.currentPose ?? 'prepare',
    };
  }

  selectNextPoseQaUnit(direction = 1): CombatPoseQaState | null {
    const proxies = this.poseQaProxies();
    if (!proxies.length) return null;
    this.poseQaSelection = (this.poseQaSelection + Math.sign(direction || 1) + proxies.length) % proxies.length;
    return this.getPoseQaState();
  }

  async cycleSelectedPose(): Promise<CombatPoseQaState | null> {
    const proxies = this.poseQaProxies();
    if (!proxies.length) return null;
    this.poseQaSelection %= proxies.length;
    const proxy = proxies[this.poseQaSelection]!;
    const currentIndex = COMBAT_POSES.indexOf(proxy.currentPose ?? 'prepare');
    const nextPose = COMBAT_POSES[(currentIndex + 1) % COMBAT_POSES.length]!;
    await applyCombatUnitPose(proxy, nextPose);
    return this.getPoseQaState();
  }

  /** Installs one actor-aware Unit Motion + Pose plan and restarts its clock. */
  setUnitMotion(motion: CompiledCasterMotion | null): void {
    this.clearUnitMotion();
    this.resetUnitRootsToSlots();
    this.unitMotion = motion ?? EMPTY_COMPILED_CASTER_MOTION;
    this.unitMotionStartedAtMs = performance.now();
  }

  /** Historical API retained for legacy CASTER-only playback hosts. */
  setCasterMotion(motion: CompiledCasterMotion | null): void {
    this.setUnitMotion(motion);
    for (const step of this.unitMotion.steps) this.activatedUnitMotionStepIds.add(step.motionId);
  }

  async applyUnitMotionStep(step: CompiledCasterMotionStep): Promise<boolean> {
    if (step.pose === null) {
      this.activatedUnitMotionStepIds.add(step.motionId);
      return true;
    }
    const proxy = step.actor === 'TARGET' ? this.targetProxies[0] : this.attackerProxy;
    if (!proxy) return false;
    const result = await applyCombatUnitPose(proxy, step.pose);
    this.activatedUnitMotionStepIds.add(step.motionId);
    return result.pose !== null;
  }

  clearUnitMotion(): void {
    this.unitMotion = EMPTY_COMPILED_CASTER_MOTION;
    this.activatedUnitMotionStepIds.clear();
    for (const offset of [this.casterMotionOffset, this.targetMotionOffset]) {
      offset.x = 0;
      offset.y = 0;
      offset.z = 0;
    }
  }

  /** Historical API retained for legacy callers. */
  clearCasterMotion(): void {
    this.clearUnitMotion();
  }

  async resetUnitMotionPresentation(): Promise<void> {
    this.clearUnitMotion();
    this.resetUnitRootsToSlots();
    await Promise.all(this.actorProxies()
      .filter((proxy) => proxy.poseSet !== null)
      .map((proxy) => applyCombatUnitPose(proxy, 'prepare')));
  }

  /** Test accessors for actor-isolated motion offsets. */
  casterMotionOffsetSnapshot(): { x: number; y: number; z: number } {
    return { ...this.casterMotionOffset };
  }

  targetMotionOffsetSnapshot(): { x: number; y: number; z: number } {
    return { ...this.targetMotionOffset };
  }

  hasCasterMotion(): boolean {
    return unitMotionHasEffectForActor(this.unitMotion, 'CASTER');
  }

  hasTargetMotion(): boolean {
    return unitMotionHasEffectForActor(this.unitMotion, 'TARGET');
  }

  /** Test accessor: attacker poseVisual world position, or null. */
  attackerProxyPosition(): THREE.Vector3 | null {
    return this.attackerProxy ? this.proxyVisualWorldPosition(this.attackerProxy) : null;
  }

  /** Test accessor: target poseVisual world position by index, or null. */
  targetProxyPosition(index: number): THREE.Vector3 | null {
    const proxy = this.targetProxies[index];
    return proxy ? this.proxyVisualWorldPosition(proxy) : null;
  }

  attackerUnitRootTransform(): { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 } | null {
    const root = this.attackerProxy?.unitRoot;
    if (!root) return null;
    return { position: root.position.clone(), quaternion: root.quaternion.clone(), scale: root.scale.clone() };
  }

  targetUnitRootTransform(index = 0): { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 } | null {
    const root = this.targetProxies[index]?.unitRoot;
    if (!root) return null;
    return { position: root.position.clone(), quaternion: root.quaternion.clone(), scale: root.scale.clone() };
  }

  attackerPoseVisualSnapshot(): {
    unitId: string | null;
    pose: CombatPose | null;
    localPosition: THREE.Vector3;
    width: number;
    height: number;
  } | null {
    return this.poseVisualSnapshot(this.attackerProxy);
  }

  targetPoseVisualSnapshot(index = 0): {
    unitId: string | null;
    pose: CombatPose | null;
    localPosition: THREE.Vector3;
    width: number;
    height: number;
  } | null {
    return this.poseVisualSnapshot(this.targetProxies[index] ?? null);
  }

  /** Test accessor: true when aftermath presentation is in progress. */
  isAftermathActive(): boolean {
    return this.aftermathActive;
  }

  /** Test accessor: count of proxies currently fading due to KO. */
  koFadeProxyCount(): number {
    return this.koFadingProxies.size;
  }

  /** Test accessor: opacity of a target proxy by index, or null. */
  targetProxyOpacity(index: number): number | null {
    const proxy = this.targetProxies[index];
    if (!proxy) return null;
    return proxy.mesh.material.opacity;
  }

  /** Test accessor: opacity of the attacker proxy, or null. */
  attackerProxyOpacity(): number | null {
    if (!this.attackerProxy) return null;
    return this.attackerProxy.mesh.material.opacity;
  }

  /** Test accessor: color of a target proxy by index as hex string, or null. */
  targetProxyColor(index: number): string | null {
    const proxy = this.targetProxies[index];
    if (!proxy) return null;
    return '#' + proxy.mesh.material.color.getHexString();
  }

  /** Test accessor: true if a target proxy was created as KO, or null. */
  targetProxyIsKO(index: number): boolean | null {
    const proxy = this.targetProxies[index];
    if (!proxy) return null;
    return proxy.isKO;
  }

  /**
   * Stage-space anchor for a unit's floating combat text, or null when the
   * Stage isn't active / the unit isn't part of the staged group — callers
   * should fall back to tactical worldToScreen projection in that case.
   */
  getFloatTextAnchor(unit: unknown): THREE.Vector3 | null {
    if (!this.active || !this.activeProfile) return null;
    if (unit === this.attackerUnitRef && this.attackerProxy) {
      return this.proxyVisualWorldPosition(this.attackerProxy).add(new THREE.Vector3(0, this.attackerProxy.baseHeight * 0.55, 0));
    }
    const idx = this.targetUnitRefs.indexOf(unit);
    const proxy = idx >= 0 ? this.targetProxies[idx] : undefined;
    if (proxy) {
      return this.proxyVisualWorldPosition(proxy).add(new THREE.Vector3(0, proxy.baseHeight * 0.55, 0));
    }
    return null;
  }

  /** Advances background parallax + actor proxy tweens. Cheap no-op when inactive. */
  tick(dt: number): void {
    if (!this.active || !this.activeProfile) return;
    this.backgroundLayers.update(dt, this.camera, this.reducedGraphics);
    this.updateActorMotion(performance.now());
  }

  /** Mirrors enter's transition, restores tactical rendering, disposes proxies. Always safe to call. */
  async exit(): Promise<void> {
    const profile = this.activeProfile;
    if (!this.active || !profile) {
      this.forceRestoreTactical();
      return;
    }
    ++this.sessionToken;
    try {
      await this.fadeMask(1, profile.transitionOutMs);
    } catch (error) {
      console.warn('[CombatStage] exit() transition-in failed.', error);
    }
    this.forceRestoreTactical();
    try {
      await this.fadeMask(0, profile.transitionOutMs);
    } catch (error) {
      console.warn('[CombatStage] exit() transition-out failed.', error);
    }
  }

  /**
   * Synchronous, idempotent safety valve: restores tactical render target
   * immediately. Safe to call even when the Stage was never activated for
   * the current action (e.g. every non-pilot combatStageExit call) — in
   * that case renderPass/tiltShift were never touched, so nothing is
   * restored, avoiding stomping the live tactical tilt-shift value.
   */
  forceRestoreTactical(): void {
    ++this.sessionToken;
    if (this.renderPassSwapped) {
      this.renderPass.scene = this.tacticalScene;
      this.renderPass.camera = this.tacticalCamera;
      this.tiltShiftStrength.value = this.savedTiltShift;
      this.renderPassSwapped = false;
    }
    this.disposeProxies();
    this.backgroundLayers.setVisible(false);
    this.clearUnitMotion();
    this.active = false;
    this.activeProfile = null;
    this.sideAssignment = null;
    this.stationaryAttacker = false;
    this.impactAtMs = null;
    this.attackerUnitRef = null;
    this.targetUnitRefs = [];
    this.vfxSourceProxy = null;
    this.vfxProxyMap.clear();
    this.koFadingProxies.clear();
    this.koFadeStartMs = 0;
    this.aftermathActive = false;
    this.setMaskOpacity(0);
  }

  /** Full teardown for combat runtime disposal. Not safe to use() after this. */
  dispose(): void {
    this.forceRestoreTactical();
    this.backgroundLayers.dispose();
    disposeCombatPoseTextureCache();
    if (this.maskEl) this.maskEl.remove();
  }

  // --------------------------------------------------------------- private

  private applyFrustum(halfHeight: number): void {
    const aspect = this.width / Math.max(1, this.height);
    const halfWidth = halfHeight * aspect;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  private buildMaskElement(): HTMLDivElement {
    const existing = document.getElementById('combat-stage-mask');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'combat-stage-mask';
    el.style.cssText =
      'position:fixed;inset:0;z-index:6;pointer-events:none;background:#05070c;opacity:0;';
    document.body.appendChild(el);
    return el;
  }

  private setMaskOpacity(value: number): void {
    if (!this.maskEl) return;
    this.maskEl.style.transition = '';
    this.maskEl.style.opacity = String(value);
  }

  private async fadeMask(to: number, ms: number): Promise<void> {
    if (!this.maskEl || ms <= 0) {
      this.setMaskOpacity(to);
      return;
    }
    this.maskEl.style.transition = `opacity ${ms}ms linear`;
    // Force a reflow so the transition is picked up before the opacity change.
    void this.maskEl.offsetHeight;
    this.maskEl.style.opacity = String(to);
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private actorProxies(): StageActorProxy[] {
    return this.attackerProxy ? [this.attackerProxy, ...this.targetProxies] : [...this.targetProxies];
  }

  private proxyVisualWorldPosition(proxy: StageActorProxy): THREE.Vector3 {
    proxy.unitRoot.updateMatrixWorld(true);
    return proxy.poseVisual.getWorldPosition(new THREE.Vector3());
  }

  private poseVisualSnapshot(proxy: StageActorProxy | null): {
    unitId: string | null;
    pose: CombatPose | null;
    localPosition: THREE.Vector3;
    width: number;
    height: number;
  } | null {
    if (!proxy) return null;
    const params = proxy.mesh.geometry.parameters;
    return {
      unitId: proxy.poseUnitId,
      pose: proxy.currentPose,
      localPosition: proxy.mesh.position.clone(),
      width: params.width,
      height: params.height,
    };
  }

  private poseQaProxies(): StageActorProxy[] {
    return this.active ? this.actorProxies().filter((proxy) => proxy.poseSet !== null) : [];
  }

  private resolvePoseSetForSource(source: StageSpriteSource): CombatPoseSet | null {
    const identities = [
      source.combatPoseUnitId,
      source.unitId,
      source.definitionId,
      source.visualProfileId,
      source.campaignId,
      source.portrait,
    ];
    for (const identity of identities) {
      const unitId = resolveCombatPoseUnitId(identity);
      if (unitId) return resolveCombatPoseSet(unitId) ?? null;
    }
    const suppliedIdentity = identities.find((identity): identity is string => Boolean(identity));
    if (suppliedIdentity && import.meta.env.DEV) {
      console.warn(`[CombatPose] No pose set for '${suppliedIdentity}'; using canonical Combat Stage sprite.`);
    }
    return null;
  }

  private createProxy(
    source: StageSpriteSource | null | undefined,
    startSlot: StageSlotId,
    impactSlot: StageSlotId,
    isAttacker: boolean,
    faction: StageFactionSide,
  ): StageActorProxy | null {
    const spr = source?.spr;
    const map = spr?.material?.map ?? null;
    if (!source || !map) return null;
    const params = spr?.geometry?.parameters ?? {};
    const width = typeof params.width === 'number' && params.width > 0 ? params.width : 1.4;
    const height = typeof params.height === 'number' && params.height > 0 ? params.height : 1.9;

    // `unitRoot` owns the authoritative Stage transform. Texture, geometry and
    // anchor offsets live only on its `poseVisual` child.
    const unitRoot = new THREE.Group();
    unitRoot.name = `CombatStageUnitRoot:${source.name ?? (isAttacker ? 'attacker' : 'target')}`;
    const material = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    const canonicalGeometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(canonicalGeometry, material);
    mesh.name = 'poseVisual';
    const mirrorX = this.sideAssignment?.mirrorX ?? false;
    const start = resolvedSlotVec(startSlot, mirrorX);
    const groundOffset = faction === 'player' ? height * STAGE_HERO_GROUND_OFFSET : 0;
    unitRoot.position.set(start.x, start.y, start.z);
    mesh.position.set(0, height * 0.5 - groundOffset - STAGE_PROXY_Y_SINK, 0);
    const faceSign = faction === 'player' ? 1 : -1;
    mesh.scale.x = faceSign;
    mesh.renderOrder = isAttacker ? 10 : 11;
    const groundVisual = source.blob ? new THREE.Mesh(source.blob.geometry.clone(), source.blob.material.clone()) : null;
    if (groundVisual) {
      groundVisual.name = 'groundVisual';
      groundVisual.rotation.x = -Math.PI / 2;
      groundVisual.position.y = 0.015;
      groundVisual.scale.copy(source.blob!.scale);
      groundVisual.renderOrder = isAttacker ? 8 : 9;
      unitRoot.add(groundVisual);
    }
    unitRoot.add(mesh);

    const poseSet = this.resolvePoseSetForSource(source);
    const isKO = !isAttacker && source.alive === false && source.downed === true;
    if (isKO) {
      material.opacity = 0.34;
      material.color.set('#ff5a4a');
    }

    const proxy: StageActorProxy = {
      unitRoot,
      poseVisual: mesh,
      poseSet,
      canonicalVisual: Object.freeze({
        geometry: canonicalGeometry,
        texture: map,
        position: mesh.position.clone(),
      }),
      poseGeometries: new Map(),
      faceSign,
      // Pose PNGs are tightly cropped and use explicit foot/root anchors, so
      // only the global Stage sink applies; heroGroundOffset is portrait padding.
      poseOriginYOffset: -STAGE_PROXY_Y_SINK,
      poseBasePosition: mesh.position.clone(),
      poseRequestId: 0,
      currentPose: null,
      mesh,
      groundVisual,
      source,
      poseUnitId: poseSet?.unitId ?? null,
      startSlot,
      impactSlot,
      isAttacker,
      baseHeight: height,
      faction,
      isKO,
    };
    this.scene.add(unitRoot);
    if (poseSet) void preloadCombatPoseSet(poseSet);
    return proxy;
  }

  private disposeProxies(): void {
    for (const proxy of this.actorProxies()) {
      ++proxy.poseRequestId;
      this.scene.remove(proxy.unitRoot);
      disposeCombatPoseVisual(proxy);
      proxy.canonicalVisual.geometry.dispose();
      proxy.mesh.material.dispose();
      proxy.groundVisual?.geometry.dispose();
      proxy.groundVisual?.material.dispose();
    }
    this.attackerProxy = null;
    this.targetProxies = [];
    this.poseQaSelection = 0;
  }

  private createVfxUnitProxy(slot: StageSlotId, mirrorX: boolean): VfxUnitLike {
    const p = resolveStageSlotCoordinate(slot, mirrorX);
    const grp = new THREE.Object3D();
    grp.position.set(p.x, p.y, p.z);
    return { grp, size: 1, alive: true };
  }

  private findProxyForUnit(unit: unknown): StageActorProxy | null {
    if (unit === this.attackerUnitRef && this.attackerProxy) return this.attackerProxy;
    const idx = this.targetUnitRefs.indexOf(unit);
    if (idx >= 0 && this.targetProxies[idx]) return this.targetProxies[idx];
    return null;
  }

  private updateActorMotion(now: number): void {
    const profile = this.activeProfile;
    if (!profile) return;
    const mirrorX = this.sideAssignment?.mirrorX ?? false;

    if (this.attackerProxy) {
      const start = resolvedSlotVec(this.attackerProxy.startSlot, mirrorX);
      const pos = start;
      const pulse = this.impactPulseFor(now, true);
      const faceSign = this.attackerProxy.faceSign;
      /**
       * CASTER MOTION is the sole source of caster movement. With no authored
       * motion the offset is exactly (0,0,0) and the unitRoot stays at its
       * start slot. Pose swaps only mutate the child poseVisual.
       */
      this.sampleUnitMotion('CASTER', now, pos, this.casterMotionOffset);
      this.attackerProxy.unitRoot.position.set(
        pos.x + this.casterMotionOffset.x,
        pos.y + this.casterMotionOffset.y,
        pos.z + this.casterMotionOffset.z,
      );
      const poseBase = this.attackerProxy.poseBasePosition;
      this.attackerProxy.poseVisual.position.set(poseBase.x * faceSign * pulse, poseBase.y * pulse, poseBase.z);
      this.attackerProxy.poseVisual.scale.set(faceSign * pulse, pulse, pulse);

      /**
       * V2.7 CASTER ANCHOR TRACKING — the VFX source proxy must follow the
       * caster's motion offset so CASTER-anchored VFX resolves to the caster's
       * actual world position, not its static slot coordinate.
       *
       * With no authored motion the offset is (0,0,0) and this is arithmetically
       * identical to the pre-V2.7 version — zero regression.
       */
      if (this.vfxSourceProxy?.grp) {
        this.vfxSourceProxy.grp.position.set(
          pos.x + this.casterMotionOffset.x,
          pos.y + this.casterMotionOffset.y,
          pos.z + this.casterMotionOffset.z,
        );
      }
    }

    for (let targetIndex = 0; targetIndex < this.targetProxies.length; targetIndex += 1) {
      const targetProxy = this.targetProxies[targetIndex]!;
      const base = resolvedSlotVec(targetProxy.startSlot, mirrorX);
      if (targetIndex === 0) this.sampleUnitMotion('TARGET', now, base, this.targetMotionOffset);
      const offset = targetIndex === 0 ? this.targetMotionOffset : null;
      const pulse = this.impactPulseFor(now, false);
      const faceSign = targetProxy.faceSign;
      targetProxy.unitRoot.position.set(
        base.x + (offset?.x ?? 0),
        base.y + (offset?.y ?? 0),
        base.z + (offset?.z ?? 0),
      );
      const poseBase = targetProxy.poseBasePosition;
      targetProxy.poseVisual.position.set(poseBase.x * faceSign * pulse, poseBase.y * pulse, poseBase.z);
      targetProxy.poseVisual.scale.set(faceSign * pulse, pulse, pulse);
      const targetRef = this.targetUnitRefs[targetIndex];
      const vfxTarget = targetRef ? this.vfxProxyMap.get(targetRef) : null;
      if (vfxTarget?.grp && vfxTarget !== this.vfxSourceProxy) {
        vfxTarget.grp.position.copy(targetProxy.unitRoot.position);
      }
      if (this.impactAtMs !== null) {
        const p = Math.min(1, (now - this.impactAtMs) / profile.impactPulseMs);
        const flash = 1 - easeOutCubic(p);
        targetProxy.mesh.material.color.setRGB(1, 1 - flash * 0.35, 1 - flash * 0.5);
      }
    }

    // KO proxy fade animation — faction-aware
    if (this.koFadingProxies.size > 0) {
      const fadeDuration = this.reducedGraphics ? 200 : 400;
      const fadeP = Math.min(1, (now - this.koFadeStartMs) / fadeDuration);
      for (const proxy of this.koFadingProxies) {
        if (proxy.faction === 'player') {
          // Player KO: fade to 0.34 (resurrection marker visible)
          proxy.mesh.material.opacity = 1 - fadeP * 0.66;
          // Red tint
          const r = 1;
          const g = 1 - 0.65 * fadeP;
          const b = 1 - 0.71 * fadeP;
          proxy.mesh.material.color.setRGB(r, g, b);
        } else {
          // Enemy KO: fade to 0 (disappears)
          proxy.mesh.material.opacity = 1 - fadeP;
        }
      }
    }
  }

  private sampleUnitMotion(
    actor: CombatActorRole,
    now: number,
    actorBase: THREE.Vector3,
    out: MutableVec3,
  ): void {
    if (!unitMotionHasEffectForActor(this.unitMotion, actor)) {
      out.x = 0;
      out.y = 0;
      out.z = 0;
      return;
    }
    const t = (now - this.unitMotionStartedAtMs) / 1000;
    sampleUnitMotionOffset(
      this.unitMotion,
      t,
      actor,
      (anchor, destination) => this.resolveUnitMotionAnchor(actor, anchor, actorBase, destination),
      out,
      this.activatedUnitMotionStepIds,
    );
  }

  /** Resolves ORIGIN and actor-relative counterpart anchors from Stage slots. */
  private resolveUnitMotionAnchor(
    actor: CombatActorRole,
    anchor: VfxAnchor,
    actorBase: THREE.Vector3,
    out: MutableVec3,
  ): void {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    const ownAnchor = actor === 'CASTER' ? 'source' : 'target';
    if (anchor === ownAnchor) return;

    const mirrorX = this.sideAssignment?.mirrorX ?? false;
    const counterpart = actor === 'CASTER' ? this.targetProxies[0] : this.attackerProxy;
    const counterpartSlot = counterpart?.startSlot ?? (actor === 'CASTER' ? 'primaryTarget' : null);
    if (!counterpartSlot) return;
    const counterpartPoint = resolveStageSlotCoordinate(counterpartSlot, mirrorX);
    this.unitAnchorDelta.set(
      counterpartPoint.x - actorBase.x,
      0,
      counterpartPoint.z - actorBase.z,
    );

    const frontAnchor = actor === 'CASTER' ? 'targetFront' : 'sourceFront';
    const backAnchor = actor === 'CASTER' ? 'targetBack' : 'sourceBack';
    if (anchor === frontAnchor || anchor === backAnchor) {
      const axisLength = this.unitAnchorDelta.length();
      if (axisLength > 1e-6) {
        const sign = anchor === frontAnchor ? -1 : 1;
        const shift = Math.min(CASTER_MOTION_FLANK_OFFSET, axisLength * 0.5);
        this.unitAnchorDelta.multiplyScalar(1 + (sign * shift) / axisLength);
      }
    }

    out.x = this.unitAnchorDelta.x;
    out.z = this.unitAnchorDelta.z;
  }

  private resetUnitRootsToSlots(): void {
    const mirrorX = this.sideAssignment?.mirrorX ?? false;
    if (this.attackerProxy) {
      const base = resolvedSlotVec(this.attackerProxy.startSlot, mirrorX);
      this.attackerProxy.unitRoot.position.copy(base);
      if (this.vfxSourceProxy?.grp) this.vfxSourceProxy.grp.position.copy(base);
    }
    for (let index = 0; index < this.targetProxies.length; index += 1) {
      const proxy = this.targetProxies[index]!;
      const base = resolvedSlotVec(proxy.startSlot, mirrorX);
      proxy.unitRoot.position.copy(base);
      const targetRef = this.targetUnitRefs[index];
      const vfxTarget = targetRef ? this.vfxProxyMap.get(targetRef) : null;
      if (vfxTarget?.grp && vfxTarget !== this.vfxSourceProxy) vfxTarget.grp.position.copy(base);
    }
  }

  private impactPulseFor(now: number, isAttacker: boolean): number {
    const profile = this.activeProfile;
    if (!profile || this.impactAtMs === null) return 1;
    const p = (now - this.impactAtMs) / profile.impactPulseMs;
    if (p >= 1) return 1;
    const amount = isAttacker ? 0.14 : -0.1;
    return 1 + punchEnvelope(p) * amount;
  }
}
