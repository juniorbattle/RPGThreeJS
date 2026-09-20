/** All grounded motion uses these logical road units, including the texture phase. */
export const ROAD_SPACE = Object.freeze({
  referenceWidth: 1463,
  length: 9000,
  truckX: 366,
  engagementX: 640,
  passedX: 160,
  wheelRadius: 36,
  farFactor: .08,
  forestFactor: .22,
  foregroundFactor: 1.22,
});

export function roadCameraX(progress: number): number { return progress * ROAD_SPACE.length; }
export function roadWorldToScreen(worldX: number, cameraX: number, viewportWidth: number): number {
  return (worldX - cameraX) * viewportWidth / ROAD_SPACE.referenceWidth;
}
export function beatWorldX(engagementProgress: number): number {
  return roadCameraX(engagementProgress) + ROAD_SPACE.engagementX;
}
export function beatPassedProgress(engagementProgress: number): number {
  return engagementProgress + (ROAD_SPACE.engagementX - ROAD_SPACE.passedX) / ROAD_SPACE.length;
}
