import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
// @ts-expect-error plain JS module without declarations
import { COMBAT_PRESENTATION } from './combatPresentationConfig.js';
import { pixelFocusResponse } from './pixel/PixelSpriteMaterial';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const previewSource = runtime.slice(runtime.indexOf('function previewMovePath(c){'), runtime.indexOf('\nfunction drawReach(){'));
const enterMoveSource = runtime.slice(runtime.indexOf('function enterMove(){'), runtime.indexOf('\nfunction drawRange(){'));
const enterTargetSource = runtime.slice(runtime.indexOf('function enterTarget(spec){'), runtime.indexOf('\nfunction cancelToMenu(){'));

type Cell = { gx: number; gz: number };

function harness(reachable: (c: Cell) => boolean) {
  const game = { _movePreviewKey: null as string | null, active: { gx: 0, gz: 0 }, reach: { prev: {} as Record<string, [number, number]> } };
  game.reach.prev = { '1,0': [0, 0], '2,0': [1, 0], '2,1': [2, 0] };
  const tiles: { gx: number; gz: number; kind: string }[] = [];
  let reachDraws = 0;
  const buildPath = runtime.slice(runtime.indexOf('function buildPath(prev,u,gx,gz){'), runtime.indexOf('\n', runtime.indexOf('function buildPath(prev,u,gx,gz){')));
  const preview = new Function('G', 'cellKey', 'drawReach', 'hoverState', 'addHL', 'COMBAT_PRESENTATION',
    buildPath + '\n' + previewSource + ';return previewMovePath;',
  )(game, (gx: number, gz: number) => gx + ',' + gz, () => { reachDraws++; tiles.length = 0; },
    (c: Cell) => reachable(c) ? 'move' : 'invalid',
    (gx: number, gz: number, _color: number, _op: number, kind: string) => { tiles.push({ gx, gz, kind }); },
    { arena: { moveTileOpacity: 1 } }) as (c: Cell | null) => void;
  return { game, tiles, preview, reachDraws: () => reachDraws };
}

describe('combat selection readability (operator playtest 2026-11-11)', () => {
  it('traces the exact move path to the hovered reachable cell, ending on the destination', () => {
    const h = harness(() => true);
    h.preview({ gx: 2, gz: 1 });
    expect(h.tiles).toEqual([
      { gx: 1, gz: 0, kind: 'path' },
      { gx: 2, gz: 0, kind: 'path' },
      { gx: 2, gz: 1, kind: 'hover' },
    ]);
  });

  it('redraws only when the hovered cell changes, and shows no path to an unreachable cell', () => {
    const h = harness(c => c.gx !== 3);
    h.preview({ gx: 2, gz: 1 });
    h.preview({ gx: 2, gz: 1 });
    expect(h.reachDraws()).toBe(1);
    h.preview({ gx: 3, gz: 0 });
    expect(h.reachDraws()).toBe(2);
    expect(h.tiles).toEqual([]);
    h.preview(null);
    expect(h.tiles).toEqual([]);
  });

  it('wires the move dim and the path preview into move selection', () => {
    expect(enterMoveSource).toContain('G._movePreviewKey=null; unitFocus.focusMove(G.units,G.active);');
    expect(runtime).toContain("if(G.mode==='move')previewMovePath(c);");
    expect(runtime).toContain("path:buildTileTex(");
    expect(runtime).toContain('moveDimOpacity:COMBAT_PRESENTATION.units.focusMoveDimOpacity,');
  });

  it('keeps other units readable during a move, while a target choice keeps its strong fade', () => {
    const move = pixelFocusResponse(COMBAT_PRESENTATION.units.focusMoveDimOpacity);
    const target = pixelFocusResponse(COMBAT_PRESENTATION.units.focusDimOpacity);
    expect(move.alpha).toBeGreaterThan(0.6);
    expect(target.alpha).toBeLessThan(0.45);
  });

  it('stays presentation only: no resolution, AP or camera call in the selection paths', () => {
    for (const source of [previewSource, enterMoveSource, enterTargetSource]) {
      expect(source).not.toMatch(/cameraDirector|focusCam\(|actionCam\(|\.ap\s*=|applyDamage|executeAction/);
    }
    // Highlight pulses are static under reduced motion (game setting or OS preference).
    expect(runtime).toContain('if(REDUCED_GRAPHICS){ m.material.opacity=m.userData.baseOp||0.28; }');
    expect(runtime).toContain('let REDUCED_GRAPHICS=prefersReducedMotion(REQUESTED_REDUCED_GRAPHICS);');
  });
});
