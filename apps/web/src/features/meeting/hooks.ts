'use client';

import { useMutation } from '@tanstack/react-query';
import {
  createMeeting,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from './api/meetingApi';

// 모임 생성. 성공 시 결과(초대코드·URL 등)를 화면에서 사용.
export function useCreateMeeting() {
  return useMutation<CreateMeetingResult, unknown, CreateMeetingInput>({
    mutationFn: createMeeting,
  });
}
