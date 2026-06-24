'use client';

import { signOut } from 'next-auth/react';
import { LogOut, Button } from '@yummpi/ui';

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      leftIcon={<LogOut size={18} strokeWidth={1.5} />}
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      로그아웃
    </Button>
  );
}
