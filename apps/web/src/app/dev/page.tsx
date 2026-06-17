'use client';

/**
 * /dev — 공통 컴포넌트 시각 검증 페이지
 */
import { Header } from '../../components/common/Header';
import { Menubar } from '../../components/common/Menubar';
import { Footer } from '../../components/common/Footer';
import { Button } from '@yummpi/ui';
// import { KakaoLoginButton } from '@yummpi/ui';
import {
  YIcon,
  Home,
  Bell,
  Users,
  MapPin,
  Star,
  Send,
  Plus,
  Close,
  Search,
  ChevronLeft,
  Sparkles,
  Flame,
  Check,
} from '@yummpi/ui';

export default function DevPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-normal)]">
      <div className="max-w-[390px] mx-auto px-4 py-8 space-y-10">
        {/* 헤더 */}
        <div>
          <h1 className="text-heading1 font-semibold text-[var(--label-strong)]">
            얌피 디자인 시스템
          </h1>
          <p className="text-label1 text-[var(--label-alternative)] mt-1">
            공통 컴포넌트 시각 검증
          </p>
        </div>

        {/* ── 타이포그래피 ── */}
        <section>
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide mb-3">
            Typography
          </h2>
          <div className="space-y-2 p-4 border border-[var(--line-normal)] [border-radius:var(--radius-12)]">
            <p className="text-display3 font-bold text-[var(--label-strong)]">
              Display3 · 36px
            </p>
            <p className="text-title3 font-semibold text-[var(--label-strong)]">
              Title3 · 24px
            </p>
            <p className="text-heading1 font-semibold text-[var(--label-normal)]">
              Heading1 · 22px
            </p>
            <p className="text-heading2 font-semibold text-[var(--label-normal)]">
              Heading2 · 20px
            </p>
            <p className="text-headline1 font-semibold text-[var(--label-normal)]">
              Headline1 · 18px
            </p>
            <p className="text-headline2 text-[var(--label-normal)]">
              Headline2 · 17px
            </p>
            <p className="text-body1 text-[var(--label-normal)]">
              Body1 · 16px
            </p>
            <p className="text-body2 text-[var(--label-alternative)]">
              Body2 · 15px
            </p>
            <p className="text-label1 text-[var(--label-alternative)]">
              Label1 · 14px
            </p>
            <p className="text-caption1 text-[var(--label-assistive)]">
              Caption1 · 12px
            </p>
          </div>
        </section>

        {/* ── 컬러 토큰 ── */}
        <section>
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide mb-3">
            Color Tokens
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'primary', color: 'var(--primary)' },
              { name: 'strong', color: 'var(--primary-strong)' },
              { name: 'heavy', color: 'var(--primary-heavy)' },
              { name: 'tint', color: 'var(--primary-tint)', border: true },
              { name: 'secondary', color: 'var(--secondary)' },
              {
                name: 'sec-tint',
                color: 'var(--secondary-tint)',
                border: true,
              },
              { name: 'positive', color: 'var(--status-positive)' },
              { name: 'caution', color: 'var(--status-cautionary)' },
              { name: 'negative', color: 'var(--status-negative)' },
              { name: 'bg-alt', color: 'var(--bg-alternative)', border: true },
              { name: 'inverse', color: 'var(--bg-inverse)' },
              { name: 'fill', color: 'var(--fill-normal)', border: true },
            ].map(({ name, color, border }) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div
                  className="w-full h-10 [border-radius:var(--radius-8)]"
                  style={{
                    background: color,
                    border: border ? '1px solid var(--line-normal)' : undefined,
                  }}
                />
                <span className="text-caption2 text-[var(--label-assistive)] text-center">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 버튼 ── */}
        <section className="space-y-6">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Button
          </h2>

          {/* Filled */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">
              Filled
            </p>
            <div className="flex gap-2">
              <Button size="lg">지원하기</Button>
              <Button size="md">지원하기</Button>
            </div>
            <div className="flex gap-2">
              <Button size="lg" leftIcon={<Check strokeWidth={1.5} />}>
                지원하기
              </Button>
              <Button size="md" leftIcon={<Check strokeWidth={1.5} />}>
                지원하기
              </Button>
            </div>
          </div>

          {/* Outline */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">
              Outline
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="lg">
                지원하기
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Check strokeWidth={1.5} />}
              >
                지원하기
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="lg">
                투표 마감
              </Button>
            </div>
          </div>

          {/* Disabled + Text links */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">
              Disabled · Link
            </p>
            <div className="flex items-center gap-4">
              <Button size="sm" disabled>
                비활성
              </Button>
            </div>
            {/* ghost = 테두리 없음, 밑줄 없음 / link = 밑줄 있음 */}
            <div className="flex items-center gap-4">
              <Button variant="link" size="sm">
                더보기
              </Button>
            </div>
            {/* 중립색 텍스트 링크 (label-alternative 오버라이드) */}
            <div className="flex items-center gap-4">
              <Button
                variant="link"
                size="sm"
                className="text-[var(--label-alternative)]"
              >
                더보기
              </Button>
            </div>
          </div>

          {/* Non-color buttons */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">
              Non-color
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="assistive"
                size="sm"
                leftIcon={<MapPin strokeWidth={1.5} />}
              >
                아이콘
              </Button>
              <Button variant="assistive" size="sm">
                아이콘
              </Button>
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">
              Radius
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="[border-radius:var(--radius-full)] px-5"
              >
                완료 확인
              </Button>
            </div>
          </div>

          {/* Chips */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">Chip</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="[border-radius:var(--radius-full)] h-7 text-xs px-3"
              >
                독촉
              </Button>
              <Button size="sm" className="text-[var(--label-normal)]">
                남남땡권
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="[border-radius:var(--radius-full)] h-7 text-xs px-3"
              >
                독촉
              </Button>
              {/* <Button
                variant="outline-primary"
                size="sm"
                className="[border-radius:var(--radius-full)] h-7 text-xs px-3"
              >
                독촉
              </Button> */}
              <Button
                size="sm"
                disabled
                className="[border-radius:var(--radius-full)] h-7 text-xs px-3"
              >
                독촉
              </Button>
            </div>
          </div>

          {/* Pay 버튼 */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">Pay</p>
            {/* <KakaoLoginButton /> */}
            <button
              className="w-full h-[50px] [border-radius:var(--radius-12)] font-semibold text-base text-[var(--static-white)] flex items-center justify-center gap-2"
              style={{ background: 'var(--brand-toss)' }}
            >
              pay
            </button>
            <button
              className="w-full h-[50px] [border-radius:var(--radius-12)] font-semibold text-base flex items-center justify-center gap-2"
              style={{
                background: 'var(--brand-kakao)',
                color: 'rgba(0,0,0,0.85)',
              }}
            >
              pay
            </button>
          </div>
        </section>

        {/* ── 아이콘 ── */}
        <section>
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide mb-3">
            Icons (Lucide · strokeWidth 1.5)
          </h2>
          <div className="p-4 border border-[var(--line-normal)] [border-radius:var(--radius-12)]">
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Home, name: 'Home' },
                { icon: Bell, name: 'Bell' },
                { icon: Users, name: 'Users' },
                { icon: MapPin, name: 'MapPin' },
                { icon: Star, name: 'Star' },
                { icon: Send, name: 'Send' },
                { icon: Plus, name: 'Plus' },
                { icon: Close, name: 'Close' },
                { icon: Search, name: 'Search' },
                { icon: ChevronLeft, name: 'Chevron' },
                { icon: Sparkles, name: 'Sparkles' },
                { icon: Flame, name: 'Flame' },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <YIcon
                    icon={icon}
                    size={24}
                    className="text-[var(--label-normal)]"
                  />
                  <span className="text-caption2 text-[var(--label-assistive)]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--line-alternative)]">
              <p className="text-caption1 text-[var(--label-assistive)] mb-2">
                크기 비교 (16 / 20 / 24px)
              </p>
              <div className="flex items-end gap-3">
                <YIcon
                  icon={Home}
                  size={16}
                  className="text-[var(--label-normal)]"
                />
                <YIcon
                  icon={Home}
                  size={20}
                  className="text-[var(--label-normal)]"
                />
                <YIcon
                  icon={Home}
                  size={24}
                  className="text-[var(--label-normal)]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Header ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Header
          </h2>
          <div className="space-y-2">
            {/* ① 뒤로가기 + 제목 */}
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Header title="송금하기" onBack={() => {}} />
            </div>
            {/* ② 대시보드 — 인사 + 벨 */}
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Header greeting="안녕하세요" title="김원티님 👋" showBell hasNotification />
            </div>
            {/* ③ 뒤로가기 + X */}
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Header onBack={() => {}} onClose={() => {}} />
            </div>
            {/* ④ 뒤로가기 + 제목 + 부제목 */}
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Header title="장소 추천" subtitle="조건에 맞는 후보 5곳" onBack={() => {}} />
            </div>
            {/* ⑤ 뒤로가기 + 제목 + 상태 뱃지 */}
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Header title="장소 투표" onBack={() => {}} badge="장소 확정" />
            </div>
            {/* ⑥ 제목 + 설정 */}
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Header title="마이페이지" onSettings={() => {}} />
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Footer
          </h2>
          {/* button — 힌트 있음 */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">button / 힌트 있음</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Footer
                variant="button"
                hint="정산 후 송금 요청이 자동으로 전송됩니다"
                label="정산 확정"
                onClick={() => {}}
              />
            </div>
          </div>
          {/* button — 힌트 없음 */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">button / 힌트 없음</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Footer variant="button" label="다음" onClick={() => {}} />
            </div>
          </div>
          {/* button — disabled */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">button / disabled</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Footer variant="button" label="다음" onClick={() => {}} disabled />
            </div>
          </div>
          {/* menubar */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">menubar</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Footer variant="menubar" activeTab="home" onTabChange={() => {}} onCreateClick={() => {}} />
            </div>
          </div>
        </section>

        {/* ── Menubar ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Menubar
          </h2>
          {/* 홈 활성 */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">홈 활성</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Menubar activeTab="home" onTabChange={() => {}} onCreateClick={() => {}} />
            </div>
          </div>
          {/* 모임 활성 */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">모임 활성</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Menubar activeTab="meetings" onTabChange={() => {}} onCreateClick={() => {}} />
            </div>
          </div>
          {/* 마이 활성 */}
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">마이 활성</p>
            <div className="border border-[var(--line-normal)] [border-radius:var(--radius-12)] overflow-hidden">
              <Menubar activeTab="mypage" onTabChange={() => {}} onCreateClick={() => {}} />
            </div>
          </div>
        </section>

        {/* ── 카카오 로그인 ── */}
        {/* <section>
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide mb-3">
            Kakao Login Button
          </h2>
          <KakaoLoginButton />
        </section> */}
      </div>
    </main>
  );
}
