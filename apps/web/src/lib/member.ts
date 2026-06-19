import type { MeetingMember } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 참석자(MeetingMember) 직렬화 + 닉네임 헬퍼 (① 영역, 참석자 API §5 공용).
 *
 * - publicMember: 목록·타인 노출용. 출발지 좌표(start*)는 개인정보라 제외한다.
 *   (중간지점 계산은 ② BE 내부에서만 사용 — 클라이언트로 좌표를 흘리지 않는다.)
 * - selfMember: 본인 응답용. 좌표 포함(숫자로 변환).
 * - suggestNickname: 닉네임 중복 시 다음 사용 가능한 suffix 제안 (지훈 → 지훈2).
 */

export interface PublicMember {
  id: string;
  nickname: string;
  role: MeetingMember['role'];
  attendanceStatus: MeetingMember['attendanceStatus'];
  checkedIn: boolean;
  isGuest: boolean;
  joinedAt: Date;
}

export function publicMember(m: MeetingMember): PublicMember {
  return {
    id: m.id,
    nickname: m.nickname,
    role: m.role,
    attendanceStatus: m.attendanceStatus,
    checkedIn: m.checkedIn,
    isGuest: m.userId === null,
    joinedAt: m.joinedAt,
  };
}

export function selfMember(m: MeetingMember) {
  return {
    ...publicMember(m),
    startAddress: m.startAddress,
    startStation: m.startStation,
    startLatitude: m.startLatitude === null ? null : Number(m.startLatitude),
    startLongitude: m.startLongitude === null ? null : Number(m.startLongitude),
  };
}

/** 닉네임 중복 시 다음 사용 가능한 suffix 제안 (미퇴장 멤버 기준). */
export async function suggestNickname(
  meetingId: string,
  base: string
): Promise<string> {
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}${i}`;
    const exists = await prisma.meetingMember.findFirst({
      where: { meetingId, nickname: candidate, leftAt: null },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${base}${Date.now()}`;
}
