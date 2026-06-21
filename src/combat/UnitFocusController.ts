export interface FocusableUnit {
  alive: boolean;
  mat: { opacity: number };
  blob: { material: { opacity: number } };
}

interface OpacitySnapshot {
  unit: FocusableUnit;
  body: number;
  shadow: number;
}

export class UnitFocusController {
  private snapshots: OpacitySnapshot[] = [];
  private activeUnit: FocusableUnit | null = null;
  private validTargets = new Set<FocusableUnit>();

  focus(
    units: FocusableUnit[],
    active: FocusableUnit,
    validTargets: FocusableUnit[] = [],
    dimOpacity = 0.45,
  ): void {
    this.restore();
    this.activeUnit = active;
    this.validTargets = new Set(validTargets);
    this.snapshots = units.map((unit) => ({
      unit,
      body: unit.mat.opacity,
      shadow: unit.blob.material.opacity,
    }));

    for (const unit of units) {
      if (!unit.alive) continue;
      if (unit === active) {
        unit.mat.opacity = 1;
        continue;
      }
      unit.mat.opacity = this.validTargets.has(unit) ? 0.75 : dimOpacity;
      unit.blob.material.opacity = Math.min(unit.blob.material.opacity, this.validTargets.has(unit) ? 0.38 : 0.24);
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
        unit.blob.material.opacity = Math.min(snapshot.shadow, highlighted.has(unit) ? 0.55 : snapshot.shadow);
      } else if (this.validTargets.has(unit)) {
        unit.mat.opacity = 0.75;
        unit.blob.material.opacity = Math.min(snapshot.shadow, 0.38);
      } else {
        unit.mat.opacity = 0.45;
        unit.blob.material.opacity = Math.min(snapshot.shadow, 0.24);
      }
    }
  }

  restore(): void {
    for (const snapshot of this.snapshots) {
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
