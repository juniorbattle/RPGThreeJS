import type { CombatantPayload, CombatConfig, CombatResult } from '../game/types';
import {
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
}

export class CombatBridge {
  private iframe: HTMLIFrameElement | null = null;
  private resolveResult: ((result: CombatResult) => void) | null = null;
  private session: CombatSession | null = null;

  constructor(private readonly root: HTMLElement) {
    window.addEventListener('message', this.onMessage);
  }

  play(session: CombatSession): Promise<CombatResult> {
    this.close();
    this.session = session;
    const iframe = document.createElement('iframe');
    iframe.className = 'combat-frame';
    iframe.title = session.config.encounterLabel;
    iframe.allow = 'fullscreen';
    iframe.src = '/legacy-combat.html?campaign=1';
    this.root.append(iframe);
    this.iframe = iframe;
    return new Promise<CombatResult>((resolve) => {
      this.resolveResult = resolve;
    });
  }

  close(): void {
    this.iframe?.remove();
    this.iframe = null;
    this.resolveResult = null;
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
      };
      this.iframe?.contentWindow?.postMessage(message, window.location.origin);
      return;
    }

    const result = toCombatResult(event.data);
    if (!result || result.combatId !== this.session?.config.id) return;
    const resolve = this.resolveResult;
    this.close();
    resolve?.(result);
  };
}
