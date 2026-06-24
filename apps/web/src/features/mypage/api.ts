// 마이페이지 프로필 API — GET/PATCH /users/me 래핑 (① 영역).
// 알림 설정(⑤ NotificationSettingsForm)과 쿼리 캐시 키를 분리한다(형상 충돌 방지).

import { type ApiEnvelope } from '@yummpi/schemas';

export interface MyProfile {
  id: string;
  nickname: string | null;
  image: string | null;
  email: string | null;
}

function extractData<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === undefined) {
    throw new Error(envelope.error?.message ?? '요청을 처리하지 못했어요.');
  }
  return envelope.data;
}

export async function getMyProfile(): Promise<MyProfile> {
  const res = await fetch('/api/v1/users/me');
  if (!res.ok) throw new Error('프로필을 불러오지 못했어요.');
  return extractData((await res.json()) as ApiEnvelope<MyProfile>);
}

export async function patchNickname(nickname: string): Promise<MyProfile> {
  const res = await fetch('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  const envelope = (await res.json()) as ApiEnvelope<MyProfile>;
  if (!res.ok || !envelope.success) {
    throw new Error(envelope.error?.message ?? '닉네임 변경에 실패했어요.');
  }
  return extractData(envelope);
}
