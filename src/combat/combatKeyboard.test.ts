// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { nextCombatCursor, shouldHandleCombatShortcut, shouldPreventCombatWheel } from './combatKeyboard';

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
