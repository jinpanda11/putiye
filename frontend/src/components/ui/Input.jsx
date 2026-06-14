import { forwardRef } from 'react';
import { cn } from '../utils';

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-md border border-gold/20 bg-xuan-surface px-3 text-base text-paper-dark placeholder:text-ink-muted transition-all duration-fast focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
