import { Check } from '@yummpi/ui';

// 게스트/회원 기능 비교표 (랜딩 — Figma "얌피 시작하기" #5).
// 게스트는 링크 기반 참여 기능만, 회원은 전체. 전환 유도 목적의 정적 표.

type Row = { label: string; guest: boolean; member: boolean };

const ROWS: Row[] = [
  { label: '장소 투표 · 후보 추가', guest: true, member: true },
  { label: '소비 항목 선택', guest: true, member: true },
  { label: '송금 완료 알림', guest: true, member: true },
  { label: '모임 생성 · 장소 확정', guest: false, member: true },
  { label: '예약 · 정산 관리', guest: false, member: true },
  { label: '대시보드 · 마이페이지', guest: false, member: true },
];

function Mark({ on, color }: { on: boolean; color: string }) {
  if (!on) {
    return (
      <span className="text-[15px]" style={{ color: 'var(--label-disable)' }}>
        –
      </span>
    );
  }
  return (
    <span style={{ color }}>
      <Check size={18} strokeWidth={2.5} />
    </span>
  );
}

const GRID = 'grid grid-cols-[1fr_3.5rem_3.5rem] items-center px-4 py-3';

export function GuestMemberCompare() {
  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      style={{
        background: 'var(--bg-normal)',
        border: '1px solid var(--line-normal)',
      }}
    >
      <div
        className={GRID}
        style={{ borderBottom: '1px solid var(--line-alternative)' }}
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--label-alternative)' }}
        >
          기능
        </span>
        <span
          className="text-center text-[13px] font-medium"
          style={{ color: 'var(--label-alternative)' }}
        >
          게스트
        </span>
        <span
          className="text-center text-[13px] font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          회원
        </span>
      </div>

      {ROWS.map((r, i) => (
        <div
          key={r.label}
          className={GRID}
          style={
            i < ROWS.length - 1
              ? { borderBottom: '1px solid var(--line-alternative)' }
              : undefined
          }
        >
          <span
            className="text-[14px]"
            style={{ color: 'var(--label-normal)' }}
          >
            {r.label}
          </span>
          <span className="flex justify-center">
            <Mark on={r.guest} color="var(--status-positive)" />
          </span>
          <span className="flex justify-center">
            <Mark on={r.member} color="var(--primary)" />
          </span>
        </div>
      ))}
    </div>
  );
}
