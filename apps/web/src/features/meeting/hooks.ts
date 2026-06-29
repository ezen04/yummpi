'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  type CreateMeetingInput,
  type CreateMeetingResult,
  type UpdateMeetingInput,
  type UpdateMeetingResult,
} from './api/meetingApi';

// 모임 생성. 성공 시 결과(초대코드·URL 등)를 화면에서 사용.
export function useCreateMeeting() {
  return useMutation<CreateMeetingResult, unknown, CreateMeetingInput>({
    mutationFn: createMeeting,
  });
}

// 모임 수정(호스트). 성공 시 허브로 복귀.
export function useUpdateMeeting(meetingId: string) {
  return useMutation<UpdateMeetingResult, unknown, UpdateMeetingInput>({
    mutationFn: (input) => updateMeeting(meetingId, input),
  });
}

// 모임 삭제(호스트, 소프트 삭제). 성공 시 대시보드로.
export function useDeleteMeeting(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: () => deleteMeeting(meetingId),
    onSuccess: () => {
      // 삭제(취소) 직후 대시보드 모임 목록 즉시 갱신.
      // (호출측 onSuccess의 router.push와 함께 실행됨)
      queryClient.invalidateQueries({ queryKey: ['my-meetings'] });
    },
  });
}
