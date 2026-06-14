import { cn } from '../utils';

export function Button({ variant = 'gold', loading, children, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-fast cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    gold: 'bg-vermillion text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light tracking-wider',
    outline: 'border border-gold/30 text-gold hover:bg-gold/10',
    ghost: 'text-paper-dark hover:text-gold hover:bg-xuan-hover',
  };
  return (
    <button className={cn(base, variants[variant], loading && 'animate-pulse', className)} disabled={loading || props.disabled} {...props}>
      {loading && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
}
