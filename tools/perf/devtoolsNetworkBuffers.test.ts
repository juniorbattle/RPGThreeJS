import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ZERO_NETWORK_BUFFERS, withZeroNetworkBuffers } from './devtoolsNetworkBuffers.mjs';

// M1 (OD-2026-11-15-A): a DevTools Network agent with Chromium's default buffers keeps every response of the page in
// the renderer, so the memory driver must enable Network with zero buffers (docs/reports/combat-memory-2026-11-15.md).
describe('DevTools Network buffers of the memory driver', () => {
  it('gives zero buffers to every parameterless Network.enable, and only to those', () => {
    const { source, count } = withZeroNetworkBuffers([
      'await session2.send("Network.enable");',
      'session2.sendMayFail( "Network.enable" ),',
      'session.send("Network.enable", { maxPostDataSize: 1 });',
      'session.send("Network.disable");',
      'session.send("Runtime.enable");',
    ].join('\n'));
    expect(count).toBe(2);
    expect(source).toContain('session2.send("Network.enable", {"maxTotalBufferSize":0,"maxResourceBufferSize":0})');
    expect(source).toContain('session2.sendMayFail("Network.enable", {"maxTotalBufferSize":0,"maxResourceBufferSize":0})');
    expect(source).toContain('session.send("Network.enable", { maxPostDataSize: 1 })');
    expect(source).toContain('session.send("Network.disable")');
    expect(ZERO_NETWORK_BUFFERS).toEqual({ maxTotalBufferSize: 0, maxResourceBufferSize: 0 });
  });

  it('still finds the Network.enable calls of the installed Playwright', () => {
    // A Playwright upgrade that reshapes these calls must fail here, not silently measure DevTools memory again.
    // The playwright-core the `playwright` package loads (its exports hide lib/, so resolve from its entry point).
    const require = createRequire(import.meta.url);
    const core = require.resolve('playwright-core', { paths: [dirname(require.resolve('playwright'))] });
    const bundle = join(dirname(core), 'lib', 'coreBundle.js');
    const { source, count } = withZeroNetworkBuffers(readFileSync(bundle, 'utf8'));
    expect(count).toBeGreaterThanOrEqual(1);
    expect(source).not.toMatch(/\.(send|sendMayFail)\(\s*"Network\.enable"\s*\)/);
  });

  it('keeps the measurement driver on zero buffers for its own CDP session', () => {
    const driver = readFileSync('tools/perf/measure-performance.mjs', 'utf8');
    expect(driver).toContain("cdp.send('Network.enable', zeroNetworkBuffers ? ZERO_NETWORK_BUFFERS : {})");
    expect(driver).not.toMatch(/cdp\.send\('Network\.enable'\)/);
    // Playwright must be imported after the bundle hook is installed, never statically.
    expect(driver).not.toMatch(/^import \{[^}]*\} from 'playwright';/m);
    expect(driver.indexOf('zeroPlaywrightNetworkBuffers()')).toBeLessThan(driver.indexOf("await import('playwright')"));
  });
});
