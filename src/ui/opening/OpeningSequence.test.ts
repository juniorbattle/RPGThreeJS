// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../../game/content';
import { prologuePanels } from '../../game/prologue';
import { OpeningSequence } from './OpeningSequence';
import { cameraAt, IMAGE_HEIGHT, IMAGE_WIDTH, OPENING_CAST, OPENING_SHOTS } from './openingShots';

function play(options: { reducedMotion?: boolean } = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const sequence = new OpeningSequence(root);
  let settled = 0;
  const done = sequence.open(options).then(() => { settled += 1; });
  const element = root.querySelector<HTMLElement>('.opening-sequence')!;
  return { root, sequence, element, done, settled: () => settled };
}

const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('opening script (OD-2026-11-02-A)', () => {
  it('lasts 50 to 60 seconds and gives each line time to be read', () => {
    const total = OPENING_SHOTS.reduce((sum, shot) => sum + shot.seconds, 0);
    expect(total).toBeGreaterThanOrEqual(50);
    expect(total).toBeLessThanOrEqual(60);
    for (const shot of OPENING_SHOTS) {
      shot.lines.forEach((line, index) => {
        const until = shot.lines[index + 1]?.at ?? shot.seconds - 0.8;
        expect((line.text.split(/\s+/).length / (until - line.at)) * 60, line.text).toBeLessThanOrEqual(240);
      });
      const words = shot.lines.flatMap(line => line.text.split(/\s+/)).length;
      expect((words / (shot.seconds - 0.8)) * 60, `${shot.id} held at once`).toBeLessThanOrEqual(240);
    }
  });

  it('plays the five panels in order, with their own words and a timing for each line', () => {
    expect(OPENING_SHOTS.map(shot => shot.id)).toEqual(prologuePanels.map(panel => panel.id));
    OPENING_SHOTS.forEach((shot, index) => expect(shot.lines.map(line => line.text)).toEqual(prologuePanels[index]!.lines));
    for (const shot of OPENING_SHOTS) for (const line of shot.lines) expect(line.at, line.text).toBeGreaterThan(0);
  });

  it('names the goal in Maelor\'s own sentence, which the dialogue keeps for a player who skips', () => {
    const goal = OPENING_SHOTS.flatMap(shot => shot.lines).find(line => line.text.includes('Tournoi des Grands'))?.text;
    expect(goal).toBeTruthy();
    expect(dialogues.get('acte_ouverture')?.steps.find(step => step.id === '2')?.text).toContain(goal!);
  });

  it('ends on the camp of the dialogue that follows, with no more than four heroes', () => {
    expect(OPENING_SHOTS.at(-1)?.image).toContain('lion-camp-tableau.png');
    expect(OPENING_SHOTS.at(-1)?.to.zoom).toBe(1);
    expect(OPENING_CAST.map(actor => actor.id)).toEqual(['alistair', 'marian', 'kestrel', 'elara']);
  });

  it('always covers the view with the image', () => {
    for (const shot of OPENING_SHOTS) for (const [width, height] of [[1920, 1080], [1280, 800], [2560, 1080]] as const) {
      for (const progress of [0, 0.5, 1]) {
        const camera = cameraAt(shot, progress, width, height, 90);
        expect(camera.x).toBeLessThanOrEqual(0);
        expect(camera.y).toBeLessThanOrEqual(0);
        expect(camera.x + IMAGE_WIDTH * camera.scale).toBeGreaterThanOrEqual(width - 0.01);
        expect(camera.y + IMAGE_HEIGHT * camera.scale).toBeGreaterThanOrEqual(height - 0.01);
      }
    }
  });
});

describe('OpeningSequence', () => {
  it('stays presentation: no game state, no WebGL, no video, no ambience of its own', () => {
    for (const file of ['OpeningSequence.ts', 'openingPainters.ts', 'openingShots.ts']) {
      const source = readFileSync(`src/ui/opening/${file}`, 'utf8');
      expect(source, file).not.toMatch(/game\/(store|runSystem|types)|saveAuto|localStorage|prologueSeen|from 'three'|<video|\.mp4|webgl|setMusic/i);
    }
  });

  it('walks the shots on Enter and on a click, then settles once after the last one', async () => {
    const { sequence, element, done, settled } = play();
    sequence.start();
    const seen = [element.dataset.panel];
    press('Enter');
    seen.push(element.dataset.panel);
    element.click();
    seen.push(element.dataset.panel);
    press(' ');
    seen.push(element.dataset.panel);
    press('Enter');
    seen.push(element.dataset.panel);
    expect(seen).toEqual(OPENING_SHOTS.map(shot => shot.id));
    expect(settled()).toBe(0);
    press('Enter');
    await done;
    press('Enter');
    await Promise.resolve();
    expect(settled()).toBe(1);
  });

  it('leaves with Passer or Escape from any shot, and fades over the dialogue without its heroes', async () => {
    const first = play();
    first.sequence.start();
    press('Escape');
    await first.done;
    expect(first.element.classList.contains('is-leaving')).toBe(true);
    expect(first.element.querySelector('[data-cast]')?.childElementCount).toBe(0);

    const second = play();
    second.sequence.start();
    press('Enter');
    second.element.querySelector<HTMLElement>('[data-skip]')!.click();
    await second.done;
    expect(second.settled()).toBe(1);
  });

  it('keeps Enter on a focused Passer for the button itself', () => {
    const { sequence, element } = play();
    sequence.start();
    const skip = element.querySelector<HTMLElement>('[data-skip]')!;
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    skip.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(element.dataset.panel).toBe(OPENING_SHOTS[0]!.id);
    sequence.close();
  });

  it('settles on close() and leaves nothing behind, even during its fade', async () => {
    const { root, sequence, done, settled } = play();
    sequence.start();
    press('Escape');
    await done;
    sequence.close();
    expect(root.querySelector('.opening-sequence')).toBeNull();
    expect(settled()).toBe(1);

    const again = play();
    again.sequence.close();
    await again.done;
    expect(again.root.querySelector('.opening-sequence')).toBeNull();
    press('Enter');
    expect(again.settled()).toBe(1);
  });

  it('never carries a line into the next shot', () => {
    const { sequence, element } = play();
    sequence.start();
    press('Enter');
    expect(element.querySelector('[data-line]')?.textContent).toBe('');
    sequence.close();
  });

  it('holds every line at once under reduced motion, from the game setting or the system', () => {
    const shown = OPENING_SHOTS[0]!.lines.map(line => line.text).join(' ');
    const game = play({ reducedMotion: true });
    game.sequence.start();
    expect(game.element.dataset.reducedMotion).toBe('true');
    expect(game.element.querySelector('[data-line]')?.textContent).toBe(shown);
    game.sequence.close();
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const system = play({ reducedMotion: false });
    system.sequence.start();
    expect(system.element.dataset.reducedMotion).toBe('true');
    system.sequence.close();
  });

  it('keeps each composition under reduced motion, drawn once and frozen', async () => {
    let drawn = 0;
    const context = new Proxy({}, {
      get: (_, key) => {
        if (key === 'createImageData') return (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) });
        if (key === 'createRadialGradient') return () => ({ addColorStop: () => undefined });
        if (key === 'fillRect' || key === 'drawImage') return () => { drawn += 1; };
        return () => undefined;
      },
      set: () => true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const { sequence } = play({ reducedMotion: true });
    sequence.start();
    expect(drawn).toBeGreaterThan(0);
    const still = drawn;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(drawn).toBe(still);
    press('Enter');
    expect(drawn).toBeGreaterThan(still);
    sequence.close();
  });

  it('keeps the text and the way out when a picture or the canvas is missing', async () => {
    const { sequence, element, done } = play();
    element.querySelector('[data-plate="prologue_seals"]')?.remove();
    element.querySelector('canvas')?.remove();
    sequence.start();
    press('Enter');
    expect(element.dataset.panel).toBe('prologue_seals');
    element.querySelector<HTMLElement>('[data-skip]')!.click();
    await done;
  });

  it('never starts twice, and never before it opens', () => {
    const idle = new OpeningSequence(document.createElement('div'));
    expect(() => idle.start()).not.toThrow();
    const { sequence, element } = play();
    sequence.start();
    press('Enter');
    sequence.start();
    expect(element.dataset.panel).toBe(OPENING_SHOTS[1]!.id);
    sequence.close();
  });

  it('plays under the launch transition and above the dialogue only while it fades', () => {
    const css = readFileSync('src/ui/opening/opening-sequence.css', 'utf8');
    expect(css).toMatch(/\.opening-sequence \{[^}]*z-index: 70;/);
    expect(css).toMatch(/\.opening-sequence\.is-leaving \{ z-index: 9100;/);
  });
});
