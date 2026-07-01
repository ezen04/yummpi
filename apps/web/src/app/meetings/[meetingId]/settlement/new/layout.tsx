import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';

export default async function SettlementNewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const member = await getCurrentMember(meetingId);
  if (member?.role !== 'HOST') {
    redirect(`/meetings/${meetingId}`);
  }
  return <>{children}</>;
}
