'use client';

import { useEffect, useState } from 'react';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function useAppInstalled(): boolean {
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = () => setInstalled(isStandalone());
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return installed;
}
