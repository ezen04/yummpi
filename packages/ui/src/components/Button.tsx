import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib';

const button = cva(
  'inline-flex items-center justify-center rounded-card font-medium transition active:scale-95 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
        danger: 'bg-danger text-white',
      },
      size: { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4', lg: 'h-14 px-6 text-lg' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
