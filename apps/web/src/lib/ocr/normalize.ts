import { ocrAnalysisSchema, type OcrToken } from '@yummpi/schemas';

import { OcrFailedError } from './errors';

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
  const tokens = fields.flatMap((f) => {
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

  // CLOVA 응답 필드가 잘못된 값(NaN bbox, 범위 밖 confidence 등)을 보내면
  // 여기서 명시적으로 차단. 이후 단계는 schema-clean OcrToken[]에만 의존.
  const parsed = ocrAnalysisSchema.safeParse(tokens);
  if (!parsed.success) {
    throw new OcrFailedError(
      'MALFORMED_RESPONSE',
      `CLOVA field validation failed: ${parsed.error.message}`,
      parsed.error
    );
  }
  return parsed.data;
}
