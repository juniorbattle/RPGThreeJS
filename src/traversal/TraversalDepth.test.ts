// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { TRAVERSAL_CARAVAN, buildTraversalCaravan, caravanWheelAngle } from './TraversalCaravan';
import { TRAVERSAL_DEPTH, TRAVERSAL_OCCLUDERS, TRAVERSAL_FOREGROUND_ASSETS, TraversalForegroundRenderer } from './TraversalDepth';
import { ROAD_SPACE } from './TraversalRoadSpace';

describe('caravan component registration and semantic depth', () => {
  it('has four separately animated road wheels, behind/in front of a wheel-free chassis', () => {
    const vehicle = document.createElement('figure');
    buildTraversalCaravan(vehicle);
    expect(vehicle.querySelectorAll('[data-wheel]')).toHaveLength(4);
    expect(vehicle.querySelectorAll('[data-wheel-plane="far"]')).toHaveLength(2);
    expect(vehicle.querySelectorAll('[data-wheel-plane="near"]')).toHaveLength(2);
    expect(vehicle.querySelectorAll('.traversal-vehicle__wheel-rotor')).toHaveLength(4);
    const { bounds, wheels } = TRAVERSAL_CARAVAN;
    for (const wheel of wheels) {
      expect(wheel.rx).toBeGreaterThan(0);
      expect(wheel.ry).toBeGreaterThan(0);
      expect(wheel.x - wheel.rx).toBeGreaterThanOrEqual(bounds.left);
      expect(wheel.x + wheel.rx).toBeLessThanOrEqual(bounds.left + bounds.width);
      expect(wheel.y + wheel.ry).toBeLessThanOrEqual(bounds.top + bounds.height);
    }
    // Contact bottoms remain aligned to within two displayed pixels at desktop scale.
    expect(Math.abs((wheels[2]!.y + wheels[2]!.ry) - (wheels[3]!.y + wheels[3]!.ry)) / bounds.height * 198).toBeLessThan(2);
  });

  it('turns one revolution per displayed road circumference at both viewport scales', () => {
    for (const [width, height] of [[1463, 823], [960, 720]]) {
      const vehicleHeight = Math.min(height! * .24, width! * (width! <= 1000 ? .16 : .14));
      const radius = TRAVERSAL_CARAVAN.wheels[2]!.ry / TRAVERSAL_CARAVAN.bounds.height * vehicleHeight;
      const circumferenceRoadUnits = 2 * Math.PI * radius * ROAD_SPACE.referenceWidth / width!;
      expect(caravanWheelAngle(circumferenceRoadUnits, vehicleHeight, width!)).toBeCloseTo(2 * Math.PI);
      expect(caravanWheelAngle(0, vehicleHeight, width!)).toBe(0);
    }
  });

  it('places all actors behind organic occlusion and keeps markers/UI above it', () => {
    expect(TRAVERSAL_DEPTH['road-world']).toBeLessThan(TRAVERSAL_DEPTH['road-actors']);
    expect(TRAVERSAL_DEPTH['road-actors']).toBeLessThan(TRAVERSAL_DEPTH['foreground-occlusion']);
    expect(TRAVERSAL_DEPTH['foreground-occlusion']).toBeLessThan(TRAVERSAL_DEPTH['foreground-extreme']);
    expect(TRAVERSAL_DEPTH['foreground-extreme']).toBeLessThan(TRAVERSAL_DEPTH.markers);
    expect(TRAVERSAL_DEPTH.markers).toBeLessThan(TRAVERSAL_DEPTH.ui);
    const foreground = new TraversalForegroundRenderer();
    expect(foreground.element.dataset.depthPlane).toBe('foreground-occlusion');
    expect(foreground.element.querySelector('[data-traversal-beat]')).toBeNull();
    for (const piece of TRAVERSAL_OCCLUDERS) expect(piece.groundPercent).toBeGreaterThan(81);
  });

  it('moves vegetation with road-space and keeps its placement stable across lane/return updates', () => {
    const foreground = new TraversalForegroundRenderer();
    foreground.update(0, 1463);
    const piece = foreground.element.querySelector<HTMLElement>('[data-occluder="near-road-1"]')!;
    const before = parseFloat(piece.style.left);
    const top = piece.style.top;
    foreground.update(123, 1463);
    expect(parseFloat(piece.style.left)).toBe(before - 123);
    const fixed = foreground.element.innerHTML;
    foreground.update(123, 1463);
    expect(foreground.element.innerHTML).toBe(fixed);
    expect(piece.style.top).toBe(top);
    expect(piece.dataset.physicalPlacement).toBe('camera-side-verge');
  });

  it('keeps real transparent component assets available without replacing character sources', () => {
    for (const asset of [TRAVERSAL_CARAVAN.chassis, TRAVERSAL_CARAVAN.wheelSource, ...Object.values(TRAVERSAL_FOREGROUND_ASSETS)]) {
      expect(existsSync(`public${asset}`)).toBe(true);
      const bytes = readFileSync(`public${asset}`);
      expect(bytes.subarray(1, 4).toString()).toBe('PNG');
      expect(bytes[25]).toBe(6); // PNG RGBA color type; alpha coverage is audited in Chromium.
    }
  });
});
