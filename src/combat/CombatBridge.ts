import type { CombatantPayload, CombatConfig, CombatResult } from '../game/types';
import {
  combatInitializedMessageSchema,
  combatReadyMessageSchema,
  toCombatResult,
  type CombatInitializeMessage,
} from './protocol';

interface CombatSession {
  config: CombatConfig;
  clan: CombatantPayload[];
  inventory: Record<string, number>;
  preferredUnitIds: string[];
  reducedGraphics: boolean;
  devQa?: boolean;
  qaFullAp?: boolean;
  qaDeployAll?: boolean;
}

interface CombatStart {
  ready: Promise<void>;
  result: Promise<CombatResult>;
}

export class CombatBridge {
  private iframe: HTMLIFrameElement | null = null;
  private resolveResult: ((result: CombatResult) => void) | null = null;
  private resolveReady: (() => void) | null = null;
  private readyTimeout: number | null = null;
  private session: CombatSession | null = null;

  constructor(private readonly root: HTMLElement) {
    window.addEventListener('message', this.onMessage);
  }

  play(session: CombatSession): Promise<CombatResult> {
    return this.start(session).result;
  }

  /**
   * Mount the real combat scene behind a transition curtain.  The `ready`
   * promise resolves once the iframe has built the Three.js scene, so callers
   * never reveal the application's fallback background between two views.
   */
  start(session: CombatSession): CombatStart {
    this.close();
    this.session = session;
    const iframe = document.createElement('iframe');
    iframe.className = 'combat-frame';
    iframe.title = session.config.encounterLabel;
    iframe.allow = 'fullscreen';
    const devQa = Boolean(session.devQa && import.meta.env.DEV);
    const devVfx = devQa && new URLSearchParams(window.location.search).get('vfx') === '1';
    iframe.src = `/legacy-combat.html?campaign=1${devQa ? '&qa=1' : ''}${devVfx ? '&vfx=1' : ''}`;
    this.root.append(iframe);
    this.iframe = iframe;
    const ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
    // A failed legacy load must not leave the transition curtain permanent.
    // The iframe's own error state remains visible once it is revealed.
    this.readyTimeout = window.setTimeout(() => this.markReady(), 10_000);
    iframe.addEventListener('error', () => this.markReady(), { once: true });
    const result = new Promise<CombatResult>((resolve) => {
      this.resolveResult = resolve;
    });
    return { ready, result };
  }

  close(): void {
    this.iframe?.remove();
    this.iframe = null;
    this.resolveResult = null;
    this.markReady();
    this.session = null;
  }

  dispose(): void {
    window.removeEventListener('message', this.onMessage);
    this.close();
  }

  private onMessage = (event: MessageEvent): void => {
    if (event.source !== this.iframe?.contentWindow || event.origin !== window.location.origin) return;

    if (combatReadyMessageSchema.safeParse(event.data).success && this.session) {
      const message: CombatInitializeMessage = {
        type: 'rpg-threejs:combat-initialize',
        config: this.session.config,
        clan: this.session.clan,
        inventory: this.session.inventory,
        preferredUnitIds: this.session.preferredUnitIds,
        reducedGraphics: this.session.reducedGraphics,
        devQa: Boolean(this.session.devQa && import.meta.env.DEV),
        qaFullAp: Boolean(this.session.qaFullAp && import.meta.env.DEV),
        qaDeployAll: Boolean(this.session.qaDeployAll && import.meta.env.DEV),
      };
      this.iframe?.contentWindow?.postMessage(message, window.location.origin);
      return;
    }

    if (combatInitializedMessageSchema.safeParse(event.data).success) {
      this.markReady();
      return;
    }

    const result = toCombatResult(event.data);
    if (!result || result.combatId !== this.session?.config.id) return;
    const resolve = this.resolveResult;
    this.close();
    resolve?.(result);
  };

  private markReady(): void {
    if (this.readyTimeout !== null) {
      window.clearTimeout(this.readyTimeout);
      this.readyTimeout = null;
    }
    this.resolveReady?.();
    this.resolveReady = null;
  }
}
