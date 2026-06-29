'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { YAvatar } from '@/components/common/YAvatar';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Confirmbox } from '@/components/common/Confirmbox';
import { cn } from '@/lib/utils';
import { kickMember, transferHost, isMeetingApiError } from '../api/meetingApi';

export interface MemberRow {
  id: string;
  nickname: string;
  isHost: boolean;
  isGuest: boolean;
}

interface Props {
  meetingId: string;
  title: string;
  members: MemberRow[];
  meId: string | null;
  isHost: boolean;
}

type Dialog =
  | { type: 'sheet'; member: MemberRow }
  | { type: 'transfer'; member: MemberRow }
  | { type: 'kick'; member: MemberRow }
  | null;

export function MembersView({
  meetingId,
  title,
  members,
  meId,
  isHost,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, setPending] = useState(false);

  const close = () => setDialog(null);

  const doTransfer = async (m: MemberRow) => {
    setPending(true);
    try {
      await transferHost(meetingId, m.id);
      toast.success(`${m.nickname}님에게 방장을 위임했어요.`);
      close();
      router.refresh();
    } catch (e) {
      toast.error(isMeetingApiError(e) ? e.message : '위임에 실패했어요.');
    } finally {
      setPending(false);
    }
  };

  const doKick = async (m: MemberRow) => {
    setPending(true);
    try {
      await kickMember(meetingId, m.id);
      toast.success(`${m.nickname}님을 내보냈어요.`);
      close();
      router.refresh();
    } catch (e) {
      toast.error(isMeetingApiError(e) ? e.message : '내보내기에 실패했어요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-alternative)]">
      <Header
        title={title}
        subtitle={`모임 참여자 ${members.length}명`}
        onBack={() => router.back()}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <p className="text-[14px] text-[var(--label-alternative)]">
          {title}의 참여자에요.
        </p>

        <ul className="flex flex-col gap-2">
          {members.map((m) => {
            const isMe = m.id === meId;
            // 호스트만 + 본인 아님 + 호스트 대상 아님 → 액션 가능(읽기 외)
            const canAct = isHost && !isMe && !m.isHost;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={!canAct}
                  onClick={() =>
                    canAct && setDialog({ type: 'sheet', member: m })
                  }
                  className={cn(
                    'w-full flex items-center gap-3 rounded-[var(--radius-12)] bg-[var(--bg-normal)] px-4 py-3 text-left',
                    isMe
                      ? 'border border-[var(--primary)]'
                      : 'border border-transparent',
                    canAct ? 'cursor-pointer' : 'cursor-default'
                  )}
                >
                  <YAvatar
                    variant={m.isHost ? 'host' : 'guest'}
                    name={m.nickname}
                    size={40}
                  />
                  <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-[var(--label-normal)]">
                    {m.nickname}
                  </span>
                  {m.isHost ? (
                    <RoleBadge label="주최자" tone="primary" />
                  ) : m.isGuest ? (
                    <RoleBadge label="게스트" tone="neutral" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 호스트 액션 시트 */}
      {dialog?.type === 'sheet' && (
        <BottomSheet open onClose={close} variant="background">
          <div className="flex flex-col px-2 pb-2">
            <p className="px-4 py-3 text-[14px] text-[var(--label-alternative)]">
              {dialog.member.nickname}님의 상태를 변경할 수 있어요.
            </p>
            {!dialog.member.isGuest && (
              <button
                type="button"
                onClick={() =>
                  setDialog({ type: 'transfer', member: dialog.member })
                }
                className="flex items-center gap-3 rounded-[var(--radius-12)] border-none bg-transparent px-4 py-3.5 text-left text-[16px] text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
              >
                권한 위임
              </button>
            )}
            <button
              type="button"
              onClick={() => setDialog({ type: 'kick', member: dialog.member })}
              className="flex items-center gap-3 rounded-[var(--radius-12)] border-none bg-transparent px-4 py-3.5 text-left text-[16px] text-[var(--status-negative)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
            >
              강제 탈퇴
            </button>
          </div>
        </BottomSheet>
      )}

      {dialog?.type === 'transfer' && (
        <Confirmbox
          open
          onClose={close}
          onConfirm={() => doTransfer(dialog.member)}
          title={`${dialog.member.nickname}에게 방장을 위임하시겠습니까?`}
          body="위임하면 본인은 일반 참여자가 됩니다."
          confirmLabel={pending ? '위임 중…' : '위임하기'}
        />
      )}

      {dialog?.type === 'kick' && (
        <Confirmbox
          open
          onClose={close}
          onConfirm={() => doKick(dialog.member)}
          title={`${dialog.member.nickname}님을 내보낼까요?`}
          body="내보내면 이 모임에서 제외됩니다."
          confirmLabel={pending ? '처리 중…' : '강제 탈퇴'}
        />
      )}
    </div>
  );
}

function RoleBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'primary' | 'neutral';
}) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={
        tone === 'primary'
          ? { background: 'var(--primary-tint)', color: 'var(--primary)' }
          : {
              background: 'var(--fill-normal)',
              color: 'var(--label-alternative)',
            }
      }
    >
      {label}
    </span>
  );
}
