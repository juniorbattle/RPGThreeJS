import { z } from 'zod';
import type { VideoCinematicDescriptor, VideoCinematicManifest } from './CinematicTypes';

const sourceSchema = z.object({
  src: z.string().min(1),
  type: z.enum(['video/webm', 'video/mp4']),
});

const descriptorSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sources: z.array(sourceSchema).default([]),
  poster: z.string().min(1).optional(),
  fallbackText: z.string().min(1).optional(),
  captions: z.string().min(1).optional(),
  durationMs: z.number().positive().optional(),
  placeholderOnly: z.boolean().optional(),
}).refine((descriptor) => descriptor.placeholderOnly || descriptor.sources.length > 0, {
  message: 'A cinematic requires media sources or placeholderOnly.',
});

const manifestSchema = z.object({
  version: z.literal(1),
  cinematics: z.array(descriptorSchema),
});

const EMPTY_MANIFEST: VideoCinematicManifest = Object.freeze({ version: 1, cinematics: Object.freeze([]) });

export type CinematicManifestFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class CinematicRegistry {
  private readonly entries = new Map<string, VideoCinematicDescriptor>();
  private loadPromise: Promise<CinematicRegistry> | null = null;
  private loaded = false;

  constructor(manifest: VideoCinematicManifest = EMPTY_MANIFEST) {
    this.apply(manifest);
  }

  get size(): number {
    return this.entries.size;
  }

  get(id: string): VideoCinematicDescriptor | undefined {
    return this.entries.get(id);
  }

  values(): readonly VideoCinematicDescriptor[] {
    return [...this.entries.values()];
  }

  load(
    url = '/assets/cinematics/manifest.json',
    fetcher: CinematicManifestFetcher = fetch,
  ): Promise<CinematicRegistry> {
    if (this.loaded) return Promise.resolve(this);
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = (async () => {
      try {
        const response = await fetcher(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Cinematic manifest request failed (${response.status}).`);
        const parsed = manifestSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => issue.message).join(' '));
        this.apply(parsed.data);
      } catch (error) {
        this.apply(EMPTY_MANIFEST);
        console.warn('[Cinematics] Manifest unavailable; continuing without cinematics.', error);
      } finally {
        this.loaded = true;
      }
      return this;
    })();
    return this.loadPromise;
  }

  private apply(manifest: VideoCinematicManifest): void {
    this.entries.clear();
    for (const descriptor of manifest.cinematics) {
      if (!this.entries.has(descriptor.id)) this.entries.set(descriptor.id, descriptor);
    }
  }
}

export function parseVideoCinematicManifest(input: unknown): VideoCinematicManifest | null {
  const parsed = manifestSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
