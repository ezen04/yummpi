'use client';

import { Check, Clock } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { MOCK_MEMBERS, MOCK_REMAINING } from '../optimalPreviewMock';

// 화면⑤ 다른 게스트의 역을 입력받고 있어요 (타이머 + 멤버목록) (Figma 755-4323)

const pad = (n: number) => String(n).padStart(2, '0');

export function WaitingInputScreen() {
  const { h, m, s } = MOCK_REMAINING;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={() => {}} onClose={() => {}} />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 flex flex-col">
        <h1 className="text-center text-[20px] font-bold leading-[28px] text-[var(--label-normal)]">
          다른 게스트의 역을
          <br />
          입력받고 있어요
        </h1>
        <p className="text-center text-[13px] text-[var(--label-alternative)] mt-3">
          입력 마감까지 남은 시간
        </p>
        <p className="text-center text-[32px] font-bold tabular-nums tracking-[0.04em] text-[var(--label-normal)] mt-1 mb-6">
          {pad(h)} : {pad(m)} : {pad(s)}
        </p>

        <ul className="flex flex-col">
          {MOCK_MEMBERS.map((mem) => {
            const done = !!mem.station;
            return (
              <li key={mem.memberId} className="flex items-center gap-3 py-2.5">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-full text-[13px] font-semibold shrink-0"
                  style={{
                    backgroundColor: mem.avatarBg,
                    color: mem.avatarText,
                  }}
                >
                  {mem.nickname.slice(0, 1)}
                </span>
                <span className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[15px] text-[var(--label-normal)] truncate">
                    {mem.nickname}
                  </span>
                  {mem.isGuest && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--fill-normal)] text-[var(--label-assistive)] shrink-0">
                      게스트
                    </span>
                  )}
                </span>
                {done ? (
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="text-[14px] text-[var(--label-normal)]">
                      {mem.station}
                    </span>
                    <Check
                      size={16}
                      className="text-[var(--status-positive)]"
                    />
                  </span>
                ) : (
                  <span className="flex items-center gap-1 shrink-0 text-[var(--label-assistive)]">
                    <span className="text-[14px]">입력대기</span>
                    <Clock size={15} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-center text-[12px] text-[var(--label-assistive)] mt-auto pt-6 pb-2">
          모두가 입력을 마치면 자동으로 중간지점 찾기를 시작합니다
        </p>
      </div>
    </div>
  );
}
