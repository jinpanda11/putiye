import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils';

const items = [
  { href: '/', label: '首页', icon: 'home' },
  { href: '/qifu', label: '祈福', icon: 'flame' },
  { href: '/almanac', label: '黄历', icon: 'calendar' },
  { href: '/lottery', label: '灵签', icon: 'scroll' },
  { href: '/profile', label: '我的', icon: 'user' },
  { href: '/more', label: '更多', icon: 'more' },
];

function Icon({ name }) {
  const props = { className: 'size-5', xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return (<svg {...props}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>);
    case 'flame': return (<svg {...props}><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>);
    case 'calendar': return (<svg {...props}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>);
    case 'scroll': return (<svg {...props}><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>);
    case 'user': return (<svg {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
    case 'more': return (<svg {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>);
    default: return null;
  }
}

export function BottomBar() {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const open = () => setModalOpen(true);
    const close = () => setModalOpen(false);
    window.addEventListener('putiyuan:modal-open', open);
    window.addEventListener('putiyuan:modal-close', close);
    return () => { window.removeEventListener('putiyuan:modal-open', open); window.removeEventListener('putiyuan:modal-close', close); };
  }, []);

  if (location.pathname === '/dy' || location.pathname.startsWith('/admin') || modalOpen) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 bg-xuan-card/97 backdrop-blur-md md:hidden">
      <div className="grid grid-cols-6 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map(item => {
          const active = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href} onClick={() => setModalOpen(false)} className={cn('flex flex-col items-center gap-0.5 rounded-md px-0 py-2 text-xs transition-colors duration-fast', active ? 'text-gold' : 'text-ink-muted')}>
              <Icon name={item.icon} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
