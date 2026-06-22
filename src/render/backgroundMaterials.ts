import * as THREE from 'three';

export interface UvWaveConfig {
  type: 'uvWave';
  intensity?: number;
  speed?: number;
  frequency?: number;
  direction?: 'horizontal' | 'vertical';
}

export function createUvWaveMaterial(texture: THREE.Texture, config: UvWaveConfig, opacity = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: texture },
      uIntensity: { value: config.intensity ?? 0.008 },
      uSpeed: { value: config.speed ?? 0.35 },
      uFrequency: { value: config.frequency ?? 7 },
      uDirection: { value: config.direction === 'vertical' ? 1 : 0 },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSpeed;
      uniform float uFrequency;
      uniform float uOpacity;
      uniform int uDirection;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        float phase = uTime * uSpeed;
        if (uDirection == 0) {
          uv.x += sin(vUv.y * uFrequency + phase) * uIntensity;
        } else {
          uv.y += sin(vUv.x * uFrequency + phase) * uIntensity;
        }
        vec4 color = texture2D(uTexture, uv);
        gl_FragColor = vec4(color.rgb, color.a * uOpacity);
      }
    `,
  });
}
