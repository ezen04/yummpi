import { TransferDonePage } from '@/features/payment/pages/TransferDonePage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <TransferDonePage meetingId={meetingId} />;
}
