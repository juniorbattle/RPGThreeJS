export type VideoCinematicMimeType = 'video/webm' | 'video/mp4';

export interface VideoCinematicSource {
  src: string;
  type: VideoCinematicMimeType;
}

export interface VideoCinematicDescriptor {
  id: string;
  title: string;
  sources: readonly VideoCinematicSource[];
  poster?: string;
  fallbackText?: string;
  captions?: string;
  durationMs?: number;
  placeholderOnly?: boolean;
}

export interface VideoCinematicManifest {
  version: 1;
  cinematics: readonly VideoCinematicDescriptor[];
}

export type VideoCinematicResultReason =
  | 'ended'
  | 'skipped'
  | 'placeholder'
  | 'reduced-motion'
  | 'unavailable'
  | 'autoplay-rejected'
  | 'error'
  | 'timeout'
  | 'aborted'
  | 'busy';

export interface VideoCinematicResult {
  id: string;
  reason: VideoCinematicResultReason;
  played: boolean;
  error?: unknown;
}

export type VideoCinematicMediaEvent =
  | 'VIDEO_ELEMENT_CREATED'
  | 'METADATA'
  | 'LOADED_DATA'
  | 'PLAY_PROMISE_RESOLVED'
  | 'PLAYING'
  | 'FIRST_VIDEO_FRAME'
  | 'FIRST_CANVAS_DRAW';

export interface VideoCinematicPlaybackOptions {
  signal?: AbortSignal;
  allowSkip?: boolean;
  muted?: boolean;
  timeoutMs?: number;
  stallTimeoutMs?: number;
  placeholderDurationMs?: number;
  reducedMotion?: boolean;
  root?: HTMLElement;
  passive?: boolean;
  /** Presentation diagnostics only. No lifecycle event except FIRST_CANVAS_DRAW proves visibility. */
  onMediaEvent?: (event: VideoCinematicMediaEvent) => void;
}

export interface HeldVideoCinematic {
  result: VideoCinematicResult;
  surface: HTMLElement | null;
  release: () => void;
}

export type VideoCinematicTrigger =
  | { hook: 'beforeDialogue'; dialogueId: string }
  | { hook: 'beforeCombat'; combatId: string }
  | { hook: 'afterCombat'; combatId: string; outcome: 'victory' | 'defeat' }
  | { hook: 'chapterBeat'; beatId: string };
