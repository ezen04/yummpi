'use client';

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[var(--bg-normal)] group-[.toaster]:text-[var(--label-normal)] group-[.toaster]:border group-[.toaster]:border-[var(--line-normal)] group-[.toaster]:shadow-[var(--shadow-medium)]',
          description: 'group-[.toast]:text-[var(--label-alternative)]',
          actionButton:
            'group-[.toast]:bg-[var(--primary)] group-[.toast]:text-[var(--static-white)]',
          cancelButton:
            'group-[.toast]:bg-[var(--fill-normal)] group-[.toast]:text-[var(--label-alternative)]',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
