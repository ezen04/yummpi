import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1 font-semibold',
    'transition-[filter,background-color,color] duration-100',
    'active:[filter:brightness(0.93)]',
    'disabled:cursor-default disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
  ].join(' '),
  {
    variants: {
      variant: {
        basic:
          'bg-[var(--primary)] text-[var(--static-white)] border-none hover:bg-[var(--primary-strong)]',
        assistive:
          'bg-[var(--fill-normal)] text-[var(--label-neutral)] border-none hover:bg-[var(--fill-strong)]',
        outline:
          'bg-transparent text-[var(--label-normal)] border border-[var(--line-normal)] hover:border-[var(--tinted)]',
        link: 'bg-transparent text-[var(--primary)] border-none underline-offset-2 hover:underline',
        disabled:
          'bg-[var(--fill-disable)] text-[var(--label-disable)] border-none',
        destructive:
          'bg-[var(--status-negative)] text-[var(--static-white)] border-none',
        radius: 'rounded-full text-xs px-3 hover:border',
      },
      size: {
        lg: 'h-12 px-7 text-base [border-radius:var(--radius-12)]',
        md: 'h-10 px-5 text-[15px] [border-radius:var(--radius-10)]',
        sm: 'h-8 px-3.5 text-[13px] [border-radius:var(--radius-8)]',
      },
    },
    defaultVariants: {
      variant: 'basic',
      size: 'lg',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, leftIcon, disabled, children, ...props },
    ref
  ) => {
    const resolvedVariant = disabled ? 'disabled' : variant;

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: resolvedVariant, size }),
          className
        )}
        {...props}
      >
        {leftIcon && (
          <span
            className={cn(
              'flex-shrink-0',
              size === 'lg' && '[&>svg]:size-5',
              size === 'md' && '[&>svg]:size-[18px]',
              (size === 'sm' || !size) && '[&>svg]:size-4'
            )}
          >
            {leftIcon}
          </span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
