import { describe, it, expect } from 'vitest';
import {
  SettlementResponseSchema,
  SettlementResponseEnvelopeSchema,
} from './settlement-response';

// `GET /meetings/:meetingId/settlement` 응답 봉투 정합 검증.
// 점진 추가 정책 초기 minimal payload — items·receipts·avatarUrl 등은 BE 라우트 작성 시 확장.

const validMember = {
  memberId: '11111111-1111-4111-8111-111111111111',
  nickname: '지훈',
  role: 'HOST' as const,
  isMe: true,
  finalAmount: 30000,
  paymentStatus: 'PENDING' as const,
};

const validResponse = {
  id: '22222222-2222-4222-8222-222222222222',
  splitMethod: 'ITEM_BASED' as const,
  status: 'CONFIRMED' as const,
  totalAmount: 90000,
  confirmedAt: '2026-06-24T10:00:00.000Z',
  settlementMembers: [validMember],
};

describe('SettlementResponseSchema', () => {
  it('S1: 핵심 필드 모두 채운 정상 응답 parse 통과', () => {
    expect(() => SettlementResponseSchema.parse(validResponse)).not.toThrow();
  });

  it('S2: confirmedAt nullable (DRAFT 상태)', () => {
    const draft = {
      ...validResponse,
      status: 'DRAFT' as const,
      confirmedAt: null,
    };
    expect(() => SettlementResponseSchema.parse(draft)).not.toThrow();
  });

  it('S3: finalAmount 0 거부 (분배 엔진 음수·0원 거부 정책)', () => {
    const zero = {
      ...validResponse,
      settlementMembers: [{ ...validMember, finalAmount: 0 }],
    };
    expect(() => SettlementResponseSchema.parse(zero)).toThrow();
  });

  it('S3b: totalAmount 0 거부 (정산 시작 조건 위반)', () => {
    const zero = { ...validResponse, totalAmount: 0 };
    expect(() => SettlementResponseSchema.parse(zero)).toThrow();
  });

  it('S4: id가 uuid 아니면 거부 (cuid·임의 문자열 거부)', () => {
    const bad = { ...validResponse, id: 'cjld2cjxh0000qzrmn831i7rn' }; // cuid
    expect(() => SettlementResponseSchema.parse(bad)).toThrow();
  });

  it('S5: totalAmount float 거부 (정수 강제, 원 단위)', () => {
    const bad = { ...validResponse, totalAmount: 1000.5 };
    expect(() => SettlementResponseSchema.parse(bad)).toThrow();
  });

  it('S6: 음수 금액 거부', () => {
    const bad = {
      ...validResponse,
      settlementMembers: [{ ...validMember, finalAmount: -1 }],
    };
    expect(() => SettlementResponseSchema.parse(bad)).toThrow();
  });

  it('S9: settlementMembers 빈 배열 거부 (참석자 0명 응답 사고 차단)', () => {
    const empty = { ...validResponse, settlementMembers: [] };
    expect(() => SettlementResponseSchema.parse(empty)).toThrow();
  });
});

describe('SettlementResponseEnvelopeSchema', () => {
  it('S7: success=true + data 정상 봉투 통과', () => {
    expect(() =>
      SettlementResponseEnvelopeSchema.parse({
        success: true,
        data: validResponse,
      })
    ).not.toThrow();
  });

  it('S8: success=false 거부 (성공 봉투 전용)', () => {
    expect(() =>
      SettlementResponseEnvelopeSchema.parse({
        success: false,
        data: validResponse,
      })
    ).toThrow();
  });
});
