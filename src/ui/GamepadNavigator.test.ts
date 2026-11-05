// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GAMEPAD_REPEAT_DELAY_MS,
  GAMEPAD_REPEAT_INTERVAL_MS,
  GamepadNavigator,
  GamepadPressTracker,
  gamepadFocusables,
  heldGamepadActions,
  performGamepadAction,
  type GamepadAction,
  type GamepadGeometry,
} from './GamepadNavigator';

// OD-2026-11-05-A: controller presses travel the keyboard's own paths; these tests pin that mapping.
const boxes = new Map<Element, { left: number; top: number; width: number; height: number }>();
const geometry: GamepadGeometry = { rect: element => boxes.get(element) ?? { left: 0, top: 0, width: 0, height: 0 } };

function control(parent: HTMLElement, label: string, left: number, top: number, width = 120, height = 40, tag = 'button'): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = label;
  if (tag !== 'button') element.tabIndex = 0;
  parent.append(element);
  boxes.set(element, { left, top, width, height });
  return element;
}

function pad(buttons: number[] = [], axes: [number, number] = [0, 0]): Gamepad {
  return {
    connected: true,
    axes,
    buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: buttons.includes(index), touched: false, value: buttons.includes(index) ? 1 : 0 })),
  } as unknown as Gamepad;
}

afterEach(() => {
  document.body.replaceChildren();
  boxes.clear();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.input;
});

describe('controller input reading', () => {
  it('maps the standard buttons and the dominant stick axis with hysteresis', () => {
    expect([...heldGamepadActions([pad([0, 1, 4, 5, 12, 13, 14, 15])])]).toEqual(['confirm', 'back', 'previous', 'next', 'up', 'down', 'left', 'right']);
    expect([...heldGamepadActions([pad([], [0.7, 0.4])])]).toEqual(['right']);
    expect([...heldGamepadActions([pad([], [0.2, -0.8])])]).toEqual(['up']);
    expect([...heldGamepadActions([pad([], [0.5, 0])])]).toEqual([]);
    expect([...heldGamepadActions([pad([], [0.5, 0])], new Set<GamepadAction>(['right']))]).toEqual(['right']);
    expect([...heldGamepadActions([null, { ...pad([0]), connected: false } as Gamepad])]).toEqual([]);
  });

  it('presses once, repeats only held directions, and stays mute for a press begun elsewhere', () => {
    const tracker = new GamepadPressTracker();
    const both = new Set<GamepadAction>(['confirm', 'down']);
    expect(tracker.step(both, 0, true)).toEqual([{ action: 'confirm', repeat: false }, { action: 'down', repeat: false }]);
    expect(tracker.step(both, GAMEPAD_REPEAT_DELAY_MS - 1, true)).toEqual([]);
    expect(tracker.step(both, GAMEPAD_REPEAT_DELAY_MS, true)).toEqual([{ action: 'down', repeat: true }]);
    expect(tracker.step(both, GAMEPAD_REPEAT_DELAY_MS + GAMEPAD_REPEAT_INTERVAL_MS - 1, true)).toEqual([]);
    expect(tracker.step(both, GAMEPAD_REPEAT_DELAY_MS + GAMEPAD_REPEAT_INTERVAL_MS, true)).toEqual([{ action: 'down', repeat: true }]);
    expect(tracker.step(new Set(), 2000, true)).toEqual([]);

    const elsewhere = new GamepadPressTracker();
    const left = new Set<GamepadAction>(['left']);
    expect(elsewhere.step(left, 0, false)).toEqual([]);
    expect(elsewhere.step(left, 1000, true)).toEqual([]);
    elsewhere.step(new Set(), 1100, true);
    expect(elsewhere.step(left, 1200, true)).toEqual([{ action: 'left', repeat: false }]);
  });
});

describe('controller presses on the page', () => {
  it('confirms a focused button through Enter, and leaves a claimed Enter to its handler', () => {
    const go = control(document.body, 'Continuer', 0, 0);
    const clicked = vi.fn();
    go.addEventListener('click', clicked);
    const keys: string[] = [];
    document.addEventListener('keydown', event => keys.push(event.key));
    go.focus();
    performGamepadAction(document, 'confirm', false, geometry);
    expect(keys).toEqual(['Enter']);
    expect(clicked).toHaveBeenCalledTimes(1);

    go.addEventListener('keydown', event => event.preventDefault());
    performGamepadAction(document, 'confirm', false, geometry);
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('sends Escape for back and the arrow to a screen that claims it, without moving focus', () => {
    const map = document.createElement('div');
    document.body.append(map);
    const first = control(map, 'Poste', 0, 0), second = control(map, 'Gué', 200, 0);
    const keys: string[] = [];
    map.addEventListener('keydown', event => { keys.push(event.key); if (event.key.startsWith('Arrow')) event.preventDefault(); });
    first.focus();
    performGamepadAction(document, 'right', false, geometry);
    performGamepadAction(document, 'back', false, geometry);
    expect(keys).toEqual(['ArrowRight', 'Escape']);
    expect(document.activeElement).toBe(first);
    expect(second).not.toBe(document.activeElement);
  });

  it('moves to the nearest control in the pressed direction when no screen claims the arrow', () => {
    const top = control(document.body, 'Haut', 100, 0);
    const middle = control(document.body, 'Milieu', 100, 60);
    const right = control(document.body, 'Droite', 300, 60);
    const below = control(document.body, 'Bas', 140, 120, 200);
    middle.focus();
    performGamepadAction(document, 'down', false, geometry);
    expect(document.activeElement).toBe(below);
    performGamepadAction(document, 'up', false, geometry);
    expect(document.activeElement).toBe(middle);
    performGamepadAction(document, 'right', false, geometry);
    expect(document.activeElement).toBe(right);
    performGamepadAction(document, 'left', false, geometry);
    performGamepadAction(document, 'up', false, geometry);
    expect(document.activeElement).toBe(top);
    performGamepadAction(document, 'up', false, geometry);
    expect(document.activeElement).toBe(top);
  });

  it('reaches a control that encloses the current one only when nothing else lies that way', () => {
    const field = control(document.body, '', 0, 0, 1000, 700, 'div');
    const upper = control(document.body, 'Attaquer', 400, 560);
    const lower = control(document.body, 'Attendre', 400, 610);
    lower.focus();
    performGamepadAction(document, 'up', false, geometry);
    expect(document.activeElement).toBe(upper);
    performGamepadAction(document, 'up', false, geometry);
    expect(document.activeElement).toBe(field);
  });

  it('keeps navigation inside the open dialog and cycles with the shoulder buttons', () => {
    const background = control(document.body, 'Carte', 0, 0);
    background.inert = true;
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.append(dialog);
    boxes.set(dialog, { left: 100, top: 100, width: 400, height: 300 });
    const fight = control(dialog, 'Combattre', 150, 150), retreat = control(dialog, 'Se replier', 150, 210);
    retreat.focus();
    performGamepadAction(document, 'next', false, geometry);
    expect(document.activeElement).toBe(fight);
    performGamepadAction(document, 'previous', false, geometry);
    expect(document.activeElement).toBe(retreat);
    performGamepadAction(document, 'up', false, geometry);
    performGamepadAction(document, 'up', false, geometry);
    expect(document.activeElement).toBe(fight);
    expect(gamepadFocusables(document, geometry)).not.toContain(background);
  });

  it('brings focus left behind a newly opened dialog into it, on its home button', () => {
    const move = control(document.body, 'Déplacer', 400, 700);
    const moved = vi.fn();
    move.addEventListener('click', moved);
    move.focus();
    const tutorial = document.createElement('div');
    tutorial.setAttribute('role', 'dialog');
    tutorial.setAttribute('aria-modal', 'true');
    document.body.append(tutorial);
    boxes.set(tutorial, { left: 300, top: 200, width: 600, height: 400 });
    control(tutorial, 'Passer', 500, 520);
    const next = control(tutorial, 'Suivant', 700, 520);
    next.dataset.gamepadHome = '';
    performGamepadAction(document, 'confirm', false, geometry);
    expect(document.activeElement).toBe(next);
    expect(moved).not.toHaveBeenCalled();
  });

  it('only places focus on the first press when nothing is focused, preferring the marked home area', () => {
    const settings = control(document.body, 'Réglages', 0, 0);
    const dock = document.createElement('div');
    dock.dataset.gamepadHome = '';
    document.body.append(dock);
    const move = control(dock, 'Déplacer', 0, 600);
    const keys: string[] = [];
    document.addEventListener('keydown', event => keys.push(event.key));
    performGamepadAction(document, 'confirm', false, geometry);
    expect(document.activeElement).toBe(move);
    expect(keys).toEqual([]);
    expect(settings).not.toBe(document.activeElement);
  });

  it('follows the screen hints: A from a point to its action, B back to the point, Start to the menu bar', () => {
    const nav = document.createElement('nav');
    nav.dataset.gamepadMenu = '';
    document.body.append(nav);
    boxes.set(nav, { left: 600, top: 0, width: 700, height: 60 });
    const sounds = control(nav, 'Sons', 600, 0);
    const point = control(document.body, 'Audience d’Alaric', 200, 300, 40, 40);
    point.dataset.gamepadConfirm = '[data-poi-action=move],[data-poi-action=details]';
    point.setAttribute('aria-pressed', 'true');
    const bar = document.createElement('div');
    bar.dataset.gamepadBack = '[aria-pressed=true]';
    document.body.append(bar);
    const details = control(bar, 'Détails', 1000, 720);
    details.dataset.poiAction = 'details';
    const go = control(bar, 'Se rendre', 1130, 720) as HTMLButtonElement;
    go.dataset.poiAction = 'move';
    const travelled = vi.fn();
    go.addEventListener('click', travelled);
    point.focus();
    performGamepadAction(document, 'confirm', false, geometry);
    expect(document.activeElement).toBe(go);
    expect(travelled).not.toHaveBeenCalled();
    performGamepadAction(document, 'back', false, geometry);
    expect(document.activeElement).toBe(point);
    go.disabled = true;
    performGamepadAction(document, 'confirm', false, geometry);
    expect(document.activeElement).toBe(details);
    go.disabled = false;
    go.focus();
    performGamepadAction(document, 'confirm', false, geometry);
    expect(travelled).toHaveBeenCalledTimes(1);
    performGamepadAction(document, 'menu', false, geometry);
    expect(document.activeElement).toBe(sounds);
  });

  it('waits while the page home is hidden, as during an enemy turn, and never types into the page', () => {
    const objective = control(document.body, 'Objectif', 1000, 20, 200, 40, 'summary');
    const dock = document.createElement('div');
    dock.dataset.gamepadHome = '';
    dock.hidden = true;
    document.body.append(dock);
    control(dock, 'Déplacer', 400, 700);
    const keys: string[] = [];
    document.addEventListener('keydown', event => keys.push(event.key));
    performGamepadAction(document, 'confirm', false, geometry);
    performGamepadAction(document, 'down', false, geometry);
    expect(document.activeElement).toBe(document.body);
    expect(objective).not.toBe(document.activeElement);
    expect(keys).toEqual([]);
    performGamepadAction(document, 'back', false, geometry);
    expect(keys).toEqual(['Escape']);
  });

  it('skips disabled, hidden and inert controls, and steps a focused slider', () => {
    const off = control(document.body, 'Indisponible', 0, 0) as HTMLButtonElement;
    off.disabled = true;
    const hidden = control(document.body, 'Caché', 0, 50);
    hidden.hidden = true;
    const slider = control(document.body, '', 0, 100, 200, 20, 'input') as HTMLInputElement;
    slider.type = 'range';
    slider.min = '0'; slider.max = '10'; slider.step = '1'; slider.value = '5';
    expect(gamepadFocusables(document, geometry)).toEqual([slider]);
    const changed = vi.fn();
    slider.addEventListener('input', changed);
    slider.focus();
    performGamepadAction(document, 'right', false, geometry);
    expect(slider.value).toBe('6');
    expect(changed).toHaveBeenCalledTimes(1);
  });
});

describe('controller polling', () => {
  it('acts in the focused frame only, and marks the controller as the current input', () => {
    let state = pad();
    Object.defineProperty(window.navigator, 'getGamepads', { configurable: true, value: () => [state] });
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const go = control(document.body, 'Continuer', 0, 0);
    const clicked = vi.fn();
    go.addEventListener('click', clicked);
    go.focus();
    const navigator = new GamepadNavigator(window, { geometry });
    navigator.poll(0);
    state = pad([0]);
    navigator.poll(16);
    navigator.poll(32);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.input).toBe('gamepad');

    state = pad();
    navigator.poll(48);
    const frame = document.createElement('iframe');
    document.body.append(frame);
    boxes.set(frame, { left: 0, top: 0, width: 800, height: 600 });
    frame.focus();
    state = pad([0]);
    navigator.poll(64);
    expect(clicked).toHaveBeenCalledTimes(1);
    navigator.dispose();
    Reflect.deleteProperty(window.navigator, 'getGamepads');
  });
});
