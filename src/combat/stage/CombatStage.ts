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
import type { VfxUnitLike } from '../vfx/VfxTypes';

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
  /** When true, attacker stays anchored at its home slot (boss/elite). No approach/recoil motion. */
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

interface StageActorProxy {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  startSlot: StageSlotId;
  impactSlot: StageSlotId;
  isAttacker: boolean;
  baseHeight: number;
  faction: StageFactionSide;
  isKO: boolean;
  /** Y offset applied to sink player sprites to match enemy grounding. */
  groundOffset: number;
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

  private vfxSourceProxy: VfxUnitLike | null = null;
  private vfxProxyMap = new Map<unknown, VfxUnitLike>();

  private motionStartedAtMs = 0;
  private impactAtMs: number | null = null;
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

  /** Test accessor: attacker proxy world position X, or null. */
  attackerProxyPosition(): THREE.Vector3 | null {
    if (!this.attackerProxy) return null;
    return this.attackerProxy.mesh.position.clone();
  }

  /** Test accessor: target proxy world position by index, or null. */
  targetProxyPosition(index: number): THREE.Vector3 | null {
    const proxy = this.targetProxies[index];
    if (!proxy) return null;
    return proxy.mesh.position.clone();
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
      return this.attackerProxy.mesh.position.clone().add(new THREE.Vector3(0, this.attackerProxy.baseHeight * 0.55, 0));
    }
    const idx = this.targetUnitRefs.indexOf(unit);
    if (idx >= 0 && this.targetProxies[idx]) {
      return this.targetProxies[idx].mesh.position.clone().add(new THREE.Vector3(0, this.targetProxies[idx].baseHeight * 0.55, 0));
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

  private createProxy(
    source: StageSpriteSource | null | undefined,
    startSlot: StageSlotId,
    impactSlot: StageSlotId,
    isAttacker: boolean,
    faction: StageFactionSide,
  ): StageActorProxy | null {
    const spr = source && source.spr;
    const map = spr && spr.material && spr.material.map ? spr.material.map : null;
    if (!map) return null;
    const params = (spr && spr.geometry && spr.geometry.parameters) || {};
    const width = typeof params.width === 'number' && params.width > 0 ? params.width : 1.4;
    const height = typeof params.height === 'number' && params.height > 0 ? params.height : 1.9;

    // Owns geometry + material. Borrows (never disposes) the tactical texture.
    const material = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    const mirrorX = this.sideAssignment?.mirrorX ?? false;
    const start = resolvedSlotVec(startSlot, mirrorX);
    const groundOffset = faction === 'player' ? height * STAGE_HERO_GROUND_OFFSET : 0;
    mesh.position.set(start.x, start.y + height * 0.5 - groundOffset - STAGE_PROXY_Y_SINK, start.z);
    // Player units face right (toward enemy), enemy units face left (toward player).
    const faceSign = faction === 'player' ? 1 : -1;
    mesh.scale.x = faceSign;
    mesh.renderOrder = isAttacker ? 10 : 11;

    // P2: Already-KO targets enter Stage with KO visual appearance
    const isKO = !isAttacker && source != null && source.alive === false && source.downed === true;
    if (isKO) {
      material.opacity = 0.34;
      material.color.set('#ff5a4a');
    }

    this.scene.add(mesh);
    return { mesh, startSlot, impactSlot, isAttacker, baseHeight: height, faction, isKO, groundOffset };
  }

  private disposeProxies(): void {
    if (this.attackerProxy) {
      this.scene.remove(this.attackerProxy.mesh);
      this.attackerProxy.mesh.geometry.dispose();
      this.attackerProxy.mesh.material.dispose();
      this.attackerProxy = null;
    }
    for (const proxy of this.targetProxies) {
      this.scene.remove(proxy.mesh);
      proxy.mesh.geometry.dispose();
      proxy.mesh.material.dispose();
    }
    this.targetProxies = [];
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
    const skipApproach = (this.reducedGraphics && Boolean(profile.reducedGraphicsSkipApproach)) || this.stationaryAttacker;

    if (this.attackerProxy) {
      const start = resolvedSlotVec(this.attackerProxy.startSlot, mirrorX);
      const impact = this.stationaryAttacker ? start : resolvedSlotVec(this.attackerProxy.impactSlot, mirrorX);
      const height = this.attackerProxy.baseHeight;
      let pos: THREE.Vector3;
      if (this.impactAtMs === null) {
        const approachMs = skipApproach ? 0 : profile.approachMs;
        const p = approachMs > 0 ? easeOutCubic((now - this.motionStartedAtMs) / approachMs) : 1;
        pos = start.clone().lerp(impact, p);
      } else if (profile.recoilMs > 0 && !this.stationaryAttacker) {
        const p = easeOutCubic((now - this.impactAtMs) / profile.recoilMs);
        pos = impact.clone().lerp(start, p);
      } else {
        pos = this.stationaryAttacker ? start : impact;
      }
      const pulse = this.impactPulseFor(now, true);
      const faceSign = this.attackerProxy.faction === 'player' ? 1 : -1;
      this.attackerProxy.mesh.position.set(pos.x, pos.y + height * 0.5 - this.attackerProxy.groundOffset - STAGE_PROXY_Y_SINK, pos.z);
      this.attackerProxy.mesh.scale.set(faceSign * pulse, pulse, pulse);
    }

    for (const targetProxy of this.targetProxies) {
      const base = resolvedSlotVec(targetProxy.startSlot, mirrorX);
      const height = targetProxy.baseHeight;
      const pulse = this.impactPulseFor(now, false);
      const faceSign = targetProxy.faction === 'player' ? 1 : -1;
      targetProxy.mesh.position.set(base.x, base.y + height * 0.5 - targetProxy.groundOffset - STAGE_PROXY_Y_SINK, base.z);
      targetProxy.mesh.scale.set(faceSign * pulse, pulse, pulse);
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

  private impactPulseFor(now: number, isAttacker: boolean): number {
    const profile = this.activeProfile;
    if (!profile || this.impactAtMs === null) return 1;
    const p = (now - this.impactAtMs) / profile.impactPulseMs;
    if (p >= 1) return 1;
    const amount = isAttacker ? 0.14 : -0.1;
    return 1 + punchEnvelope(p) * amount;
  }
}
