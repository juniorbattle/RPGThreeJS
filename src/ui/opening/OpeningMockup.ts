import { resolvePixelSheet } from '../../combat/pixel/PixelSpriteSheets';
import { resolveCharacterAsset } from '../../render/CharacterVisualRegistry';
import { prefersReducedMotion } from '../ReducedMotion';
import type { UiSoundPlayer } from '../UiSoundPlayer';
import type { OpeningArenaShot } from './OpeningArenaShot';
import { createShotPainter, type SheetArt, type ShotPainter } from './openingPainters';
import { cameraAt, OPENING_ACTOR_FADE_AT, OPENING_BARS_OPEN_AT, OPENING_CAST, OPENING_SHEETS, OPENING_SHOTS, OPENING_VARIANTS, type BoisClairVariant, type OpeningShot, type ViewCamera } from './openingShots';
import './opening-mockup.css';

const CUT_SECONDS = 0.5;
const LOAD_TIMEOUT_MS = 8000;
const PARALLAX_NEAR = 0.05;
/** Where the road meets the horizon: the near layer grows from here, as the ground does when a camera moves in. */
const VANISHING: Record<string, { x: number; y: number }> = { 'bois-clair': { x: 948, y: 420 }, seals: { x: 1240, y: 430 }, shadow: { x: 700, y: 620 }, company: { x: 1000, y: 460 } };

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => resolve(null), LOAD_TIMEOUT_MS);
    image.onload = () => { window.clearTimeout(timer); resolve(image); };
    image.onerror = () => { window.clearTimeout(timer); resolve(null); };
    image.src = url;
  });
}

export interface OpeningMockupOptions {
  reducedGraphics?: boolean;
  /** Tests skip the images. */
  preload?: boolean;
}

/**
 * Opening mockup (OD-2026-11-02-A), dev builds only: the 55 seconds the operator judges in motion before anything
 * enters the game. It reads no game state, writes none and owns the music only while open. A click or Enter moves to
 * the next shot, Passer or Escape leaves. The text runs on the sequence's own clock, never on the sound's.
 */
export class OpeningMockup {
  private element: HTMLElement | null = null;
  private restore: (() => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private plates = new Map<string, { root: HTMLElement; far: HTMLImageElement; near: HTMLImageElement }>();
  private actors: Array<{ element: HTMLElement; at: number }> = [];
  private sheets = new Map<string, SheetArt>();
  private arena: OpeningArenaShot | null = null;
  private variant: BoisClairVariant = 'tableau';
  private painter: ShotPainter | null = null;
  private index = -1;
  private seconds = 0;
  private lastFrame = 0;
  private frame = 0;
  private lineText = '';
  private serial = 0;
  private reduced = false;
  private width = 0;
  private height = 0;
  private bar = 0;

  constructor(private readonly root: HTMLElement, private readonly player: UiSoundPlayer, private readonly options: OpeningMockupOptions = {}) {}

  open(): void {
    if (this.element) return;
    const previous = document.activeElement as HTMLElement | null;
    const siblings = [...this.root.children].map(child => ({ child: child as HTMLElement, inert: (child as HTMLElement).inert }));
    for (const { child } of siblings) child.inert = true;
    const element = document.createElement('section');
    element.className = 'opening-mock';
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
    element.setAttribute('aria-label', 'Maquette d’ouverture');
    element.innerHTML = `
      <div class="opening-mock__scene" data-scene>
        ${OPENING_SHOTS.filter(shot => shot.image).map(shot => `<div class="opening-mock__plate" data-plate="${shot.id}"><img alt="" src="${shot.image}"><img class="is-near" alt="" src="${shot.image}"></div>`).join('')}
        <div class="opening-mock__arena" data-arena hidden></div>
        <canvas class="opening-mock__canvas" aria-hidden="true"></canvas>
        <div class="opening-mock__cast" data-cast></div>
      </div>
      <div class="opening-mock__grain" aria-hidden="true"></div>
      <div class="opening-mock__veil" data-veil></div>
      <div class="opening-mock__bar opening-mock__bar--top" aria-hidden="true"></div>
      <div class="opening-mock__bar opening-mock__bar--bottom" aria-hidden="true"></div>
      <p class="opening-mock__line" data-line aria-live="polite"></p>
      <button class="opening-mock__skip" type="button" data-skip hidden>Passer</button>
      <div class="opening-mock__menu" data-menu>
        <p class="opening-mock__eyebrow">Maquette hors jeu · 55 secondes</p>
        <h2>Ouverture de la chronique</h2>
        <p>Choisis le plan de Bois-Clair. Un clic ou Entrée passe au plan suivant, Échap arrête.</p>
        <div class="opening-mock__choices">
          ${OPENING_VARIANTS.map(variant => `<button type="button" data-variant="${variant.id}"><strong>${variant.label}</strong><span>${variant.note}</span></button>`).join('')}
        </div>
        <p class="opening-mock__status" data-status role="status"></p>
        <button class="opening-mock__close" type="button" data-close>Fermer</button>
      </div>`;
    this.root.append(element);
    this.element = element;
    this.restore = () => {
      for (const { child, inert } of siblings) if (child.isConnected) child.inert = inert;
      if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
    this.canvas = element.querySelector('canvas');
    this.ctx = this.canvas?.getContext('2d') ?? null;
    for (const shot of OPENING_SHOTS) {
      const root = element.querySelector<HTMLElement>(`[data-plate="${shot.id}"]`);
      const images = root?.querySelectorAll('img');
      if (root && images?.[0] && images[1]) this.plates.set(shot.id, { root, far: images[0], near: images[1] });
    }
    this.measure();
    window.addEventListener('resize', this.measure);
    element.addEventListener('click', this.handleClick);
    element.addEventListener('keydown', this.handleKey);
    element.querySelector<HTMLElement>('[data-variant]')?.focus();
  }

  close(): void {
    this.stop();
    window.removeEventListener('resize', this.measure);
    this.player.setMusicScene(null);
    this.player.setMusicContext('title');
    this.element?.remove();
    this.element = null;
    this.plates.clear();
    this.restore?.();
    this.restore = null;
  }

  private readonly measure = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.bar = Math.max(this.height * 0.11, (this.height - this.width / 2.39) / 2);
    if (this.canvas) { this.canvas.width = this.width; this.canvas.height = this.height; }
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const variant = target.closest<HTMLElement>('[data-variant]')?.dataset.variant as BoisClairVariant | undefined;
    if (variant) { void this.start(variant); return; }
    if (target.closest('[data-close]')) { this.close(); return; }
    if (target.closest('[data-skip]')) { this.backToMenu(); return; }
    if (this.index >= 0) this.nextShot();
  };

  private readonly handleKey = (event: KeyboardEvent): void => {
    const running = this.index >= 0;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (running) this.backToMenu(); else this.close();
      return;
    }
    if (running && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.nextShot();
      return;
    }
    if (event.key === 'Tab' && this.element) {
      const controls = [...this.element.querySelectorAll<HTMLElement>('button:not([hidden])')].filter(control => !control.closest('[hidden]'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };

  private async start(variant: BoisClairVariant): Promise<void> {
    const element = this.element;
    if (!element) return;
    const serial = ++this.serial;
    this.variant = variant;
    this.reduced = prefersReducedMotion(this.options.reducedGraphics);
    element.dataset.reducedMotion = String(this.reduced);
    const status = element.querySelector<HTMLElement>('[data-status]')!;
    status.textContent = 'Préparation…';
    // The click that chose the variant is the gesture that unlocks the sound.
    this.player.setMusicContext('drama');
    await this.prepare(variant);
    if (serial !== this.serial || !this.element) return;
    status.textContent = '';
    element.dataset.bars = 'closed';
    element.querySelector<HTMLElement>('[data-menu]')!.hidden = true;
    element.querySelector<HTMLElement>('[data-skip]')!.hidden = false;
    element.querySelector<HTMLElement>('[data-skip]')!.focus();
    this.mountCast();
    this.index = -1;
    this.nextShot();
    this.lastFrame = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private async prepare(variant: BoisClairVariant): Promise<void> {
    if (this.options.preload === false) return;
    const element = this.element!;
    await Promise.all([...this.plates.values()].flatMap(({ far, near }) => [far, near]).map(image => image.decode().catch(() => undefined)));
    await Promise.all(OPENING_SHEETS.map(async (id) => {
      const entry = resolvePixelSheet(id);
      const image = entry && !this.sheets.has(id) ? await loadImage(entry.file) : null;
      if (entry && image) this.sheets.set(id, { entry, image });
    }));
    if (variant === 'tableau' || this.reduced) return;
    this.arena?.dispose();
    this.arena = null;
    const { OpeningArenaShot } = await import('./OpeningArenaShot');
    const shot = await OpeningArenaShot.create(this.width, this.height, { platform: variant === 'arena-platform', reducedGraphics: false }).catch((error: unknown) => {
      console.warn('Plan d’arène indisponible', error);
      return null;
    });
    if (shot && this.element === element) {
      this.arena = shot;
      element.querySelector('[data-arena]')!.append(shot.element);
    } else shot?.dispose();
  }

  private mountCast(): void {
    const cast = this.element?.querySelector<HTMLElement>('[data-cast]');
    if (!cast) return;
    cast.replaceChildren();
    this.actors = OPENING_CAST.map(({ id, at, left, facing }) => {
      const actor = document.createElement('figure');
      actor.className = 'opening-mock__actor';
      actor.dataset.facing = facing;
      actor.style.left = `${left}%`;
      const image = document.createElement('img');
      image.alt = '';
      image.src = resolveCharacterAsset(id, 'dialogue') ?? '';
      actor.append(image);
      cast.append(actor);
      return { element: actor, at };
    });
  }

  private nextShot(): void {
    const element = this.element;
    if (!element) return;
    const next = OPENING_SHOTS[this.index + 1];
    if (!next) { this.backToMenu(); return; }
    this.index += 1;
    this.seconds = 0;
    this.lineText = '';
    element.querySelector<HTMLElement>('[data-line]')!.textContent = '';
    element.dataset.shot = next.id;
    this.player.setMusicScene(next.ambience);
    this.painter = this.reduced ? null : createShotPainter(next.id, { sheets: this.sheets, marchers: this.variant === 'tableau' });
    const useArena = next.id === 'bois-clair' && this.arena !== null;
    for (const [id, plate] of this.plates) plate.root.classList.toggle('is-visible', id === next.id && !useArena);
    element.querySelector<HTMLElement>('[data-arena]')!.hidden = !useArena;
    element.querySelector<HTMLElement>('[data-cast]')!.classList.toggle('is-visible', next.id === 'company');
    this.ctx?.clearRect(0, 0, this.width, this.height);
    this.paint(next, 0);
  }

  private readonly tick = (now: number): void => {
    if (this.index < 0) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.seconds += dt;
    const shot = OPENING_SHOTS[this.index];
    if (shot && this.seconds >= shot.seconds) this.nextShot();
    else if (shot) this.paint(shot, dt);
    if (this.index >= 0) this.frame = requestAnimationFrame(this.tick);
  };

  private paint(shot: OpeningShot, dt: number): void {
    const element = this.element;
    if (!element) return;
    const remaining = shot.seconds - this.seconds;
    const progress = this.reduced ? 1 : this.seconds / shot.seconds;
    const camera = cameraAt(shot, progress, this.width, this.height, this.bar);
    this.placePlate(shot, camera, progress);
    element.querySelector<HTMLElement>('[data-veil]')!.classList.toggle('is-down', !this.reduced && (remaining < CUT_SECONDS || this.seconds < 0.05));
    const lineAt = this.reduced ? shot.lines : shot.lines.filter(line => line.at <= this.seconds);
    const text = this.reduced ? shot.lines.map(line => line.text).join(' ') : lineAt.at(-1)?.text ?? '';
    const line = element.querySelector<HTMLElement>('[data-line]')!;
    if (text !== this.lineText) {
      this.lineText = text;
      line.textContent = text;
      if (!this.reduced) line.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' });
    }
    const company = shot.id === 'company';
    line.classList.toggle('is-out', remaining < CUT_SECONDS + 0.3 && !this.reduced || company && this.seconds >= OPENING_BARS_OPEN_AT + 0.6);
    if (company) {
      for (const actor of this.actors) actor.element.classList.toggle('is-in', this.seconds >= actor.at);
      element.querySelector<HTMLElement>('[data-cast]')!.classList.toggle('is-leaving', this.seconds >= OPENING_ACTOR_FADE_AT);
      element.dataset.bars = this.seconds >= OPENING_BARS_OPEN_AT ? 'open' : 'closed';
    }
    if (this.reduced || !this.ctx) return;
    if (shot.id === 'bois-clair') this.arena?.render(this.seconds, dt);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.painter?.({ ctx: this.ctx, width: this.width, height: this.height, seconds: this.seconds, dt, camera });
  }

  private placePlate(shot: OpeningShot, camera: ViewCamera, progress: number): void {
    const plate = this.plates.get(shot.id);
    if (!plate) return;
    plate.far.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    const vanishing = VANISHING[shot.id] ?? { x: 836, y: 470 };
    const grow = 1 + PARALLAX_NEAR * progress;
    const scale = camera.scale * grow;
    const anchorX = camera.x + vanishing.x * camera.scale, anchorY = camera.y + vanishing.y * camera.scale;
    plate.near.style.transform = `translate(${anchorX - vanishing.x * scale}px,${anchorY - vanishing.y * scale}px) scale(${scale})`;
  }

  private stop(): void {
    this.serial += 1;
    cancelAnimationFrame(this.frame);
    this.index = -1;
    this.painter = null;
    this.arena?.dispose();
    this.arena = null;
  }

  private backToMenu(): void {
    const element = this.element;
    if (!element) return;
    this.stop();
    delete element.dataset.shot;
    delete element.dataset.bars;
    this.player.setMusicScene(null);
    for (const plate of this.plates.values()) plate.root.classList.remove('is-visible');
    element.querySelector<HTMLElement>('[data-cast]')!.replaceChildren();
    element.querySelector<HTMLElement>('[data-arena]')!.hidden = true;
    element.querySelector<HTMLElement>('[data-line]')!.textContent = '';
    element.querySelector<HTMLElement>('[data-skip]')!.hidden = true;
    element.querySelector<HTMLElement>('[data-veil]')!.classList.remove('is-down');
    this.ctx?.clearRect(0, 0, this.width, this.height);
    element.querySelector<HTMLElement>('[data-menu]')!.hidden = false;
    element.querySelector<HTMLElement>('[data-variant]')?.focus();
  }
}
