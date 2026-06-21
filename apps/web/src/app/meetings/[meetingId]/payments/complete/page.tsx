import { MeetingCompletePage } from '@/features/payment/pages/MeetingCompletePage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingCompletePage meetingId={meetingId} />;
}
