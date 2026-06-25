import * as THREE from 'three';

const bark = new THREE.MeshStandardMaterial({ color: 0x3d2f22, roughness: 1 });
const barkDark = new THREE.MeshStandardMaterial({ color: 0x27241d, roughness: 1 });
const stone = new THREE.MeshStandardMaterial({ color: 0x747969, roughness: 1 });
const stoneDark = new THREE.MeshStandardMaterial({ color: 0x424c45, roughness: 1 });
const moss = new THREE.MeshStandardMaterial({ color: 0x405737, roughness: 1 });
const metal = new THREE.MeshStandardMaterial({ color: 0x312d2a, roughness: 0.86, metalness: 0.12 });

function shadows(group: THREE.Object3D): THREE.Object3D {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

export function createMossyRock(seed = 0): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 1), stoneDark);
  body.scale.set(1.12, 0.68, 0.9);
  body.rotation.set(seed * 0.17, seed * 0.41, seed * 0.09);
  body.position.y = 0.27;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), moss);
  cap.scale.set(1.16, 0.28, 0.9);
  cap.position.set(-0.04, 0.48, 0);
  group.add(body, cap);
  return shadows(group) as THREE.Group;
}

export function createForestStump(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.62, 10), bark);
  trunk.position.y = 0.31;
  const cut = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.035, 16), new THREE.MeshStandardMaterial({
    color: 0x8a6f49,
    roughness: 1,
  }));
  cut.position.y = 0.64;
  const rootGeometry = new THREE.CapsuleGeometry(0.08, 0.38, 4, 7);
  for (let index = 0; index < 4; index += 1) {
    const root = new THREE.Mesh(rootGeometry, barkDark);
    root.rotation.z = Math.PI / 2;
    root.rotation.y = index * Math.PI / 2;
    root.position.set(Math.cos(root.rotation.y) * 0.25, 0.08, Math.sin(root.rotation.y) * 0.25);
    group.add(root);
  }
  group.add(trunk, cut);
  return shadows(group) as THREE.Group;
}

export function createFallenLog(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.31, 1.2, 10), bark);
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 0.28;
  const mossStrip = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.82, 5, 9), moss);
  mossStrip.rotation.z = Math.PI / 2;
  mossStrip.position.set(0, 0.48, -0.05);
  group.add(trunk, mossStrip);
  return shadows(group) as THREE.Group;
}

export function createBrokenColumn(): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.43, 0.2, 10), stoneDark);
  base.position.y = 0.1;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.92, 10), stone);
  shaft.position.y = 0.62;
  shaft.rotation.z = 0.08;
  const mossPatch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 7), moss);
  mossPatch.scale.set(1, 0.22, 0.58);
  mossPatch.position.set(-0.08, 1.06, 0.02);
  group.add(base, shaft, mossPatch);
  return shadows(group) as THREE.Group;
}

export function createShrineStone(): THREE.Group {
  const group = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.62, 6, 10), stoneDark);
  slab.position.y = 0.64;
  slab.scale.z = 0.38;
  const inset = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 18), new THREE.MeshStandardMaterial({
    color: 0xb99b5c,
    emissive: 0x47391b,
    emissiveIntensity: 0.26,
    roughness: 0.78,
  }));
  inset.position.set(0, 0.75, 0.125);
  group.add(slab, inset);
  return shadows(group) as THREE.Group;
}

export function createLanternPost(): THREE.Group {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 1.35, 7), barkDark);
  post.position.y = 0.68;
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.38, 4, 7), barkDark);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.16, 1.27, 0);
  const cage = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), metal);
  cage.position.set(0.34, 1.08, 0);
  const glow = new THREE.PointLight(0xe8b66d, 1.45, 4.0, 2);
  glow.position.copy(cage.position);
  group.add(post, arm, cage, glow);
  return shadows(group) as THREE.Group;
}
