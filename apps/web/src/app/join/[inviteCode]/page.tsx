import { JoinPage } from '@/features/join/pages/JoinPage';

export default async function Page({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  return <JoinPage inviteCode={inviteCode} />;
}
