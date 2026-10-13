import * as THREE from 'three';
import type { VfxTextureName } from './VfxTypes';

export const VFX_TEXTURE_NAMES = [
  'softParticle',
  'sparkle',
  'slashArc',
  'smokePuff',
  'ringGradient',
  'projectileCore',
  'magicGlow',
  'magicCircle',
  'impactStar',
] as const satisfies readonly VfxTextureName[];

const textureCache = new Map<VfxTextureName, THREE.CanvasTexture>();

function canvas2d(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D unavailable for combat VFX textures.');
  context.clearRect(0, 0, size, size);
  return { canvas, context, size };
}

function radialDisc(context: CanvasRenderingContext2D, size: number, stops: Array<[number, string]>) {
  const c = size / 2;
  const gradient = context.createRadialGradient(c, c, 0, c, c, c);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
}

function drawSoftParticle() {
  const { canvas, context, size } = canvas2d();
  radialDisc(context, size, [
    [0, 'rgba(255,255,255,1)'],
    [0.22, 'rgba(255,255,255,.9)'],
    [0.62, 'rgba(255,255,255,.28)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  return canvas;
}

function drawSparkle() {
  const { canvas, context, size } = canvas2d();
  const c = size / 2;
  context.save();
  context.translate(c, c);
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, c * 0.72);
  glow.addColorStop(0, 'rgba(255,255,255,.8)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(-c, -c, size, size);
  context.beginPath();
  context.moveTo(0, -c * 0.82);
  context.quadraticCurveTo(c * 0.08, -c * 0.1, c * 0.75, 0);
  context.quadraticCurveTo(c * 0.08, c * 0.1, 0, c * 0.82);
  context.quadraticCurveTo(-c * 0.08, c * 0.1, -c * 0.75, 0);
  context.quadraticCurveTo(-c * 0.08, -c * 0.1, 0, -c * 0.82);
  context.fillStyle = '#fff';
  context.fill();
  context.restore();
  return canvas;
}

function drawSlashArc() {
  const { canvas, context, size } = canvas2d(256);
  const c = size / 2;
  const gradient = context.createLinearGradient(24, 210, 224, 38);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,.72)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.strokeStyle = gradient;
  context.lineCap = 'round';
  context.shadowColor = 'rgba(255,255,255,.72)';
  context.shadowBlur = 16;
  context.lineWidth = 17;
  context.beginPath();
  context.arc(c, c, 82, Math.PI * 0.82, Math.PI * 1.86);
  context.stroke();
  context.shadowBlur = 4;
  context.lineWidth = 5;
  context.strokeStyle = 'rgba(255,255,255,.95)';
  context.stroke();
  return canvas;
}

function drawSmokePuff() {
  const { canvas, context, size } = canvas2d();
  const puffs: Array<readonly [number, number, number]> = [
    [0.34, 0.53, 0.28],
    [0.51, 0.34, 0.3],
    [0.68, 0.52, 0.26],
    [0.48, 0.68, 0.31],
  ];
  for (const [x, y, radius] of puffs) {
    const gradient = context.createRadialGradient(size * x, size * y, 0, size * x, size * y, size * radius);
    gradient.addColorStop(0, 'rgba(255,255,255,.72)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,.34)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return canvas;
}

function drawRingGradient() {
  const { canvas, context, size } = canvas2d();
  const c = size / 2;
  const gradient = context.createRadialGradient(c, c, c * 0.44, c, c, c * 0.5);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.32, 'rgba(255,255,255,.25)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return canvas;
}

function drawProjectileCore() {
  const { canvas, context, size } = canvas2d();
  radialDisc(context, size, [
    [0, 'rgba(255,255,255,1)'],
    [0.12, 'rgba(255,255,255,1)'],
    [0.34, 'rgba(255,255,255,.82)'],
    [0.7, 'rgba(255,255,255,.2)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  return canvas;
}

function drawMagicGlow() {
  const { canvas, context, size } = canvas2d();
  radialDisc(context, size, [
    [0, 'rgba(255,255,255,.92)'],
    [0.3, 'rgba(255,255,255,.48)'],
    [0.74, 'rgba(255,255,255,.12)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  return canvas;
}

function drawMagicCircle() {
  const { canvas, context, size } = canvas2d(256);
  const c = size / 2;
  context.save();
  context.translate(c, c);
  context.strokeStyle = 'rgba(255,255,255,.92)';
  context.lineWidth = 4;
  context.shadowColor = 'rgba(255,255,255,.7)';
  context.shadowBlur = 8;
  for (const radius of [94, 76, 42]) {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.lineWidth = 3;
  context.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    const x = Math.cos(angle) * 72;
    const y = Math.sin(angle) * 72;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.stroke();
  for (let i = 0; i < 12; i += 1) {
    const angle = i * Math.PI / 6;
    context.save();
    context.rotate(angle);
    context.fillStyle = 'rgba(255,255,255,.9)';
    context.fillRect(104, -3, 13, 6);
    context.restore();
  }
  context.restore();
  return canvas;
}

function drawImpactStar() {
  const { canvas, context, size } = canvas2d();
  const c = size / 2;
  context.save();
  context.translate(c, c);
  const points = 16;
  context.beginPath();
  for (let i = 0; i < points; i += 1) {
    const radius = i % 2 === 0 ? c * 0.9 : c * 0.2;
    const angle = -Math.PI / 2 + i * Math.PI / (points / 2);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = '#fff';
  context.shadowColor = 'rgba(255,255,255,.88)';
  context.shadowBlur = 14;
  context.fill();
  context.restore();
  return canvas;
}

const DRAWERS: Record<VfxTextureName, () => HTMLCanvasElement> = {
  softParticle: drawSoftParticle,
  sparkle: drawSparkle,
  slashArc: drawSlashArc,
  smokePuff: drawSmokePuff,
  ringGradient: drawRingGradient,
  projectileCore: drawProjectileCore,
  magicGlow: drawMagicGlow,
  magicCircle: drawMagicCircle,
  impactStar: drawImpactStar,
};

export function getVfxTexture(name: VfxTextureName) {
  const cached = textureCache.get(name);
  if (cached) return cached;
  const texture = new THREE.CanvasTexture(DRAWERS[name]());
  texture.name = `combat-vfx:${name}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  textureCache.set(name, texture);
  return texture;
}

export function disposeVfxTextures() {
  for (const texture of textureCache.values()) texture.dispose();
  textureCache.clear();
}
