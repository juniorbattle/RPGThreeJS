/**
 * M1 (OD-2026-11-15-A, 2026-11-15): keep the DevTools Network agents of a measurement run from holding page memory.
 *
 * Every DevTools session that sends `Network.enable` without parameters keeps the content of the page's responses in
 * the renderer for as long as the top page lives (Chromium's default buffers: tens of MB). Playwright enables it on its
 * own session of every page, and the measurement driver enabled it on its CDP session too, so each fight's iframe
 * (scripts, sprites, sounds) stayed in the renderer's `partition_alloc` buffer partition: +18 to +33 MB per fight,
 * deaf to garbage collection and to a critical memory-pressure signal. The game itself keeps nothing: measured with no
 * DevTools client, or with `Network.enable` and zero buffers, the renderer plateaus (docs/reports/combat-memory-2026-11-15.md).
 *
 * Zero buffers change nothing else: network events (bytes, statuses, failures) still arrive; only
 * `Network.getResponseBody` loses the content it would have kept, which the drivers never ask for.
 */
import Module from 'node:module';

export const ZERO_NETWORK_BUFFERS = Object.freeze({ maxTotalBufferSize: 0, maxResourceBufferSize: 0 });

const NETWORK_ENABLE_WITHOUT_PARAMS = /\.(send|sendMayFail)\(\s*"Network\.enable"\s*\)/g;

/** Playwright's bundled source with every parameterless `Network.enable` given zero buffers; `count` says how many. */
export function withZeroNetworkBuffers(source) {
  let count = 0;
  const rewritten = source.replace(NETWORK_ENABLE_WITHOUT_PARAMS, (_match, method) => {
    count += 1;
    return `.${method}("Network.enable", ${JSON.stringify(ZERO_NETWORK_BUFFERS)})`;
  });
  return { source: rewritten, count };
}

/**
 * Rewrites playwright-core's bundle as Node loads it, so its own sessions enable Network with zero buffers. Call it
 * BEFORE importing `playwright`; the returned state tells whether the bundle was found and how many calls were changed.
 */
export function zeroPlaywrightNetworkBuffers() {
  const state = { bundles: 0, calls: 0 };
  const compile = Module.prototype._compile;
  Module.prototype._compile = function compileWithZeroNetworkBuffers(content, filename) {
    if (/[\\/]playwright-core[\\/]lib[\\/]coreBundle\.js$/.test(filename)) {
      const { source, count } = withZeroNetworkBuffers(content);
      state.bundles += 1; state.calls += count;
      return compile.call(this, source, filename);
    }
    return compile.call(this, content, filename);
  };
  return state;
}
