# 08 — Cache Policy

## Default policy

```typescript
const DEFAULT_CACHE_POLICY = {
  maxEntries: 128,
  maxDecodedBytes: 256 * 1024 * 1024,  // 256 MB
  reuseCharacterAcrossSurfaces: true,
  reuseEnvironmentAcrossSurfaces: true,
  releaseEnvironmentOnSurfaceSwitch: false,
  releaseCharacterAnimationsOnSurfaceSwitch: false,
};
```

## LRU eviction

When the cache reaches `maxEntries` or `maxDecodedBytes`, the least-recently-
used entry is evicted. Last-used timestamps are updated on every access.

## Reuse behavior

- Character assets are reused across surfaces (idle frames shared between
  tableau and strategic)
- Environment assets are reused across surfaces (forest-road tableau and
  strategic share the same family)
- Surface switches do NOT aggressively unload — only `releaseUnusedCharacters`
  releases assets for characters no longer in the visible/participating set

## Release API

```typescript
loader.releaseUnusedCharacters(['archer'])  // releases non-archer assets
loader.releaseSurface('tableau')             // releases all tableau assets
loader.clear()                                // releases everything
```

## No thrash guarantee

Switching from tableau to strategic with the same character does not
reload the character's idle frames — they remain in cache. Only new states
(dash for strategic) are loaded on demand.

## Memory report

```typescript
const report = loader.getMemoryReport();
// {
//   totalEntries: number,
//   totalFileBytes: number,
//   estimatedDecodedRgbaBytes: number,
//   activeTextures: number,
//   loadedCharacterStates: string[],
//   loadedEnvironmentFamilies: string[],
//   cacheEntries: OptionCCacheEntry[],
//   isEstimate: true,
// }
```

Memory tracking is estimate-based in DEV. Production would use actual
GPU texture memory queries.
