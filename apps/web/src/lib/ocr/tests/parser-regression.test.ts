import { describe, it, expect } from 'vitest';

import { loadOcrFixtures } from './loader';

const fixtures = loadOcrFixtures();

describe.runIf(fixtures.length > 0)('OCR parser regression', () => {
  it.each(fixtures)('$name: tokens schema 유효', ({ tokens }) => {
    expect(Array.isArray(tokens)).toBe(true);
  });

  // ④ ocrParserOutputSchema와 parser 함수가 추가되면 아래 it.each로 expected 매칭 활성화:
  //
  // it.each(fixtures)('$name: parser 출력 = expected', ({ tokens, expected }) => {
  //   const parsed = parseReceipt(tokens);
  //   expect(parsed).toEqual(ocrParserOutputSchema.parse(expected));
  // });
});

describe.runIf(fixtures.length === 0)('OCR parser regression (skipped)', () => {
  it('fixture 없음 — fixtures/README.md 참고하여 ④이 페어 추가하면 자동 활성화', () => {
    expect(fixtures.length).toBe(0);
  });
});
