'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@yummpi/ui';
import { Input } from '@/components/common/Input';

/**
 * 초대 코드 직접 입력 화면 (결정#2, 2026-06-21).
 * 랜딩 "초대 링크로 입장하기" → 이 화면 → 코드 입력 → /join/{code}.
 * 코드 유효성(미존재·만료 등)은 /join/[inviteCode]에서 처리하므로 여기선 비어있지만 않으면 이동.
 */
export default function JoinCodeEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/join/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main
      className="min-h-screen flex flex-col justify-between px-6 py-12"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="space-y-2 text-center">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--label-normal)' }}
          >
            초대 코드 입력
          </h1>
          <p style={{ color: 'var(--label-alternative)' }}>
            받은 초대 코드를 입력하면 모임에 입장할 수 있어요.
          </p>
        </div>

        <Input
          label="초대 코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="예: ABCD1234"
          autoFocus
        />
      </div>

      <Button className="w-full" onClick={submit} disabled={!code.trim()}>
        입장하기
      </Button>
    </main>
  );
}
