/** Placeholder Route Reward requires an explicit DEV-only flag. */
export function resolveTraversalRewardEnabled({ dev, search }: { dev: boolean; search: string }): boolean {
  return dev && new URLSearchParams(search).get('traversalReward') === '1';
}
