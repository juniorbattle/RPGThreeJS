import { ROAD_SPACE, roadWorldToScreen } from './TraversalRoadSpace';
import { routeWorldCamera, type TraversalWorldPresentation, type TraversalWorldSection } from './TraversalWorldModel';
import { createTraversalSprite } from './TraversalSprite';

type RenderedSection = { definition: TraversalWorldSection; element: HTMLElement; image: HTMLImageElement };

/** Physical scenery is a sibling of actors: consuming/hiding a beat cannot remove a place. */
export class TraversalWorldRenderer {
  readonly element = document.createElement('div');
  /** The checkpoint-scale section renderer, filled only with generic forest for every Route. */
  readonly routeElement = document.createElement('div');
  private sections: RenderedSection[] = [];
  private readonly routeSections: RenderedSection[];
  private readonly preloaded: HTMLImageElement[] = [];
  private presentedBranch = 'main';

  constructor(private readonly world: TraversalWorldPresentation) {
    this.element.className = 'traversal-world__sections';
    this.element.setAttribute('aria-hidden', 'true');
    this.routeElement.className = 'traversal-world__route-sections';
    this.routeElement.setAttribute('aria-hidden', 'true');
    this.mount('main');
    // The two overlap sections cover the viewport as the camera crosses the loop join.
    const wrap = world.routeSections.slice(0, 2).map(definition => Object.freeze({
      ...definition, id: `${definition.id}-wrap`,
      worldStart: definition.worldStart + world.routePeriod,
      worldEnd: definition.worldEnd + world.routePeriod,
      coreStart: definition.coreStart + world.routePeriod,
      coreEnd: definition.coreEnd + world.routePeriod,
    }));
    this.routeSections = [...world.routeSections, ...wrap].map(definition =>
      this.createSection(definition, this.routeElement));
  }

  private mount(presentedBranch: string): void {
    this.element.replaceChildren();
    this.preloaded.length = 0;
    this.presentedBranch = presentedBranch;
    this.sections = this.world.resolveWorld(presentedBranch).map(definition =>
      this.createSection(definition, this.element, true));
  }

  private createSection(definition: TraversalWorldSection, parent: HTMLElement, preloadVariants = false): RenderedSection {
    const element = document.createElement('div');
    element.className = 'traversal-world-section';
    element.dataset.worldSection = definition.id;
    element.dataset.sectionKind = definition.kind;
    element.dataset.worldStart = String(definition.worldStart);
    element.dataset.worldEnd = String(definition.worldEnd);
    element.dataset.coreStart = String(definition.coreStart);
    element.dataset.coreEnd = String(definition.coreEnd);
    element.style.left = `${definition.worldStart / ROAD_SPACE.referenceWidth * 100}%`;
    element.style.width = `${(definition.worldEnd - definition.worldStart) / ROAD_SPACE.referenceWidth * 100}%`;
    const image = document.createElement('img');
    image.src = definition.asset;
    image.alt = '';
    image.draggable = false;
    if (definition.mirror) image.style.transform = 'scaleX(-1)';
    const terrain = document.createElement('div');
    terrain.className = 'traversal-world-section__terrain';
    // Authored and generic route paintings keep the same native aspect ratio and road scale.
    const margins = ['before', 'after'].map(side => {
      const margin = document.createElement('div');
      margin.className = `traversal-world-section__margin traversal-world-section__margin--${side}`;
      const forest = document.createElement('img');
      forest.src = this.world.forestAsset;
      forest.alt = '';
      forest.draggable = false;
      if (!definition.mirror) forest.style.transform = 'scaleX(-1)';
      margin.append(forest);
      return margin;
    });
    const painting = document.createElement('div');
    painting.className = 'traversal-world-section__painting';
    painting.append(image);
    terrain.append(margins[0]!, painting, margins[1]!);
    element.append(terrain);
    for (const prop of definition.props ?? []) {
      const sprite = createTraversalSprite(prop.asset, 'traversal-location-prop');
      sprite.dataset.locationProp = prop.id;
      sprite.style.left = `${(prop.worldX - definition.worldStart) / (definition.worldEnd - definition.worldStart) * 100}%`;
      sprite.style.top = `${prop.groundPercent}%`;
      sprite.style.height = `calc(var(--vehicle-height) * ${prop.vehicleHeightRatio})`;
      element.append(sprite);
    }
    if (preloadVariants) {
      for (const src of [definition.clearedAsset, ...Object.values(definition.variantAssets ?? {})]) {
        if (!src) continue;
        const preload = new Image();
        preload.src = src;
        this.preloaded.push(preload);
      }
    }
    parent.append(element);
    return { definition, element, image };
  }

  setDirections(choices: readonly { id: string; label: string }[]): void {
    const sign = Array.from(this.element.querySelectorAll<HTMLElement>('[data-location-prop]'))
      .find(element => element.dataset.locationProp === this.world.directionSignPropId);
    if (!sign) return;
    let labels = sign.querySelector<HTMLElement>('.traversal-sign-directions');
    if (!labels) { labels = document.createElement('span'); labels.className = 'traversal-sign-directions'; sign.append(labels); }
    const signature = JSON.stringify(choices.map(choice => [choice.id, choice.label]));
    if (labels.dataset.choices === signature) return;
    labels.dataset.choices = signature;
    labels.replaceChildren(...choices.map((choice, index) => {
      const direction = document.createElement('span');
      direction.textContent = `${index === 0 ? '↖' : '→'} ${choice.label}`;
      return direction;
    }));
  }

  /** Hold the black midpoint until the currently visible checkpoint art is decoded. */
  readyVisible(): Promise<void> | void {
    if (typeof Image.prototype.decode !== 'function') return;
    const images = this.sections.filter(section => !section.element.hidden)
      .flatMap(section => Array.from(section.element.querySelectorAll('img')));
    return Promise.all(images.map(image => image.decode())).then(() => undefined);
  }

  readyRouteVisible(): Promise<void> | void {
    if (typeof Image.prototype.decode !== 'function') return;
    const images = this.routeSections.filter(section => !section.element.hidden)
      .flatMap(section => Array.from(section.element.querySelectorAll('img')));
    return Promise.all(images.map(image => image.decode())).then(() => undefined);
  }

  /** Move generic road sections with the route's visual distance; no checkpoint art or props. */
  routeCamera(distance: number): number {
    return routeWorldCamera(distance, this.world.routeSections, this.world.routePeriod);
  }

  updateRoute(camera: number, viewportWidth: number): void {
    this.positionSections(this.routeElement, this.routeSections, camera, viewportWidth, () => this.world.forestAsset);
  }

  update(camera: number, viewportWidth: number, presentedBranch: string, resolvedLocations: ReadonlySet<string>): void {
    if (presentedBranch !== this.presentedBranch) this.mount(presentedBranch);
    this.positionSections(this.element, this.sections, camera, viewportWidth, definition =>
      (resolvedLocations.has(definition.id) ? definition.clearedAsset : undefined)
        ?? definition.variantAssets?.[presentedBranch] ?? definition.asset);
  }

  private positionSections(container: HTMLElement, sections: readonly RenderedSection[], camera: number,
    viewportWidth: number, assetFor: (definition: TraversalWorldSection) => string): void {
    container.style.setProperty('--section-overlap', `${this.world.sectionOverlap * viewportWidth / ROAD_SPACE.referenceWidth}px`);
    // Both modes use the same section scale and camera transform as the vehicle.
    container.style.transform = `translateX(${roadWorldToScreen(0, camera, viewportWidth)}px)`;
    for (const { definition, element, image } of sections) {
      const hidden = definition.worldEnd < camera - 100
        || definition.worldStart > camera + ROAD_SPACE.referenceWidth + 100;
      if (element.hidden !== hidden) element.hidden = hidden;
      const asset = assetFor(definition);
      if (image.getAttribute('src') !== asset) image.src = asset;
    }
  }
}
