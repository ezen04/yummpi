import { describe, it, expect } from 'vitest';
import { ocrParserOutputSchema } from '@yummpi/schemas';

import { parseReceipt } from '../parser';
import { loadOcrFixtures } from './loader';

const fixtures = loadOcrFixtures();

describe.runIf(fixtures.length > 0)('OCR parser regression', () => {
  it.each(fixtures)('$name: tokens schema 유효', ({ tokens }) => {
    expect(Array.isArray(tokens)).toBe(true);
  });

  // 계약 기준점: parseReceipt(tokens) === ocrParserOutputSchema.parse(expected)
  it.each(fixtures)('$name: parser 출력 = expected', ({ tokens, expected }) => {
    expect(parseReceipt(tokens)).toEqual(ocrParserOutputSchema.parse(expected));
  });
});

describe.runIf(fixtures.length === 0)('OCR parser regression (skipped)', () => {
  it('fixture 없음 — fixtures/README.md 참고하여 ④이 페어 추가하면 자동 활성화', () => {
    expect(fixtures.length).toBe(0);
  });
});
