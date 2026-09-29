/** T0 Route Reward is production-on; DEV may disable it for isolated QA. */
export function resolveTraversalRewardEnabled({ dev, search }: { dev: boolean; search: string }): boolean {
  return !(dev && new URLSearchParams(search).get('traversalReward') === '0');
}
