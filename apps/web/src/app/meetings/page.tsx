import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-member';
import { MeetingsListPage } from '@/features/meetings/pages/MeetingsListPage';

// 나의 모임 목록은 회원 전용. 비로그인 시 카카오 로그인으로.
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/api/auth/signin');
  // h-screen로 높이 바운드 → 헤더·메뉴바 고정 + 본문만 스크롤 (대시보드/마이페이지 셸과 동일).
  return (
    <div className="h-screen">
      <MeetingsListPage />
    </div>
  );
}
