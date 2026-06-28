'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useHostAccountStore } from '../../stores/useHostAccountStore';
import { RegisterAccountBottomSheet } from '../transfer/RegisterAccountBottomSheet';

// 호스트가 '받을 계좌'를 등록/표시하는 섹션 (호스트 뷰 상단).
// 계좌 값은 useHostAccountStore(sessionStorage)에만 있고 DB·API로 전송하지 않는다.
export function HostAccountSection() {
  const account = useHostAccountStore((s) => s.account);
  const setAccount = useHostAccountStore((s) => s.setAccount);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className="px-5 pt-4">
      {account ? (
        <div className="rounded-[14px] border border-[var(--line-alternative)] bg-[var(--bg-normal)] shadow-[var(--shadow-small)] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
            <Icon name="wallet" size={20} color="var(--primary)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--label-alternative)]">받을 계좌</p>
            <p className="text-sm font-semibold text-[var(--label-strong)] truncate">
              {account.bank} {account.accountNumber}
            </p>
            <p className="text-xs text-[var(--label-alternative)] truncate">
              예금주 {account.accountHolder}
            </p>
          </div>
          <Button
            variant="assistive"
            size="sm"
            onClick={() => setSheetOpen(true)}
            className="shrink-0"
          >
            수정
          </Button>
        </div>
      ) : (
        <div className="rounded-[14px] border border-dashed border-[var(--line-neutral)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-tint)] flex items-center justify-center shrink-0">
            <Icon name="wallet" size={20} color="var(--primary)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--label-strong)]">
              받을 계좌를 등록해주세요
            </p>
            <p className="text-xs text-[var(--label-alternative)]">
              멤버에게 보여줄 입금 계좌예요
            </p>
          </div>
          <Button
            variant="basic"
            size="sm"
            onClick={() => setSheetOpen(true)}
            leftIcon={
              <Icon name="plus" size={16} color="var(--static-white)" />
            }
            className="shrink-0"
          >
            등록
          </Button>
        </div>
      )}

      <RegisterAccountBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(data) => {
          setAccount(data);
          setSheetOpen(false);
        }}
      />
    </section>
  );
}
