import * as THREE from 'three';

/** A pair of faces on one plane, facing the same way and covering the same ground: they flicker as the camera moves. */
export interface CoplanarOverlap {
  /** Where the overlap sits, in arena space. */
  at: [number, number, number];
  normal: [number, number, number];
  area: number;
}

interface Triangle {
  a: THREE.Vector2;
  b: THREE.Vector2;
  c: THREE.Vector2;
  centre: THREE.Vector3;
}

const round = (value: number, step: number) => Math.round(value / step);

function clip(subject: THREE.Vector2[], a: THREE.Vector2, b: THREE.Vector2, sign: number): THREE.Vector2[] {
  const inside = (p: THREE.Vector2) => sign * ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) >= 0;
  const out: THREE.Vector2[] = [];
  subject.forEach((current, i) => {
    const next = subject[(i + 1) % subject.length]!;
    const currentIn = inside(current), nextIn = inside(next);
    if (currentIn) out.push(current);
    if (currentIn !== nextIn) {
      const da = sign * ((b.x - a.x) * (current.y - a.y) - (b.y - a.y) * (current.x - a.x));
      const db = sign * ((b.x - a.x) * (next.y - a.y) - (b.y - a.y) * (next.x - a.x));
      out.push(current.clone().lerp(next, da / (da - db)));
    }
  });
  return out;
}

function overlapArea(p: Triangle, q: Triangle): { area: number; centroid: THREE.Vector2 } {
  const orient = (q.b.x - q.a.x) * (q.c.y - q.a.y) - (q.b.y - q.a.y) * (q.c.x - q.a.x);
  const sign = orient >= 0 ? 1 : -1;
  let poly: THREE.Vector2[] = [p.a, p.b, p.c];
  for (const [a, b] of [[q.a, q.b], [q.b, q.c], [q.c, q.a]] as const) {
    if (!poly.length) break;
    poly = clip(poly, a, b, sign);
  }
  let area = 0;
  const centroid = new THREE.Vector2();
  poly.forEach((point, i) => {
    const next = poly[(i + 1) % poly.length]!;
    area += point.x * next.y - next.x * point.y;
    centroid.add(point);
  });
  if (poly.length) centroid.divideScalar(poly.length);
  return { area: Math.abs(area) / 2, centroid };
}

/**
 * Lists the coplanar overlaps of the opaque geometry under `root`. Faces are grouped by plane (normal to a thousandth,
 * distance to a millimetre) and every pair that faces the same way and shares more than `minArea` m² is reported.
 * Billboards turn with the camera and shaders draw what they like, so only baked or static meshes take part, and a face
 * turned away from every eye of the combat camera is culled and cannot fight.
 */
export function coplanarOverlaps(root: THREE.Object3D, eyes: readonly THREE.Vector3[], minArea = 0.002): CoplanarOverlap[] {
  root.updateMatrixWorld(true);
  const planes = new Map<string, { origin: THREE.Vector3; normal: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; triangles: Triangle[] }>();
  const p = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] as const;
  const inverse = root.matrixWorld.clone().invert();
  const baked: THREE.Mesh[] = [];
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || !mesh.name.startsWith('arena-static-decor')) return;
    const material = mesh.material as THREE.Material;
    if (material.transparent || material.polygonOffset) return;
    baked.push(mesh);
    const position = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const index = mesh.geometry.index;
    const matrix = inverse.clone().multiply(mesh.matrixWorld);
    const count = index ? index.count : position.count;
    for (let i = 0; i + 2 < count; i += 3) {
      p.forEach((point, k) => point.fromBufferAttribute(position, index ? index.getX(i + k) : i + k).applyMatrix4(matrix));
      const normal = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
      const size = normal.length();
      if (size < 1e-6) continue;
      normal.divideScalar(size);
      if (!eyes.some((eye) => normal.dot(new THREE.Vector3().subVectors(eye, p[0])) > 0)) continue;
      const key = `${round(normal.x, 0.001)}|${round(normal.y, 0.001)}|${round(normal.z, 0.001)}|${round(normal.dot(p[0]), 0.001)}`;
      let plane = planes.get(key);
      if (!plane) {
        const u = new THREE.Vector3().subVectors(p[1], p[0]).normalize();
        plane = { origin: p[0].clone(), normal, u, v: new THREE.Vector3().crossVectors(normal, u), triangles: [] };
        planes.set(key, plane);
      }
      const flat = (point: THREE.Vector3) => {
        const d = new THREE.Vector3().subVectors(point, plane!.origin);
        return new THREE.Vector2(d.dot(plane!.u), d.dot(plane!.v));
      };
      plane.triangles.push({ a: flat(p[0]), b: flat(p[1]), c: flat(p[2]), centre: new THREE.Vector3().add(p[0]).add(p[1]).add(p[2]).divideScalar(3) });
    }
  });
  const found: CoplanarOverlap[] = [];
  const raycaster = new THREE.Raycaster();
  const point = new THREE.Vector3(), direction = new THREE.Vector3();
  const hits: THREE.Intersection[] = [];
  // an overlap buried inside a building never reaches the screen (baked meshes opt out of `raycast`, hence the prototype)
  const inSight = (at: THREE.Vector3) => eyes.some((eye) => {
    point.copy(at).applyMatrix4(root.matrixWorld);
    direction.subVectors(point, eye);
    raycaster.set(eye, direction.clone().normalize());
    raycaster.far = direction.length() - 0.03;
    return !baked.some((mesh) => {
      hits.length = 0;
      THREE.Mesh.prototype.raycast.call(mesh, raycaster, hits);
      return hits.length > 0;
    });
  });
  for (const plane of planes.values()) {
    const list = plane.triangles;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const { area, centroid } = overlapArea(list[i]!, list[j]!);
      if (area <= minArea) continue;
      const at = plane.origin.clone().addScaledVector(plane.u, centroid.x).addScaledVector(plane.v, centroid.y);
      if (!inSight(at)) continue;
      const { x, y, z } = plane.normal;
      found.push({ at: [+at.x.toFixed(2), +at.y.toFixed(2), +at.z.toFixed(2)], normal: [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)], area: +area.toFixed(3) });
    }
  }
  return found.sort((a, b) => b.area - a.area);
}
