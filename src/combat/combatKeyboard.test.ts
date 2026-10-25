// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { captureDeploymentFocus, nextCombatCursor, shouldHandleCombatShortcut, shouldPreventCombatWheel } from './combatKeyboard';
import { renderCombatActionDock } from './combatHudPresentation';

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
    const move = vi.fn(async () => undefined), execute = vi.fn(async () => undefined), after = vi.fn(), cue = vi.fn();
    const activate = new Function('G', 'keyboardInput', 'byId', 'moveAlong', 'buildPath', 'afterSub', 'doExecute', 'combatCue',
      `const setHint=()=>{};\n${announcement}\n${activation}\nreturn activateBattlefieldCell;`)(
      game, keyboard, (id: string) => document.getElementById(id), move, () => ['native path'], after, execute, cue,
    ) as (cell: { gx: number; gz: number } | null) => Promise<void>;
    return { game, status, canvas, move, execute, after, cue, activate };
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

  // OD-2026-10-19-B cues `refused` on an explicit refusal for pointer and keyboard alike; 06a59c48 also shows the
  // refusal text for pointer input. Busy input stays silent. Neither path moves, executes or changes game state.
  it.each(['move', 'target'] as const)('announces pointer rejection like keyboard rejection and keeps busy %s input silent', async mode => {
    const pointer = nativeInput(mode, false), pointerBefore = structuredClone(pointer.game);
    await pointer.activate({ gx: 7, gz: 3 });
    expect(pointer.status.textContent).toBe(`Case 8, 4 — ${mode === 'move' ? 'Déplacement' : 'Ciblage'} refusé — choisissez une case disponible`);
    expect(pointer.cue.mock.calls).toEqual([['refused']]);
    expect(pointer.game).toEqual(pointerBefore);
    expect(pointer.move).not.toHaveBeenCalled();
    expect(pointer.execute).not.toHaveBeenCalled();
    const busy = nativeInput(mode), original = busy.status.textContent;
    busy.game.busy = true;
    await busy.activate({ gx: 7, gz: 3 });
    expect(busy.status.textContent).toBe(original);
    expect(busy.cue).not.toHaveBeenCalled();
    expect(busy.move).not.toHaveBeenCalled();
    expect(busy.execute).not.toHaveBeenCalled();
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

describe('native action submenu cancellation', () => {
  const runtime = readFileSync(new NodeURL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
  const cancelSource = runtime.slice(runtime.indexOf('function cancelToMenu(){'), runtime.indexOf('\nasync function doExecute('));
  const closeSource = runtime.slice(runtime.indexOf('function closeSubmenu(){'), runtime.indexOf('\nfunction tipFor('));

  function submenu(kind: string, keyboard = true, busy = false) {
    const menu = document.createElement('div'), skillmenu = document.createElement('div'), outside = document.createElement('button');
    menu.innerHTML = '<button data-a="' + kind + '">Action</button><button data-a="wait">Attendre</button>';
    skillmenu.dataset.kind = kind;
    skillmenu.innerHTML = '<button>Retour</button>';
    document.body.replaceChildren(menu, skillmenu, outside);
    const game = { mode: 'menu', busy, active: { ap: 3 }, pending: null };
    const sync = vi.fn();
    const cancel = new Function('G', 'dom', 'keyboardInput', 'syncActionDockState',
      'const combatCue=()=>{};' + closeSource + cancelSource + ';return cancelToMenu;')(game, { menu, skillmenu }, keyboard, sync);
    skillmenu.querySelector('button')!.focus();
    return { game, menu, skillmenu, outside, sync, cancel };
  }

  it.each(['attack', 'skill', 'item'])('returns Escape from the %s submenu to its enabled dock action without spending AP', kind => {
    const input = submenu(kind), before = structuredClone(input.game);
    input.cancel();
    expect(input.skillmenu.classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(input.menu.querySelector('[data-a="' + kind + '"]'));
    expect(input.game).toEqual(before);
  });

  it('does not interrupt a busy native action', () => {
    const input = submenu('skill', true, true), focused = document.activeElement;
    input.cancel();
    expect(input.skillmenu.classList.contains('hidden')).toBe(false);
    expect(document.activeElement).toBe(focused);
    expect(input.sync).not.toHaveBeenCalled();
  });

  it.each([true, false])('keeps external focus ownership when keyboard mode is %s', keyboard => {
    const input = submenu('item', keyboard);
    input.outside.focus();
    input.cancel();
    expect(input.skillmenu.classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(input.outside);
  });
});

describe('native movement undo focus', () => {
  const runtime = readFileSync(new NodeURL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
  const undoSource = runtime.slice(runtime.indexOf('function undoMove(){'), runtime.indexOf('\nfunction transientInspect('));
  const menuSource = runtime.slice(runtime.indexOf('function openActionMenu(){'), runtime.indexOf('\nfunction onMenu('));

  function movement(keyboard = true, sync = () => {}) {
    const menu = document.createElement('div'), skillmenu = document.createElement('div');
    const canvas = document.createElement('canvas'), outside = document.createElement('button');
    canvas.tabIndex = 0;
    document.body.replaceChildren(menu, skillmenu, canvas, outside);
    const game = { active: { team: 'player', name: 'Hero', gx: 2, gz: 1, ap: 3, mov: 4, skills: [], weapons: [] },
      busy: false, over: false, movedThisTurn: true, movedBeforeAct: false, startGX: 0, startGZ: 1,
      basicAttacksThisTurn: 0, itemsUsedThisTurn: 0, mode: 'menu' };
    const place = vi.fn((u, gx, gz) => Object.assign(u, { gx, gz }));
    const api = new Function('G', 'dom', 'renderer', 'keyboardInput', 'restoreUnitFocus', 'placeUnit', 'clearHL',
      'selectUnit', 'setHint', 'closeMenus', 'hasS', 'invCount', 'renderCombatActionDock', 'syncActionDockState',
      `const combatCue=()=>{};\n${undoSource}\n${menuSource}\nreturn { undo: undoMove, open: openActionMenu };`)(
      game, { menu, skillmenu }, { domElement: canvas }, keyboard, vi.fn(), place, vi.fn(), vi.fn(), vi.fn(),
      vi.fn(), () => false, () => 0, renderCombatActionDock, sync,
    ) as { undo: () => void; open: () => void };
    api.open();
    return { ...api, game, menu, canvas, outside, place };
  }

  it.each(['dock', 'canvas'])('returns keyboard undo from %s to enabled movement without changing AP', origin => {
    const input = movement(), before = structuredClone(input.game);
    (origin === 'dock' ? input.menu.querySelector<HTMLButtonElement>('[data-a="undo"]')! : input.canvas).focus();
    input.undo();
    expect(document.activeElement).toBe(input.menu.querySelector('[data-a="move"]'));
    expect(input.game).toEqual({ ...before, movedThisTurn: false, active: { ...before.active, gx: 0 } });
    expect(input.place).toHaveBeenCalledExactlyOnceWith(input.game.active, 0, 1, true);
  });

  it('preserves pointer and external focus owners', () => {
    const pointer = movement(false);
    pointer.menu.querySelector<HTMLButtonElement>('[data-a="undo"]')!.focus(); pointer.undo();
    expect(document.activeElement).toBe(document.body);
    const external = movement(); external.outside.focus(); external.undo();
    expect(document.activeElement).toBe(external.outside);
  });

  it('does not take focus acquired during menu reconstruction', () => {
    let outside: HTMLButtonElement | undefined;
    const input = movement(true, () => outside?.focus()); outside = input.outside;
    input.menu.querySelector<HTMLButtonElement>('[data-a="undo"]')!.focus(); input.undo();
    expect(document.activeElement).toBe(input.outside);
  });

  it.each(['busy', 'movedBeforeAct'] as const)('keeps rejected %s undo and focus unchanged', flag => {
    const input = movement(); input.game[flag] = true;
    const button = input.menu.querySelector<HTMLButtonElement>('[data-a="undo"]')!; button.focus();
    const before = structuredClone(input.game); input.undo();
    expect(input.game).toEqual(before); expect(document.activeElement).toBe(button);
    expect(input.place).not.toHaveBeenCalled();
  });
});

describe('native next-player-turn focus', () => {
  const runtime = readFileSync(new NodeURL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
  const turns = runtime.slice(runtime.indexOf('async function beginTurn(u){'), runtime.indexOf('\nfunction checkEnd('));
  const menuSource = runtime.slice(runtime.indexOf('function openActionMenu(){'), runtime.indexOf('\nfunction onMenu('));

  function battle(keyboard = true, hasFocus = true) {
    const menu = document.createElement('div'), skillmenu = document.createElement('div');
    const canvas = document.createElement('canvas'), outside = document.createElement('button'); canvas.tabIndex = 0;
    document.body.replaceChildren(menu, skillmenu, canvas, outside);
    const hero = (name: string, team = 'player') => ({ name, team, alive: true, ap: 1, maxap: 3, gx: 0, gz: 1,
      mov: 4, statuses: {}, skills: [], weapons: [], _ultCooldown: 0 });
    const first = hero('First'), second = hero('Second'), foe = hero('Foe', 'foe');
    const game = { active: first, busy: false, over: false, mode: 'menu', movedThisTurn: false,
      basicAttacksThisTurn: 0, itemsUsedThisTurn: 0 };
    const close = () => { menu.replaceChildren(); menu.classList.add('hidden'); };
    const next = vi.fn(), status = vi.fn(async () => {});
    const documentView = { get activeElement() { return document.activeElement; }, body: document.body, hasFocus: () => hasFocus };
    const noop = () => {};
    const api = new Function('G', 'dom', 'renderer', 'keyboardInput', 'document', 'renderCombatActionDock',
      'closeMenus', 'nextTurn', 'tickStatusDamage', 'setTimeout',
      `let turnReturnFocus=false; const _t=0, STATUS={}, combatCue=()=>{};
       const hideActionPreview=()=>{}, refreshTurnbar=()=>{}, selectUnit=()=>{}, focusCam=()=>{},
       refreshPanel=()=>{}, floatText=()=>{}, logMsg=()=>{}, clearBossIntentPresentation=()=>{},
       setHint=()=>{}, restoreUnitFocus=()=>{}, clearHL=()=>{}, syncActionDockState=()=>{},
       tickStatusDuration=()=>{}, hasS=()=>false, invCount=()=>0, statusSkips=()=>null,
       wait=async()=>{}, aiTurn=async()=>{};
       ${turns}\n${menuSource}\nreturn { begin:beginTurn, end:endTurn, open:openActionMenu };`)(
      game, { menu, skillmenu }, { domElement: canvas }, keyboard, documentView, renderCombatActionDock,
      close, next, status, noop,
    ) as { begin: (unit: typeof first) => Promise<void>; end: () => void; open: () => void };
    api.open();
    return { ...api, game, first, second, foe, menu, canvas, outside, next, status };
  }

  it.each(['dock', 'canvas'])('restores an enabled action after keyboard Wait from %s and an enemy turn', async origin => {
    const input = battle();
    (origin === 'dock' ? input.menu.querySelector<HTMLButtonElement>('[data-a="wait"]')! : input.canvas).focus();
    input.end();
    expect(input.first.ap).toBe(2); expect(input.first).toMatchObject({ gardeAP: 2, _souffle: true });
    expect(input.next).toHaveBeenCalledTimes(1);
    await input.begin(input.foe); input.end();
    await input.begin(input.second);
    expect(document.activeElement).toBe(input.menu.querySelector('button:not(:disabled)'));
    expect(input.second.ap).toBe(2); expect(input.game.mode).toBe('menu');
  });

  it('preserves zero-AP Wait and restores focus at a directly following player turn', async () => {
    const input = battle(); input.first.ap = 0;
    input.menu.querySelector<HTMLButtonElement>('[data-a="wait"]')!.focus(); input.end();
    expect(input.first).toMatchObject({ ap: 0, gardeAP: 0, _souffle: false });
    await input.begin(input.second);
    expect(document.activeElement).toBe(input.menu.querySelector('button:not(:disabled)'));
  });

  it.each(['external', 'parent', 'pointer'])('preserves %s focus ownership during the asynchronous handoff', async owner => {
    const input = battle(owner !== 'pointer', owner !== 'parent');
    input.menu.querySelector<HTMLButtonElement>('[data-a="wait"]')!.focus(); input.end();
    input.status.mockImplementationOnce(async () => { if (owner === 'external') input.outside.focus(); });
    await input.begin(input.second);
    expect(document.activeElement).toBe(owner === 'external' ? input.outside : document.body);
  });

  it('leaves busy Wait and an unrelated initial turn outside focus restoration', async () => {
    const input = battle(), button = input.menu.querySelector<HTMLButtonElement>('[data-a="wait"]')!;
    button.focus(); input.game.busy = true; input.end();
    expect(document.activeElement).toBe(button); expect(input.next).not.toHaveBeenCalled();
    input.game.busy = false; input.outside.focus(); await input.begin(input.second);
    expect(document.activeElement).toBe(input.outside);
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
      'const combatCue=()=>{};' + menuSource + actionSource + ';return openDeployMenu;')(
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
