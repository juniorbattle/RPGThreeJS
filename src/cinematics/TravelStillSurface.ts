import type { ResolvedPresentationBeat, TravelStillSource } from './NarrativePresentationMode';

export interface TravelStillSurfaceOptions {
  source?: TravelStillSource;
  fallbackAsset?: string;
  reducedMotion?: boolean;
  dev?: boolean;
}

function selectedAsset(source: TravelStillSource | undefined, reducedMotion: boolean): string | undefined {
  if (!source) return undefined;
  if (source.kind === 'STATIC_IMAGE') return source.assetId;
  return reducedMotion ? source.staticFallbackAssetId : source.assetId;
}

/** A complete, sprite-free frame for connective travel and Continue boundaries. */
export class TravelStillSurface {
  readonly element = document.createElement('div');
  readonly image = document.createElement('img');
  readonly fallbackLayer = document.createElement('div');
  readonly fallbackActive: boolean;
  readonly asset: string | undefined;

  constructor(
    private readonly root: HTMLElement,
    readonly beat: ResolvedPresentationBeat,
    options: TravelStillSurfaceOptions = {},
  ) {
    if (beat.mode !== 'TRAVEL_STILL') throw new Error(`TravelStillSurface requires TRAVEL_STILL, received ${beat.mode}.`);
    this.asset = selectedAsset(options.source ?? beat.travelStillSource, options.reducedMotion ?? false);
    this.fallbackActive = !this.asset;

    this.element.className = 'narrative-travel-still narrative-media-surface narrative-media-surface--travel-still';
    this.element.dataset.presentationMode = 'TRAVEL_STILL';
    this.element.dataset.presentationBeat = beat.beatId;
    this.element.dataset.visualFamily = beat.visualFamily;
    this.element.dataset.fallbackActive = `${this.fallbackActive}`;
    this.element.dataset.castOwnership = 'TRAVEL_SURFACE_OWNS_ENVIRONMENT';
    this.element.setAttribute('aria-hidden', 'true');

    this.image.className = 'narrative-travel-still__image';
    this.image.alt = '';
    this.image.draggable = false;
    this.fallbackLayer.className = 'narrative-travel-still__fallback';

    if (this.asset) {
      this.image.src = this.asset;
      this.element.append(this.image);
    } else {
      const fallback = options.fallbackAsset ?? beat.fallbackAsset;
      if (fallback) this.fallbackLayer.style.backgroundImage = `url("${fallback}")`;
      this.element.append(this.fallbackLayer);
      if (options.dev) this.element.dataset.travelStillAssetPending = 'true';
    }
  }

  mount(): void {
    this.root.replaceChildren(this.element);
  }

  async whenRenderable(): Promise<void> {
    const source = this.asset ?? this.fallbackLayer.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
    if (!source) return;
    const image = new Image();
    image.src = source;
    if (typeof image.decode === 'function') await image.decode().catch(() => undefined);
  }

  dispose(): void {
    this.image.removeAttribute('src');
    this.element.remove();
  }
}

