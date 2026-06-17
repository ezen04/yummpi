import { getServerSession } from 'next-auth';
import type { MeetingMember, User } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import {
  hashGuestToken,
  readGuestCookie,
  verifyGuestToken,
} from '@/lib/guest-token';

/**
 * 공통 인증/권한 미들웨어.
 *
 * - getCurrentUser / requireUser: 로그인 회원(User) 해석. 계정 단위 API용.
 * - getCurrentMember / requireMember: 모임 범위 행위자를 MeetingMember로 해석.
 *   회원은 세션, 게스트는 게스트 토큰 쿠키(b안)로 해석한다.
 * - assertHost: 호스트 전용 가드.
 *
 * ⚠️ 인라인 권한 체크 금지 — 호스트 전용 API는 반드시 assertHost를 경유한다.
 */

/** 현재 로그인 회원. 비로그인이거나 게스트면 null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/** 회원 인증 필수 — 없으면 UNAUTHORIZED(401). */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  }
  return user;
}

/**
 * 모임 범위에서 현재 행위자를 MeetingMember로 해석한다.
 * - 로그인 회원: 세션 user → 해당 모임의 멤버(user_id 일치, 미퇴장)
 * - 게스트: 게스트 토큰 쿠키 → 서명·해시 검증 후 멤버
 * 멤버가 아니면 null.
 */
export async function getCurrentMember(
  meetingId: string
): Promise<MeetingMember | null> {
  const user = await getCurrentUser();
  if (user) {
    return prisma.meetingMember.findFirst({
      where: { meetingId, userId: user.id, leftAt: null },
    });
  }

  // 게스트: 모임 범위 쿠키 → 서명 검증 → 멤버 조회 + 해시 일치 확인
  const token = await readGuestCookie(meetingId);
  if (!token) return null;

  const verified = verifyGuestToken(token, meetingId);
  if (!verified) return null;

  const member = await prisma.meetingMember.findFirst({
    where: { id: verified.memberId, meetingId, leftAt: null },
  });
  if (!member?.guestTokenHash) return null;
  if (member.guestTokenHash !== hashGuestToken(token)) return null;

  return member;
}

/** 모임 멤버 필수 — 아니면 FORBIDDEN(403). */
export async function requireMember(meetingId: string): Promise<MeetingMember> {
  const member = await getCurrentMember(meetingId);
  if (!member) {
    throw new ApiError('FORBIDDEN', '모임 참여자만 접근할 수 있습니다.');
  }
  return member;
}

/** 호스트 전용 가드 — 호스트가 아니면 FORBIDDEN(403). */
export async function assertHost(meetingId: string): Promise<MeetingMember> {
  const member = await requireMember(meetingId);
  if (member.role !== 'HOST') {
    throw new ApiError('FORBIDDEN', '주최자만 수행할 수 있습니다.');
  }
  return member;
}
