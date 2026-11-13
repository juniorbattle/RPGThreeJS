/**
 * Test support: a recording stand-in for a Web Audio context. Every node it creates, every property and parameter set,
 * every automation call, connection, start and stop is written to a log, in order, with exact numbers; every buffer
 * created through it is digested byte by byte when the trace is read. Two runs that build the same graph with the same
 * schedule give the same digest, so a sound can be compared before and after a change without an audio device. Time is
 * whatever the caller's clock says (fake timers in tests).
 */

const PARAMS = new Set(['gain', 'frequency', 'detune', 'Q', 'playbackRate', 'threshold', 'knee', 'ratio', 'attack', 'release', 'pan', 'delayTime', 'offset']);
const AUTOMATION = ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues', 'cancelAndHoldAtTime', 'setValueCurveAtTime'];
const METHODS = ['disconnect', 'start', 'stop', 'setPeriodicWave'];
const NODES = ['Gain', 'BiquadFilter', 'Oscillator', 'BufferSource', 'DynamicsCompressor', 'WaveShaper', 'StereoPanner', 'Delay', 'Convolver', 'ConstantSource', 'Panner', 'ChannelMerger', 'ChannelSplitter', 'IIRFilter'];

/** FNV-1a and djb2 side by side over 32-bit words of text or bytes: 16 hex digits. */
export function digestText(text: string): string {
  let a = 0x811c9dc5, b = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = (Math.imul(b, 33) + c) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

export function digestBytes(view: ArrayBufferView): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  let a = 0x811c9dc5, b = 5381;
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i]!;
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = (Math.imul(b, 33) + c) >>> 0;
  }
  return `${bytes.length}:${a.toString(16).padStart(8, '0')}${b.toString(16).padStart(8, '0')}`;
}

interface Traced { __id: number }

export interface AudioTrace {
  /** Use it wherever a BaseAudioContext or AudioContext is expected. */
  ctx: AudioContext;
  /** The log so far, then every buffer's content. */
  lines(): string[];
  digest(): string;
}

export function traceAudio(now: () => number, sampleRate = 48000): AudioTrace {
  let ids = 0;
  const log: string[] = [];
  const buffers: Array<{ id: number; channels: Float32Array[] }> = [];
  const fmt = (x: unknown): string => {
    if (typeof x === 'number') return String(x);
    if (x && typeof x === 'object' && '__id' in x) return `#${(x as Traced).__id}`;
    if (ArrayBuffer.isView(x)) return `bytes(${digestBytes(x)})`;
    if (Array.isArray(x)) return `[${x.map(fmt).join(',')}]`;
    return JSON.stringify(x) ?? String(x);
  };
  const call = (args: unknown[]) => args.map(fmt).join(',');
  const param = (owner: number, name: string): Traced => {
    let value = 0;
    const p: Record<string, unknown> = { __id: ++ids };
    for (const method of AUTOMATION) p[method] = (...args: unknown[]) => { log.push(`#${owner}.${name}.${method}(${call(args)})`); return p; };
    Object.defineProperty(p, 'value', { get: () => value, set: (v: number) => { value = v; log.push(`#${owner}.${name}=${fmt(v)}`); } });
    return p as unknown as Traced;
  };
  const node = (kind: string, args: unknown[]): Traced => {
    const id = ++ids;
    log.push(`#${id}=${kind}(${call(args)})`);
    const store: Record<string | symbol, unknown> = { __id: id };
    return new Proxy(store, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        if (PARAMS.has(prop)) return (target[prop] = param(id, prop));
        if (prop === 'connect') return (dest: unknown, ...rest: unknown[]) => { log.push(`#${id}.connect(${call([dest, ...rest])})`); return dest; };
        if (METHODS.includes(prop)) return (...rest: unknown[]) => { log.push(`#${id}.${prop}(${call(rest)})`); };
        return undefined;
      },
      set(target, prop, value) {
        target[prop] = value;
        log.push(`#${id}.${String(prop)}=${fmt(value)}`);
        return true;
      },
    }) as unknown as Traced;
  };
  const ctx: Record<string, unknown> = {
    __id: 0,
    sampleRate,
    destination: node('destination', []),
    createBuffer(channels: number, length: number, rate: number) {
      const id = ++ids;
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      buffers.push({ id, channels: data });
      log.push(`#${id}=buffer(${channels},${length},${rate})`);
      return { __id: id, length, sampleRate: rate, numberOfChannels: channels, duration: length / rate, getChannelData: (c: number) => data[c], copyToChannel: (src: Float32Array, c: number, at = 0) => data[c]!.set(src, at) };
    },
  };
  Object.defineProperty(ctx, 'currentTime', { get: now });
  for (const kind of NODES) ctx[`create${kind}`] = (...args: unknown[]) => node(kind, args);
  const lines = () => [...log, ...buffers.map(({ id, channels }) => `#${id}:${channels.map((c) => digestBytes(c)).join('|')}`)];
  return { ctx: ctx as unknown as AudioContext, lines, digest: () => digestText(lines().join('\n')) };
}
