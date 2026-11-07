/**
 * Controller support (OD-2026-11-05-A). A gamepad drives the game through the paths the keyboard already uses: each
 * press becomes the key a player would type, sent to the focused control. Only when no screen claims that key does the
 * navigator move focus itself, as the browser does for Tab. Presentation only: it reads and writes no game truth,
 * save or rule, and every action still goes through the control or handler that owns it.
 *
 * A screen may add three hints that only the controller reads: `data-gamepad-confirm` (A moves focus to the first
 * listed control instead of activating, as the map does from a point to « Se rendre »), `data-gamepad-back` (B moves
 * focus back to a listed control) and `data-gamepad-menu` (Start reaches that menu bar).
 */

export type GamepadAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back' | 'previous' | 'next' | 'menu';
type Direction = 'up' | 'down' | 'left' | 'right';

export interface GamepadPress {
  action: GamepadAction;
  repeat: boolean;
}

export interface GamepadGeometry {
  rect(element: Element): { left: number; top: number; width: number; height: number };
}

/** Standard mapping, which Chromium gives Xbox and PlayStation pads: A/Cross, B/Circle, LB/L1, RB/R1, Start/Options, then the D-pad. */
export const GAMEPAD_BUTTONS: ReadonlyArray<readonly [number, GamepadAction]> = [
  [0, 'confirm'], [1, 'back'], [4, 'previous'], [5, 'next'], [9, 'menu'], [12, 'up'], [13, 'down'], [14, 'left'], [15, 'right'],
];
export const GAMEPAD_REPEAT_DELAY_MS = 380;
export const GAMEPAD_REPEAT_INTERVAL_MS = 140;
export const GAMEPAD_CONNECTED_TEXT = 'Manette connectée · A ou Croix : valider · B ou Rond : retour · croix ou stick gauche : se déplacer · stick droit : faire défiler · LB/RB ou L1/R1 : commande précédente ou suivante · Start ou Options : menu de la carte';
export const GAMEPAD_DISCONNECTED_TEXT = 'Manette déconnectée.';

const STICK_ON = 0.6;
const STICK_OFF = 0.35;
const MODAL = '[aria-modal="true"], dialog[open]';
const FOCUSABLE = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, iframe, [tabindex]';
const NATIVE_ACTIVATION = 'button, a[href], summary, input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], input[type="reset"]';
const KEYS: Record<Exclude<GamepadAction, 'menu'>, { key: string; code: string; shiftKey?: boolean }> = {
  up: { key: 'ArrowUp', code: 'ArrowUp' },
  down: { key: 'ArrowDown', code: 'ArrowDown' },
  left: { key: 'ArrowLeft', code: 'ArrowLeft' },
  right: { key: 'ArrowRight', code: 'ArrowRight' },
  confirm: { key: 'Enter', code: 'Enter' },
  back: { key: 'Escape', code: 'Escape' },
  previous: { key: 'Tab', code: 'Tab', shiftKey: true },
  next: { key: 'Tab', code: 'Tab' },
};

const domGeometry: GamepadGeometry = { rect: element => element.getBoundingClientRect() };

function isDirection(action: GamepadAction): action is Direction {
  return action === 'up' || action === 'down' || action === 'left' || action === 'right';
}

/** Actions held on every connected pad. The left stick counts on its dominant axis, with hysteresis so it never flickers. */
export function heldGamepadActions(pads: ArrayLike<Gamepad | null>, previous: ReadonlySet<GamepadAction> = new Set()): Set<GamepadAction> {
  const held = new Set<GamepadAction>();
  for (let index = 0; index < pads.length; index += 1) {
    const pad = pads[index];
    if (!pad || pad.connected === false) continue;
    for (const [button, action] of GAMEPAD_BUTTONS) if (pad.buttons[button]?.pressed) held.add(action);
    const x = Number.isFinite(pad.axes[0]) ? pad.axes[0]! : 0;
    const y = Number.isFinite(pad.axes[1]) ? pad.axes[1]! : 0;
    const [negative, positive, value]: [Direction, Direction, number] = Math.abs(x) >= Math.abs(y) ? ['left', 'right', x] : ['up', 'down', y];
    const direction = value < 0 ? negative : positive;
    if (Math.abs(value) >= (previous.has(direction) ? STICK_OFF : STICK_ON)) held.add(direction);
  }
  return held;
}

const SCROLL_DEAD_ZONE = 0.25;
const SCROLL_PX_PER_FRAME = 16;

/** The right stick's vertical lean on the strongest pad, past a dead zone: -1 up to 1 down, 0 at rest. */
export function gamepadScrollLean(pads: ArrayLike<Gamepad | null>): number {
  let lean = 0;
  for (let index = 0; index < pads.length; index += 1) {
    const pad = pads[index];
    if (!pad || pad.connected === false) continue;
    const y = Number.isFinite(pad.axes[3]) ? pad.axes[3]! : 0;
    if (Math.abs(y) > Math.abs(lean)) lean = y;
  }
  return Math.abs(lean) < SCROLL_DEAD_ZONE ? 0 : lean;
}

/** The panel the right stick scrolls: the nearest scrollable box around the focus, else the open dialog's, else the page. */
export function gamepadScrollTarget(doc: Document, from: Element | null): Element | null {
  const view = doc.defaultView;
  for (let node = from; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    const style = view?.getComputedStyle(node);
    if (style && /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) return node;
  }
  return doc.scrollingElement;
}

/** One press per new action, then repeats for a held direction. A press held while the frame was inactive stays mute until released. */
export class GamepadPressTracker {
  private readonly heldSince = new Map<GamepadAction, number>();
  private readonly lastFired = new Map<GamepadAction, number>();
  private readonly muted = new Set<GamepadAction>();

  step(held: ReadonlySet<GamepadAction>, now: number, active: boolean): GamepadPress[] {
    const presses: GamepadPress[] = [];
    for (const action of [...this.heldSince.keys()]) {
      if (held.has(action)) continue;
      this.heldSince.delete(action);
      this.lastFired.delete(action);
      this.muted.delete(action);
    }
    for (const action of held) {
      if (!this.heldSince.has(action)) {
        this.heldSince.set(action, now);
        this.lastFired.set(action, now);
        if (active) presses.push({ action, repeat: false });
        else this.muted.add(action);
        continue;
      }
      if (!active) { this.muted.add(action); continue; }
      if (this.muted.has(action) || !isDirection(action)) continue;
      if (now - this.heldSince.get(action)! >= GAMEPAD_REPEAT_DELAY_MS && now - this.lastFired.get(action)! >= GAMEPAD_REPEAT_INTERVAL_MS) {
        this.lastFired.set(action, now);
        presses.push({ action, repeat: true });
      }
    }
    return presses;
  }
}

function blocked(element: Element): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const html = node as HTMLElement;
    if (html.inert === true || node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true' || html.hidden === true) return true;
  }
  return false;
}

function visible(element: Element, geometry: GamepadGeometry): boolean {
  const box = geometry.rect(element);
  if (box.width <= 0 && box.height <= 0) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  return !style || (style.visibility !== 'hidden' && style.display !== 'none');
}

/** Focusable controls a player can reach under `root`, in document order. */
export function gamepadFocusables(root: ParentNode, geometry: GamepadGeometry = domGeometry): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(element =>
    element.tabIndex >= 0 && (element as HTMLButtonElement).disabled !== true && !blocked(element) && visible(element, geometry));
}

function openModal(doc: Document, geometry: GamepadGeometry): Element | null {
  return [...doc.querySelectorAll(MODAL)].filter(element => !blocked(element) && visible(element, geometry)).at(-1) ?? null;
}

/** The open modal that owns focus, else the whole page: navigation never leaves a dialog the game has opened. */
export function gamepadScope(doc: Document, from: Element | null, geometry: GamepadGeometry = domGeometry): ParentNode {
  const own = from?.closest(MODAL);
  if (own && !blocked(own)) return own;
  return openModal(doc, geometry) ?? doc.body;
}

function intervalGap(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.max(a1, b1) - Math.min(a2, b2));
}

/** The nearest control in a direction. A control that encloses the current one, such as the battlefield behind the dock, comes last. */
export function spatialNeighbour(from: Element, candidates: readonly HTMLElement[], direction: Direction, geometry: GamepadGeometry = domGeometry): HTMLElement | null {
  const a = geometry.rect(from);
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  const horizontal = direction === 'left' || direction === 'right';
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    if (candidate === from) continue;
    const b = geometry.rect(candidate);
    const dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
    const forward = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
    if (forward <= 1) continue;
    const gap = Math.max(0, direction === 'left' ? a.left - (b.left + b.width)
      : direction === 'right' ? b.left - (a.left + a.width)
        : direction === 'up' ? a.top - (b.top + b.height)
          : b.top - (a.top + a.height));
    const side = horizontal ? intervalGap(a.top, a.top + a.height, b.top, b.top + b.height) : intervalGap(a.left, a.left + a.width, b.left, b.left + b.width);
    const beyond = direction === 'left' ? b.left + b.width <= a.left + 1
      : direction === 'right' ? b.left >= a.left + a.width - 1
        : direction === 'up' ? b.top + b.height <= a.top + 1
          : b.top >= a.top + a.height - 1;
    const encloses = b.left <= a.left && b.top <= a.top && b.left + b.width >= a.left + a.width && b.top + b.height >= a.top + a.height;
    const score = gap + side * 2 + Math.abs(horizontal ? dy : dx) * 0.01 + (beyond ? 0 : 1e3) + (encloses ? 1e6 : 0);
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best;
}

function sequential(list: readonly HTMLElement[], from: Element | null, backwards: boolean): HTMLElement | null {
  if (!list.length) return null;
  const index = from ? list.indexOf(from as HTMLElement) : -1;
  if (index < 0) return backwards ? list.at(-1)! : list[0]!;
  return list[(index + (backwards ? -1 : 1) + list.length) % list.length]!;
}

function innerDocument(element: Element): Document | null {
  if (element.tagName !== 'IFRAME') return null;
  try { return (element as HTMLIFrameElement).contentDocument; } catch { return null; }
}

/**
 * Where the first press lands when nothing is focused: an embedded combat frame, then a marked home area, then the
 * first control. A page whose home area is hidden is busy (an enemy turn, for instance): the press then waits.
 */
function homeTarget(doc: Document, geometry: GamepadGeometry): HTMLElement | null {
  const scope = gamepadScope(doc, null, geometry);
  const list = gamepadFocusables(scope, geometry);
  const preferred = list.find(element => element.tagName === 'IFRAME')
    ?? list.find(element => element.hasAttribute('autofocus'))
    ?? list.find(element => element.closest('[data-gamepad-home]'));
  if (preferred) return preferred;
  if (scope === doc.body && doc.querySelector('[data-gamepad-home]')) return null;
  return list[0] ?? null;
}

function focusFromGamepad(element: HTMLElement, geometry: GamepadGeometry): void {
  element.focus({ preventScroll: false, focusVisible: true } as FocusOptions);
  const inner = innerDocument(element);
  if (inner) homeTarget(inner, geometry)?.focus({ preventScroll: false, focusVisible: true } as FocusOptions);
}

/** The first reachable control matching a screen's hint list, in the hint's order. */
function hintedTarget(doc: Document, from: Element, hints: string | null | undefined, geometry: GamepadGeometry): HTMLElement | null {
  if (!hints) return null;
  const list = gamepadFocusables(gamepadScope(doc, from, geometry), geometry);
  for (const selector of hints.split(',')) {
    try {
      const match = list.find(element => element.matches(selector.trim()));
      if (match) return match;
    } catch { /* A malformed hint is ignored; the press keeps its ordinary path. */ }
  }
  return null;
}

function menuTarget(doc: Document, from: Element | null, geometry: GamepadGeometry): HTMLElement | null {
  const menus = [...gamepadScope(doc, from, geometry).querySelectorAll('[data-gamepad-menu]')].filter(menu => !blocked(menu) && visible(menu, geometry));
  const menu = menus.at(-1);
  return menu ? gamepadFocusables(menu, geometry)[0] ?? null : null;
}

function defaultAction(doc: Document, target: HTMLElement, action: Exclude<GamepadAction, 'menu'>, geometry: GamepadGeometry): void {
  if (action === 'back') return;
  if (action === 'confirm') {
    if (target.matches(NATIVE_ACTIVATION)) target.click();
    return;
  }
  if ((action === 'left' || action === 'right') && target.matches('input[type="range"]')) {
    const input = target as HTMLInputElement;
    const step = Number(input.step) > 0 ? Number(input.step) : 1;
    const min = input.min === '' ? 0 : Number(input.min), max = input.max === '' ? 100 : Number(input.max);
    const next = Math.min(max, Math.max(min, Number(input.value) + (action === 'right' ? step : -step)));
    if (String(next) === input.value) return;
    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  const list = gamepadFocusables(gamepadScope(doc, target, geometry), geometry);
  const next = isDirection(action) ? spatialNeighbour(target, list, action, geometry) : sequential(list, target, action === 'previous');
  if (next && next !== target) focusFromGamepad(next, geometry);
}

/**
 * Performs one press in `doc`. The key goes to the focused control first, exactly as typed; if no handler claims it,
 * the browser's own default follows (a button activates on Enter) and arrows or shoulder buttons move focus.
 * With no usable focus, the first press only places focus, so a stray press never ends a combat turn.
 */
export function performGamepadAction(doc: Document, action: GamepadAction, repeat = false, geometry: GamepadGeometry = domGeometry): void {
  const active = doc.activeElement as HTMLElement | null;
  const modal = openModal(doc, geometry);
  // Focus left behind a dialog that has since opened, or on a control now hidden, counts as no focus.
  const focused = active && active !== doc.body && active !== doc.documentElement && !blocked(active) && visible(active, geometry)
    && (!modal || modal.contains(active)) ? active : null;
  if (action === 'menu') {
    const menu = menuTarget(doc, focused, geometry);
    if (menu) focusFromGamepad(menu, geometry);
    return;
  }
  if (!focused && action !== 'back') {
    const home = homeTarget(doc, geometry);
    if (home) focusFromGamepad(home, geometry);
    return;
  }
  if (focused && (action === 'confirm' || action === 'back')) {
    const hint = action === 'confirm' ? 'data-gamepad-confirm' : 'data-gamepad-back';
    const hinted = hintedTarget(doc, focused, focused.closest(`[${hint}]`)?.getAttribute(hint), geometry);
    if (hinted && hinted !== focused) { focusFromGamepad(hinted, geometry); return; }
  }
  const target = focused ?? doc.body;
  const spec = KEYS[action];
  const KeyboardEventType = doc.defaultView?.KeyboardEvent ?? KeyboardEvent;
  const proceed = target.dispatchEvent(new KeyboardEventType('keydown', {
    key: spec.key, code: spec.code, shiftKey: spec.shiftKey ?? false, repeat, bubbles: true, cancelable: true, composed: true,
  }));
  if (proceed && focused && focused.isConnected) defaultAction(doc, focused, action, geometry);
}

export interface GamepadNavigatorOptions {
  /** Show a short notice when a pad connects or disconnects (the top page only). */
  announce?: boolean;
  geometry?: GamepadGeometry;
  now?: () => number;
}

/**
 * Polls the pads once per frame. The top page and the combat frame each run one; only the frame that holds focus
 * acts, so a press is never performed twice.
 */
export class GamepadNavigator {
  private held = new Set<GamepadAction>();
  private readonly tracker = new GamepadPressTracker();
  private frame = 0;
  private running = false;
  private toast: HTMLElement | null = null;
  private toastTimer = 0;

  constructor(private readonly win: Window, private readonly options: GamepadNavigatorOptions = {}) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.win.addEventListener('gamepadconnected', this.onConnected);
    this.win.addEventListener('gamepaddisconnected', this.onDisconnected);
    this.win.addEventListener('pointerdown', this.onOtherInput, true);
    this.win.addEventListener('keydown', this.onOtherInput, true);
    const tick = (): void => {
      if (!this.running) return;
      this.poll();
      this.frame = this.win.requestAnimationFrame(tick);
    };
    this.frame = this.win.requestAnimationFrame(tick);
  }

  /** One sample of every pad; the frame loop calls it, tests and the QA driver may too. */
  poll(now: number = this.options.now?.() ?? this.win.performance.now()): void {
    const held = heldGamepadActions(this.pads(), this.held);
    this.held = held;
    const presses = this.tracker.step(held, now, this.isActiveFrame());
    if (presses.length) this.win.document.documentElement.dataset.input = 'gamepad';
    for (const press of presses) performGamepadAction(this.win.document, press.action, press.repeat, this.options.geometry);
    // The right stick scrolls long panels, such as a hero's whole sheet, without moving focus.
    const lean = this.isActiveFrame() ? gamepadScrollLean(this.pads()) : 0;
    if (lean) {
      const doc = this.win.document;
      gamepadScrollTarget(doc, doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : doc.querySelector(MODAL))?.scrollBy({ top: lean * SCROLL_PX_PER_FRAME });
    }
  }

  dispose(): void {
    this.running = false;
    this.win.cancelAnimationFrame(this.frame);
    this.win.removeEventListener('gamepadconnected', this.onConnected);
    this.win.removeEventListener('gamepaddisconnected', this.onDisconnected);
    this.win.removeEventListener('pointerdown', this.onOtherInput, true);
    this.win.removeEventListener('keydown', this.onOtherInput, true);
    this.win.clearTimeout(this.toastTimer);
    this.toast?.remove();
    this.toast = null;
  }

  private pads(): ArrayLike<Gamepad | null> {
    try { return this.win.navigator.getGamepads?.() ?? []; } catch { return []; }
  }

  private isActiveFrame(): boolean {
    const doc = this.win.document;
    if (doc.visibilityState === 'hidden' || !doc.hasFocus()) return false;
    const active = doc.activeElement;
    return !(active && innerDocument(active));
  }

  private readonly onConnected = (): void => {
    if (this.options.announce) this.announce(GAMEPAD_CONNECTED_TEXT);
  };

  private readonly onDisconnected = (): void => {
    if (this.options.announce) this.announce(GAMEPAD_DISCONNECTED_TEXT);
  };

  /** A real pointer or key press hands the focus ring back to the browser's own rules. */
  private readonly onOtherInput = (event: Event): void => {
    if (event.isTrusted) delete this.win.document.documentElement.dataset.input;
  };

  private announce(text: string): void {
    const doc = this.win.document;
    if (!this.toast) {
      this.toast = doc.createElement('div');
      this.toast.className = 'gamepad-toast';
      this.toast.setAttribute('role', 'status');
      this.toast.setAttribute('aria-live', 'polite');
      doc.body.append(this.toast);
    }
    this.toast.textContent = text;
    this.toast.classList.add('is-visible');
    this.win.clearTimeout(this.toastTimer);
    this.toastTimer = this.win.setTimeout(() => this.toast?.classList.remove('is-visible'), 5200);
  }
}

/** Installs controller support on a page, or does nothing where the browser has no Gamepad API. */
export function installGamepadNavigator(win: Window = window, options: GamepadNavigatorOptions = {}): GamepadNavigator | null {
  if (typeof win.navigator?.getGamepads !== 'function') return null;
  const navigator = new GamepadNavigator(win, options);
  navigator.start();
  return navigator;
}
