import type { HTMLAttributes } from 'react';
import { cn } from '../lib';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-card bg-white p-4 shadow-sm', className)} {...props} />
  );
}
