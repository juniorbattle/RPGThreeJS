import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface ForestEnvironment {
  root: THREE.Group;
  update(time: number, delta: number, reducedGraphics: boolean): void;
}

const KIT_URL = '/assets/3d/forest-kit.glb';
const MATERIAL_URLS = {
  grass: '/assets/3d/forest-kit/materials/grass.webp',
  stone: '/assets/3d/forest-kit/materials/stone.webp',
  bark: '/assets/3d/forest-kit/materials/bark.webp',
  foliage: '/assets/3d/forest-kit/materials/foliage.webp',
} as const;

export interface ForestMaterialTextures {
  grass: THREE.Texture;
  stone: THREE.Texture;
  bark: THREE.Texture;
  foliage: THREE.Texture;
}

function prepareTexture(texture: THREE.Texture, repeat = 1): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  return texture;
}

export async function loadForestMaterialTextures(): Promise<ForestMaterialTextures> {
  const loader = new THREE.TextureLoader();
  const [grass, stone, bark, foliage] = await Promise.all([
    loader.loadAsync(MATERIAL_URLS.grass),
    loader.loadAsync(MATERIAL_URLS.stone),
    loader.loadAsync(MATERIAL_URLS.bark),
    loader.loadAsync(MATERIAL_URLS.foliage),
  ]);
  return {
    grass: prepareTexture(grass, 1.35),
    stone: prepareTexture(stone, 1.05),
    bark: prepareTexture(bark, 1.15),
    foliage: prepareTexture(foliage, 1.1),
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function configureObject(object: THREE.Object3D, castShadow = false): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = castShadow;
    child.receiveShadow = true;
    child.frustumCulled = true;
  });
}

function painterlyMaterial(material: THREE.MeshStandardMaterial, texture: THREE.Texture, tint: number): void {
  material.map = texture;
  material.color.setHex(tint);
  material.roughness = Math.max(material.roughness, 0.88);
  material.metalness = Math.min(material.metalness, 0.05);
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
        gl_FragColor.rgb = mix(gl_FragColor.rgb, floor(gl_FragColor.rgb * 18.0) / 18.0, 0.18);
        #include <dithering_fragment>
      `,
    );
  };
  material.needsUpdate = true;
}

function dressForestMaterials(scene: THREE.Object3D, textures: ForestMaterialTextures): void {
  const dressed = new Set<THREE.Material>();
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const candidate of materials) {
      if (!(candidate instanceof THREE.MeshStandardMaterial) || dressed.has(candidate)) continue;
      dressed.add(candidate);
      const name = candidate.name.toLowerCase();
      if (name.includes('leaf') || name.includes('grass') || name.includes('moss')) {
        painterlyMaterial(candidate, textures.foliage, name.includes('dark') ? 0x718f78 : 0xa1ad74);
      } else if (name.includes('bark') || name.includes('wood')) {
        painterlyMaterial(candidate, textures.bark, name.includes('dark') ? 0x806b68 : 0xb18a70);
      } else if (name.includes('stone') || name.includes('earth')) {
        painterlyMaterial(candidate, textures.stone, name.includes('dark') ? 0x7d8983 : 0xa5aa91);
      }
    }
  });
}

function createSkyDome(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(52, 32, 18);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    transparent: true,
    uniforms: {
      topColor: { value: new THREE.Color(0x668aa1) },
      horizonColor: { value: new THREE.Color(0xc6c9a6) },
      bottomColor: { value: new THREE.Color(0x475b4d) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 low = mix(bottomColor, horizonColor, smoothstep(-0.18, 0.12, h));
        vec3 color = mix(low, topColor, smoothstep(0.05, 0.72, h));
        gl_FragColor = vec4(color, 0.42);
      }
    `,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.name = 'ForestSkyDome';
  sky.position.y = -4;
  sky.renderOrder = -20;
  return sky;
}

function createTerrainShell(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ForestTerrainShell';

  const earth = new THREE.MeshStandardMaterial({ color: 0x594435, roughness: 1 });
  const grass = new THREE.MeshStandardMaterial({ color: 0x5e784b, roughness: 1 });

  const earthDisc = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 13.2, 2.4, 48), earth);
  earthDisc.position.y = -2.25;
  earthDisc.receiveShadow = true;

  const grassDisc = new THREE.Mesh(new THREE.CylinderGeometry(12.3, 12.6, 0.22, 48), grass);
  grassDisc.position.y = -0.98;
  grassDisc.receiveShadow = true;

  group.add(earthDisc, grassDisc);

  const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x5f7167, roughness: 1, flatShading: true });
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const radius = 11.2 + (index % 2) * 0.65;
    const mountain = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.5 + (index % 3) * 0.35, 0),
      mountainMaterial,
    );
    mountain.position.set(Math.sin(angle) * radius, 0.15 + (index % 3) * 0.25, Math.cos(angle) * radius);
    mountain.rotation.y = angle * 0.7;
    mountain.scale.set(1.25, 1.05 + (index % 3) * 0.18, 0.65);
    mountain.receiveShadow = true;
    group.add(mountain);
  }
  return group;
}

function createStreamRibbonGeometry(length = 10.5, segments = 24): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const center = Math.sin(t * Math.PI * 2.2) * 0.24 + Math.sin(t * Math.PI * 5.1) * 0.07;
    const width = 0.92 + Math.sin(t * Math.PI * 3.0) * 0.14 + Math.sin(t * Math.PI * 7.0) * 0.06;
    const y = (t - 0.5) * length;
    const elevation = THREE.MathUtils.smoothstep(t, 0.55, 1) * 0.17;
    positions.push(center - width, y, 0, center + width, y, 0);
    positions[positions.length - 1] = elevation;
    positions[positions.length - 4] = elevation;
    uvs.push(0, t, 1, t);
    if (index < segments) {
      const offset = index * 2;
      indices.push(offset, offset + 2, offset + 1, offset + 1, offset + 2, offset + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createForestWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      t: { value: 0 },
      deepColor: { value: new THREE.Color(0x176f83) },
      shallowColor: { value: new THREE.Color(0x67d6c7) },
      foamColor: { value: new THREE.Color(0xe7f3d4) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float t;
      uniform vec3 deepColor;
      uniform vec3 shallowColor;
      uniform vec3 foamColor;
      varying vec2 vUv;
      void main() {
        float ribbon = sin(vUv.y * 34.0 - t * 2.6 + sin(vUv.x * 10.0) * 1.2);
        float crossing = sin(vUv.x * 22.0 + t * 1.2);
        float shimmer = smoothstep(0.76, 0.98, ribbon * 0.65 + crossing * 0.35);
        float edgeFoam = smoothstep(0.44, 0.5, abs(vUv.x - 0.5));
        vec3 water = mix(deepColor, shallowColor, 0.28 + 0.2 * sin(vUv.y * 7.0 + t));
        water = mix(water, foamColor, max(shimmer * 0.14, edgeFoam * 0.26));
        gl_FragColor = vec4(water, 0.9);
      }
    `,
  });
}

function createWaterFeatures(): {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
} {
  const group = new THREE.Group();
  group.name = 'ForestWaterFeatures';
  const waterMaterial = createForestWaterMaterial();

  const stream = new THREE.Mesh(createStreamRibbonGeometry(), waterMaterial);
  stream.rotation.x = -Math.PI / 2;
  stream.position.set(-1.5, -0.13, 8.15);
  group.add(stream);

  const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.45, 1, 8), waterMaterial.clone());
  waterfall.position.set(-1.5, -0.74, 4.28);
  waterfall.rotation.y = Math.PI;
  group.add(waterfall);

  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 36), waterMaterial.clone());
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(1, 1.6, 1);
  pool.position.set(-1.5, -1.35, 11.4);
  group.add(pool);

  const foamMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7f4d9,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  for (let index = 0; index < 11; index += 1) {
    const foam = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.14 + (index % 3) * 0.035, 12), foamMaterial);
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(-2.7 + (index % 5) * 0.6, -1.31, 9.5 + Math.floor(index / 5) * 0.72);
    foam.userData.phase = index * 0.72;
    group.add(foam);
  }

  return {
    group,
    materials: [waterMaterial, waterfall.material as THREE.ShaderMaterial, pool.material as THREE.ShaderMaterial],
  };
}

function createGrassClusterGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const blades: Array<[number, number, number, number]> = [
    [-0.16, 0, 0.42, -0.04],
    [0.02, 0.02, 0.56, 0.08],
    [0.18, -0.03, 0.46, 0.04],
    [-0.02, -0.1, 0.34, -0.12],
    [0.1, 0.11, 0.38, 0.14],
  ];
  blades.forEach(([x, z, height, bend], bladeIndex) => {
    const base = positions.length / 3;
    const halfWidth = 0.055 + (bladeIndex % 2) * 0.015;
    positions.push(
      x - halfWidth, 0, z,
      x + halfWidth, 0, z,
      x + bend, height, z,
    );
    uvs.push(0, 0, 1, 0, 0.5, 1);
    indices.push(base, base + 1, base + 2);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createFernGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const frondAngles = [0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6];
  for (const angle of frondAngles) {
    const sideX = Math.cos(angle);
    const sideZ = Math.sin(angle);
    for (let leafIndex = 0; leafIndex < 4; leafIndex += 1) {
      const progress = (leafIndex + 1) / 5;
      const length = 0.62 * progress;
      const width = 0.12 * (1 - progress * 0.35);
      const centerX = sideX * length;
      const centerZ = sideZ * length;
      const normalX = -sideZ;
      const normalZ = sideX;
      const base = positions.length / 3;
      positions.push(
        centerX - normalX * width, 0.08 + progress * 0.18, centerZ - normalZ * width,
        centerX + normalX * width, 0.08 + progress * 0.18, centerZ + normalZ * width,
        sideX * (length + 0.2), 0.24 + progress * 0.24, sideZ * (length + 0.2),
      );
      indices.push(base, base + 1, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createAmbientVegetation(_textures: ForestMaterialTextures): {
  group: THREE.Group;
  sway: THREE.InstancedMesh[];
} {
  const group = new THREE.Group();
  group.name = 'ForestAmbientVegetation';
  const bladeMaterial = new THREE.MeshBasicMaterial({
    color: 0x668b4f,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const bladeGeometry = createGrassClusterGeometry();
  const count = 112;
  const blades = new THREE.InstancedMesh(bladeGeometry, bladeMaterial, count);
  const random = seededRandom(8128);
  const transform = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const edge = index % 4;
    const along = -8.6 + random() * 17.2;
    const distance = 4.15 + random() * 1.4;
    const x = edge < 2 ? along : (edge === 2 ? -8.2 - random() * 1.8 : 8.2 + random() * 1.8);
    const z = edge < 2 ? (edge === 0 ? -distance : distance) : along * 0.48;
    transform.position.set(x, -0.08, z);
    transform.rotation.set((random() - 0.5) * 0.22, random() * Math.PI, (random() - 0.5) * 0.24);
    const scale = 0.7 + random() * 0.9;
    transform.scale.set(scale * (0.75 + random() * 0.45), scale, scale);
    transform.updateMatrix();
    blades.setMatrixAt(index, transform.matrix);
  }
  blades.instanceMatrix.needsUpdate = true;
  blades.receiveShadow = true;
  group.add(blades);

  const flowerMaterial = new THREE.MeshBasicMaterial({ color: 0xffe8a6 });
  const flowerGeometry = new THREE.OctahedronGeometry(0.055, 0);
  const flowers = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, 28);
  for (let index = 0; index < 28; index += 1) {
    const side = index % 2 ? -1 : 1;
    transform.position.set(side * (7.2 + random() * 1.8), 0.12, -3.4 + random() * 6.8);
    transform.rotation.set(0, random() * Math.PI, 0);
    transform.scale.setScalar(0.8 + random() * 0.7);
    transform.updateMatrix();
    flowers.setMatrixAt(index, transform.matrix);
  }
  flowers.instanceMatrix.needsUpdate = true;
  group.add(flowers);

  const fernMaterial = new THREE.MeshBasicMaterial({
    color: 0x365f35,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const ferns = new THREE.InstancedMesh(createFernGeometry(), fernMaterial, 24);
  const fernColor = new THREE.Color();
  for (let index = 0; index < 24; index += 1) {
    const side = index % 2 ? -1 : 1;
    transform.position.set(side * (7.35 + random() * 1.45), -0.07, -3.8 + random() * 7.6);
    transform.rotation.set(0, random() * Math.PI, 0);
    const scale = 0.62 + random() * 0.52;
    transform.scale.set(scale, scale * (0.85 + random() * 0.3), scale);
    transform.updateMatrix();
    ferns.setMatrixAt(index, transform.matrix);
    fernColor.setHSL(0.29 + random() * 0.035, 0.34 + random() * 0.12, 0.27 + random() * 0.1);
    ferns.setColorAt(index, fernColor);
  }
  ferns.instanceMatrix.needsUpdate = true;
  if (ferns.instanceColor) ferns.instanceColor.needsUpdate = true;
  group.add(ferns);
  return { group, sway: [blades, ferns] };
}

function templateMap(scene: THREE.Object3D): Map<string, THREE.Object3D> {
  const templates = new Map<string, THREE.Object3D>();
  for (const child of scene.children) {
    if (child.name) templates.set(child.name, child);
  }
  return templates;
}

function cloneTemplate(
  templates: Map<string, THREE.Object3D>,
  name: string,
  position: [number, number, number],
  scale: number,
  rotation: number,
): THREE.Object3D | null {
  const source = templates.get(name);
  if (!source) return null;
  const clone = source.clone(true);
  clone.name = `${name}_Instance`;
  clone.position.set(...position);
  clone.scale.setScalar(scale);
  clone.rotation.y = rotation;
  const heroShadow = Math.hypot(position[0], position[2]) < 10
    && !name.startsWith('Bush_')
    && !name.startsWith('Tree_Pine_');
  configureObject(clone, heroShadow);
  return clone;
}

export async function createForestEnvironment(scene: THREE.Scene): Promise<ForestEnvironment> {
  const root = new THREE.Group();
  root.name = 'ForestEnvironment';
  root.add(createTerrainShell());
  scene.add(root);

  const swayTargets: Array<{ object: THREE.Object3D; phase: number; amplitude: number }> = [];
  const lanternMaterials: THREE.MeshStandardMaterial[] = [];
  const waterMaterials: THREE.ShaderMaterial[] = [];
  const ambientSway: THREE.InstancedMesh[] = [];
  let ambientVegetation: THREE.Group | null = null;

  try {
    const [gltf, textures] = await Promise.all([
      new GLTFLoader().loadAsync(KIT_URL),
      loadForestMaterialTextures(),
    ]);
    dressForestMaterials(gltf.scene, textures);
    const water = createWaterFeatures();
    root.add(water.group);
    waterMaterials.push(...water.materials);
    const vegetation = createAmbientVegetation(textures);
    root.add(vegetation.group);
    ambientVegetation = vegetation.group;
    ambientSway.push(...vegetation.sway);
    const templates = templateMap(gltf.scene);
    const random = seededRandom(20260621);

    const place = (
      name: string,
      position: [number, number, number],
      scale = 1,
      rotation = random() * Math.PI * 2,
      sway = 0,
    ) => {
      const object = cloneTemplate(templates, name, position, scale, rotation);
      if (!object) return;
      root.add(object);
      if (sway > 0) swayTargets.push({ object, phase: random() * Math.PI * 2, amplitude: sway });
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial && material.name === 'Lantern glow') {
            lanternMaterials.push(material);
          }
        }
      });
    };

    const treeTypes = ['Tree_Broad_A', 'Tree_Pine_A', 'Tree_Broad_A', 'Tree_Pine_B'];
    for (let index = 0; index < 24; index += 1) {
      const side = index % 4;
      const along = -9 + random() * 18;
      const distance = 5.4 + random() * 3.4;
      const position: [number, number, number] = side === 0
        ? [along, -0.86, -distance]
        : side === 1
          ? [along, -0.86, distance]
          : side === 2
            ? [-distance - 1.4, -0.86, along * 0.55]
            : [distance + 1.4, -0.86, along * 0.55];
      place(treeTypes[index % treeTypes.length] ?? 'Tree_Pine_A', position, 0.72 + random() * 0.55, undefined, 0.012 + random() * 0.012);
    }

    for (let index = 0; index < 16; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 6.2 + random() * 3.4;
      place(
        index % 3 === 0 ? 'Bush_Light' : 'Bush_Dark',
        [Math.sin(angle) * radius, -0.82, Math.cos(angle) * radius],
        0.65 + random() * 0.55,
      );
    }

    const rockTypes = ['Rock_Small', 'Rock_Medium', 'Rock_Tall'];
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 6.1 + random() * 4.2;
      place(rockTypes[index % rockTypes.length] ?? 'Rock_Small', [Math.sin(angle) * radius, -0.84, Math.cos(angle) * radius], 0.8 + random() * 0.75);
    }

    place('Cliff_Wide', [-9.6, -0.9, -6.4], 1.45, 0.18);
    place('Cliff_Straight', [9.7, -0.9, -5.8], 1.45, -0.25);
    place('Cliff_Straight', [-10.2, -0.9, 5.4], 1.25, Math.PI + 0.15);
    place('Ruin_Arch', [0.5, -0.86, -9.4], 1.35, 0.04);
    place('Ruin_Arch', [11.8, -0.86, 2.8], 0.9, -Math.PI / 2);
    place('Lantern_Post', [-8.8, -0.86, 4.5], 1.05, 0);
    place('Lantern_Post', [8.9, -0.86, 4.8], 1.05, Math.PI);
    place('Bridge_Wood', [0, -0.72, 7.5], 1.25, 0);

    const bankDetails: Array<[string, [number, number, number], number, number]> = [
      ['Rock_Medium', [-3.28, -0.78, 4.45], 1.15, 0.3],
      ['Rock_Small', [-0.72, -0.78, 4.75], 1.05, 1.2],
      ['Bush_Dark', [-3.55, -0.78, 5.35], 0.82, 0.4],
      ['Bush_Light', [-0.45, -0.78, 5.75], 0.74, 2.1],
      ['Rock_Tall', [-3.32, -1.1, 7.0], 0.76, 0.2],
      ['Rock_Medium', [-0.63, -1.08, 7.45], 0.92, 0.8],
      ['Bush_Dark', [-3.62, -1.08, 8.35], 0.78, 1.5],
      ['Rock_Small', [-0.38, -1.1, 9.0], 1.0, 2.4],
      ['Tree_Broad_A', [-7.9, -0.86, 5.6], 1.28, 0.15],
      ['Tree_Broad_A', [8.0, -0.86, 5.8], 1.22, -0.3],
    ];
    for (const [name, position, scale, rotation] of bankDetails) place(name, position, scale, rotation, name.startsWith('Tree_') ? 0.014 : 0);

    const plantDetails: Array<[string, [number, number, number], number, number]> = [
      ['Broad_Plant_A', [-8.25, -0.8, 1.8], 1.08, 0.6],
      ['Broad_Plant_A', [8.35, -0.8, -1.2], 1.1, 1.4],
      ['Broad_Plant_A', [-0.15, -0.82, 4.55], 0.92, 1.6],
      ['Mushroom_Cluster_A', [-7.2, -0.78, -3.55], 1.2, 0.2],
      ['Mushroom_Cluster_A', [7.25, -0.78, 3.55], 1.0, 1.4],
    ];
    for (const [name, position, scale, rotation] of plantDetails) {
      place(name, position, scale, rotation);
    }
  } catch (error) {
    console.error('Forest GLB could not be loaded; keeping the procedural environment shell.', error);
  }

  return {
    root,
    update(time, _delta, reducedGraphics) {
      for (const target of swayTargets) {
        target.object.rotation.z = reducedGraphics
          ? 0
          : Math.sin(time * 0.72 + target.phase) * target.amplitude;
      }
      for (const material of lanternMaterials) {
        material.emissiveIntensity = reducedGraphics ? 1.3 : 2.2 + Math.sin(time * 5.2) * 0.35;
      }
      for (const material of waterMaterials) {
        const timeUniform = material.uniforms.t;
        if (timeUniform) timeUniform.value = reducedGraphics ? 0 : time;
      }
      for (const mesh of ambientSway) {
        mesh.rotation.z = reducedGraphics ? 0 : Math.sin(time * 0.65) * 0.012;
      }
      if (ambientVegetation) ambientVegetation.visible = !reducedGraphics;
    },
  };
}
