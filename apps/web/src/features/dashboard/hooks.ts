'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getMe,
  getMyMeetings,
  type Me,
  type MyMeetingsResult,
} from './api/dashboardApi';

// 내 프로필(인사·주최 판별용). 가드 통과 후라 항상 회원.
export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });
}

// 내 모임 목록(주최 + 참여, 나간 모임 제외 — BE 결정 B).
export function useMyMeetings() {
  return useQuery<MyMeetingsResult>({
    queryKey: ['my-meetings'],
    queryFn: getMyMeetings,
    retry: false,
  });
}
