// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SceneTransition } from './SceneTransition';

afterEach(() => {
  document.body.replaceChildren();
  document.body.className = '';
  vi.useRealTimers();
});

describe('scene transition interlude', () => {
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
