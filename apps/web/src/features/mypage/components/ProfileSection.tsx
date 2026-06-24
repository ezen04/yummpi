'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Pencil, Button } from '@yummpi/ui';
import { getMyProfile, patchNickname } from '../api';

const PROFILE_KEY = ['mypage', 'profile'] as const;

export function ProfileSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: getMyProfile,
    staleTime: 60_000,
  });

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: patchNickname,
    onSuccess: () => {
      // 마이페이지 프로필 + 알림설정(⑤ ['user','me']) + 대시보드 인사(['me']) 동기화
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : '닉네임 변경에 실패했어요.'
      );
    },
  });

  function startEdit() {
    setValue(data?.nickname ?? '');
    setError(null);
    setEditing(true);
  }

  function submit() {
    const next = value.trim();
    if (next.length < 1 || next.length > 20) {
      setError('닉네임은 1~20자로 입력해주세요.');
      return;
    }
    if (next === (data?.nickname ?? '')) {
      setEditing(false);
      return;
    }
    setError(null);
    mutation.mutate(next);
  }

  if (isLoading || !data) {
    return (
      <div className="bg-[var(--bg-normal)] rounded-2xl px-4 py-5 h-[92px] animate-pulse" />
    );
  }

  return (
    <div className="bg-[var(--bg-normal)] rounded-2xl px-4 py-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[var(--fill-normal)] flex items-center justify-center overflow-hidden shrink-0 text-[var(--label-alternative)]">
          {data.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={28} strokeWidth={1.5} />
          )}
        </div>

        {editing ? (
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={20}
              autoFocus
              placeholder="닉네임"
              className="w-full h-10 px-3 rounded-[var(--radius-8)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[15px] text-[var(--label-normal)] outline-none focus:border-[var(--primary)]"
            />
            {error && (
              <p className="text-[13px] text-[var(--status-negative)]">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-semibold text-[var(--label-normal)] truncate">
              {data.nickname ?? '닉네임 없음'}
            </p>
            {data.email && (
              <p className="text-[13px] text-[var(--label-alternative)] truncate">
                {data.email}
              </p>
            )}
          </div>
        )}

        {!editing && (
          <button
            onClick={startEdit}
            aria-label="닉네임 수정"
            className="flex items-center justify-center w-9 h-9 shrink-0 rounded-[var(--radius-full)] bg-transparent border-none cursor-pointer text-[var(--label-alternative)] transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]"
          >
            <Pencil size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {editing && (
        <div className="flex gap-2">
          <Button
            variant="assistive"
            size="sm"
            className="flex-1"
            disabled={mutation.isPending}
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
          >
            취소
          </Button>
          <Button
            variant="basic"
            size="sm"
            className="flex-1"
            disabled={mutation.isPending}
            onClick={submit}
          >
            저장
          </Button>
        </div>
      )}
    </div>
  );
}
