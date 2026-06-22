'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getInviteInfo,
  getRandomNickname,
  joinAsGuest,
  type GuestJoinResult,
  type InviteInfo,
} from './api/joinApi';

// 초대 링크 정보 (비로그인). 실패(잘못된 코드 등)는 차단 화면에서 처리하므로 retry 없음.
export function useInviteInfo(inviteCode: string) {
  return useQuery<InviteInfo>({
    queryKey: ['invite', inviteCode],
    queryFn: () => getInviteInfo(inviteCode),
    retry: false,
  });
}

// 게스트 랜덤 닉네임 (입장 화면 진입 시 1회, prefill용)
export function useRandomNickname(enabled: boolean) {
  return useQuery({
    queryKey: ['nickname', 'random'],
    queryFn: getRandomNickname,
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function useGuestJoin() {
  return useMutation<
    GuestJoinResult,
    unknown,
    { meetingId: string; inviteCode: string; nickname: string }
  >({
    mutationFn: joinAsGuest,
  });
}
