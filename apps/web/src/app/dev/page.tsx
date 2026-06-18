'use client';

import { useState } from 'react';

/**
 * /dev — 공통 컴포넌트 시각 검증 페이지
 */
import { Header } from '../../components/common/Header';
import { Menubar } from '../../components/common/Menubar';
import { Footer } from '../../components/common/Footer';
import { Badge } from '../../components/common/Badge';
import { KakaoLoginButton, KakaoPayButton, TossPayButton, RadiusButton } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Check } from '../../components/common/Check';
import { Radio, RadioGroup } from '../../components/common/Radio';
import { BottomSheet } from '../../components/common/BottomSheet';
import { Chip } from '../../components/common/Chip';
import { Toggle } from '../../components/common/Toggle';
import { Selectbox } from '../../components/common/Selectbox';
import { YAvatar } from '../../components/common/YAvatar';
import { Thumbnail } from '../../components/common/Thumbnail';
import { Confirmbox } from '../../components/common/Confirmbox';
import { PersonItem, MenuItem } from '../../components/common/List';
import { Notification } from '../../components/common/Notification';
import { Tipbox } from '../../components/common/Tipbox';
import { Step } from '../../components/common/Step';
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
  Check as CheckIcon,
  Pencil,
  Calendar,
} from '@yummpi/ui';

export default function DevPage() {
  const [bsOpen, setBsOpen] = useState<'background' | 'non-background' | 'solo' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
              <Button size="lg" leftIcon={<CheckIcon strokeWidth={1.5} />}>
                지원하기
              </Button>
              <Button size="md" leftIcon={<CheckIcon strokeWidth={1.5} />}>
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
                leftIcon={<CheckIcon strokeWidth={1.5} />}
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

        {/* ── Input ── */}
        <section className="space-y-4">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Input
          </h2>
          {/* essential-basic (왼쪽 아이콘 — 펜) */}
          <Input
            label="모임 이름" required
            leftIcon={<Pencil size={18} strokeWidth={1.5} />}
            placeholder="모임 이름을 입력하세요"
          />
          {/* essential-icon-left — 캘린더 */}
          <Input
            label="날짜" required
            leftIcon={<Calendar size={18} strokeWidth={1.5} />}
            placeholder="날짜를 선택하세요"
            readOnly
          />
          {/* essential-icon-left — 인원 */}
          <Input
            label="인원" required
            leftIcon={<Users size={18} strokeWidth={1.5} />}
            placeholder="인원 수"
          />
          {/* essential-icon-left — 지역 */}
          <Input
            label="지역" required
            leftIcon={<MapPin size={18} strokeWidth={1.5} />}
            placeholder="지역을 입력하세요"
          />
          {/* optional-basic */}
          <Input label="모임 설명" placeholder="설명을 입력하세요 (선택)" />
          {/* error */}
          <Input
            label="닉네임" required
            placeholder="닉네임을 입력하세요"
            error="이미 사용 중인 닉네임입니다"
          />
        </section>

        {/* ── Check ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Check
          </h2>
          <div className="space-y-3">
            <Check checked={false} label="삼겹살 2인분 (inactive)" />
            <Check checked={true} label="소주 3병 (active)" />
            <Check checked={true} label="비활성 선택됨" disabled />
            <Check checked={false} />
            <Check checked={true} />
          </div>
        </section>

        {/* ── Radio ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Radio
          </h2>
          <div className="space-y-3">
            <Radio checked={false} label="항목별 정산 (inactive)" />
            <Radio checked={true} label="1/N 균등 정산 (active)" />
            <Radio checked={true} label="비활성 선택됨" disabled />
          </div>
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-2">RadioGroup</p>
            <RadioGroup
              options={[
                { value: 'ITEM_BASED', label: '항목별 정산' },
                { value: 'EQUAL', label: '1/N 균등 정산' },
              ]}
              value="ITEM_BASED"
              onChange={() => {}}
            />
          </div>
        </section>

        {/* ── Chip ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">Chip</h2>
          <div className="flex flex-wrap gap-2">
            <Chip active>한식</Chip>
            <Chip active={false}>일식</Chip>
            <Chip active={false}>중식</Chip>
            <Chip active={false}>고기</Chip>
            <Chip active={false}>카페</Chip>
          </div>
        </section>

        {/* ── Toggle ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">Toggle</h2>
          <div className="space-y-3">
            <Toggle checked={false} label="송금 독촉 알림 (inactive)" />
            <Toggle checked={true} label="모임 알림 (active)" />
            <Toggle checked={true} label="비활성" disabled />
          </div>
        </section>

        {/* ── Selectbox ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">Selectbox</h2>
          <Selectbox
            options={[
              { value: 'ITEM_BASED', label: '항목별 정산' },
              { value: 'EQUAL', label: '1/N 균등 정산' },
            ]}
            value="ITEM_BASED"
            onChange={() => {}}
          />
        </section>

        {/* ── YAvatar ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">YAvatar</h2>
          <div className="flex gap-3 items-center">
            <YAvatar variant="host" name="김주최" size={48} />
            <YAvatar variant="guest" name="이참여" size={48} />
            <YAvatar variant="host" name="박호스트" size={40} />
            <YAvatar variant="guest" name="최게스트" size={32} />
          </div>
        </section>

        {/* ── Thumbnail ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">Thumbnail</h2>
          <div className="flex gap-2 flex-wrap">
            <Thumbnail category="korean" />
            <Thumbnail category="japanese" />
            <Thumbnail category="chinese" />
            <Thumbnail category="meat" />
            <Thumbnail category="cafe" />
            <Thumbnail category="western" />
          </div>
        </section>

        {/* ── Confirmbox ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">Confirmbox</h2>
          <button
            onClick={() => setConfirmOpen(true)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-8)', border: '1px solid var(--line-normal)', font: '400 14px var(--font-sans)', cursor: 'pointer' }}
          >
            다이얼로그 열기
          </button>
          <Confirmbox
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
            title="정산을 확정할까요?"
            body="확정 후에는 금액을 수정할 수 없어요"
            confirmLabel="확정"
          />
        </section>

        {/* ── List ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">List</h2>
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">Person</p>
            <div style={{ borderBottom: '1px solid var(--line-normal)' }}>
              <PersonItem variant="me" name="김윤아" isHost={true} status="paid" />
            </div>
            <div style={{ borderBottom: '1px solid var(--line-normal)' }}>
              <PersonItem variant="other" name="이지훈" status="unpaid" />
            </div>
            <div style={{ borderBottom: '1px solid var(--line-normal)' }}>
              <PersonItem variant="other-inactive" name="박민수" />
            </div>
          </div>
          <div>
            <p className="text-caption1 text-[var(--label-assistive)] mb-1">Menu</p>
            <div style={{ borderTop: '1px solid var(--line-normal)' }}>
              <div style={{ borderBottom: '1px solid var(--line-normal)' }}>
                <MenuItem label="계좌 관리" />
              </div>
              <div style={{ borderBottom: '1px solid var(--line-normal)' }}>
                <MenuItem label="알림 설정" value="켜짐" />
              </div>
              <MenuItem label="탈퇴하기" destructive />
            </div>
          </div>
        </section>

        {/* ── Notification ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Notification
          </h2>
          <div style={{ borderRadius: 'var(--radius-12)', overflow: 'hidden', border: '1px solid var(--line-normal)' }}>
            <Notification
              variant="unread"
              title="송금 요청이 도착했어요"
              body="김지훈님이 15,000원 송금을 요청했어요"
            />
            <Notification
              variant="read"
              title="모임 장소가 확정됐어요"
              body="홍대 삼겹살 마당으로 장소가 확정됐어요"
            />
          </div>
        </section>

        {/* ── Tipbox ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Tipbox
          </h2>
          <Tipbox variant="normal">
            초대 링크를 공유하면 게스트도 참여할 수 있어요
          </Tipbox>
          <Tipbox variant="completed-vote">
            투표가 완료됐어요! 주최자가 장소를 확정할 예정이에요
          </Tipbox>
          <Tipbox variant="completed-title" title="정산 완료">
            모든 참여자의 송금이 확인됐어요
          </Tipbox>
        </section>

        {/* ── Step ── */}
        <section className="space-y-4">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Step
          </h2>
          <Step steps={['장소 선택', '투표', '예약', '정산']} current={0} />
          <Step steps={['장소 선택', '투표', '예약', '정산']} current={2} />
          <Step steps={['장소 선택', '투표', '예약', '정산']} current={4} />
        </section>

        {/* ── BottomSheet ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            BottomSheet
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBsOpen('background')}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius-8)', border: '1px solid var(--line-normal)', font: '400 14px var(--font-sans)', cursor: 'pointer' }}
            >
              background
            </button>
            <button
              onClick={() => setBsOpen('non-background')}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius-8)', border: '1px solid var(--line-normal)', font: '400 14px var(--font-sans)', cursor: 'pointer' }}
            >
              non-background
            </button>
            <button
              onClick={() => setBsOpen('solo')}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius-8)', border: '1px solid var(--line-normal)', font: '400 14px var(--font-sans)', cursor: 'pointer' }}
            >
              solo
            </button>
          </div>
        </section>

        <BottomSheet
          open={bsOpen === 'background'}
          onClose={() => setBsOpen(null)}
          variant="background"
          title="정산 방식 선택"
        >
          <RadioGroup
            options={[
              { value: 'ITEM_BASED', label: '항목별 정산' },
              { value: 'EQUAL', label: '1/N 균등 정산' },
            ]}
            value="ITEM_BASED"
            onChange={() => {}}
          />
        </BottomSheet>

        <BottomSheet
          open={bsOpen === 'non-background'}
          onClose={() => setBsOpen(null)}
          variant="non-background"
          title="옵션 선택"
        >
          <p style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--label-normal)' }}>
            non-background 바텀시트 콘텐츠
          </p>
        </BottomSheet>

        <BottomSheet
          open={bsOpen === 'solo'}
          onClose={() => setBsOpen(null)}
          variant="solo"
        >
          <p style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--label-normal)', marginBottom: 16 }}>
            닉네임을 입력해주세요
          </p>
        </BottomSheet>

        {/* ── Button (얌피 전용) ── */}
        <section className="space-y-4">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Button (얌피 전용)
          </h2>
          {/* 브랜드 버튼 */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">브랜드</p>
            <KakaoLoginButton />
            <KakaoPayButton />
            <TossPayButton />
          </div>
          {/* Radius 계열 */}
          <div className="space-y-2">
            <p className="text-caption1 text-[var(--label-assistive)]">Radius</p>
            <div className="flex flex-wrap gap-2">
              <RadiusButton variant="radius">태그</RadiusButton>
              <RadiusButton variant="radius-border">독촉</RadiusButton>
              <RadiusButton variant="radius-border-colored">완료 확인</RadiusButton>
              <RadiusButton variant="radius-border-inactive">비활성</RadiusButton>
            </div>
          </div>
        </section>

        {/* ── Badge ── */}
        <section className="space-y-3">
          <h2 className="text-label1 font-semibold text-[var(--label-alternative)] uppercase tracking-wide">
            Badge
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="black">한식</Badge>
            <Badge variant="green">good</Badge>
            <Badge variant="red">오류</Badge>
            <Badge variant="yellow">투표 중</Badge>
            <Badge variant="guest">게스트</Badge>
            <Badge variant="unpaid">미송금</Badge>
            <Badge variant="reservable">예약가능</Badge>
            <Badge variant="icon-red" icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-negative)', display: 'inline-block' }} />}>
              미송금
            </Badge>
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
