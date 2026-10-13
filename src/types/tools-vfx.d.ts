declare module '*.mjs' {
  export function decodePng(buf: Buffer): { width: number; height: number; data: Uint8Array };
  export function detectGridV2(
    pixels: Uint8Array,
    width: number,
    height: number,
    filename: string,
    options?: {
      groundTruth?: { cols: number; rows: number };
      gifFrameCount?: number;
    }
  ): {
    cols: number;
    rows: number;
    cellW: number;
    cellH: number;
    frameCount: number;
    confidence: string;
    gridEvidenceSource: string;
    gridValidationStatus: string;
    separatorTransparencyRatio: number;
    activeCount: number;
    emptyCount: number;
    emptyRatio: number;
    avgCenterDrift: number;
    clippingCellCount: number;
    subCellSepRatio?: number;
    frameContinuity?: number;
    gifCorrelation: boolean;
    ambiguityReason: string | null;
    hypotheses: Array<{
      cols: number;
      rows: number;
      frameCount: number;
      cellW: number;
      cellH: number;
      score: number;
      separatorTransparency: number;
      subCellSep: number;
      frameContinuity: number;
      activeCells: number;
      emptyCells: number;
      avgCenterDrift: number;
      gifCorrelation: boolean;
    }>;
  };
}
