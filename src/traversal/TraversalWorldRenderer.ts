import { ROAD_SPACE, roadWorldToScreen } from './TraversalRoadSpace';
import { TRAVERSAL_T0_WORLD, type TraversalWorldSection } from './TraversalT0World';
import { createTraversalSprite } from './TraversalSprite';

/** Physical scenery is a sibling of actors: consuming/hiding a beat cannot remove a place. */
export class TraversalWorldRenderer {
  readonly element = document.createElement('div');
  private readonly sections: { definition: TraversalWorldSection; element: HTMLElement; image: HTMLImageElement }[];
  private readonly preloaded: HTMLImageElement[] = [];

  constructor() {
    this.element.className = 'traversal-world__sections';
    this.element.setAttribute('aria-hidden', 'true');
    this.sections = TRAVERSAL_T0_WORLD.map(definition => {
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
      element.append(image);
      for (const prop of definition.props ?? []) {
        const sprite = createTraversalSprite(prop.asset, 'traversal-location-prop');
        sprite.dataset.locationProp = prop.id;
        sprite.style.left = `${(prop.worldX - definition.worldStart) / (definition.worldEnd - definition.worldStart) * 100}%`;
        sprite.style.top = `${prop.groundPercent}%`;
        sprite.style.height = `calc(var(--vehicle-height) * ${prop.vehicleHeightRatio})`;
        element.append(sprite);
      }
      for (const src of [definition.clearedAsset, ...Object.values(definition.variantAssets ?? {})]) {
        if (!src) continue;
        const preload = new Image();
        preload.src = src;
        this.preloaded.push(preload);
      }
      this.element.append(element);
      return { definition, element, image };
    });
  }

  setDirections(choices: readonly { id: string; label: string }[]): void {
    const sign = this.element.querySelector<HTMLElement>('[data-location-prop="junction-sign"]');
    if (!sign) return;
    let labels = sign.querySelector<HTMLElement>('.traversal-sign-directions');
    if (!labels) { labels = document.createElement('span'); labels.className = 'traversal-sign-directions'; sign.append(labels); }
    const text = choices.map((choice, index) => `${index === 0 ? '↗' : '→'} ${choice.label}`).join('\n');
    if (labels.textContent !== text) labels.textContent = text;
  }

  update(camera: number, viewportWidth: number, presentedBranch: string, resolvedLocations: ReadonlySet<string>): void {
    // Exactly the same camera as the entities and wheel-distance calculation.
    this.element.style.transform = `translateX(${roadWorldToScreen(0, camera, viewportWidth)}px)`;
    for (const { definition, element, image } of this.sections) {
      element.hidden = definition.worldEnd < camera - 100
        || definition.worldStart > camera + ROAD_SPACE.referenceWidth + 100;
      const asset = (resolvedLocations.has(definition.id) ? definition.clearedAsset : undefined)
        ?? definition.variantAssets?.[presentedBranch] ?? definition.asset;
      if (image.getAttribute('src') !== asset) image.src = asset;
    }
  }
}
