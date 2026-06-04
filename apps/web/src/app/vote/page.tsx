'use client';
// ───────── OWNER: ③ 실시간·투표 ─────────
// F3 실시간 투표 화면. getSocket() + SOCKET_EVENTS(@gatherflow/shared)로 전원 동기화.
import { useEffect } from 'react';
import { Card } from '@gatherflow/ui';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@gatherflow/shared';

export default function VotePage() {
  useEffect(() => {
    const s = getSocket();
    s.connect();
    s.on(SOCKET_EVENTS.TALLY, () => {
      // TODO(③): 집계 반영
    });
    return () => void s.disconnect();
  }, []);

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-bold">실시간 투표</h1>
      <Card>
        <p className="text-sm text-gray-400">투표·실시간 동기화 (③)</p>
      </Card>
    </div>
  );
}
