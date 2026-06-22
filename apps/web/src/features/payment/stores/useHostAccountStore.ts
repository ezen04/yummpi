import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// MOCK ONLY — 계좌번호/은행명/예금주는 DB·API에 저장하지 않는다(CLAUDE.md 송금 Mock UX).
// sessionStorage(탭 종료 시 소멸)만 사용한다. localStorage는 PWA 잔존성·XSS 노출 위험으로 금지.
export type HostAccountMock = {
  bank: string;
  accountNumber: string;
  accountHolder: string;
};

type HostAccountState = {
  account: HostAccountMock | null;
  setAccount: (account: HostAccountMock) => void;
  clearAccount: () => void;
};

export const useHostAccountStore = create<HostAccountState>()(
  persist(
    (set) => ({
      account: null,
      setAccount: (account) => set({ account }),
      clearAccount: () => set({ account: null }),
    }),
    {
      name: 'yummpi-host-account-mock',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
