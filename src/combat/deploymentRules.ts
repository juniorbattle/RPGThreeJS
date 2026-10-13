export function normalizeDeploymentLimit(value: number): number {
  return Math.max(3, Math.min(5, Math.trunc(value)));
}

export function orderDeploymentCandidates<T extends { id: string }>(
  candidates: T[],
  preferredIds: string[],
): T[] {
  const priority = new Map(preferredIds.map((id, index) => [id, index]));
  return [...candidates].sort((left, right) => {
    const leftRank = priority.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = priority.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
}

export function canStartDeployment(deployedCount: number, maxPlayerUnits: number): boolean {
  return deployedCount >= 1 && deployedCount <= normalizeDeploymentLimit(maxPlayerUnits);
}
