'use client';

import { useEffect, useState } from 'react';

function readPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export function usePushPermission(): boolean {
  const [permission, setPermission] = useState(readPermission);

  // Notification.permission은 변화 이벤트를 제공하지 않아서 visibility 변화 시 재점검한다.
  useEffect(() => {
    const handler = () => setPermission(readPermission());
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return permission === 'granted';
}
