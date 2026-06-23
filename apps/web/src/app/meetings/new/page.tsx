import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-member';
import { CreateMeetingPage } from '@/features/meeting/pages/CreateMeetingPage';

// 모임 생성은 회원 전용. 비로그인 시 카카오 로그인으로.
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/api/auth/signin');
  return <CreateMeetingPage />;
}
