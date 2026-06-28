import { describe, expect, it } from 'vitest';
import { NotificationCategory } from '@prisma/client';
import { notificationCategorySchema } from '@yummpi/schemas';

/**
 * NotificationCategory parity 가드 — Prisma enum ↔ schemas Zod enum.
 *
 * 두 정의는 "일원화(단일 진실원)"가 아니라 각자 다른 경계의 진실원이다:
 *  - Prisma `NotificationCategory` = DB 진실원 (server·DB 적재)
 *  - schemas `notificationCategorySchema` = API 계약 진실원 (web·큐 입력 검증)
 *
 * 한쪽만 카테고리를 추가/삭제/변경하면 런타임 drift가 생긴다. 이 테스트가
 * 두 진실원의 값 집합 일치를 단언해 CI에서 즉시 drift를 잡는다.
 */
describe('NotificationCategory parity (Prisma enum ↔ schemas Zod enum)', () => {
  it('두 진실원의 값 집합이 일치한다', () => {
    const prismaValues = Object.values(NotificationCategory).sort();
    const zodValues = [...notificationCategorySchema.options].sort();

    expect(prismaValues).toEqual(zodValues);
  });
});
