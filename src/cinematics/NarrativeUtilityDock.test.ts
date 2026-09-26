// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { NarrativeUtilityDock } from './NarrativeUtilityDock';

describe('NarrativeUtilityDock', () => {
  afterEach(() => document.body.replaceChildren());

  it('owns one utility element through replacement, repeated disposal, and re-presentation', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const dock = new NarrativeUtilityDock(root);
    const first = document.createElement('div');
    const second = document.createElement('div');
    dock.mount(first);
    expect(root.querySelectorAll('.narrative-utility-dock')).toHaveLength(1);
    dock.mount(second);
    expect(first.isConnected).toBe(false);
    expect(first.classList.contains('narrative-utility-dock')).toBe(false);
    expect(root.querySelectorAll('.narrative-utility-dock')).toHaveLength(1);
    dock.dispose();
    dock.dispose();
    expect(second.isConnected).toBe(false);
    expect(second.hasAttribute('role')).toBe(false);
    dock.mount(first);
    expect(root.querySelectorAll('.narrative-utility-dock')).toHaveLength(1);
    dock.dispose();
    expect(root.querySelector('.narrative-utility-dock')).toBeNull();
  });
});
