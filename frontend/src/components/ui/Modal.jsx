import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent('putiyuan:modal-open'));
    return () => window.dispatchEvent(new CustomEvent('putiyuan:modal-close'));
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-xuan/95 px-3 backdrop-blur-sm pb-[calc(env(safe-area-inset-bottom)+90px)] md:pb-4" onClick={onClose}>
      <div className="relative w-full max-w-md max-h-full overflow-y-auto rounded-2xl border border-gold/30 bg-xuan-card p-5 shadow-2xl sm:p-6" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-paper-dark/60 hover:bg-gold/10 hover:text-gold" aria-label="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        {title && <h2 className="font-display text-2xl text-gold text-center mb-4">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
}
