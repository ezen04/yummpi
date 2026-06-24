import { describe, it, expect } from 'vitest';
import { maskSensitive } from '../parser';

describe('maskSensitive (D)', () => {
  it('M1: 전체 카드번호 3종 구분자 → 카드만 치환, 주변 텍스트 보존', () => {
    expect(maskSensitive('신용 1234-5678-9012-3456 승인')).toBe(
      '신용 ****-****-****-**** 승인'
    );
    expect(maskSensitive('1234 5678 9012 3456')).toBe('****-****-****-****');
    expect(maskSensitive('1234567890123456')).toBe('****-****-****-****');
  });

  it('M2: 부분 마스킹된 카드(1234-56**-****-7890)도 완전 마스킹 출력', () => {
    expect(maskSensitive('1234-56**-****-7890')).toBe('****-****-****-****');
  });

  it('M3: 카드 아닌 숫자열(금액·전화·사업자번호)은 미마스킹 (false positive 방지)', () => {
    expect(maskSensitive('30000')).toBe('30000');
    expect(maskSensitive('010-1234-5678')).toBe('010-1234-5678'); // 전화 3-4-4
    expect(maskSensitive('123-45-67890')).toBe('123-45-67890'); // 사업자번호 3-2-5
  });

  it('M4: 카드번호 없는 텍스트는 그대로', () => {
    expect(maskSensitive('삼겹살 2인분')).toBe('삼겹살 2인분');
  });

  it('M5: 한 줄 다중 카드 → /g로 전부 치환', () => {
    expect(maskSensitive('1234-5678-9012-3456 1111-2222-3333-4444')).toBe(
      '****-****-****-**** ****-****-****-****'
    );
  });

  it('M6: CLOVA 부분 마스킹(앞 4-6자리 가시 + 별표 8-12) → 완전 마스킹', () => {
    // 6자리 + 10별표 (실측: 카페 코코민트 영수증)
    expect(maskSensitive('448125**********')).toBe('****-****-****-****');
    expect(maskSensitive('카드번호: 448125**********')).toBe(
      '카드번호: ****-****-****-****'
    );
    // 4자리 + 12별표 경계 케이스
    expect(maskSensitive('4481************')).toBe('****-****-****-****');
    // false positive: 짧은 숫자+별표 본문은 미매치
    expect(maskSensitive('포인트 12**** 적립')).toBe('포인트 12**** 적립');
  });
});
