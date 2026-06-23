import { describe, it, expect } from 'vitest';

import { normalizeFields, type ClovaField } from '../normalize';

const RECT: { x: number; y: number }[] = [
  { x: 10, y: 100 },
  { x: 50, y: 100 },
  { x: 50, y: 120 },
  { x: 10, y: 120 },
];

describe('normalizeFields', () => {
  it('boundingPoly.vertices를 cx/cy/width/height bbox로 변환한다', () => {
    const fields: ClovaField[] = [
      {
        inferText: '삼겹살',
        inferConfidence: 0.99,
        boundingPoly: { vertices: RECT },
      },
    ];

    const tokens = normalizeFields(fields);

    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      text: '삼겹살',
      confidence: 0.99,
      cx: 30,
      cy: 110,
      width: 40,
      height: 20,
    });
  });

  it('lineBreak가 없으면 false로 채운다 (V2 필수 보장 없음)', () => {
    const fields: ClovaField[] = [
      {
        inferText: '합계',
        inferConfidence: 0.95,
        boundingPoly: { vertices: RECT },
      },
    ];

    expect(normalizeFields(fields)[0].lineBreak).toBe(false);
  });

  it('lineBreak 명시값은 그대로 통과시킨다', () => {
    const fields: ClovaField[] = [
      {
        inferText: '30,000',
        inferConfidence: 0.99,
        boundingPoly: { vertices: RECT },
        lineBreak: true,
      },
    ];

    expect(normalizeFields(fields)[0].lineBreak).toBe(true);
  });

  it('type이 있으면 보존, 없으면 키 자체를 두지 않는다', () => {
    const withType = normalizeFields([
      {
        inferText: 'x',
        inferConfidence: 0.9,
        boundingPoly: { vertices: RECT },
        type: 'NORMAL',
      },
    ]);
    const withoutType = normalizeFields([
      {
        inferText: 'x',
        inferConfidence: 0.9,
        boundingPoly: { vertices: RECT },
      },
    ]);

    expect(withType[0].type).toBe('NORMAL');
    expect(withoutType[0]).not.toHaveProperty('type');
  });

  it('boundingPoly가 없는 토큰은 drop한다', () => {
    const fields: ClovaField[] = [
      { inferText: '있음', inferConfidence: 0.9, boundingPoly: { vertices: RECT } },
      { inferText: '없음', inferConfidence: 0.9 },
    ];

    const tokens = normalizeFields(fields);

    expect(tokens).toHaveLength(1);
    expect(tokens[0].text).toBe('있음');
  });

  it('vertices가 빈 배열인 토큰도 drop한다', () => {
    const tokens = normalizeFields([
      {
        inferText: '빈배열',
        inferConfidence: 0.9,
        boundingPoly: { vertices: [] },
      },
    ]);

    expect(tokens).toHaveLength(0);
  });
});
