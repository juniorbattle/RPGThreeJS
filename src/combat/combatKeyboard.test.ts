// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { shouldHandleCombatShortcut } from './combatKeyboard';

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
});
