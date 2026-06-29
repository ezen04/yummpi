'use client';

import { BottomSheet } from '@/components/common/BottomSheet';
import { Icon } from '@/components/common/Icon';
import { IconButton } from '@/components/common/IconButton';
import type { PaymentListItem, PaymentAction } from '@yummpi/schemas';

type SecondaryAction = {
  label: string;
  action: PaymentAction;
  /** 되돌리기/취소 계열은 약한 강조 색으로 표시 */
  muted?: boolean;
};

/**
 * 호스트 보조 액션(더보기) 목록. 주 액션(완료확인·독촉)은 행에 인라인으로 남고,
 * 되돌리기·면제취소·면제처럼 빈도 낮은 정정 액션만 여기로 모은다.
 * 서버 can* 플래그를 신뢰하되 상태별로 라벨을 구분한다.
 */
export function getSecondaryActions(item: PaymentListItem): SecondaryAction[] {
  const actions: SecondaryAction[] = [];
  if (item.status === 'PAID' && item.canMarkPending) {
    actions.push({
      label: '결제 완료 취소',
      action: 'MARK_PENDING',
      muted: true,
    });
  }
  if (item.status === 'EXEMPT' && item.canMarkPending) {
    actions.push({ label: '면제 취소', action: 'MARK_PENDING', muted: true });
  }
  if (item.status === 'PENDING' && item.canMarkExempt) {
    actions.push({ label: '면제 처리', action: 'MARK_EXEMPT' });
  }
  return actions;
}

type Props = {
  open: boolean;
  onClose: () => void;
  item: PaymentListItem;
  onAction: (paymentId: string, action: PaymentAction) => void;
};

export function PaymentMemberActionSheet({
  open,
  onClose,
  item,
  onAction,
}: Props) {
  const actions = getSecondaryActions(item);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      className="mx-auto w-full max-w-[390px] px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]"
    >
      <div className="relative">
        <div className="absolute -top-1 right-0">
          <IconButton
            onClick={onClose}
            size={32}
            icon={<Icon name="x" size={20} color="var(--label-alternative)" />}
          />
        </div>

        <p className="mtg-headline1 is-bold text-[var(--label-strong)] text-center mb-1">
          {item.displayName}님
        </p>
        <p className="text-xs text-[var(--label-alternative)] text-center mb-5">
          처리할 항목을 선택해 주세요
        </p>

        <div className="flex flex-col gap-2">
          {actions.map((a) => (
            <button
              key={`${a.action}-${a.label}`}
              onClick={() => {
                onAction(item.paymentId, a.action);
                onClose();
              }}
              className={`w-full h-[52px] rounded-[var(--radius-12)] border border-[var(--line-normal)] text-[15px] font-medium ${
                a.muted
                  ? 'text-[var(--label-alternative)]'
                  : 'text-[var(--label-strong)]'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
