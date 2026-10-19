import type { CombatantPayload, CombatConfig, CombatResult } from '../game/types';
import { combatAudioMessageSchema } from './CombatAudio';
import type { UiSoundPlayer } from '../ui/UiSoundPlayer';
import {
  combatInitializedMessageSchema,
  combatReadyMessageSchema,
  toCombatResult,
  type CombatInitializeMessage,
} from './protocol';

let audioSessionSerial = 0;

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
  private audioSession: string | null = null;
  private detachGestures: (() => void) | null = null;

  constructor(private readonly root: HTMLElement, private readonly audio?: { player: UiSoundPlayer; openSettings: (returnFocus: () => void) => void; closeSettings?: () => void }) {
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
    this.audioSession = `combat-${++audioSessionSerial}`;
    try { this.audioSession = globalThis.crypto?.randomUUID?.() ?? this.audioSession; } catch { /* Optional nonce API; mandatory source/origin/frame guards remain. */ }
    try { this.audio?.player.beginCombat(this.audioSession); } catch { /* Audio never prevents mounting combat. */ }
    const iframe = document.createElement('iframe');
    iframe.className = 'combat-frame';
    iframe.title = session.config.encounterLabel;
    iframe.allow = 'fullscreen';
    const devQa = Boolean(session.devQa && import.meta.env.DEV);
    const params = new URLSearchParams(window.location.search);
    const devVfx = devQa && params.get('vfx') === '1';
    const devMotion = devQa && params.get('motion') === '1';
    const devGrid = devQa && params.get('grid') === '1';
    const devR2ca = devQa && params.get('r2ca') === '1';
    const devVfxLab = devQa && params.get('vfxlab') === '1';
    const devStageQa = devQa && params.get('stageqa') === '1';
    iframe.src = `/legacy-combat.html?campaign=1${devQa ? '&qa=1' : ''}${devVfx ? '&vfx=1' : ''}${devMotion ? '&motion=1' : ''}${devGrid ? '&grid=1' : ''}${devR2ca ? '&r2ca=1' : ''}${devVfxLab ? '&vfxlab=1' : ''}${devStageQa ? '&stageqa=1' : ''}`;
    this.iframe = iframe;
    iframe.addEventListener('load', () => {
      if (this.iframe !== iframe) return;
      this.detachGestures?.(); this.detachGestures = null;
      try { if (iframe.contentDocument) this.detachGestures = this.audio?.player.observeGestures(iframe.contentDocument) ?? null; } catch { /* same-origin optional audio */ }
    });
    this.root.append(iframe);
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
    try { if (this.audioSession) this.audio?.closeSettings?.(); } catch { /* Optional settings cannot prevent the combat handoff. */ }
    this.detachGestures?.(); this.detachGestures = null;
    if (this.audioSession) this.audio?.player.endCombat(this.audioSession);
    this.audioSession = null;
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

    const sound = combatAudioMessageSchema.safeParse(event.data);
    if (sound.success) {
      if (sound.data.sessionId !== this.audioSession) return;
      try {
        if (sound.data.type === 'rpg-threejs:combat-sound-settings') {
          const iframe = this.iframe, session = this.audioSession, opener = iframe?.contentDocument?.activeElement as HTMLElement | null;
          this.audio?.openSettings(() => {
            if (this.iframe !== iframe || this.audioSession !== session || !iframe?.isConnected || !opener?.isConnected || iframe.contentDocument !== opener.ownerDocument || opener.closest('[inert]')) return;
            iframe.focus(); opener.focus({ preventScroll: true });
          });
        }
        else this.audio?.player.playCombat(sound.data.id, sound.data.sessionId, sound.data.eventId);
      } catch { /* Audio must never escape into combat result handling. */ }
      return;
    }

    if (combatReadyMessageSchema.safeParse(event.data).success && this.session) {
      const message: CombatInitializeMessage = {
        type: 'rpg-threejs:combat-initialize',
        config: this.session.config,
        clan: this.session.clan,
        inventory: this.session.inventory,
        preferredUnitIds: this.session.preferredUnitIds,
        reducedGraphics: this.session.reducedGraphics,
        presentationSessionId: this.audioSession ?? undefined,
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
