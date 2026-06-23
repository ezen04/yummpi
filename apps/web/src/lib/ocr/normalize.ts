import type { OcrToken } from '@yummpi/schemas';

type ClovaVertex = { x: number; y: number };

export type ClovaField = {
  inferText: string;
  inferConfidence: number;
  boundingPoly?: { vertices?: ClovaVertex[] };
  lineBreak?: boolean;
  type?: string;
};

function verticesToBbox(vertices: ClovaVertex[]) {
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function normalizeFields(fields: ClovaField[]): OcrToken[] {
  return fields.flatMap((f) => {
    const vertices = f.boundingPoly?.vertices;
    if (!vertices || vertices.length === 0) return [];
    const bbox = verticesToBbox(vertices);
    const token: OcrToken = {
      text: f.inferText,
      confidence: f.inferConfidence,
      ...bbox,
      lineBreak: f.lineBreak ?? false,
    };
    if (f.type !== undefined) token.type = f.type;
    return [token];
  });
}
