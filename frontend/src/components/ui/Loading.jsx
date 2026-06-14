import { cn } from '../utils';

export function Loading({ text = '加载中...', className }) {
  return (
    <div className={cn('flex h-[60vh] items-center justify-center text-paper-dark/65', className)}>
      <div className="flex flex-col items-center gap-3">
        <span className="size-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  );
}
