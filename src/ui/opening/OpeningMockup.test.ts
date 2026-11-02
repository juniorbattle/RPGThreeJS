// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../../game/content';
import { prologuePanels } from '../../game/prologue';
import type { UiSoundPlayer } from '../UiSoundPlayer';
import { OpeningMockup } from './OpeningMockup';
import { cameraAt, IMAGE_HEIGHT, IMAGE_WIDTH, OPENING_CAST, OPENING_SHOTS, OPENING_VARIANTS } from './openingShots';

function open() {
  const root = document.createElement('div');
  root.append(document.createElement('main'));
  document.body.append(root);
  const player = { setMusicContext: vi.fn(), setMusicScene: vi.fn() };
  const view = new OpeningMockup(root, player as unknown as UiSoundPlayer, { preload: false });
  view.open();
  const element = root.querySelector<HTMLElement>('.opening-mock')!;
  return { root, player, view, element };
}

const key = (element: HTMLElement, name: string) => element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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
        const words = line.text.split(/\s+/).length;
        expect((words / (until - line.at)) * 60, line.text).toBeLessThanOrEqual(240);
      });
    }
  });

  it('adds no sentence: every line already exists in the prologue or in the opening dialogue', () => {
    const sources = [...prologuePanels.map(panel => panel.body), ...(dialogues.get('acte_ouverture')?.steps ?? []).map(step => step.text)];
    for (const shot of OPENING_SHOTS) for (const line of shot.lines) {
      for (const sentence of line.text.split(/(?<=\.)\s+/)) expect(sources.some(source => source.includes(sentence)), sentence).toBe(true);
    }
  });

  it('names the goal, keeps the company out of Bois-Clair and ends on the camp of the dialogue that follows', () => {
    expect(OPENING_SHOTS.flatMap(shot => shot.lines).some(line => line.text.includes('Tournoi des Grands'))).toBe(true);
    expect(OPENING_SHOTS.at(-1)?.image).toContain('lion-camp-tableau.png');
    expect(OPENING_SHOTS.at(-1)?.to.zoom).toBe(1);
    expect(OPENING_CAST).toHaveLength(4);
    expect(readFileSync('src/ui/opening/OpeningArenaShot.ts', 'utf8')).not.toMatch(/alistair|marian|kestrel|elara/);
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

describe('OpeningMockup', () => {
  it('stays out of the production build', () => {
    const app = readFileSync('src/game/GameApp.ts', 'utf8');
    expect(app).not.toMatch(/^import .*OpeningMockup/m);
    expect(app).toMatch(/if \(import\.meta\.env\.DEV\) void import\('\.\.\/ui\/opening\/OpeningMockup'\)/);
  });

  it('reads and writes no game state', () => {
    for (const file of ['OpeningMockup.ts', 'openingPainters.ts', 'openingShots.ts', 'OpeningArenaShot.ts']) {
      expect(readFileSync(`src/ui/opening/${file}`, 'utf8'), file).not.toMatch(/game\/(store|runSystem|types)|saveAuto|localStorage/);
    }
  });

  it('offers the three versions of Bois-Clair and closes with Escape', () => {
    const { root, player, element } = open();
    expect([...element.querySelectorAll<HTMLElement>('[data-variant]')].map(button => button.dataset.variant)).toEqual(OPENING_VARIANTS.map(variant => variant.id));
    expect(root.querySelector('main')?.inert).toBe(true);
    key(element, 'Escape');
    expect(root.querySelector('.opening-mock')).toBeNull();
    expect(root.querySelector('main')?.inert).toBe(false);
    expect(player.setMusicContext).toHaveBeenCalledWith('title');
  });

  it('walks the shots on Enter, plays the drama music and returns to the menu after the last one', async () => {
    const { player, element } = open();
    element.querySelector<HTMLElement>('[data-variant="tableau"]')!.click();
    await flush();
    expect(player.setMusicContext).toHaveBeenCalledWith('drama');
    expect(element.querySelector<HTMLElement>('[data-menu]')!.hidden).toBe(true);
    const seen = [element.dataset.shot];
    for (let i = 1; i < OPENING_SHOTS.length; i += 1) {
      key(element, 'Enter');
      seen.push(element.dataset.shot);
    }
    expect(seen).toEqual(OPENING_SHOTS.map(shot => shot.id));
    expect(player.setMusicScene).toHaveBeenCalledWith('bois_clair_burning');
    key(element, 'Enter');
    expect(element.dataset.shot).toBeUndefined();
    expect(element.querySelector<HTMLElement>('[data-menu]')!.hidden).toBe(false);
  });

  it('stops on Passer and on Escape, and a line never outlives its shot', async () => {
    const { element, view } = open();
    element.querySelector<HTMLElement>('[data-variant="tableau"]')!.click();
    await flush();
    element.querySelector<HTMLElement>('[data-skip]')!.click();
    expect(element.dataset.shot).toBeUndefined();
    element.querySelector<HTMLElement>('[data-variant="tableau"]')!.click();
    await flush();
    key(element, 'Escape');
    expect(element.dataset.shot).toBeUndefined();
    expect(element.isConnected).toBe(true);
    expect(element.querySelector('[data-line]')?.textContent).toBe('');
    view.close();
  });

  it('holds every line at once, without motion, under reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const { element, view } = open();
    element.querySelector<HTMLElement>('[data-variant="tableau"]')!.click();
    await flush();
    expect(element.dataset.reducedMotion).toBe('true');
    expect(element.querySelector('[data-line]')?.textContent).toBe(OPENING_SHOTS[0]!.lines.map(line => line.text).join(' '));
    view.close();
  });

  it('keeps the skip control and the text when a picture is missing', async () => {
    const { element, view } = open();
    element.querySelector('[data-plate="seals"]')?.remove();
    element.querySelector<HTMLElement>('[data-variant="tableau"]')!.click();
    await flush();
    key(element, 'Enter');
    expect(element.dataset.shot).toBe('seals');
    expect(element.querySelector<HTMLElement>('[data-skip]')!.hidden).toBe(false);
    view.close();
  });
});
