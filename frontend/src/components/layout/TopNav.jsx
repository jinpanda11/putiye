import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../utils';

const navLinks = [
  { href: '/qifu', label: '为家人祈福' },
  { href: '/almanac', label: '今日黄历' },
  { href: '/lottery', label: '求灵签' },
  { href: '/bazi', label: '八字精批' },
  { href: '/dream', label: '周公解梦' },
  { href: '/palmistry', label: '看手相' },
  { href: '/naming', label: '宝宝起名' },
  { href: '/divination', label: '六爻占卜' },
  { href: '/meditation', label: '静心禅坐' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-9 shrink-0 text-gold drop-shadow-[0_0_8px_rgba(201,160,94,0.4)]">
        <path d="M32 6 C 22 6, 12 12, 10 22 C 8 32, 14 44, 24 50 C 28 53, 30 56, 31 60 L 32 62 L 33 60 C 34 56, 36 53, 40 50 C 50 44, 56 32, 54 22 C 52 12, 42 6, 32 6 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M32 8 V 60" strokeWidth="1.4" />
        <path d="M32 16 C 26 18, 20 22, 16 28" />
        <path d="M32 16 C 38 18, 44 22, 48 28" />
        <path d="M32 28 C 24 30, 18 36, 16 42" />
        <path d="M32 28 C 40 30, 46 36, 48 42" />
        <path d="M32 42 C 28 46, 26 50, 26 54" />
        <path d="M32 42 C 36 46, 38 50, 38 54" />
      </svg>
      <span className="text-[1.4rem] md:text-[1.65rem]" style={{
        fontFamily: "'ZhiMangXing', cursive",
        background: 'linear-gradient(180deg, #f5e6b8 0%, #c9a05c 50%, #8b6914 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '0.12em',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
      }}>菩提苑</span>
    </Link>
  );
}

export function TopNav() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, openLogin } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isSpecial = location.pathname === '/dy' || location.pathname.startsWith('/admin');
  if (isSpecial) return null;

  return (
    <header className={cn(
      'fixed top-0 z-50 h-14 w-full transition-all duration-base safe-top',
      scrolled ? 'bg-xuan/95 shadow-[0_1px_0_rgba(201,169,110,0.12)] backdrop-blur-md' : 'bg-transparent'
    )}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'font-body text-sm transition-colors duration-fast hover:text-gold',
                location.pathname === link.href ? 'text-gold' : 'text-paper-dark'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Link to="/profile" className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1.5 text-sm text-gold hover:bg-gold/10" title={user.lucky_code ? '吉祥号 ' + user.lucky_code : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {user.lucky_code || user.nickname || user.username}
              </Link>
            ) : (
              <button type="button" onClick={openLogin} className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1.5 text-sm text-gold hover:bg-gold/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                登录/注册
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={cn('gold-divider h-px transition-opacity duration-slow', scrolled ? 'opacity-100' : 'opacity-0')} style={{
        background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.3), transparent)'
      }} />
    </header>
  );
}
