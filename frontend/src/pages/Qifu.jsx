import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { blessing, payment } from '../api/client';
import { PaymentModal } from '../components/payment/PaymentModal';

const LAMP_TYPES = [
  { id: 'pingan', icon: '灯', name: '平安灯', color: '#C9A96E', desc: '愿家宅平安，出入顺遂。', min_amount: 6.6 },
  { id: 'health', icon: '寿', name: '健康灯', color: '#7DAE7A', desc: '愿身心康泰，福寿绵长。', min_amount: 8.8 },
  { id: 'career', icon: '禄', name: '事业灯', color: '#C43D3D', desc: '愿事业顺利，步步高升。', min_amount: 9.9 },
  { id: 'study', icon: '慧', name: '智慧灯', color: '#8E6AD8', desc: '愿学业精进，智慧增长。', min_amount: 6.6 },
  { id: 'love', icon: '缘', name: '姻缘灯', color: '#D97A9D', desc: '愿善缘和合，家庭美满。', min_amount: 8.8 },
];

const RANDOM_LAMP_COLORS = ['#C9A96E', '#7DAE7A', '#C43D3D', '#8E6AD8', '#D97A9D', '#5FA8D3', '#D9903D', '#70B6A1'];

const DURATIONS = [
  { id: 'month', label: '一月', days: 30, price: 6.6 },
  { id: 'quarter', label: '三月', days: 90, price: 16.6 },
  { id: 'year', label: '一年', days: 365, price: 66 },
];

function FlameIcon({ className = 'size-7', color = 'currentColor' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3q1 4 4 6.5t3 5.5a7 7 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </svg>
  );
}

function getEntryText(entry) {
  const beneficiary = entry.beneficiary_masked || entry.beneficiaryName || entry.beneficiary_name || entry.content || entry.relation || '家人';
  const sponsor = entry.sponsor_masked || entry.sponsorNickname || entry.sponsor_nickname || entry.nickname || '善信';
  const relation = entry.relation || entry.blessing_type || '家人';
  return { beneficiary, sponsor, relation };
}

function getStableLampColor(entry = {}) {
  const key = `${entry.id || ''}${entry.litAt || entry.lit_at || ''}${entry.beneficiaryName || entry.content || ''}${entry.sponsorNickname || entry.nickname || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  return RANDOM_LAMP_COLORS[Math.abs(hash) % RANDOM_LAMP_COLORS.length];
}

function LitLamp({ entry = {}, lampColor, size = 'sm', glow = true }) {
  const color = lampColor || entry.lampColor || getStableLampColor(entry);
  const { beneficiary, sponsor, relation } = getEntryText(entry);
  const wish = (entry.wish || '').slice(0, 12);
  const name = (beneficiary || '?').slice(0, size === 'sm' ? 2 : 4);
  const lampName = entry.lamp_name || entry.lampName || '平安灯';
  const duration = entry.duration || entry.duration_label || '';
  const litAt = entry.lit_at || entry.litAt || entry.created_at;
  const dimension = {
    lg: { w: 260, h: 360, fontSize: 36 },
    md: { w: 200, h: 280, fontSize: 28 },
    sm: { w: 130, h: 180, fontSize: 20 },
  }[size] || { w: 130, h: 180, fontSize: 20 };
  const rawId = `${entry.id || ''}-${entry.lamp_type || entry.lampType || ''}-${beneficiary}-${size}`;
  let hash = 0;
  for (let i = 0; i < rawId.length; i += 1) hash = ((hash << 5) - hash + rawId.charCodeAt(i)) | 0;
  const uid = `lamp-${Math.abs(hash)}`;
  const labelStart = size === 'sm' ? 138 : 130;

  return (
    <div className="mx-auto inline-flex flex-col items-center">
      <svg width={dimension.w} height={dimension.h} viewBox="0 0 240 320" style={{ filter: glow ? 'drop-shadow(0 0 24px rgba(255,180,80,0.4))' : 'none' }} className="overflow-visible">
        <defs>
          <radialGradient id={`${uid}-body`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff5d8" stopOpacity="0.95" />
            <stop offset="35%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="60%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-highlight`} cx="35%" cy="30%" r="35%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#c9a05c" />
            <stop offset="100%" stopColor="#7c4f1a" />
          </linearGradient>
          <linearGradient id={`${uid}-tassel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <radialGradient id={`${uid}-flame`} cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#fff7c0" />
            <stop offset="40%" stopColor="#ffd97a" />
            <stop offset="80%" stopColor="#ff8b3d" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff5a14" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g style={{ animation: glow ? 'lamp-sway 8s ease-in-out infinite' : 'none', transformOrigin: '120px 28px' }}>
          <line x1="120" y1="0" x2="120" y2="20" stroke={`url(#${uid}-metal)`} strokeWidth="2" />
          <ellipse cx="120" cy="20" rx="8" ry="4" fill={`url(#${uid}-metal)`} stroke="#7c4f1a" strokeWidth="1" />
          <rect x="108" y="22" width="24" height="6" rx="2" fill={`url(#${uid}-metal)`} stroke="#7c4f1a" strokeWidth="0.5" />
          <path d="M 60 38 Q 120 24 180 38 L 170 50 Q 120 42 70 50 Z" fill={`url(#${uid}-metal)`} stroke="#7c4f1a" strokeWidth="1" />
          <path d="M 70 50 Q 120 42 170 50 L 165 56 Q 120 50 75 56 Z" fill="#7c4f1a" />
          {glow && <circle cx="120" cy="150" r="130" fill={`url(#${uid}-glow)`} style={{ animation: 'lamp-glow-pulse 4s ease-in-out infinite' }} />}
          <ellipse cx="120" cy="150" rx="68" ry="92" fill={`url(#${uid}-body)`} stroke={color} strokeWidth="2" />
          {glow && <ellipse cx="120" cy="150" rx="50" ry="70" fill={`url(#${uid}-flame)`} opacity="0.6" style={{ animation: 'inner-flame 2.4s ease-in-out infinite', transformOrigin: '120px 150px' }} />}
          {[-50, -30, -10, 10, 30, 50].map(offset => {
            const x = 120 + 0.3 * offset;
            return <path key={offset} d={`M ${x} 60 Q ${120 + 1.3 * offset} 150 ${120 + 0.3 * offset} 240`} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" fill="none" />;
          })}
          {[80, 110, 150, 190, 220].map(y => {
            const rx = 68 * Math.sqrt(Math.max(0, 1 - ((y - 150) / 92) ** 2));
            return rx < 4 ? null : <line key={y} x1={120 - rx} y1={y} x2={120 + rx} y2={y} stroke="rgba(0,0,0,0.15)" strokeWidth="0.6" />;
          })}
          <ellipse cx="102" cy="120" rx="28" ry="36" fill={`url(#${uid}-highlight)`} />
          <path d="M 70 240 Q 120 252 170 240 L 165 248 Q 120 256 75 248 Z" fill={`url(#${uid}-metal)`} stroke="#7c4f1a" strokeWidth="1" />
          <g style={{ animation: glow ? 'tassel-sway 3.5s ease-in-out infinite' : 'none', transformOrigin: '120px 252px' }}>
            {[-15, -5, 5, 15].map((offset, index) => (
              <g key={offset}>
                <line x1={120 + offset} y1="252" x2={120 + 1.4 * offset} y2={282 + (index % 2) * 4} stroke={`url(#${uid}-tassel)`} strokeWidth="2" />
                <circle cx={120 + 1.5 * offset} cy={285 + (index % 2) * 4} r="2.5" fill="#dc2626" />
              </g>
            ))}
            <line x1="120" y1="252" x2="120" y2="296" stroke={`url(#${uid}-tassel)`} strokeWidth="2.5" />
            <circle cx="120" cy="300" r="4" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.5" />
          </g>
          <g textAnchor="middle" fontFamily='"STKaiti", "KaiTi", "楷体", serif' fontWeight="bold" fill="#3a1f0a" style={{ filter: 'drop-shadow(0 0 4px rgba(255,220,140,0.95))' }}>
            {size !== 'sm' && relation && <text x="120" y="108" fontSize={0.5 * dimension.fontSize} opacity="0.85">为</text>}
            {name.split('').map((char, index) => <text key={`${char}-${index}`} x="120" y={labelStart + 1.05 * dimension.fontSize * index} fontSize={dimension.fontSize}>{char}</text>)}
            {size !== 'sm' && <text x="120" y={130 + (name.length + 0.5) * (1.05 * dimension.fontSize)} fontSize={0.5 * dimension.fontSize} opacity="0.85">祈福</text>}
          </g>
        </g>
      </svg>
      {wish && size !== 'sm' && (
        <div className="mt-2 max-w-[220px] rounded-lg border border-gold/30 bg-xuan-surface/80 px-3 py-2 text-center backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-paper-dark">「{wish}」</p>
        </div>
      )}
      {size !== 'sm' && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-paper-dark/75">
          <FlameIcon className="size-3" color={color} />
          <span>{lampName}</span>
          {duration && <span> · {duration}</span>}
        </div>
      )}
      {sponsor && size !== 'sm' && <p className="mt-1 text-xs text-paper-dark/55">{sponsor} 敬奉{litAt && ` · ${new Date(litAt).toLocaleDateString('zh-CN')}`}</p>}
    </div>
  );
}

function LampWallItem({ entry, lampOptions }) {
  const ref = useRef(null);
  const [glow, setGlow] = useState(false);
  const lamp = lampOptions.find(item => item.id === (entry.lamp_type || entry.lampType));
  const color = lamp?.color || getStableLampColor(entry);
  const { beneficiary, sponsor } = getEntryText(entry);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([item]) => setGlow(item.isIntersecting), { rootMargin: '100px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-2">
      <LitLamp entry={entry} lampColor={color} size="sm" glow={glow} />
      <p className="text-center text-xs text-paper-dark/65">{sponsor} 为 {beneficiary} 敬奉</p>
    </div>
  );
}

export function Qifu() {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('父亲');
  const [lampType, setLampType] = useState('pingan');
  const [duration, setDuration] = useState('month');
  const [wish, setWish] = useState('');
  const [nickname, setNickname] = useState('');
  const [blessings, setBlessings] = useState([]);
  const [lampOptions, setLampOptions] = useState(LAMP_TYPES);
  const [stats, setStats] = useState({ total_lit: 0, today_lit: 0 });
  const [wallLoading, setWallLoading] = useState(true);
  const [durations, setDurations] = useState(DURATIONS);
  const [loading, setLoading] = useState(false);
  const [pendingBlessing, setPendingBlessing] = useState(null);
  const [payOpen, setPayOpen] = useState(false);

  const sel = durations.find(d => d.id === duration);
  const price = sel ? sel.price : 6.6;

  async function loadWall() {
    try {
      const data = await blessing.wall();
      setBlessings(data || []);
      setStats(prev => ({ ...prev, total_lit: Math.max(prev.total_lit || 0, (data || []).length) }));
    } catch (error) {
      console.warn('load blessing wall failed:', error);
    } finally {
      setWallLoading(false);
    }
  }

  function buildBlessingPayload() {
    return {
      name: name.trim(),
      relation,
      lamp_type: lampType,
      duration,
      duration_days: sel?.days || 30,
      amount: price,
      wish: wish.trim() || undefined,
      nickname: nickname.trim() || undefined,
    };
  }

  async function createBlessing(payload) {
    setLoading(true);
    try {
      await blessing.create(payload);
      loadWall();
      setName('');
      setWish('');
      setPendingBlessing(null);
      setPayOpen(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    const payload = buildBlessingPayload();
    setPendingBlessing(payload);
    setPayOpen(true);
  }

  useEffect(() => {
    blessing.catalog()
      .then(data => {
        if (data?.lamps?.length) {
          setLampOptions(data.lamps);
          setLampType(data.lamps[0].id);
        }
        if (data?.stats) setStats(data.stats);
      })
      .catch(error => console.warn('load blessing catalog failed:', error));
    payment.prices()
      .then(data => {
        const list = (data?.blessing_durations || []).map(item => ({
          id: item.duration_id,
          label: item.label,
          days: item.days,
          price: item.current_price,
        }));
        if (list.length) {
          setDurations(list);
          setDuration(list[0].id);
        }
      })
      .catch(error => console.warn('load prices failed:', error));
    const timer = window.setTimeout(loadWall, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full border border-vermillion/30 bg-vermillion/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 text-vermillion"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">为家人祈福</h1>
          <p className="mx-auto max-w-md text-base text-paper-dark/85">点一盏灯，挂家人之名，愿心愿成就，福寿安康。</p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="mx-auto inline-flex items-center gap-4 rounded-full border border-gold/30 bg-xuan-card/70 px-6 py-2 text-sm text-paper-dark/85">
            <span>已点亮 <span className="font-display text-lg text-gold">{stats.total_lit || blessings.length || 0}</span> 盏</span>
            <span className="h-4 w-px bg-gold/30" />
            <span>今日新增 <span className="font-display text-lg text-vermillion">{stats.today_lit || 0}</span> 盏</span>
          </div>
        </ScrollReveal>
        {blessings.length > 0 && (
          <ScrollReveal delay={0.12}>
            <div className="relative mx-auto mt-3 max-w-lg overflow-hidden rounded-full border border-gold/20 bg-xuan-card/50 px-4 py-2">
              <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap gap-8">
                {[...blessings.slice(0, 10), ...blessings.slice(0, 10)].map((entry, index) => {
                  const { beneficiary, sponsor } = getEntryText(entry);
                  const lamp = lampOptions.find(item => item.id === (entry.lamp_type || entry.lampType));
                  const color = lamp?.color || getStableLampColor(entry);
                  return (
                    <span key={`${entry.id || index}-${index}`} className="inline-flex items-center gap-1.5 text-xs text-paper-dark/75">
                      <FlameIcon className="size-3" color={color} />
                      <span className="text-gold/85">{sponsor}</span>
                      <span>为</span>
                      <span className="text-gold/85">{beneficiary}</span>
                      <span>点亮{entry.lamp_name || entry.lampName || lamp?.name || '祈福灯'}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}
      </section>

      <ScrollReveal delay={0.15}>
        <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-6">
          <h2 className="font-display text-2xl text-gold">为谁祈福</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-base text-paper-dark/85">家人姓名</span>
              <input className="h-10 w-full rounded-md border border-gold/20 bg-xuan-surface px-3 text-paper-dark placeholder:text-ink-muted transition-all duration-fast focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 text-lg" placeholder="例如：王秀英" maxLength={16} value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-base text-paper-dark/85">与您的关系</span>
              <select className="h-12 w-full rounded-md border border-gold/20 bg-xuan-surface px-3 text-lg text-paper-dark focus:border-gold focus:outline-none" value={relation} onChange={e => setRelation(e.target.value)}>
                {['父亲','母亲','爱人','孩子','孙辈','朋友','自己'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-base text-paper-dark/85">选一盏灯</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {lampOptions.map(lt => (
                <button key={lt.id} type="button" onClick={() => setLampType(lt.id)}
                  className={`group relative rounded-xl border p-4 text-left transition-all duration-fast text-sm ${lampType === lt.id ? 'border-gold/60 bg-gold/10 shadow-lg shadow-gold/5' : 'border-gold/20 bg-xuan-surface/40 hover:border-gold/40'}`}>
                  <FlameIcon className="mb-2 size-7" color={lampType === lt.id ? lt.color : '#7a6a4a'} />
                  <div className="font-display text-base text-gold">{lt.name}</div>
                  <div className="text-xs text-paper-dark/50 mt-0.5">{lt.desc || lt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base text-paper-dark/85">供奉时长</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {durations.map(d => (
                <button key={d.id} type="button" onClick={() => setDuration(d.id)}
                  className={`rounded-xl border p-3 text-center transition-all duration-fast ${duration === d.id ? 'border-gold/60 bg-gold/10 shadow-lg shadow-gold/5' : 'border-gold/20 bg-xuan-card/80 hover:border-gold/40'}`}>
                  <div className="font-display text-base text-gold">{d.label}</div>
                  <div className="text-xs text-paper-dark/60 mt-0.5">¥{d.price}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-base text-paper-dark/85">心愿（可选，最多 80 字）</span>
            <textarea placeholder="例如：愿父亲身体康健、烦恼消解" maxLength={80} rows={3} className="w-full rounded-md border border-gold/20 bg-xuan-surface px-4 py-3 text-base text-paper-dark focus:border-gold focus:outline-none" value={wish} onChange={e => setWish(e.target.value)} />
          </label>

          <label className="block space-y-2">
            <span className="text-base text-paper-dark/85">您的称呼（可选，会显示在灯墙）</span>
            <input className="h-10 w-full rounded-md border border-gold/20 bg-xuan-surface px-3 text-base text-paper-dark placeholder:text-ink-muted transition-all duration-fast focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30" placeholder="例如：李小华" maxLength={16} value={nickname} onChange={e => setNickname(e.target.value)} />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-paper-dark/65">需供奉</p>
              <p className="font-display text-3xl text-gold">¥{price}</p>
            </div>
            <button onClick={handleSubmit} disabled={loading || !name.trim()} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark h-12 px-8 text-lg">
              <span>{loading ? '点亮中...' : '支付并点亮'}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4">
          <h2 className="font-display text-2xl text-gold">功德灯墙</h2>
          <p className="text-sm text-paper-dark/65">姓名已脱敏处理 · 心诚则灵</p>
          {wallLoading ? (
            <p className="text-center text-paper-dark/65">加载中...</p>
          ) : blessings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gold/20 p-8 text-center">
              <FlameIcon className="mx-auto mb-3 size-10 text-vermillion/40" />
              <p className="text-paper-dark/65">暂无供灯，您可以是第一位为家人点灯的人。</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {blessings.slice(0, 40).map((entry, index) => (
                <LampWallItem key={`${entry.litAt || entry.lit_at || entry.id || index}-${index}`} entry={entry} lampOptions={lampOptions} />
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>
      <PaymentModal
        open={payOpen}
        productId="blessing_lamp"
        title="供灯祈福支付"
        extras={{
          duration,
          amount: price,
          lamp_name: lampOptions.find(t => t.id === lampType)?.name || '供灯祈福',
        }}
        onClose={() => setPayOpen(false)}
        onPaid={() => pendingBlessing && createBlessing(pendingBlessing)}
      />
    </div>
  );
}
