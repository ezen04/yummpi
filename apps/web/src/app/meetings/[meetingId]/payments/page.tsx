import { PaymentStatusPage } from '@/features/payment/pages/PaymentStatusPage';

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <PaymentStatusPage meetingId={meetingId} />;
}
