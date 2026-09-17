import * as THREE from 'three';
import { CombatStage, type StageSpriteSource } from '../../combat/stage/CombatStage';
import {
  PILOT_RUNTIME_UNITS,
  parseRuntimeProofEnvironment,
  parseRuntimeProofScenario,
  runtimePlaneSize,
  visibleAlphaHeightPx,
  worldUnitsPerSourcePixel,
  type PilotRuntimeUnit,
  type PilotUnitId,
  type RuntimeProofScenario,
} from './runtimeProofConfig';

const STAGE_PROXY_Y_SINK = 0.08;
const READABILITY_MIN_HEIGHT_PX = 120;
const WEAPON_SILHOUETTE_MIN_WIDTH_PX = 82;
const VFX_TOP_CLEARANCE_MIN_PX = 52;
const VFX_SIDE_CLEARANCE_MIN_PX = 36;
const PIXEL_DENSITY_MAX_RATIO = 1.3;
const BACKGROUND_DELTA_MIN = 28;

interface PilotManifest {
  status: string;
  units: Array<{
    unitId: string;
    worldUnitsPerPixel: number;
    poses: Record<string, {
      src: string;
      sourceSizePx: { width: number; height: number };
      alphaBoundsPx: { left: number; top: number; right: number; bottom: number };
      anchor: { x: number; y: number };
      scaleCorrection: number;
    }>;
  }>;
}

interface UnitRuntimeRecord {
  config: PilotRuntimeUnit;
  source: StageSpriteSource;
  texture: THREE.Texture;
  blob: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  root: THREE.Group | null;
  poseVisual: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null;
}

interface ScreenPoint {
  x: number;
  y: number;
}

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface UnitProofMetrics {
  id: PilotUnitId;
  displayName: string;
  scaleCorrection: number;
  targetWorldHeight: number;
  measuredVisibleWorldHeight: number;
  planeWorldSize: readonly [number, number];
  footBaselinePx: number;
  pivotPx: readonly [number, number];
  alphaBBoxPx: readonly [number, number, number, number];
  sourcePixelsPerWorldUnit: number;
  screenRectPx: ScreenRect;
  screenBaselinePx: ScreenPoint;
  screenPixelsPerWorldUnit: number;
  groundContactErrorWorld: number;
  topClearancePx: number;
  sideClearancePx: number;
  foregroundBackgroundDelta: number;
  checks: {
    manifestLock: 'PASS';
    scaleCorrection: 'PASS' | 'FAIL';
    groundContact: 'PASS' | 'FAIL';
    silhouetteReadability: 'PASS' | 'FAIL';
    weaponReadability: 'PASS' | 'FAIL';
    backgroundContrast: 'PASS' | 'FAIL';
    vfxSafeSpace: 'PASS' | 'FAIL';
  };
}

export interface CombatPosesV2RuntimeProofResult {
  schemaVersion: 1;
  status: 'PASS' | 'FAIL';
  devOnly: true;
  canonicalAssetsPromoted: true;
  gameplayChanged: false;
  combatLogicChanged: false;
  vfxChanged: false;
  environmentChanged: false;
  camera: 'CombatStage.OrthographicCamera';
  grounding: 'CombatStage proxy root + manifest baseline';
  viewport: { width: number; height: number; devicePixelRatio: number };
  scenario: { id: string; label: string };
  environment: { requestedAssetId: string; runtimeEnvironmentId: string };
  profile: { id: string; cameraFrustumHalfHeight: number; targetSlots: readonly string[] };
  units: UnitProofMetrics[];
  checks: {
    assetManifestLock: 'PASS';
    relativeSizeHierarchy: 'PASS' | 'FAIL';
    grounding: 'PASS' | 'FAIL';
    pixelDensityCoherence: 'PASS' | 'FAIL';
    silhouetteReadability: 'PASS' | 'FAIL';
    weaponReadability: 'PASS' | 'FAIL';
    backgroundContrast: 'PASS' | 'FAIL';
    vfxSafeSpace: 'PASS' | 'FAIL';
  };
  pixelDensityRatio: number;
  minimumInterUnitGapPx: number | null;
}

declare global {
  interface Window {
    __OPTION_C_COMBAT_POSES_V2_PROOF__?: CombatPosesV2RuntimeProofResult;
  }
}

function sameNumbers(actual: readonly number[], expected: readonly number[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

async function validateManifest(unit: PilotRuntimeUnit): Promise<void> {
  const response = await fetch(unit.manifestUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Manifest request failed for ${unit.id}: HTTP ${response.status}`);
  const manifest = await response.json() as PilotManifest;
  const manifestUnit = manifest.units.find((candidate) => candidate.unitId === unit.combatPoseUnitId);
  const pose = manifestUnit?.poses[unit.pose];
  const bounds = pose?.alphaBoundsPx;
  const valid = manifest.status === 'PROMOTED'
    && manifestUnit?.worldUnitsPerPixel === unit.worldUnitsPerPixel
    && pose?.src === unit.imageUrl
    && pose.scaleCorrection === unit.scaleCorrection
    && pose.sourceSizePx.width === unit.sourceSizePx[0]
    && pose.sourceSizePx.height === unit.sourceSizePx[1]
    && sameNumbers([pose.anchor.x, pose.anchor.y], unit.pivotPx)
    && Boolean(bounds)
    && sameNumbers([bounds!.left, bounds!.top, bounds!.right, bounds!.bottom], unit.alphaBBoxPx);
  if (!valid) throw new Error(`Runtime proof config drifted from ${unit.id} manifest metadata.`);
}

function createShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the Combat Stage contact shadow texture.');
  const gradient = context.createRadialGradient(64, 32, 2, 64, 32, 62);
  gradient.addColorStop(0, 'rgba(0,0,0,.82)');
  gradient.addColorStop(0.48, 'rgba(0,0,0,.48)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function projectToScreen(
  point: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number,
): ScreenPoint {
  const projected = point.clone().project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * width,
    y: (-projected.y * 0.5 + 0.5) * height,
  };
}

function round(value: number, digits = 3): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function roundRect(rect: ScreenRect): ScreenRect {
  return {
    left: round(rect.left),
    top: round(rect.top),
    right: round(rect.right),
    bottom: round(rect.bottom),
    width: round(rect.width),
    height: round(rect.height),
  };
}

function screenRectFor(
  record: UnitRuntimeRecord,
  camera: THREE.Camera,
  width: number,
  height: number,
): { rect: ScreenRect; baseline: ScreenPoint; measuredWorldHeight: number } {
  const root = record.root;
  const mesh = record.poseVisual;
  if (!root || !mesh) throw new Error(`Missing staged proxy for ${record.config.id}.`);
  root.updateMatrixWorld(true);
  const unit = record.config;
  const unitsPerPixel = worldUnitsPerSourcePixel(unit);
  const [leftPx, topPx, rightPx, bottomPx] = unit.alphaBBoxPx;
  const pivotX = unit.pivotPx[0];
  const facing = Math.sign(mesh.scale.x) || 1;
  const xA = root.position.x + (leftPx - pivotX) * unitsPerPixel * facing;
  const xB = root.position.x + (rightPx - pivotX) * unitsPerPixel * facing;
  const baselineWorldY = root.position.y - STAGE_PROXY_Y_SINK;
  const topWorldY = baselineWorldY + (bottomPx - topPx) * unitsPerPixel;
  const bottomWorldY = baselineWorldY + (bottomPx - unit.footBaselinePx) * unitsPerPixel;
  const leftWorldX = Math.min(xA, xB);
  const rightWorldX = Math.max(xA, xB);
  const corners = [
    projectToScreen(new THREE.Vector3(leftWorldX, topWorldY, root.position.z), camera, width, height),
    projectToScreen(new THREE.Vector3(rightWorldX, topWorldY, root.position.z), camera, width, height),
    projectToScreen(new THREE.Vector3(leftWorldX, bottomWorldY, root.position.z), camera, width, height),
    projectToScreen(new THREE.Vector3(rightWorldX, bottomWorldY, root.position.z), camera, width, height),
  ];
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const rect = {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
  return {
    rect,
    baseline: projectToScreen(
      new THREE.Vector3(root.position.x, baselineWorldY, root.position.z),
      camera,
      width,
      height,
    ),
    measuredWorldHeight: topWorldY - bottomWorldY,
  };
}

function readFrame(renderer: THREE.WebGLRenderer): Uint8Array {
  const gl = renderer.getContext();
  const pixels = new Uint8Array(renderer.domElement.width * renderer.domElement.height * 4);
  gl.readPixels(0, 0, renderer.domElement.width, renderer.domElement.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return pixels;
}

function foregroundBackgroundDelta(
  full: Uint8Array,
  background: Uint8Array,
  rect: ScreenRect,
  width: number,
  height: number,
): number {
  const left = Math.max(0, Math.floor(rect.left));
  const right = Math.min(width - 1, Math.ceil(rect.right));
  const top = Math.max(0, Math.floor(rect.top));
  const bottom = Math.min(height - 1, Math.ceil(rect.bottom));
  let changed = 0;
  let deltaSum = 0;
  for (let screenY = top; screenY <= bottom; screenY += 1) {
    const glY = height - 1 - screenY;
    for (let x = left; x <= right; x += 1) {
      const offset = (glY * width + x) * 4;
      const delta = (
        Math.abs(full[offset]! - background[offset]!)
        + Math.abs(full[offset + 1]! - background[offset + 1]!)
        + Math.abs(full[offset + 2]! - background[offset + 2]!)
      ) / 3;
      if (delta >= 8) {
        changed += 1;
        deltaSum += delta;
      }
    }
  }
  return changed > 0 ? deltaSum / changed : 0;
}

function minimumInterUnitGap(rects: ScreenRect[]): number | null {
  if (rects.length < 2) return null;
  const sorted = [...rects].sort((a, b) => a.left - b.left);
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < sorted.length; index += 1) {
    minimum = Math.min(minimum, sorted[index]!.left - sorted[index - 1]!.right);
  }
  return round(minimum);
}

function addStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.dataset.optionCCombatPosesV2 = 'true';
  style.textContent = `
    .option-c-v2-proof { position: fixed; inset: 0; z-index: 8; pointer-events: none; color: #fff6df; font-family: Inter, system-ui, sans-serif; }
    .option-c-v2-proof__header { position: absolute; top: 18px; left: 20px; max-width: min(640px, calc(100vw - 40px)); padding: 12px 15px; border: 1px solid rgba(246,219,145,.48); background: rgba(5,8,14,.78); box-shadow: 0 8px 32px rgba(0,0,0,.34); }
    .option-c-v2-proof__eyebrow { margin: 0 0 4px; color: #f6db91; font: 700 10px/1.2 Cinzel, serif; letter-spacing: .2em; text-transform: uppercase; }
    .option-c-v2-proof__title { margin: 0; font: 600 clamp(15px, 1.45vw, 22px)/1.2 Cinzel, serif; }
    .option-c-v2-proof__meta { margin: 5px 0 0; color: #cbd6df; font-size: 11px; letter-spacing: .04em; }
    .option-c-v2-proof__legend { position: absolute; right: 18px; bottom: 16px; display: flex; gap: 7px; align-items: end; }
    .option-c-v2-proof__unit { min-width: 122px; padding: 8px 10px; border-top: 2px solid #d9b25a; background: rgba(5,8,14,.76); box-shadow: 0 6px 24px rgba(0,0,0,.32); }
    .option-c-v2-proof__unit strong { display: block; font: 600 11px/1.2 Cinzel, serif; color: #fff2cf; }
    .option-c-v2-proof__unit span { display: block; margin-top: 3px; color: #becbd6; font-size: 9px; white-space: nowrap; }
    .option-c-v2-proof__status { position: absolute; left: 20px; bottom: 18px; padding: 7px 10px; border: 1px solid rgba(101,197,155,.58); background: rgba(4,14,12,.78); color: #9be2c4; font: 700 10px/1.2 Inter, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
  `;
  document.head.appendChild(style);
  return style;
}

export class CombatPosesV2RuntimeProof {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly scenario: RuntimeProofScenario;
  private readonly environmentId: ReturnType<typeof parseRuntimeProofEnvironment>;
  private renderer: THREE.WebGLRenderer | null = null;
  private stage: CombatStage | null = null;
  private style: HTMLStyleElement | null = null;
  private shadowTexture: THREE.Texture | null = null;
  private records: UnitRuntimeRecord[] = [];
  private resizeHandler = () => this.resize();

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    this.root = root;
    this.canvas = canvas;
    const params = new URLSearchParams(window.location.search);
    this.scenario = parseRuntimeProofScenario(params.get('scenario'));
    this.environmentId = parseRuntimeProofEnvironment(params.get('environment'), this.scenario.environmentId);
  }

  async start(): Promise<void> {
    try {
      this.root.replaceChildren();
      document.body.dataset.optionCCombatPosesV2Ready = 'false';
      document.body.dataset.optionCCombatPosesV2Scenario = this.scenario.id;
      document.body.dataset.optionCCombatPosesV2Environment = `${this.environmentId}_stage`;
      document.body.dataset.optionCCombatPosesV2CanonicalPromotion = 'false';

      const selectedIds = [this.scenario.attacker, ...this.scenario.targets];
      const selectedUnits = selectedIds.map((id) => PILOT_RUNTIME_UNITS[id]);
      await Promise.all(selectedUnits.map(validateManifest));

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setPixelRatio(1);
      this.renderer.setClearColor(0x05070c, 1);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);

      const tacticalScene = new THREE.Scene();
      const tacticalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 100);
      const renderPass = { scene: tacticalScene, camera: tacticalCamera as THREE.Camera };
      this.stage = new CombatStage({
        renderPass,
        tacticalScene,
        tacticalCamera,
        tiltShiftStrength: { value: 0.5 },
        width: window.innerWidth,
        height: window.innerHeight,
      });

      this.shadowTexture = createShadowTexture();
      this.records = await Promise.all(selectedUnits.map((unit) => this.createUnitRecord(unit)));
      const byId = new Map(this.records.map((record) => [record.config.id, record]));
      const attacker = byId.get(this.scenario.attacker);
      const targets = this.scenario.targets.map((id) => byId.get(id));
      if (!attacker || targets.some((record) => !record)) throw new Error('Runtime proof actor selection is incomplete.');

      const entered = await this.stage.enter(
        attacker.source,
        targets.map((record) => record!.source),
        { key: '__option_c_combat_poses_v2_runtime_proof' },
        {
          reducedGraphics: true,
          environmentId: this.environmentId,
          profile: this.scenario.profile,
          sourceTeam: 'player',
        },
      );
      if (!entered) throw new Error('CombatStage refused the DEV runtime proof composition.');

      await Promise.all(this.records.map((record) => this.stage!.setCombatUnitPose(
        record.source,
        record.config.pose,
      )));

      // One production tick installs the camera-local environment transform.
      // The static proof uses the production registry's authored anchors and
      // one shared pixel scale; no per-pose fitting or body scaling is involved.
      this.stage.tick(0);
      this.bindAndGroundProxies();
      this.renderer.render(this.stage.scene, this.stage.camera);
      const result = this.measure();
      window.__OPTION_C_COMBAT_POSES_V2_PROOF__ = result;
      this.renderOverlay(result);
      document.body.dataset.optionCCombatPosesV2Status = result.status;
      document.body.dataset.optionCCombatPosesV2Ready = 'true';
      window.addEventListener('resize', this.resizeHandler);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Option C Combat Poses V2 runtime proof]', error);
      document.body.dataset.optionCCombatPosesV2Failure = message;
      document.body.dataset.optionCCombatPosesV2Ready = 'false';
      throw error;
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.stage?.dispose();
    this.stage = null;
    for (const record of this.records) {
      record.texture.dispose();
      record.blob.geometry.dispose();
      record.blob.material.dispose();
    }
    this.records = [];
    this.shadowTexture?.dispose();
    this.shadowTexture = null;
    this.renderer?.dispose();
    this.renderer = null;
    this.style?.remove();
    this.style = null;
    this.root.replaceChildren();
    delete window.__OPTION_C_COMBAT_POSES_V2_PROOF__;
  }

  private async createUnitRecord(config: PilotRuntimeUnit): Promise<UnitRuntimeRecord> {
    const texture = await new THREE.TextureLoader().loadAsync(config.imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    const [planeWidth, planeHeight] = runtimePlaneSize(config);
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(...config.contactShadowSize),
      new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        color: 0xffffff,
      }),
    );
    const source: StageSpriteSource = {
      name: config.displayName,
      team: config.team,
      combatPoseUnitId: config.combatPoseUnitId,
      spr: {
        material: { map: texture },
        geometry: { parameters: { width: planeWidth, height: planeHeight } },
      },
      blob,
      alive: true,
      downed: false,
    };
    return { config, source, texture, blob, root: null, poseVisual: null };
  }

  private bindAndGroundProxies(): void {
    if (!this.stage) throw new Error('CombatStage is not initialized.');
    for (const record of this.records) {
      const root = this.stage.scene.getObjectByName(`CombatStageUnitRoot:${record.config.displayName}`);
      const poseVisual = root?.getObjectByName('poseVisual');
      if (!(root instanceof THREE.Group) || !(poseVisual instanceof THREE.Mesh)) {
        throw new Error(`CombatStage proxy lookup failed for ${record.config.displayName}.`);
      }
      const mesh = poseVisual as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      record.root = root;
      record.poseVisual = mesh;
    }
  }

  private measure(): CombatPosesV2RuntimeProofResult {
    if (!this.renderer || !this.stage) throw new Error('Runtime proof measurement requested before initialization.');
    const width = this.renderer.domElement.width;
    const height = this.renderer.domElement.height;
    const rectRecords = this.records.map((record) => ({ record, ...screenRectFor(record, this.stage!.camera, width, height) }));

    for (const { record } of rectRecords) record.poseVisual!.visible = false;
    this.renderer.render(this.stage.scene, this.stage.camera);
    const backgroundPixels = readFrame(this.renderer);
    for (const { record } of rectRecords) record.poseVisual!.visible = true;
    this.renderer.render(this.stage.scene, this.stage.camera);
    const fullPixels = readFrame(this.renderer);

    const units: UnitProofMetrics[] = rectRecords.map(({ record, rect, baseline, measuredWorldHeight }) => {
      const config = record.config;
      const delta = foregroundBackgroundDelta(fullPixels, backgroundPixels, rect, width, height);
      const sideClearance = Math.min(rect.left, width - rect.right);
      const topClearance = rect.top;
      const [, planeHeight] = runtimePlaneSize(config);
      const actualBaselineWorldY = record.root!.position.y
        + record.poseVisual!.position.y
        + planeHeight * (0.5 - config.footBaselinePx / config.sourceSizePx[1]);
      const expectedBaselineWorldY = record.root!.position.y - STAGE_PROXY_Y_SINK;
      const groundContactErrorWorld = Math.abs(actualBaselineWorldY - expectedBaselineWorldY);
      return {
        id: config.id,
        displayName: config.displayName,
        scaleCorrection: config.scaleCorrection,
        targetWorldHeight: config.targetWorldHeight,
        measuredVisibleWorldHeight: round(measuredWorldHeight, 6),
        planeWorldSize: runtimePlaneSize(config).map((value) => round(value, 6)) as [number, number],
        footBaselinePx: config.footBaselinePx,
        pivotPx: config.pivotPx,
        alphaBBoxPx: config.alphaBBoxPx,
        sourcePixelsPerWorldUnit: round(1 / worldUnitsPerSourcePixel(config), 4),
        screenRectPx: roundRect(rect),
        screenBaselinePx: { x: round(baseline.x), y: round(baseline.y) },
        screenPixelsPerWorldUnit: round(rect.height / measuredWorldHeight, 4),
        groundContactErrorWorld,
        topClearancePx: round(topClearance),
        sideClearancePx: round(sideClearance),
        foregroundBackgroundDelta: round(delta),
        checks: {
          manifestLock: 'PASS',
          scaleCorrection: config.scaleCorrection === 1 ? 'PASS' : 'FAIL',
          groundContact: groundContactErrorWorld <= 0.001 ? 'PASS' : 'FAIL',
          silhouetteReadability: rect.height >= READABILITY_MIN_HEIGHT_PX ? 'PASS' : 'FAIL',
          weaponReadability: rect.width >= WEAPON_SILHOUETTE_MIN_WIDTH_PX ? 'PASS' : 'FAIL',
          backgroundContrast: delta >= BACKGROUND_DELTA_MIN ? 'PASS' : 'FAIL',
          vfxSafeSpace: topClearance >= VFX_TOP_CLEARANCE_MIN_PX && sideClearance >= VFX_SIDE_CLEARANCE_MIN_PX ? 'PASS' : 'FAIL',
        },
      };
    });

    const sourceDensities = units.map((unit) => unit.sourcePixelsPerWorldUnit);
    const pixelDensityRatio = Math.max(...sourceDensities) / Math.min(...sourceDensities);
    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    const hierarchy = PILOT_RUNTIME_UNITS.goblin.targetWorldHeight < PILOT_RUNTIME_UNITS.alistair.targetWorldHeight
      && PILOT_RUNTIME_UNITS.alistair.targetWorldHeight < PILOT_RUNTIME_UNITS['lion-champion'].targetWorldHeight;
    const relevantHierarchy = this.scenario.id !== 'all-three' || (
      unitById.has('goblin') && unitById.has('alistair') && unitById.has('lion-champion') && hierarchy
    );
    const all = (selector: (unit: UnitProofMetrics) => 'PASS' | 'FAIL') => units.every((unit) => selector(unit) === 'PASS');
    const checks: CombatPosesV2RuntimeProofResult['checks'] = {
      assetManifestLock: 'PASS',
      relativeSizeHierarchy: relevantHierarchy ? 'PASS' : 'FAIL',
      grounding: all((unit) => unit.checks.groundContact) ? 'PASS' : 'FAIL',
      pixelDensityCoherence: pixelDensityRatio <= PIXEL_DENSITY_MAX_RATIO ? 'PASS' : 'FAIL',
      silhouetteReadability: all((unit) => unit.checks.silhouetteReadability) ? 'PASS' : 'FAIL',
      weaponReadability: all((unit) => unit.checks.weaponReadability) ? 'PASS' : 'FAIL',
      backgroundContrast: all((unit) => unit.checks.backgroundContrast) ? 'PASS' : 'FAIL',
      vfxSafeSpace: all((unit) => unit.checks.vfxSafeSpace) ? 'PASS' : 'FAIL',
    };
    const status = Object.values(checks).every((value) => value === 'PASS') ? 'PASS' : 'FAIL';
    return {
      schemaVersion: 1,
      status,
      devOnly: true,
      canonicalAssetsPromoted: true,
      gameplayChanged: false,
      combatLogicChanged: false,
      vfxChanged: false,
      environmentChanged: false,
      camera: 'CombatStage.OrthographicCamera',
      grounding: 'CombatStage proxy root + manifest baseline',
      viewport: { width, height, devicePixelRatio: window.devicePixelRatio },
      scenario: { id: this.scenario.id, label: this.scenario.label },
      environment: { requestedAssetId: `${this.environmentId}_stage`, runtimeEnvironmentId: this.environmentId },
      profile: {
        id: this.scenario.profile.id,
        cameraFrustumHalfHeight: this.scenario.profile.cameraFrustumHalfHeight,
        targetSlots: this.scenario.profile.targetSlots,
      },
      units,
      checks,
      pixelDensityRatio: round(pixelDensityRatio, 4),
      minimumInterUnitGapPx: minimumInterUnitGap(units.map((unit) => unit.screenRectPx)),
    };
  }

  private renderOverlay(result: CombatPosesV2RuntimeProofResult): void {
    this.style = addStyles();
    const overlay = document.createElement('section');
    overlay.className = 'option-c-v2-proof';
    overlay.setAttribute('aria-label', 'Option C Combat Poses V2 runtime scale proof');
    const header = document.createElement('header');
    header.className = 'option-c-v2-proof__header';
    header.innerHTML = `
      <p class="option-c-v2-proof__eyebrow">DEV ONLY · COMBAT STAGE RUNTIME</p>
      <h1 class="option-c-v2-proof__title">${this.scenario.label}</h1>
      <p class="option-c-v2-proof__meta">${this.environmentId}_stage · ${result.viewport.width}×${result.viewport.height} · real Stage camera + grounding</p>
    `;
    const legend = document.createElement('div');
    legend.className = 'option-c-v2-proof__legend';
    for (const unit of result.units) {
      const item = document.createElement('div');
      item.className = 'option-c-v2-proof__unit';
      item.innerHTML = `<strong>${unit.displayName}</strong><span>${unit.targetWorldHeight.toFixed(2)}u · ${this.records.find((record) => record.config.id === unit.id)?.config.pose.toUpperCase()} · correction ${unit.scaleCorrection.toFixed(1)}</span>`;
      legend.appendChild(item);
    }
    const status = document.createElement('div');
    status.className = 'option-c-v2-proof__status';
    status.textContent = `${result.status} · full assets untouched`;
    overlay.append(header, legend, status);
    this.root.appendChild(overlay);
  }

  private resize(): void {
    if (!this.renderer || !this.stage) return;
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.stage.handleResize(window.innerWidth, window.innerHeight);
    this.stage.tick(0);
    this.bindAndGroundProxies();
    this.renderer.render(this.stage.scene, this.stage.camera);
  }
}
