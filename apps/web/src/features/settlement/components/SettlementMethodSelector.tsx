'use client';

import { useRouter } from 'next/navigation';
import { Button, YIcon, Camera, Pencil, Receipt, ChevronRight } from '@yummpi/ui';

interface Method {
  key: string;
  label: string;
  description: string;
  Icon: typeof Camera;
}

const METHODS: Method[] = [
  {
    key: 'receipt',
    label: '영수증 등록',
    description: '영수증 사진을 촬영하거나 선택해 자동으로 정산해요',
    Icon: Camera,
  },
  {
    key: 'manual',
    label: '직접 입력',
    description: '직접 금액과 항목명을 입력해 정산해요',
    Icon: Pencil,
  },
  {
    key: 'equal',
    label: '전체 금액 입력',
    description: '전체 금액을 입력해 인원대로 나눠요',
    Icon: Receipt,
  },
];

interface Props {
  meetingId: string;
}

export function SettlementMethodSelector({ meetingId }: Props) {
  const router = useRouter();

  return (
    <ul className="flex flex-col" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
      {METHODS.map((method) => (
        <li key={method.key} style={{ borderBottom: '1px solid var(--line-alternative)' }}>
          <Button
            variant="outline"
            className="w-full h-auto py-4 justify-start gap-4 border-none rounded-none"
            onClick={() => router.push(`/meetings/${meetingId}/settlement/new/${method.key}`)}
            leftIcon={
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-12)',
                  background: 'rgba(233, 75, 53, 0.08)',
                  color: 'var(--primary)',
                }}
              >
                <YIcon icon={method.Icon} size={24} />
              </span>
            }
          >
            <span className="flex flex-col items-start gap-0.5 flex-1">
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--label-normal)' }}>
                {method.label}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 400,
                  color: 'var(--label-alternative)',
                  lineHeight: 1.5,
                }}
              >
                {method.description}
              </span>
            </span>
            <YIcon
              icon={ChevronRight}
              size={20}
              style={{ color: 'var(--label-assistive)', flexShrink: 0 }}
            />
          </Button>
        </li>
      ))}
    </ul>
  );
}
