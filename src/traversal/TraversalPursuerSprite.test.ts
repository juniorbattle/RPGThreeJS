// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { TraversalPursuerSprite } from './TraversalPursuerSprite';
import { TraversalPursuitChargeRenderer } from './TraversalPursuitChargeRenderer';
import { createPursuitCharge } from './TraversalPursuitCharge';

describe('road-owned articulated pursuer poses', () => {
  it('shows six poses from the road clock, freezes a paused pose, and wraps without wall-clock motion', () => {
    const sprite = new TraversalPursuerSprite();
    for (let frame = 0; frame < 6; frame++) {
      sprite.update(frame * 85, true);
      expect(sprite.element.dataset.frame).toBe(String(frame));
    }
    sprite.update(2000, false);
    expect(sprite.element.dataset.frame).toBe('5');
    sprite.update(510, true);
    expect(sprite.element.dataset.frame).toBe('0');
    sprite.dispose();
  });

  it('settles for either preference and can resume when both are off', () => {
    const query = { matches: false };
    vi.spyOn(window, 'matchMedia').mockReturnValue(query as MediaQueryList);
    const sprite = new TraversalPursuerSprite();
    sprite.update(170, true);
    expect(sprite.element.dataset.frame).toBe('2');
    query.matches = true;
    sprite.update(255, true, false);
    expect(sprite.element.dataset.frame).toBe('0');
    query.matches = false;
    sprite.update(340, true, true);
    expect(sprite.element.dataset.frame).toBe('0');
    sprite.update(340, true, false);
    expect(sprite.element.dataset.frame).toBe('4');
    sprite.dispose();
    vi.restoreAllMocks();
  });

  it('keeps the static identity until a valid sheet loads; malformed or failed sheets retain fallback', () => {
    const sprite = new TraversalPursuerSprite();
    const loader = sprite.element.querySelector<HTMLImageElement>('.traversal-pursuer-sprite__loader')!;
    expect(sprite.element.dataset.asset).toBe('pending');
    loader.dispatchEvent(new Event('load'));
    expect(sprite.element.dataset.asset).toBe('fallback');
    Object.defineProperties(loader, { naturalWidth: { value: 1536 }, naturalHeight: { value: 492 } });
    loader.dispatchEvent(new Event('load'));
    expect(sprite.element.dataset.asset).toBe('sheet');
    loader.dispatchEvent(new Event('error'));
    expect(sprite.element.dataset.asset).toBe('fallback');
    expect(sprite.element.style.backgroundImage).toBe('none');
    sprite.dispose();
    loader.dispatchEvent(new Event('load'));
    expect(sprite.element.dataset.asset).toBe('fallback');
  });

  it('freezes the charge pose on contact without changing terminal geometry or visibility', () => {
    const renderer = new TraversalPursuitChargeRenderer();
    const charge = createPursuitCharge({ windowId: 'authored', lane: 1, left: 40, speed: 200, acceleration: 800 });
    renderer.update({ ...charge, elapsedSeconds: .17 }, 1463, 160, true);
    const sprite = renderer.element.querySelector<HTMLElement>('.traversal-pursuer-sprite')!;
    expect(sprite.dataset.frame).toBe('2');
    renderer.update({ ...charge, phase: 'COLLISION_PENDING', elapsedSeconds: .26 }, 1463, 160, true);
    expect(sprite.dataset.frame).toBe('2');
    expect(renderer.element.style.left).toBe('40px');
    expect(renderer.element.style.top).toBe('81%');
    expect(renderer.element.hidden).toBe(false);
    renderer.update({ ...charge, phase: 'EXITED', left: 1463 }, 1463, 160, true);
    expect(renderer.element.hidden).toBe(true);
    renderer.dispose();
  });
});
