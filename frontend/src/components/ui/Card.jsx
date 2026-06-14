import { cn } from '../utils';

export function Card({ children, className, glow, ...props }) {
  return (
    <div className={cn(
      'rounded-xl border border-gold/20 bg-xuan-card/95 p-4 backdrop-blur-sm',
      glow && 'hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all duration-fast',
      className
    )} {...props}>
      {children}
    </div>
  );
}
