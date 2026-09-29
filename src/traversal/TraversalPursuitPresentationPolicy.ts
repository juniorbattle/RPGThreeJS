export function resolveTraversalPursuitEnabled({ dev, search }: { dev: boolean; search: string }): boolean {
  return dev && new URLSearchParams(search).get('traversalPursuit') === '1';
}
