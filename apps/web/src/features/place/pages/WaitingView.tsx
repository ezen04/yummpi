'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import {
  useDepartureStatus,
  useWaitDeadline,
} from '../hooks/useDepartureStatus';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 실제 라우트용 — 출발역 입력 대기 화면.
 * 멤버 입력 현황(재진입 시 갱신) + 마감시각 기반 카운트다운.
 * 전원 입력 or 마감 도달 → 결과(optimal)로 자동 이동. 수동 "결과 보기"도 제공.
 */
export function WaitingView({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const { data: status } = useDepartureStatus(meetingId);
  const { data: deadlineIso } = useWaitDeadline(meetingId);

  const deadlineMs = deadlineIso ? new Date(deadlineIso).getTime() : null;

  // 1초마다 now만 갱신하고, 남은시간은 deadline-now로 파생 (재진입해도 정확)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining =
    deadlineMs == null
      ? null
      : Math.max(0, Math.round((deadlineMs - now) / 1000));

  // 전원 입력 or 마감 도달 → 결과로
  const expired = deadlineMs != null && remaining === 0;
  const done = !!status?.allInput || expired;
  useEffect(() => {
    if (done) router.replace(`/meetings/${meetingId}/place/optimal`);
  }, [done, meetingId, router]);

  const h = remaining != null ? Math.floor(remaining / 3600) : 0;
  const m = remaining != null ? Math.floor((remaining % 3600) / 60) : 0;
  const s = remaining != null ? remaining % 60 : 0;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={() => router.back()} onClose={() => router.back()} />

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
          {remaining != null
            ? `${pad(h)} : ${pad(m)} : ${pad(s)}`
            : '— : — : —'}
        </p>

        <ul className="flex flex-col">
          {(status?.members ?? []).map((mem) => (
            <li key={mem.memberId} className="flex items-center gap-3 py-2.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--fill-normal)] text-[13px] font-semibold text-[var(--label-normal)] shrink-0">
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
              {mem.hasInput ? (
                <span className="flex items-center gap-1 shrink-0">
                  <span className="text-[14px] text-[var(--label-normal)]">
                    {mem.station ?? '입력 완료'}
                  </span>
                  <Check size={16} className="text-[var(--status-positive)]" />
                </span>
              ) : (
                <span className="flex items-center gap-1 shrink-0 text-[var(--label-assistive)]">
                  <span className="text-[14px]">입력대기</span>
                  <Clock size={15} />
                </span>
              )}
            </li>
          ))}
        </ul>

        <p className="text-center text-[12px] text-[var(--label-assistive)] mt-auto pt-6 pb-2">
          모두 입력하거나 마감되면 자동으로 중간지점 찾기를 시작합니다
          {status ? ` (${status.inputCount}/${status.total} 입력)` : ''}
        </p>
      </div>

      <div className="px-5 pt-3 pb-5 border-t border-[var(--line-alternative)]">
        <Button
          variant="basic"
          size="lg"
          className="w-full"
          onClick={() => router.push(`/meetings/${meetingId}/place/optimal`)}
        >
          지금 결과 보기
        </Button>
      </div>
    </div>
  );
}
