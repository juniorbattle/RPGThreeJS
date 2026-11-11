// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SceneTransition } from './SceneTransition';

afterEach(() => {
  document.body.replaceChildren();
  document.body.className = '';
  vi.useRealTimers();
});

describe('scene transition interlude', () => {

  it('covers map/Journey handoffs and keeps input locked until the ordinary travel reveal', async () => {
    vi.useFakeTimers();const transition=new SceneTransition(),task=vi.fn(async()=>undefined);
    const run=transition.run({variant:'travel',task});
    const curtain=document.querySelector<HTMLElement>('.scene-transition')!;
    expect(curtain.classList.contains('scene-transition--fade')).toBe(true);
    expect(curtain.style.getPropertyValue('--scene-transition-in')).toBe('450ms');
    await vi.advanceTimersByTimeAsync(440);expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(20);expect(task).not.toHaveBeenCalled();
    curtain.dispatchEvent(new Event('transitionend'));await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledOnce();
    expect(document.body.classList.contains('scene-transition--locked')).toBe(true);
    await vi.runAllTimersAsync();await run;
    expect(document.querySelector('.scene-transition')).toBeNull();expect(document.body.classList.contains('scene-transition--locked')).toBe(false);
  });
  it('releases input only for the covered interlude and reacquires it before the task', async () => {
    vi.useFakeTimers();
    const transition = new SceneTransition();
    const order: string[] = [];
    let finishInterlude!: () => void;
    const interludeDone = new Promise<void>((resolve) => { finishInterlude = resolve; });
    const run = transition.run({
      variant: 'fade',
      interlude: async () => {
        order.push('interlude');
        expect(document.body.classList.contains('scene-transition--locked')).toBe(false);
        expect(document.body.classList.contains('scene-transition--interlude')).toBe(true);
        await interludeDone;
      },
      task: async () => {
        order.push('task');
        expect(document.body.classList.contains('scene-transition--locked')).toBe(true);
      },
      holdMs: 0,
    });
    await vi.advanceTimersByTimeAsync(520);
    expect(order).toEqual(['interlude']);
    finishInterlude();
    await vi.advanceTimersByTimeAsync(500);
    await run;
    expect(order).toEqual(['interlude', 'task']);
    expect(document.body.classList.contains('scene-transition--locked')).toBe(false);
    expect(document.querySelector('.scene-transition')).toBeNull();
  });

  it('continues to the task when an interlude fails', async () => {
    vi.useFakeTimers();
    const transition = new SceneTransition();
    const task = vi.fn(async () => undefined);
    const run = transition.run({
      variant: 'fade',
      interlude: async () => { throw new Error('media failed'); },
      task,
      holdMs: 0,
    });
    await vi.advanceTimersByTimeAsync(1_100);
    await run;
    expect(task).toHaveBeenCalledOnce();
    expect(document.querySelector('.scene-transition')).toBeNull();
  });

  it.each(['ended', 'skipped', 'reduced-motion', 'unavailable', 'error'])(
    'continues downstream gameplay after a %s cinematic result',
    async (reason) => {
      vi.useFakeTimers();
      const transition = new SceneTransition();
      const order: string[] = [];
      const run = transition.run({
        variant: 'dialogue',
        interlude: async () => {
          order.push(`cinematic:${reason}`);
          return { reason };
        },
        task: async () => { order.push('downstream'); },
        holdMs: 0,
      });
      await vi.advanceTimersByTimeAsync(1_200);
      await run;
      expect(order).toEqual([`cinematic:${reason}`, 'downstream']);
      expect(document.querySelector('.scene-transition')).toBeNull();
    },
  );
});

describe('scene transition guards (final audit 2026-11-11, A4 and A5)', () => {
  it('blocks keyboard and gamepad keydowns while the curtain covers, and only then', async () => {
    vi.useFakeTimers();
    const transition = new SceneTransition();
    const seen: string[] = [];
    const listener = (event: KeyboardEvent) => { seen.push(event.key); };
    document.addEventListener('keydown', listener);
    const press = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    try {
      const run = transition.run({ variant: 'fade', task: async () => { press(); }, holdMs: 0 });
      press();
      await vi.runAllTimersAsync();
      await run;
      expect(seen).toEqual([]);
      press();
      expect(seen).toEqual(['Enter']);
    } finally {
      document.removeEventListener('keydown', listener);
    }
  });

  it('reports a refused second transition instead of silently dropping its task', async () => {
    vi.useFakeTimers();
    const transition = new SceneTransition();
    const first = transition.run({ variant: 'fade', task: async () => undefined, holdMs: 0 });
    const secondTask = vi.fn(async () => undefined);
    const second = transition.run({ variant: 'combat', task: secondTask });
    await vi.runAllTimersAsync();
    await expect(second).resolves.toBe(false);
    await expect(first).resolves.toBe(true);
    expect(secondTask).not.toHaveBeenCalled();
  });

  it('holds the curtain over a swap and lifts it once the next surface has painted', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 16));
    try {
      const transition = new SceneTransition();
      const covered = transition.cover({ variant: 'result', label: 'Victoire' });
      await vi.advanceTimersByTimeAsync(700);
      await expect(covered).resolves.toBe(true);
      expect(transition.isHeld).toBe(true);
      expect(document.querySelector('.scene-transition__label')?.textContent).toBe('Victoire');
      expect(document.body.classList.contains('scene-transition--locked')).toBe(true);
      transition.releaseWhenReady();
      await vi.advanceTimersByTimeAsync(400);
      expect(document.querySelector('.scene-transition')).not.toBeNull(); // the minimum hold is honoured
      await vi.runAllTimersAsync();
      expect(transition.isHeld).toBe(false);
      expect(transition.isActive).toBe(false);
      expect(document.querySelector('.scene-transition')).toBeNull();
      expect(document.body.classList.contains('scene-transition--locked')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('lets the next transition run its task under a held curtain and lift it once', async () => {
    vi.useFakeTimers();
    const transition = new SceneTransition();
    const covered = transition.cover({ variant: 'result' });
    await vi.advanceTimersByTimeAsync(700);
    await covered;
    const task = vi.fn(async () => { expect(document.querySelectorAll('.scene-transition')).toHaveLength(1); });
    const run = transition.run({ variant: 'travel', task, holdMs: 0 });
    await vi.runAllTimersAsync();
    await expect(run).resolves.toBe(true);
    expect(task).toHaveBeenCalledOnce();
    expect(document.querySelector('.scene-transition')).toBeNull();
    expect(transition.isActive).toBe(false);
  });

  it('never leaves a held curtain up when no surface answers', async () => {
    vi.useFakeTimers();
    const transition = new SceneTransition();
    const covered = transition.cover({ variant: 'result' });
    await vi.advanceTimersByTimeAsync(700);
    await covered;
    await vi.advanceTimersByTimeAsync(6_000);
    await vi.runAllTimersAsync();
    expect(transition.isHeld).toBe(false);
    expect(document.querySelector('.scene-transition')).toBeNull();
  });
});
