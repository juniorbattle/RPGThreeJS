export interface CameraState {
  tx: number;
  ty: number;
  tz: number;
  dist: number;
  height: number;
  yaw: number;
  fov: number;
}

export interface CameraPoint {
  x: number;
  y: number;
  z: number;
}

export interface ShakeRequest {
  token: string;
  magnitude: number;
  duration: number;
  frequency?: number;
  accent?: boolean;
}

export interface ShakeSample {
  x: number;
  y: number;
  active: boolean;
}

export interface CombatCameraPolicy {
  staticCombatCamera: boolean;
  shakeEnabled: boolean;
  maxShakeMagnitude: number;
}

interface ShakeEnvelope extends Required<ShakeRequest> {
  elapsed: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const copyCameraState = (state: CameraState): CameraState => ({ ...state });

export const STATIC_COMBAT_CAMERA_POLICY: Readonly<CombatCameraPolicy> = Object.freeze({
  staticCombatCamera: true,
  shakeEnabled: true,
  maxShakeMagnitude: 0.035,
});

export function snapshotCameraState(state: Omit<CameraState, 'fov'>, fov: number): CameraState {
  return { ...state, fov };
}

export function beginActionFrame(state: Omit<CameraState, 'fov'>, fov: number): CameraState {
  return snapshotCameraState(state, fov);
}

export function frameActiveUnit(baseline: CameraState, _actor?: CameraPoint): CameraState {
  return copyCameraState(baseline);
}

export function frameCombatStage(baseline: CameraState, _points: readonly CameraPoint[] = []): CameraState {
  return copyCameraState(baseline);
}

export function frameAction(baseline: CameraState, _actor?: CameraPoint, _target?: CameraPoint): CameraState {
  return copyCameraState(baseline);
}

export function frameBossAction(baseline: CameraState, _actor?: CameraPoint, _target?: CameraPoint): CameraState {
  return copyCameraState(baseline);
}

export function frameAoeAction(baseline: CameraState, _center?: CameraPoint): CameraState {
  return copyCameraState(baseline);
}

export function restoreCamera(baseline: CameraState): CameraState {
  return copyCameraState(baseline);
}

export function applyAdditiveCameraShake(position: CameraPoint, shake: ShakeSample): CameraPoint {
  return { x: position.x + shake.x, y: position.y + shake.y, z: position.z };
}

export class CombatCameraFeedback {
  private envelope: ShakeEnvelope | null = null;

  constructor(private readonly policy: Readonly<CombatCameraPolicy> = STATIC_COMBAT_CAMERA_POLICY) {}

  request(request: ShakeRequest): boolean {
    if (!this.policy.shakeEnabled) return false;
    const normalized: ShakeEnvelope = {
      token: request.token,
      magnitude: clamp(request.magnitude, 0, this.policy.maxShakeMagnitude),
      duration: Math.max(0, request.duration),
      frequency: Math.max(1, request.frequency ?? 18),
      accent: Boolean(request.accent),
      elapsed: 0,
    };
    if (!normalized.magnitude || !normalized.duration) return false;
    const active = this.envelope;
    if (active && active.token === normalized.token) {
      active.magnitude = Math.max(active.magnitude, normalized.magnitude);
      active.duration = Math.max(active.duration, active.elapsed + normalized.duration * (normalized.accent ? 0.6 : 1));
      active.frequency = Math.min(active.frequency, normalized.frequency);
      active.accent ||= normalized.accent;
      return false;
    }
    this.envelope = normalized;
    return true;
  }

  tick(deltaSeconds: number): void {
    if (!this.envelope) return;
    this.envelope.elapsed += Math.max(0, deltaSeconds);
    if (this.envelope.elapsed >= this.envelope.duration) this.envelope = null;
  }

  sample(): ShakeSample {
    const envelope = this.envelope;
    if (!envelope) return { x: 0, y: 0, active: false };
    const progress = clamp(envelope.elapsed / envelope.duration, 0, 1);
    const decay = (1 - progress) ** 2;
    const phase = envelope.elapsed * envelope.frequency * Math.PI * 2;
    return {
      x: Math.sin(phase) * envelope.magnitude * decay,
      y: Math.sin(phase * 0.73 + Math.PI / 3) * envelope.magnitude * 0.62 * decay,
      active: true,
    };
  }

  clear(token?: string): void {
    if (!token || this.envelope?.token === token) this.envelope = null;
  }

  get activeToken(): string | null {
    return this.envelope?.token ?? null;
  }
}
