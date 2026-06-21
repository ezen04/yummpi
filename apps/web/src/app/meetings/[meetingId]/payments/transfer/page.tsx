import { TransferStatusPage } from '@/features/payment/pages/TransferStatusPage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <TransferStatusPage meetingId={meetingId} />;
}
