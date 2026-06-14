import { Link } from 'react-router-dom';

export function More() {
  const features = [
    { href: '/qifu', name: '为家人祈福', icon: '🪷' },
    { href: '/almanac', name: '今日黄历', icon: '📅' },
    { href: '/lottery', name: '求灵签', icon: '🎋' },
    { href: '/bazi', name: '八字精批', icon: '☯️' },
    { href: '/dream', name: '周公解梦', icon: '🌙' },
    { href: '/palmistry', name: '看手相', icon: '🤲' },
    { href: '/naming', name: '宝宝起名', icon: '👶' },
    { href: '/divination', name: '六爻占卜', icon: '🔮' },
    { href: '/meditation', name: '静心禅坐', icon: '🧘' },
    { href: '/profile', name: '我的', icon: '👤' },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl text-gold">更多功能</h1>
        <p className="mt-1 text-sm text-paper-dark/65">全部传统文化服务</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {features.map(f => (
          <Link key={f.href} to={f.href} className="flex flex-col items-center gap-2 rounded-xl border border-gold/20 bg-xuan-card/80 p-4 backdrop-blur-sm hover:border-gold/40 transition-all duration-fast">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-sm text-gold font-display">{f.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
