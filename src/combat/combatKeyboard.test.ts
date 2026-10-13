// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { captureDeploymentFocus, nextCombatCursor, shouldHandleCombatShortcut, shouldPreventCombatWheel } from './combatKeyboard';

function routed(key: string, target: EventTarget, defaultPrevented = false): boolean {
  return shouldHandleCombatShortcut({ key, target, defaultPrevented });
}

describe('combat shortcut ownership', () => {
  it.each(['Enter', ' ', 'm', 'a', 'u'])('leaves %s to a focused button or its child', key => {
    const button = document.createElement('button');
    button.innerHTML = '<span><b>Attaquer</b></span>';
    expect(routed(key, button)).toBe(false);
    expect(routed(key, button.querySelector('b')!)).toBe(false);
    button.disabled = true;
    expect(routed(key, button)).toBe(false);
  });
  it.each(['input', 'textarea', 'select', 'a', 'summary'])('preserves native %s interaction', tag => {
    const control = document.createElement(tag);
    if (tag === 'a') control.setAttribute('href', '#help');
    expect(routed('Enter', control)).toBe(false);
    expect(routed('m', control)).toBe(false);
  });
  it('protects inherited editable and ARIA controls', () => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const child = editor.appendChild(document.createElement('span'));
    expect(routed('a', child)).toBe(false);
    for (const role of ['button', 'menuitem', 'menuitemcheckbox', 'textbox', 'combobox', 'slider', 'spinbutton']) {
      const control = document.createElement('div');
      control.setAttribute('role', role);
      expect(routed('Enter', control)).toBe(false);
    }
  });
  it('allows cancellation from controls but respects already handled events', () => {
    const button = document.createElement('button');
    expect(routed('Escape', button)).toBe(true);
    expect(routed('Escape', button, true)).toBe(false);
    expect(routed('Enter', document.body, true)).toBe(false);
  });
  it('retains battlefield shortcuts including a focusable canvas', () => {
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    for (const key of ['Enter', 'm', 'a', 'u', 'Escape']) {
      expect(routed(key, canvas)).toBe(true);
      expect(routed(key, document.body)).toBe(true);
    }
  });

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)('leaves %s chords outside combat routing', modifier => {
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    for (const key of ['a', 'm', 'u', 'ArrowRight', 'Enter', ' ', 'Escape']) {
      expect(shouldHandleCombatShortcut({ key, target: canvas, defaultPrevented: false, [modifier]: true })).toBe(false);
    }
    expect(shouldHandleCombatShortcut({ key: 'Escape', target: document.createElement('button'), defaultPrevented: false, [modifier]: true })).toBe(false);
  });

  it('leaves combined modifiers and AltGraph-style chords outside combat routing', () => {
    for (const key of ['a', 'ArrowRight', 'Enter', 'Escape']) {
      expect(shouldHandleCombatShortcut({ key, target: document.body, defaultPrevented: false, ctrlKey: true, altKey: true })).toBe(false);
      expect(shouldHandleCombatShortcut({ key, target: document.body, defaultPrevented: false, metaKey: true, shiftKey: true })).toBe(false);
    }
  });

  it('retains Shift shortcuts and native Shift+Tab ownership', () => {
    const canvas = document.createElement('canvas');
    for (const key of ['A', 'M', 'ArrowRight', 'Enter', 'Escape']) {
      expect(shouldHandleCombatShortcut({ key, target: canvas, defaultPrevented: false, shiftKey: true })).toBe(true);
    }
    const button = document.createElement('button');
    expect(shouldHandleCombatShortcut({ key: 'Escape', target: button, defaultPrevented: false, shiftKey: true })).toBe(true);
    expect(shouldHandleCombatShortcut({ key: 'Tab', target: button, defaultPrevented: false, shiftKey: true })).toBe(false);
  });
});

describe('transient battlefield navigation', () => {
  it('clamps all four edges without wrapping or changing the original cell', () => {
    const origin = { gx: 0, gz: 0 };
    expect(nextCombatCursor(origin, 'ArrowLeft', 8, 4)).toEqual(origin);
    expect(nextCombatCursor(origin, 'ArrowUp', 8, 4)).toEqual(origin);
    expect(nextCombatCursor({ gx: 7, gz: 3 }, 'ArrowRight', 8, 4)).toEqual({ gx: 7, gz: 3 });
    expect(nextCombatCursor({ gx: 7, gz: 3 }, 'ArrowDown', 8, 4)).toEqual({ gx: 7, gz: 3 });
    expect(nextCombatCursor(origin, 'ArrowRight', 8, 4)).toEqual({ gx: 1, gz: 0 });
    expect(nextCombatCursor(origin, 'ArrowDown', 8, 4)).toEqual({ gx: 0, gz: 1 });
    expect(origin).toEqual({ gx: 0, gz: 0 });
    expect(nextCombatCursor(origin, 'Enter', 8, 4)).toEqual(origin);
  });
});

describe('combat wheel ownership', () => {
  it('leaves inspection and its nested controls to native scrolling', () => {
    const panel = document.createElement('div');
    panel.id = 'panel';
    const button = panel.appendChild(document.createElement('button'));
    const text = button.appendChild(document.createElement('span'));
    for (const target of [panel, button, text]) expect(shouldPreventCombatWheel({ target })).toBe(false);
  });
  it.each(['canvas', 'body', 'button'])('still blocks wheel input over %s outside inspection', tag => {
    expect(shouldPreventCombatWheel({ target: document.createElement(tag) })).toBe(true);
  });
  it('blocks unrecognized event targets', () => {
    expect(shouldPreventCombatWheel({ target: null })).toBe(true);
  });
});

describe('native battlefield rejection feedback', () => {
  const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
  const activation = runtime.slice(runtime.indexOf('async function activateBattlefieldCell('), runtime.indexOf('\nfunction bindInput('));
  const announcementStart = runtime.indexOf('function announceBattlefieldRejection(');
  const announcement = announcementStart < 0 ? '' : runtime.slice(announcementStart, runtime.indexOf('async function activateBattlefieldCell('));

  function nativeInput(mode: 'move' | 'target', keyboard = true, self = false) {
    const status = document.createElement('div');
    status.id = 'combat-cell-status';
    status.textContent = 'Case 8, 4 — indisponible';
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    document.body.replaceChildren(status, canvas);
    canvas.focus();
    const game = {
      mode, busy: false, over: false, stage: false, movedThisTurn: false,
      active: { id: 'warrior', gx: 0, gz: 0, ap: 3, hp: 140 },
      reach: { list: [{ gx: 0, gz: 0 }, { gx: 1, gz: 0 }], prev: {} },
      pending: { spec: { key: 'attack', self }, keys: new Set(['1,0']) },
    };
    const move = vi.fn(async () => undefined), execute = vi.fn(async () => undefined), after = vi.fn();
    const activate = new Function('G', 'keyboardInput', 'byId', 'moveAlong', 'buildPath', 'afterSub', 'doExecute',
      `${announcement}\n${activation}\nreturn activateBattlefieldCell;`)(
      game, keyboard, (id: string) => document.getElementById(id), move, () => ['native path'], after, execute,
    ) as (cell: { gx: number; gz: number } | null) => Promise<void>;
    return { game, status, canvas, move, execute, after, activate };
  }

  it.each(['move', 'target'] as const)('confirms rejected %s input without spending AP or changing focus', async mode => {
    const input = nativeInput(mode), before = structuredClone(input.game);
    await input.activate({ gx: 7, gz: 3 });
    expect(input.status.textContent).toBe(`Case 8, 4 — ${mode === 'move' ? 'Déplacement' : 'Ciblage'} refusé — choisissez une case disponible`);
    expect(input.game).toEqual(before);
    expect(document.activeElement).toBe(input.canvas);
    expect(input.move).not.toHaveBeenCalled();
    expect(input.execute).not.toHaveBeenCalled();
    expect(input.after).not.toHaveBeenCalled();
  });

  it('rejects the current movement cell rather than committing a zero-distance move', async () => {
    const input = nativeInput('move'), before = structuredClone(input.game);
    await input.activate({ gx: 0, gz: 0 });
    expect(input.status.textContent).toContain('Déplacement refusé');
    expect(input.game).toEqual(before);
    expect(input.move).not.toHaveBeenCalled();
  });

  it.each(['move', 'target'] as const)('keeps pointer rejection and busy %s input outside keyboard feedback', async mode => {
    const pointer = nativeInput(mode, false), original = pointer.status.textContent;
    await pointer.activate({ gx: 7, gz: 3 });
    expect(pointer.status.textContent).toBe(original);
    const busy = nativeInput(mode);
    busy.game.busy = true;
    await busy.activate({ gx: 7, gz: 3 });
    expect(busy.status.textContent).toBe(original);
  });

  it('preserves legal movement and target execution through their native owners', async () => {
    const movement = nativeInput('move');
    await movement.activate({ gx: 1, gz: 0 });
    expect(movement.move).toHaveBeenCalledWith(movement.game.active, ['native path']);
    expect(movement.game.movedThisTurn).toBe(true);
    expect(movement.after).toHaveBeenCalledTimes(1);
    const target = nativeInput('target');
    await target.activate({ gx: 1, gz: 0 });
    expect(target.execute).toHaveBeenCalledWith(target.game.pending.spec, 1, 0);
    const self = nativeInput('target', true, true);
    await self.activate(null);
    expect(self.execute).toHaveBeenCalledWith(self.game.pending.spec, 0, 0);
  });
});

describe('native deployment keyboard focus', () => {
  const runtime = readFileSync(new NodeURL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
  const menuSource = runtime.slice(runtime.indexOf('function openDeployMenu(){'), runtime.indexOf('\nfunction renderDefinitionPanel('));
  const actionSource = runtime.slice(runtime.indexOf('function onDeploy('), runtime.indexOf('\nfunction startDeployment('));

  function deployment(keyboard = true, rosterSize = 1, deployed = false, renderObjective = () => {}) {
    const menu = document.createElement('div'), skillmenu = document.createElement('div'), outside = document.createElement('button');
    document.body.replaceChildren(menu, skillmenu, outside);
    const game = { rosterDefs: Array.from({ length: rosterSize }, (_, index) => ({ campaignId: 'hero-' + index })),
      deployedUnits: deployed ? ['hero-0'] : [], deployPage: 0, selectedDeployId: null };
    let open: () => void;
    const reset = vi.fn(() => { game.deployedUnits = []; open(); });
    open = new Function('G', 'dom', 'keyboardInput', 'captureDeploymentFocus', 'renderObjective', 'cl', 'playerDeployLimit',
      'deploymentCard', 'canStartDeployment', 'deployDefById', 'selectUnitData', 'setHint', 'autoDeploy', 'resetDeploy', 'beginBattle',
      menuSource + actionSource + ';return openDeployMenu;')(
      game, { menu, skillmenu }, keyboard, captureDeploymentFocus, renderObjective,
      (n: number, min: number, max: number) => Math.max(min, Math.min(max, n)), () => 4,
      (unit: { campaignId: string }) => '<button type="button" data-unit="' + unit.campaignId + '">Hero</button>',
      (count: number) => count > 0, () => ({ name: 'Hero' }), vi.fn(), vi.fn(), vi.fn(), reset, vi.fn(),
    );
    open();
    const control = (selector: string) => menu.querySelector<HTMLButtonElement>(selector)!;
    const activate = (selector: string) => { const button = control(selector); button.focus(); button.click(); return button; };
    return { menu, game, outside, open, reset, control, activate };
  }

  it('retains the selected roster card without changing unrelated deployment state', () => {
    const input = deployment(), before = structuredClone(input.game);
    const original = input.activate('[data-unit="hero-0"]');
    expect(original.isConnected).toBe(false);
    expect(document.activeElement).toBe(input.control('[data-unit="hero-0"]'));
    expect(input.game).toEqual({ ...before, selectedDeployId: 'hero-0' });
    expect(input.reset).not.toHaveBeenCalled();
  });

  it('keeps pagination focus on an enabled deployment action when next becomes disabled', () => {
    const input = deployment(true, 5), before = structuredClone(input.game);
    input.activate('[data-d="next"]');
    expect(input.control('[data-d="next"]').disabled).toBe(true);
    expect(document.activeElement).toBe(input.control('[data-d="prev"]'));
    expect(input.game).toEqual({ ...before, deployPage: 1 });
  });

  it('returns reset focus to an enabled action after the party becomes empty', () => {
    const input = deployment(true, 1, true), before = structuredClone(input.game);
    input.activate('[data-d="reset"]');
    expect(input.control('[data-d="reset"]').disabled).toBe(true);
    expect(document.activeElement).toBe(input.control('[data-d="auto"]'));
    expect(input.game).toEqual({ ...before, deployedUnits: [] });
    expect(input.reset).toHaveBeenCalledTimes(1);
  });

  it('leaves pointer mode and existing external focus ownership unchanged', () => {
    const pointer = deployment(false);
    pointer.activate('[data-unit="hero-0"]');
    expect(document.activeElement).toBe(document.body);
    const external = deployment();
    external.outside.focus(); external.open();
    expect(document.activeElement).toBe(external.outside);
  });

  it('does not steal focus acquired by another surface during the rebuild', () => {
    let outside: HTMLButtonElement | undefined;
    const input = deployment(true, 1, false, () => outside?.focus());
    outside = input.outside;
    input.activate('[data-unit="hero-0"]');
    expect(document.activeElement).toBe(outside);
  });
});
