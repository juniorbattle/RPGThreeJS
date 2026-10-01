// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { TraversalWorldRenderer } from './TraversalWorldRenderer';
import type { TraversalWorldPresentation, TraversalWorldSection } from './TraversalWorldModel';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';

describe('TraversalWorldRenderer authored inputs', () => {
  it('uses supplied road, checkpoint and direction-sign art without T0 asset defaults', () => {
    const section: TraversalWorldSection = {
      id: 'other-leg-checkpoint', kind: 'TRANSITION', worldStart: -100, worldEnd: 900,
      coreStart: 100, coreEnd: 700, asset: '/other/checkpoint.png', mirror: false,
      props: [{ id: 'other-sign', asset: TRAVERSAL_T0_ASSETS.forkSign, worldX: 400,
        groundPercent: 55, vehicleHeightRatio: .7 }],
    };
    const world: TraversalWorldPresentation = {
      checkpointSections: [section],
      routeSections: [{ ...section, id: 'other-road', kind: 'FOREST', asset: '/other/forest.png', props: undefined }],
      routePeriod: 1000, forestAsset: '/other/forest.png', sectionOverlap: 30,
      directionSignPropId: 'other-sign', resolveWorld: () => [section],
    };
    const renderer = new TraversalWorldRenderer(world);
    renderer.update(0, 1000, 'main', new Set());
    renderer.updateRoute(renderer.routeCamera(1350), 1000);
    renderer.setDirections([{ id: 'choice-a', label: 'Route A' }]);
    expect(renderer.routeCamera(1350)).toBe(350);
    expect(renderer.element.querySelector('[data-world-section="other-leg-checkpoint"] .traversal-world-section__painting img')?.getAttribute('src'))
      .toBe('/other/checkpoint.png');
    expect(renderer.routeElement.querySelector('img')?.getAttribute('src')).toBe('/other/forest.png');
    expect(renderer.element.querySelector('[data-location-prop="other-sign"]')?.textContent).toContain('Route A');
  });
});
