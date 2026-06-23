import type {
  OcrToken,
  ParsedItem,
  OcrValidation,
  OcrParserOutput,
} from '@yummpi/schemas';

// OCR 규칙 기반 파서 — P0 stub.
// TDD RED 단계: 5함수 전부 동일하게 throw 하여 균일한 NOT_IMPLEMENTED 실패를 낸다.
// 내부 분류(classify)는 비공개로 두고, parseReceipt 가 조립한다.

export function groupIntoLines(_tokens: OcrToken[]): OcrToken[][] {
  throw new Error('NOT_IMPLEMENTED');
}

export function parseItemLine(_tokens: OcrToken[]): ParsedItem | null {
  throw new Error('NOT_IMPLEMENTED');
}

export function validate(_input: {
  items: ParsedItem[];
  totalAmount: number | null;
}): OcrValidation {
  throw new Error('NOT_IMPLEMENTED');
}

export function maskSensitive(_text: string): string {
  throw new Error('NOT_IMPLEMENTED');
}

export function parseReceipt(_tokens: OcrToken[]): OcrParserOutput {
  throw new Error('NOT_IMPLEMENTED');
}
