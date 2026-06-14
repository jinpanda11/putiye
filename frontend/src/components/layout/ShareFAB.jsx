import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function ShareFAB() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (location.pathname.startsWith('/admin') || location.pathname === '/dy' || location.pathname.startsWith('/meditation')) return null;

  if (open) {
    return (
      <div className="fixed right-3 z-40 bottom-[calc(env(safe-area-inset-bottom)+150px)] md:bottom-4 md:right-4">
        <div className="rounded-2xl border border-gold/30 bg-xuan-card/95 p-4 backdrop-blur-md shadow-xl w-64">
          <p className="text-sm text-gold font-display mb-2">分享菩提苑</p>
          <p className="text-xs text-paper-dark/70 leading-relaxed">一念慈悲，福报自来。<br />分享给有缘人，功德无量。</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }} type="button" className="flex-1 rounded-lg border border-gold/30 px-3 py-2 text-xs text-gold hover:bg-gold/10">
              复制链接
            </button>
            <button onClick={() => setOpen(false)} type="button" className="rounded-lg border border-gold/30 px-3 py-2 text-xs text-paper-dark hover:bg-gold/10">
              关闭
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-[-1]" aria-label="关闭" />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setOpen(true)} className="fixed right-3 z-40 flex size-12 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-gold/30 to-vermillion/20 text-gold shadow-lg shadow-gold/20 backdrop-blur-md hover:from-gold/40 hover:to-vermillion/30 md:right-4 md:size-14 bottom-[calc(env(safe-area-inset-bottom)+150px)] md:bottom-4" aria-label="分享菩提苑" title="分享传播 · 功德倍增">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:size-6"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
    </button>
  );
}
