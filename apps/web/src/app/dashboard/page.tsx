import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-member';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

// 대시보드는 회원 전용. 비로그인 시 카카오 로그인으로.
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/api/auth/signin');
  return <DashboardPage />;
}
