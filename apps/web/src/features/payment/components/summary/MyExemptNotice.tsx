'use client';

type Props = {
  displayName: string;
};

export function MyExemptNotice({ displayName }: Props) {
  return (
    <div className="mx-5 mt-2 rounded-[var(--radius-12)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[var(--fill-normal)] flex items-center justify-center text-xl shrink-0">
        🎁
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-[var(--label-strong)]">
          면제 처리됐어요
        </p>
        <p className="text-xs text-[var(--label-alternative)]">
          {displayName}님은 이번 정산에서 제외됐어요
        </p>
      </div>
    </div>
  );
}
