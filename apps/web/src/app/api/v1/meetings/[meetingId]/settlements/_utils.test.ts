import { describe, it, expect } from 'vitest';
import type { MeetingMember } from '@prisma/client';
import { SettlementCreateResponseSchema } from '@yummpi/schemas';
import type { SettlementMemberOutput } from '@/lib/settlement-engine/types';
import { ApiError } from '@/lib/api-response';
import {
  assertEngineTotal,
  buildCreationResponse,
  buildEqualEngineInput,
  buildSettlementMemberRows,
  resolveTotalAmount,
} from './_utils';

// idSchema가 uuid()라 RFC 4122 형식 강제: 3번째 그룹 첫 글자=version(1-8),
// 4번째 그룹 첫 글자=variant(8/9/a/b). 추적 가독성 위해 version=1, variant=8 고정.
const IDs = {
  settlement: '11111111-1111-1111-8111-111111111111',
  meeting: '22222222-2222-2222-8222-222222222222',
  host: '33333333-3333-3333-8333-333333333333',
  memberA: '44444444-4444-4444-8444-444444444444',
  memberB: '55555555-5555-5555-8555-555555555555',
};

// 던져진 ApiError의 code까지 단언 — normalize.test.ts의 toThrow(objectContaining) 컨벤션과 동일.
// 단순 .toThrow()는 무관한 에러로도 통과하는 사각이 있어 code를 명시한다.
const apiError = (code: string) => expect.objectContaining({ code });

// resolveTotalAmount는 totalAmount만 보므로 영수증 행은 최소 형태로.
function receipt(totalAmount: number | null) {
  return { totalAmount };
}

function member(
  id: string,
  role: MeetingMember['role']
): Pick<MeetingMember, 'id' | 'role'> {
  return { id, role };
}

describe('resolveTotalAmount', () => {
  it('receipt ≥ 1: 모든 영수증 total_amount의 합', () => {
    const total = resolveTotalAmount({
      receipts: [receipt(12000), receipt(8000)],
      splitMethod: 'ITEM_BASED',
    });
    expect(total).toBe(20000);
  });

  it('receipt가 있으면 요청 totalAmount는 무시(서버 합산이 단일 출처)', () => {
    const total = resolveTotalAmount({
      receipts: [receipt(30000)],
      splitMethod: 'EQUAL',
      requestedTotalAmount: 999,
    });
    expect(total).toBe(30000);
  });

  it('하나라도 total_amount=null이면 VALIDATION_ERROR', () => {
    expect(() =>
      resolveTotalAmount({
        receipts: [receipt(10000), receipt(null)],
        splitMethod: 'ITEM_BASED',
      })
    ).toThrow(apiError('VALIDATION_ERROR'));
  });

  it('하나라도 total_amount<=0이면 VALIDATION_ERROR', () => {
    expect(() =>
      resolveTotalAmount({
        receipts: [receipt(10000), receipt(0)],
        splitMethod: 'ITEM_BASED',
      })
    ).toThrow(apiError('VALIDATION_ERROR'));
  });

  it('receipt 0개 + ITEM_BASED: RECEIPT_REQUIRED', () => {
    expect(() =>
      resolveTotalAmount({ receipts: [], splitMethod: 'ITEM_BASED' })
    ).toThrow(apiError('RECEIPT_REQUIRED'));
  });

  it('receipt 0개 + EQUAL + 요청 totalAmount 있음: 그 값을 반환', () => {
    const total = resolveTotalAmount({
      receipts: [],
      splitMethod: 'EQUAL',
      requestedTotalAmount: 45000,
    });
    expect(total).toBe(45000);
  });

  it('receipt 0개 + EQUAL + 요청 totalAmount 없음: VALIDATION_ERROR', () => {
    expect(() =>
      resolveTotalAmount({ receipts: [], splitMethod: 'EQUAL' })
    ).toThrow(apiError('VALIDATION_ERROR'));
  });
});

describe('buildEqualEngineInput', () => {
  it('참석 멤버 전원을 participant로, HOST를 차액 흡수자로 구성', () => {
    const input = buildEqualEngineInput(30000, [
      member(IDs.host, 'HOST'),
      member(IDs.memberA, 'MEMBER'),
      member(IDs.memberB, 'MEMBER'),
    ]);
    expect(input).toEqual({
      splitMethod: 'EQUAL',
      totalAmount: 30000,
      hostMemberId: IDs.host,
      participantMemberIds: [IDs.host, IDs.memberA, IDs.memberB],
    });
  });

  it('참석 멤버가 없으면 VALIDATION_ERROR', () => {
    expect(() => buildEqualEngineInput(30000, [])).toThrow(
      apiError('VALIDATION_ERROR')
    );
  });

  it('HOST가 참석 집합에 없으면 VALIDATION_ERROR(엔진 가드 사전 차단)', () => {
    expect(() =>
      buildEqualEngineInput(30000, [
        member(IDs.memberA, 'MEMBER'),
        member(IDs.memberB, 'MEMBER'),
      ])
    ).toThrow(apiError('VALIDATION_ERROR'));
  });
});

describe('buildSettlementMemberRows', () => {
  it('엔진 출력 멤버를 createMany 행으로 매핑', () => {
    const members: SettlementMemberOutput[] = [
      { memberId: IDs.host, itemAmount: 0, adjustmentAmount: 10000, finalAmount: 10000 },
      { memberId: IDs.memberA, itemAmount: 0, adjustmentAmount: 10000, finalAmount: 10000 },
    ];
    const rows = buildSettlementMemberRows(IDs.settlement, members);
    expect(rows).toEqual([
      {
        settlementId: IDs.settlement,
        memberId: IDs.host,
        itemAmount: 0,
        adjustmentAmount: 10000,
        finalAmount: 10000,
      },
      {
        settlementId: IDs.settlement,
        memberId: IDs.memberA,
        itemAmount: 0,
        adjustmentAmount: 10000,
        finalAmount: 10000,
      },
    ]);
  });
});

describe('assertEngineTotal', () => {
  it('Σ finalAmount == totalAmount면 통과(throw 없음)', () => {
    const members: SettlementMemberOutput[] = [
      { memberId: IDs.host, itemAmount: 0, adjustmentAmount: 10000, finalAmount: 10000 },
      { memberId: IDs.memberA, itemAmount: 0, adjustmentAmount: 20000, finalAmount: 20000 },
    ];
    expect(() => assertEngineTotal(30000, members)).not.toThrow();
  });

  it('Σ finalAmount != totalAmount면 INTERNAL_ERROR(부패 정산 영속 차단)', () => {
    const members: SettlementMemberOutput[] = [
      { memberId: IDs.host, itemAmount: 0, adjustmentAmount: 10000, finalAmount: 10000 },
    ];
    expect(() => assertEngineTotal(30000, members)).toThrow(
      apiError('INTERNAL_ERROR')
    );
  });
});

describe('buildCreationResponse', () => {
  it('생성 응답을 조립하고 SettlementCreateResponseSchema와 정합', () => {
    const response = buildCreationResponse(
      {
        id: IDs.settlement,
        splitMethod: 'EQUAL',
        status: 'DRAFT',
        totalAmount: 30000,
      },
      'SETTLING'
    );
    expect(response).toEqual({
      id: IDs.settlement,
      splitMethod: 'EQUAL',
      status: 'DRAFT',
      totalAmount: 30000,
      meetingStatus: 'SETTLING',
    });
    // strip silent drop 차단: parse 결과가 원본과 동일해야 함.
    expect(SettlementCreateResponseSchema.parse(response)).toEqual(response);
  });
});

describe('ApiError 인스턴스 계약', () => {
  it('throw되는 검증 실패는 ApiError 인스턴스(plain Error 아님)', () => {
    let caught: unknown;
    try {
      resolveTotalAmount({ receipts: [], splitMethod: 'ITEM_BASED' });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ApiError);
  });
});
