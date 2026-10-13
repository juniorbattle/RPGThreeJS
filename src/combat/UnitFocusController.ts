export interface FocusableUnit {
  alive: boolean;
  boss?: boolean;
  elite?: boolean;
  focusOpacityFloor?: number;
  mat: { opacity: number };
  blob: { material: { opacity: number } };
}

export interface UnitFocusPolicy {
  dimOpacity: number;
  validTargetOpacity: number;
  dimShadowOpacity: number;
  validTargetShadowOpacity: number;
  highlightedShadowOpacity: number;
  bossDimFloor: number;
  eliteDimFloor: number;
}

export const DEFAULT_UNIT_FOCUS_POLICY: Readonly<UnitFocusPolicy> = Object.freeze({
  dimOpacity: 0.42,
  validTargetOpacity: 0.82,
  dimShadowOpacity: 0.22,
  validTargetShadowOpacity: 0.42,
  highlightedShadowOpacity: 0.55,
  bossDimFloor: 0.6,
  eliteDimFloor: 0.55,
});

interface OpacitySnapshot {
  unit: FocusableUnit;
  body: number;
  shadow: number;
  wasAlive: boolean;
}

export class UnitFocusController {
  private snapshots: OpacitySnapshot[] = [];
  private activeUnit: FocusableUnit | null = null;
  private validTargets = new Set<FocusableUnit>();
  private readonly policy: UnitFocusPolicy;

  constructor(policy: Partial<UnitFocusPolicy> = {}) {
    this.policy = { ...DEFAULT_UNIT_FOCUS_POLICY, ...policy };
  }

  private opacityFloor(unit: FocusableUnit): number {
    return Math.max(
      unit.focusOpacityFloor ?? 0,
      unit.boss ? this.policy.bossDimFloor : 0,
      unit.elite ? this.policy.eliteDimFloor : 0,
    );
  }

  private setBodyOpacity(unit: FocusableUnit, opacity: number): void {
    unit.mat.opacity = Math.max(opacity, this.opacityFloor(unit));
  }

  focus(
    units: FocusableUnit[],
    active: FocusableUnit,
    validTargets: FocusableUnit[] = [],
    dimOpacity = this.policy.dimOpacity,
  ): void {
    this.restore();
    this.activeUnit = active;
    this.validTargets = new Set(validTargets);
    this.snapshots = units.map((unit) => ({
      unit,
      body: unit.mat.opacity,
      shadow: unit.blob.material.opacity,
      wasAlive: unit.alive,
    }));

    for (const unit of units) {
      if (!unit.alive) continue;
      if (unit === active) {
        unit.mat.opacity = 1;
        continue;
      }
      const validTarget = this.validTargets.has(unit);
      this.setBodyOpacity(unit, validTarget ? this.policy.validTargetOpacity : dimOpacity);
      unit.blob.material.opacity = Math.min(
        unit.blob.material.opacity,
        validTarget ? this.policy.validTargetShadowOpacity : this.policy.dimShadowOpacity,
      );
    }
  }

  preview(units: FocusableUnit[]): void {
    if (!this.active) return;
    const highlighted = new Set(units);
    for (const snapshot of this.snapshots) {
      const unit = snapshot.unit;
      if (!unit.alive) continue;
      if (unit === this.activeUnit || highlighted.has(unit)) {
        unit.mat.opacity = 1;
        unit.blob.material.opacity = Math.min(
          snapshot.shadow,
          highlighted.has(unit) ? this.policy.highlightedShadowOpacity : snapshot.shadow,
        );
      } else if (this.validTargets.has(unit)) {
        this.setBodyOpacity(unit, this.policy.validTargetOpacity);
        unit.blob.material.opacity = Math.min(snapshot.shadow, this.policy.validTargetShadowOpacity);
      } else {
        this.setBodyOpacity(unit, this.policy.dimOpacity);
        unit.blob.material.opacity = Math.min(snapshot.shadow, this.policy.dimShadowOpacity);
      }
    }
  }

  restore(): void {
    for (const snapshot of this.snapshots) {
      if (snapshot.unit.alive !== snapshot.wasAlive) continue;
      snapshot.unit.mat.opacity = snapshot.body;
      snapshot.unit.blob.material.opacity = snapshot.shadow;
    }
    this.snapshots = [];
    this.activeUnit = null;
    this.validTargets.clear();
  }

  get active(): boolean {
    return this.snapshots.length > 0;
  }
}
