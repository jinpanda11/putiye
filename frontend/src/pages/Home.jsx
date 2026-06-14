import { Link } from 'react-router-dom';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { cn } from '../components/utils';

const features = [
  { href: '/qifu', icon: 'heart', badge: '镇宅祈福', color: 'vermillion', title: '为家人祈福', desc: '点一盏灯，挂家人姓名。价格和时长由后台实时配置。' },
  { href: '/almanac', icon: 'calendar', badge: '每日打卡', color: 'gold', title: '今日黄历', desc: '干支宜忌、神煞冲煞、十二时辰，传统择吉一目了然。' },
  { href: '/dream', icon: 'moon', badge: '新增', color: 'purple', title: '周公解梦', desc: '百梦皆有意，古今相参证。80 余条经典梦境，直接告诉您吉凶。' },
  { href: '/lottery', icon: 'sparkles', badge: '传统签谱', color: 'blue', title: '关帝灵签', desc: '心诚则灵，一签一事。100 支签文出自传统签谱。' },
  { href: '/bazi', icon: 'compass', badge: '传家技艺', color: 'green', title: '八字精批', desc: '立春节气真排盘，看命格根骨与一生气运起伏。' },
  { href: '/divination', icon: 'scroll', badge: '周易卦例', color: 'gold', title: '六爻占卜', desc: '心起一念，三铜起卦，再观爻象之变，定一时之趋避。' },
  { href: '/palmistry', icon: 'hand', badge: '图解', color: 'vermillion', title: '手相图解', desc: '传一张清晰的掌心照，依传统手相学逐线开示。' },
  { href: '/naming', icon: 'book', badge: '传家', color: 'purple', title: '宝宝起名', desc: '结合八字喜忌、音韵笔画、典故诗词，给孩子一个耐看的名字。' },
  { href: '/meditation', icon: 'flame', badge: '新增', color: 'blue', title: '静心禅坐', desc: '钟磬古乐、佛号梵音、深山溪水。日日一坐，福报自来。' },
];

function FeatureIcon({ name }) {
  const props = { className: 'size-6', xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'heart': return <svg {...props}><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>;
    case 'calendar': return <svg {...props}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>;
    case 'moon': return <svg {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
    case 'sparkles': return <svg {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
    case 'compass': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76a.5.5 0 0 1 .12.61l-2.75 5.48a.5.5 0 0 1-.64.24l-5.49-2.74a.5.5 0 0 1-.24-.64l2.74-5.49a.5.5 0 0 1 .61-.12Z"/></svg>;
    case 'scroll': return <svg {...props}><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>;
    case 'hand': return <svg {...props}><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M4 13.5V18a8 8 0 0 0 16 0v-5.4A2.6 2.6 0 0 0 17.4 10v0a2.6 2.6 0 0 0-2.6 2.6"/></svg>;
    case 'book': return <svg {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
    case 'flame': return <svg {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
    default: return null;
  }
}

function HeroSection() {
  return (
    <ScrollReveal>
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-8 text-center md:pt-24 md:pb-12">
        <div className="relative mb-6">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full border-2 border-gold/30 bg-gradient-to-br from-gold/15 to-transparent md:size-32">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-14 text-gold drop-shadow-[0_0_12px_rgba(201,160,94,0.5)] md:size-20">
              <path d="M32 6 C 22 6, 12 12, 10 22 C 8 32, 14 44, 24 50 C 28 53, 30 56, 31 60 L 32 62 L 33 60 C 34 56, 36 53, 40 50 C 50 44, 56 32, 54 22 C 52 12, 42 6, 32 6 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M32 8 V 60" strokeWidth="1.4" />
              <path d="M32 16 C 26 18, 20 22, 16 28" /><path d="M32 16 C 38 18, 44 22, 48 28" />
              <path d="M32 28 C 24 30, 18 36, 16 42" /><path d="M32 28 C 40 30, 46 36, 48 42" />
              <path d="M32 42 C 28 46, 26 50, 26 54" /><path d="M32 42 C 36 46, 38 50, 38 54" />
            </svg>
          </div>
          <span className="absolute -inset-2 rounded-full border border-gold/20 animate-ring-expand pointer-events-none" style={{ animation: 'ring-expand 3s ease-out infinite' }} />
          <span className="absolute -inset-4 rounded-full border border-gold/10 animate-ring-expand pointer-events-none" style={{ animation: 'ring-expand 3s ease-out infinite 1s' }} />
        </div>
        <h1 className="font-display text-4xl text-gold-light md:text-5xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>菩提苑</h1>
        <p className="mt-3 max-w-md text-base text-paper-dark/80 leading-relaxed md:text-lg">
          以古籍为根，以师父为引<br />为家人祈福 · 求灵签 · 看八字
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to="/qifu" className="inline-flex items-center gap-2 rounded-xl bg-vermillion px-8 py-3 text-base font-medium text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light transition-colors tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
            为家人祈福
          </Link>
          <Link to="/lottery" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-8 py-3 text-base text-gold hover:bg-gold/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>
            求一支灵签
          </Link>
        </div>
        <p className="mt-6 text-xs text-paper-dark/40 animate-bounce">向下滚动 · 看更多功德</p>
      </section>
    </ScrollReveal>
  );
}

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <ScrollReveal>
        <h2 className="text-center font-display text-2xl text-gold mb-8 tracking-widest">九大善门</h2>
      </ScrollReveal>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <ScrollReveal key={f.href} delay={i * 0.05}>
            <Link to={f.href} className="group block rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all duration-fast">
              <div className={cn(
                'mb-3 inline-flex size-12 items-center justify-center rounded-full border',
                f.color === 'vermillion' && 'text-vermillion-light bg-vermillion/10 border-vermillion/30',
                f.color === 'gold' && 'text-gold bg-gold/10 border-gold/30',
                f.color === 'purple' && 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                f.color === 'blue' && 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                f.color === 'green' && 'text-green-400 bg-green-500/10 border-green-500/30',
              )}>
                <FeatureIcon name={f.icon} color={f.color} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg text-gold group-hover:text-gold-light transition-colors">{f.title}</h3>
                <span className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px]',
                  f.color === 'vermillion' && 'border-vermillion/30 text-vermillion-light bg-vermillion/10',
                  f.color === 'gold' && 'border-gold/30 text-gold bg-gold/10',
                  f.color === 'purple' && 'border-purple-500/30 text-purple-400 bg-purple-500/10',
                  f.color === 'blue' && 'border-blue-500/30 text-blue-400 bg-blue-500/10',
                  f.color === 'green' && 'border-green-500/30 text-green-400 bg-green-500/10',
                )}>{f.badge}</span>
              </div>
              <p className="text-sm text-paper-dark/65 leading-relaxed">{f.desc}</p>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <ScrollReveal>
        <div className="flex justify-center mb-4">
          <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-1 text-xs text-gold tracking-wider">真排盘 · 古籍为据 · 师父开示</span>
        </div>
        <h2 className="text-center font-display text-2xl text-gold mb-8">为何选菩提苑</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm">
            <div className="text-2xl mb-2">📜</div>
            <h3 className="font-display text-base text-gold mb-2">古籍为根</h3>
            <p className="text-sm text-paper-dark/65 leading-relaxed">解读围绕《渊海子平》《滴天髓》《周易》等经典展开，引文皆有出处。</p>
          </div>
          <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm">
            <div className="text-2xl mb-2">🧘</div>
            <h3 className="font-display text-base text-gold mb-2">师父开示</h3>
            <p className="text-sm text-paper-dark/65 leading-relaxed">三位虚拟师父分别擅长稳重派、慈悲派与直爽派，选适合您的来听。</p>
          </div>
          <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm">
            <div className="text-2xl mb-2">💛</div>
            <h3 className="font-display text-base text-gold mb-2">心诚为本</h3>
            <p className="text-sm text-paper-dark/65 leading-relaxed">网站不替代医疗、法律、投资建议。一切结果，仅作传统文化参考。</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['渊海子平', '三命通会', '滴天髓', '穷通宝鉴', '子平真诠', '周易'].map(b => (
            <span key={b} className="rounded-full border border-gold/15 bg-xuan-surface/50 px-3 py-1 text-xs text-paper-dark/50">{b}</span>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}

function IncenseSection() {
  return (
    <ScrollReveal>
      <section className="mx-4 mb-16 max-w-3xl md:mx-auto">
        <div className="rounded-xl border-x-4 border-gold/40 bg-gradient-to-b from-[#3d2e1a] to-[#2a1f15] px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-vermillion/20 text-vermillion-light">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </div>
          <p className="text-xs text-paper-dark/60 mb-1">每日三礼 · 每礼三炷</p>
          <h2 className="font-display text-2xl text-gold mb-3">在线上香</h2>
          <p className="text-sm text-paper-dark/70 leading-relaxed mb-6 max-w-md mx-auto">静心三礼九炷，为自己、为家人、为众生。心念在哪里，福报就在哪里。</p>
          <Link to="/incense" className="inline-flex items-center gap-2 rounded-xl bg-vermillion px-8 py-3 text-base font-medium text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light transition-colors tracking-wider">
            敬上一炷清香
          </Link>
        </div>
      </section>
    </ScrollReveal>
  );
}

function ShareSection() {
  return (
    <ScrollReveal>
      <section className="mx-4 mb-8 max-w-3xl md:mx-auto">
        <div className="rounded-xl border border-gold/20 bg-[#2a1f15] px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-vermillion/20 text-vermillion-light">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          </div>
          <p className="text-xs text-paper-dark/60 mb-1">一灯传万灯</p>
          <h2 className="font-display text-2xl text-gold mb-3">分享传播 · 功德倍增</h2>
          <p className="text-sm text-paper-dark/70 leading-relaxed mb-6 max-w-md mx-auto">发给亲朋好友，让他们也能为家人点一盏灯、求一支签。微信、朋友圈、抖音私信都可以分享。</p>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(window.location.origin); }} className="inline-flex items-center gap-2 rounded-xl bg-vermillion px-8 py-3 text-base font-medium text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light transition-colors tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            分享给有缘人
          </button>
        </div>
      </section>
    </ScrollReveal>
  );
}

function Footer() {
  const verses = [
    { text: '善念起于心，福缘自然生。一念清净，万物皆宁。', color: 'text-gold' },
    { text: '菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。', color: 'text-paper-dark/70' },
    { text: '命自我立，福自我求。诸恶莫作，众善奉行。', color: 'text-paper-dark/70' },
  ];
  return (
    <footer className="border-t border-gold/10 px-4 py-12 text-center">
      {verses.map((v, i) => (
        <p key={i} className={cn('text-sm leading-relaxed mb-2', v.color)}>{v.text}</p>
      ))}
      <div className="mx-auto my-6 w-24 h-px bg-gold/20" />
      <p className="text-xs text-paper-dark/40">菩提苑 · 一念慈悲，一灯长明</p>
    </footer>
  );
}

export function Home() {
  return (
    <>
      <HeroSection />
      <FeatureGrid />
      <WhySection />
      <IncenseSection />
      <ShareSection />
      <Footer />
    </>
  );
}
