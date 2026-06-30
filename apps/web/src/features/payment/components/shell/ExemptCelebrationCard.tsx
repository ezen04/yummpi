'use client';

import { formatAmount } from '../../utils/transferMock';

type Props = {
  displayName: string;
  amount: number;
  /** 제공되면 카드 하단에 "송금 현황 보러가기" 텍스트 버튼을 노출(회원용). 게스트는 미제공. */
  onViewStatus?: () => void;
};

/**
 * 면제(EXEMPT) 축하 카드. 게스트는 /transfer EXEMPT 분기에서, 회원은 /payments에서
 * 송금 현황을 펼치기 전에 본다. 컨페티 없이 카드만 풍성하게(축하 위계는 PAID·완료 화면 이하 유지).
 */
export function ExemptCelebrationCard({
  displayName,
  amount,
  onViewStatus,
}: Props) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-5 pb-10 gap-7">
      {/* 큰 선물 아이콘 */}
      <div className="w-24 h-24 rounded-full bg-[var(--primary)]/12 flex items-center justify-center text-[44px]">
        🎁
      </div>

      {/* 타이틀 + 따뜻한 카피 */}
      <div className="text-center flex flex-col gap-2.5">
        <p className="text-[22px] font-bold text-[var(--label-strong)] tracking-[-0.3px]">
          이번 모임은 무료예요!
        </p>
        <p className="text-sm text-[var(--label-alternative)] leading-relaxed">
          {displayName}님은 이번 정산에서 면제됐어요.
          <br />
          오늘은 마음 편히 쉬어가세요 😊
        </p>
      </div>

      {/* 면제 금액 디테일 (0원이면 생략) */}
      {amount > 0 && (
        <div className="w-full rounded-[var(--radius-16)] bg-[var(--bg-alternative)] px-5 py-[18px] flex items-center justify-between">
          <span className="text-sm text-[var(--label-alternative)]">
            면제된 금액
          </span>
          <span className="text-base font-bold text-[var(--label-strong)] [font-variant-numeric:tabular-nums]">
            {formatAmount(amount)}
          </span>
        </div>
      )}

      {/* 회원: 송금 현황 펼치기 (이동 없이 같은 페이지에서 전환) */}
      {onViewStatus && (
        <button
          type="button"
          onClick={onViewStatus}
          className="text-sm font-medium text-[var(--label-alternative)] underline underline-offset-4 decoration-[var(--line-normal)]"
        >
          송금 현황 보러가기
        </button>
      )}
    </div>
  );
}
