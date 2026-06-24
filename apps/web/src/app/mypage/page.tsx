import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-member';
import { MypagePage } from '@/features/mypage/pages/MypagePage';

// 마이페이지는 회원 전용. 비로그인·게스트는 카카오 로그인으로.
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/api/auth/signin');
  return (
    <div className="h-screen">
      <MypagePage />
    </div>
  );
}
