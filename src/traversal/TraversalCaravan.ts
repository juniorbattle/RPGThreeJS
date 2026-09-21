import { ROAD_SPACE } from './TraversalRoadSpace';

const ROOT = '/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan';

/** Painted components registered in the selected candidate's source-pixel coordinates.
 * The two near wheels share a ground line; far wheels contact the receding side of the road.
 * Artistic constraints are visually audited, not inferred from these metadata labels.
 */
export const TRAVERSAL_CARAVAN = Object.freeze({
  chassis: `${ROOT}/chassis.png`,
  wheelSource: `${ROOT}/candidates/mechanical.png`,
  canvas: { width: 1748, height: 899 },
  bounds: { left: 170, top: 81, width: 1454, height: 733 },
  wheelTexture: { canvasWidth: 1749, canvasHeight: 899, x: 225, y: 486, width: 303, height: 316 },
  suspension: { amplitude: 1.1, wavelength: 27 },
  wheels: [
    { id: 'far-rear', plane: 'far', x: 546, y: 637, rx: 126, ry: 132 },
    { id: 'far-front', plane: 'far', x: 1416, y: 642, rx: 133, ry: 134 },
    { id: 'near-rear', plane: 'near', x: 376, y: 648, rx: 151.5, ry: 158 },
    { id: 'near-front', plane: 'near', x: 1280, y: 655, rx: 151.5, ry: 158 },
  ],
});

export function buildTraversalCaravan(vehicle: HTMLElement): void {
  const { bounds, canvas, wheels, wheelTexture: texture } = TRAVERSAL_CARAVAN;
  vehicle.style.aspectRatio = `${bounds.width} / ${bounds.height}`;
  const chassis = document.createElement('img');
  chassis.className = 'traversal-vehicle__art';
  chassis.src = TRAVERSAL_CARAVAN.chassis;
  chassis.alt = '';
  chassis.draggable = false;
  chassis.style.cssText = `width:${canvas.width / bounds.width * 100}%;height:${canvas.height / bounds.height * 100}%;left:${-bounds.left / bounds.width * 100}%;top:${-bounds.top / bounds.height * 100}%`;
  vehicle.append(chassis);
  for (const metadata of wheels) {
    const wheel = document.createElement('span');
    wheel.className = 'traversal-vehicle__wheel';
    wheel.dataset.wheel = metadata.id;
    wheel.dataset.wheelPlane = metadata.plane;
    wheel.setAttribute('aria-hidden', 'true');
    wheel.style.cssText = `left:${(metadata.x - metadata.rx - bounds.left) / bounds.width * 100}%;top:${(metadata.y - metadata.ry - bounds.top) / bounds.height * 100}%;width:${2 * metadata.rx / bounds.width * 100}%;height:${2 * metadata.ry / bounds.height * 100}%`;
    // Normalize the painted elliptical face before rotating, then project back into
    // the wheel's ellipse. Rotation cannot wobble/change the wheel's contact bounds.
    const projection = document.createElement('span');
    projection.className = 'traversal-vehicle__wheel-projection';
    projection.style.scale = `${metadata.rx / metadata.ry} 1`;
    const rotor = document.createElement('span');
    rotor.className = 'traversal-vehicle__wheel-rotor';
    const image = document.createElement('img');
    image.src = TRAVERSAL_CARAVAN.wheelSource;
    image.alt = '';
    image.style.cssText = `width:${texture.canvasWidth / texture.width * 100}%;height:${texture.canvasHeight / texture.height * 100}%;left:${-texture.x / texture.width * 100}%;top:${-texture.y / texture.height * 100}%`;
    rotor.append(image);
    projection.append(rotor);
    wheel.append(projection);
    vehicle.append(wheel);
  }
}

/** A physical radius is measured at the current uniform sprite scale, not a fixed
 * desktop constant. Road displacement and radius use the same coordinate system.
 */
export function caravanWheelAngle(distance: number, vehicleHeight: number, viewportWidth: number): number {
  const radius = TRAVERSAL_CARAVAN.wheels[2]!.ry / TRAVERSAL_CARAVAN.bounds.height
    * vehicleHeight * ROAD_SPACE.referenceWidth / viewportWidth;
  return distance / radius;
}
