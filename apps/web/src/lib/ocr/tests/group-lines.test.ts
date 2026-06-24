import { describe, it, expect } from 'vitest';
import type { OcrToken } from '@yummpi/schemas';
import { groupIntoLines } from '../parser';

function tok(
  text: string,
  cx: number,
  cy: number,
  opts: Partial<OcrToken> = {}
): OcrToken {
  return { text, cx, cy, confidence: 0.99, width: 20, height: 20, ...opts };
}

describe('groupIntoLines (A)', () => {
  it('G1: 같은 cy(±height·50%) 토큰을 한 줄로 묶고 cx 오름차순 정렬', () => {
    const a = tok('30000', 300, 100);
    const b = tok('삼겹살', 50, 105);
    const c = tok('2', 200, 98);
    expect(groupIntoLines([a, b, c])).toEqual([[b, c, a]]); // cx 50,200,300
  });

  it('G2: cy 차이가 임계 초과면 별도 줄', () => {
    const a = tok('삼겹살', 50, 100);
    const b = tok('콜라', 50, 200);
    expect(groupIntoLines([a, b])).toEqual([[a], [b]]);
  });

  it('G2.5: cy 차가 정확히 height·50%면 같은 줄(<= 경계 포함)', () => {
    const a = tok('삼겹살', 50, 100);
    const b = tok('30000', 300, 110); // |110-100| = 10 = 임계 → 포함
    expect(groupIntoLines([a, b])).toEqual([[a, b]]);
  });

  it('G3: 입력이 cy 역순이어도 정렬 후 묶음', () => {
    const a = tok('아래', 50, 300);
    const b = tok('위', 50, 100);
    expect(groupIntoLines([a, b])).toEqual([[b], [a]]);
  });

  it('G4: 빈 배열', () => {
    expect(groupIntoLines([])).toEqual([]);
  });

  it('G5: 단일 토큰', () => {
    const a = tok('합계', 50, 100);
    expect(groupIntoLines([a])).toEqual([[a]]);
  });

  it('G6: 좌표상 같은 줄이면 lineBreak:true여도 같은 줄(좌표 우선)', () => {
    const a = tok('삼겹살', 50, 100, { lineBreak: true });
    const b = tok('30000', 300, 102);
    expect(groupIntoLines([a, b])).toEqual([[a, b]]);
  });
});
