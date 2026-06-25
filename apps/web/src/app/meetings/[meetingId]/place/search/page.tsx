import { notFound } from 'next/navigation';
import { assertHost, getCurrentMember } from '@/lib/current-member';
import { PlaceSearchPage } from '@/features/place/pages/PlaceSearchPage';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ meetingId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { meetingId } = await params;
  const { mode } = await searchParams;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  // mode=add (후보 추가)는 회원·게스트 모두 가능, mode=confirm (장소 변경)은 호스트 전용
  if (mode === 'confirm') {
    await assertHost(meetingId);
  }

  return <PlaceSearchPage meetingId={meetingId} />;
}
