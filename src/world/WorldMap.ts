import * as THREE from 'three';
import type { CampaignNode, GameState } from '../game/types';

interface WorldMapOptions {
  canvas: HTMLCanvasElement;
  labelLayer: HTMLElement;
  nodes: CampaignNode[];
  onSelect: (node: CampaignNode) => void;
}

interface NodeVisual {
  node: CampaignNode;
  group: THREE.Group;
  core: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  button: HTMLButtonElement;
}

const COLORS: Record<CampaignNode['type'], number> = {
  start: 0xd9b25a,
  story: 0x6aa6ff,
  mystery: 0xa978e8,
  'random-combat': 0xe66b55,
  'story-combat': 0xf09b4c,
  boss: 0xd84c63,
  treasure: 0xf3cf65,
  shop: 0x5ed0b0,
  end: 0xf5e9c8,
};

export class WorldMap {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  private readonly clock = new THREE.Clock();
  private readonly visuals = new Map<string, NodeVisual>();
  private readonly pathMaterials: THREE.LineBasicMaterial[] = [];
  private readonly pathVisuals: Array<{ from: string; to: string; line: THREE.Line }> = [];
  private readonly marker: THREE.Group;
  private readonly markerLight: THREE.PointLight;
  private readonly scenery = new THREE.Group();
  private readonly atmosphere = new THREE.Group();
  private waterMaterial: THREE.MeshBasicMaterial | null = null;
  private frame = 0;
  private disposed = false;
  private currentNodeId = '';
  private cameraCenterX = 0;
  private state: GameState | null = null;
  private resizeObserver: ResizeObserver;

  constructor(private readonly options: WorldMapOptions) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.fog = new THREE.FogExp2(0x10182d, 0.045);
    this.camera.position.set(0, 10.5, 15);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.HemisphereLight(0x99bfff, 0x1b1421, 1.4));
    const sun = new THREE.DirectionalLight(0xffe1ad, 3.2);
    sun.position.set(-8, 12, 8);
    this.scene.add(sun);

    this.buildGround();
    this.buildScenery();
    this.buildAtmosphere();
    this.buildPaths();
    this.buildNodes();
    const { marker, light } = this.buildMarker();
    this.marker = marker;
    this.markerLight = light;
    this.scene.add(marker);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(options.canvas);
    this.resize();
    this.animate();
  }

  update(state: GameState): void {
    this.state = state;
    this.atmosphere.visible = !state.settings.reducedGraphics;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, state.settings.reducedGraphics ? 1 : 1.75));
    const nodeChanged = this.currentNodeId !== state.currentNodeId;
    this.currentNodeId = state.currentNodeId;
    const current = this.options.nodes.find((node) => node.id === state.currentNodeId);
    if (current) {
      this.marker.position.set(current.x, 0.46, current.z);
      if (nodeChanged) {
        this.cameraCenterX = current.x;
        this.camera.position.x = current.x;
        this.camera.lookAt(current.x, 0, 0);
      }
    }

    const currentCanBeLeft = current !== undefined && state.resolvedNodeIds.includes(current.id);
    const connected = new Set(currentCanBeLeft ? current?.links ?? [] : []);
    for (const path of this.pathVisuals) {
      path.line.visible = state.run.revealedNodeIds.includes(path.from)
        && state.run.revealedNodeIds.includes(path.to);
    }
    for (const visual of this.visuals.values()) {
      const revealed = state.run.revealedNodeIds.includes(visual.node.id);
      const resolved = state.resolvedNodeIds.includes(visual.node.id);
      const visited = state.visitedNodeIds.includes(visual.node.id);
      const currentNode = visual.node.id === state.currentNodeId;
      const reachable = connected.has(visual.node.id);
      const cooldown = state.combatCooldowns[visual.node.id];
      visual.core.material.opacity = resolved ? 0.4 : 1;
      visual.core.material.transparent = resolved;
      visual.halo.visible = currentNode || reachable;
      visual.halo.material.color.setHex(currentNode ? 0xffe39a : 0x72c7ff);
      visual.button.disabled = !reachable || cooldown !== undefined;
      visual.button.hidden = !revealed;
      visual.group.visible = revealed;
      visual.button.classList.toggle('is-current', currentNode);
      visual.button.classList.toggle('is-resolved', resolved);
      visual.button.classList.toggle('is-visited', visited);
      visual.button.classList.toggle('is-reachable', reachable && cooldown === undefined);
      visual.button.dataset.cooldown = cooldown === undefined
        ? ''
        : `Disponible dans ${Math.max(0, cooldown - state.stepCounter)} déplacement(s)`;
    }
  }

  async travelTo(node: CampaignNode): Promise<void> {
    const start = this.marker.position.clone();
    const end = new THREE.Vector3(node.x, 0.46, node.z);
    const duration = 850;
    const started = performance.now();
    const startCenterX = this.cameraCenterX;
    await new Promise<void>((resolve) => {
      const step = (now: number) => {
        const p = Math.min(1, (now - started) / duration);
        const eased = p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
        this.marker.position.lerpVectors(start, end, eased);
        this.cameraCenterX = THREE.MathUtils.lerp(startCenterX, node.x, eased);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  setVisible(visible: boolean): void {
    this.options.canvas.hidden = !visible;
    this.options.labelLayer.hidden = !visible;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    for (const visual of this.visuals.values()) {
      visual.core.geometry.dispose();
      visual.core.material.dispose();
      visual.halo.geometry.dispose();
      visual.halo.material.dispose();
      visual.button.remove();
    }
    for (const material of this.pathMaterials) material.dispose();
    this.renderer.dispose();
  }

  private buildGround(): void {
    const geometry = new THREE.PlaneGeometry(48, 28, 54, 30);
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      positions.setZ(i, Math.sin(x * 0.55) * 0.12 + Math.cos(y * 0.7) * 0.1);
    }
    geometry.computeVertexNormals();
    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x314d42,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.34,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    this.scene.add(ground);

    this.waterMaterial = new THREE.MeshBasicMaterial({ color: 0x183954, transparent: true, opacity: 0.2 });
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(56, 36),
      this.waterMaterial,
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.28;
    this.scene.add(water);
  }

  private buildScenery(): void {
    this.scene.add(this.scenery);
  }

  private buildAtmosphere(): void {
    this.scene.add(this.atmosphere);
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 24;
      positions[index * 3 + 1] = 0.2 + Math.random() * 5;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffe2a0,
        size: 0.035,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    motes.userData.drift = true;
    this.atmosphere.add(motes);
  }

  private buildPaths(): void {
    const byId = new Map(this.options.nodes.map((node) => [node.id, node]));
    const built = new Set<string>();
    for (const node of this.options.nodes) {
      for (const linkedId of node.links) {
        const linked = byId.get(linkedId);
        if (!linked) continue;
        const key = [node.id, linked.id].sort().join(':');
        if (built.has(key)) continue;
        built.add(key);
        const material = new THREE.LineBasicMaterial({ color: 0xb4b8b0, transparent: true, opacity: 0.42 });
        this.pathMaterials.push(material);
        const midpoint = new THREE.Vector3((node.x + linked.x) / 2, 0.1, (node.z + linked.z) / 2 + 0.18);
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(node.x, 0.1, node.z),
          midpoint,
          new THREE.Vector3(linked.x, 0.1, linked.z),
        ]);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)), material);
        this.scene.add(line);
        this.pathVisuals.push({ from: node.id, to: linked.id, line });
      }
    }
  }

  private buildNodes(): void {
    for (const node of this.options.nodes) {
      const group = new THREE.Group();
      group.position.set(node.x, 0, node.z);
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.44, 0.24, 28),
        new THREE.MeshStandardMaterial({
          color: COLORS[node.type],
          emissive: COLORS[node.type],
          emissiveIntensity: 0.18,
          roughness: 0.45,
        }),
      );
      core.position.y = 0.12;
      group.add(core);
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.48, 0.58, 36),
        new THREE.MeshBasicMaterial({ color: 0x72c7ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.03;
      halo.visible = false;
      group.add(halo);
      this.scene.add(group);

      const button = document.createElement('button');
      button.className = 'map-node';
      button.type = 'button';
      button.innerHTML = `<span class="map-node__icon">${node.icon}</span><span class="map-node__label">${node.label}</span><small></small>`;
      button.addEventListener('click', () => this.options.onSelect(node));
      this.options.labelLayer.append(button);
      this.visuals.set(node.id, { node, group, core, halo, button });
    }
  }

  private buildMarker(): { marker: THREE.Group; light: THREE.PointLight } {
    const marker = new THREE.Group();
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0xffe09b, emissive: 0xffb347, emissiveIntensity: 1.5, roughness: 0.2 }),
    );
    gem.position.y = 0.34;
    marker.add(gem);
    const light = new THREE.PointLight(0xffb75a, 4, 3);
    light.position.y = 0.5;
    marker.add(light);
    return { marker, light };
  }

  private resize(): void {
    const rect = this.options.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.z = this.camera.aspect < 0.9 ? 20 : 15;
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();
    this.scenery.position.x += (this.cameraCenterX * 0.18 - this.scenery.position.x) * 0.025;
    this.atmosphere.position.x = this.cameraCenterX;
    this.atmosphere.rotation.y = Math.sin(time * 0.08) * 0.02;
    if (this.waterMaterial) {
      this.waterMaterial.opacity = 0.17 + Math.sin(time * 0.55) * 0.025;
      this.waterMaterial.color.setHSL(0.59 + Math.sin(time * 0.2) * 0.008, 0.52, 0.18);
    }
    this.marker.rotation.y = time * 1.1;
    this.marker.position.y = 0.08 + Math.sin(time * 2.4) * 0.06;
    this.markerLight.intensity = 3.4 + Math.sin(time * 3) * 0.8;
    this.camera.position.x += (this.cameraCenterX - this.camera.position.x) * 0.09;
    this.camera.lookAt(this.cameraCenterX, 0, 0);
    for (const visual of this.visuals.values()) {
      if (visual.halo.visible) {
        visual.halo.rotation.z = time * 0.25;
        visual.halo.material.opacity = 0.58 + Math.sin(time * 3 + visual.node.x) * 0.18;
      }
      const projected = visual.group.position.clone().add(new THREE.Vector3(0, 0.62, 0)).project(this.camera);
      const rect = this.options.canvas.getBoundingClientRect();
      visual.button.style.left = `${rect.left + (projected.x * 0.5 + 0.5) * rect.width}px`;
      visual.button.style.top = `${rect.top + (-projected.y * 0.5 + 0.5) * rect.height}px`;
      const cooldownText = visual.button.dataset.cooldown ?? '';
      const small = visual.button.querySelector('small');
      if (small) small.textContent = cooldownText;
    }
    this.renderer.render(this.scene, this.camera);
  };
}
