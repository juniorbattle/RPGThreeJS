/** T0 risk is production gameplay. Only development QA may turn it off. */
export function resolveTraversalRiskEnabled({ dev, search }: { dev: boolean; search: string }): boolean {
  return !(dev && new URLSearchParams(search).get('traversalRisk') === '0');
}
