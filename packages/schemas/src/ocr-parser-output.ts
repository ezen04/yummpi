import { z } from 'zod';

// OCR 규칙 기반 파서의 출력 계약.
// parseReceipt(tokens: OcrToken[]) → OcrParserOutput  (회귀 테스트 계약 기준점)
//
// 파일 분담(2026-06-23 확정): 입력 계약 OcrToken/OcrAnalysis 은 ocr-response.ts(⑤ leaf),
// 출력 계약은 이 파일(④). import 방향은 ④ → leaf 단방향이며, P0 출력은 OcrToken 을
// 직접 참조하지 않으므로 leaf import 가 없다(필요해질 때만 leaf 에서 가져온다).

// 품목 — confidence(P0) = min(라인 토큰 inferConfidence) 원시값.
// 파싱 모호 플래그(lowConfidence)는 파서 내부 신호로만 두고 출력에 넣지 않는다.
// P1 에서 confidence 합성(work-doc §4.5)에 흡수.
export const parsedItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative().nullable(),
  totalPrice: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
});

// 파서 출력 = parseReceipt 반환 계약 (= 모든 expected.json 형태).
// api-spec §9 와 정합: unclassifiedLines 는 마스킹된 라인 텍스트(string[])만 노출하고
// 토큰·좌표·분류 kind 는 서버 내부 보관. merchantName/purchasedAt 는 P1 로 연기.
export const ocrParserOutputSchema = z.object({
  totalAmount: z.number().int().nonnegative().nullable(),
  items: z.array(parsedItemSchema),
  unclassifiedLines: z.array(z.string()), // 검수 화면 수동 승격 대상
});

export type ParsedItem = z.infer<typeof parsedItemSchema>;
export type OcrParserOutput = z.infer<typeof ocrParserOutputSchema>;
