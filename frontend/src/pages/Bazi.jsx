import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { PaymentModal } from '../components/payment/PaymentModal';
import { auth, bazi, entitlement, payment } from '../api/client';
import { cn } from '../components/utils';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_FORM = {
  birth_year: 1990,
  birth_month: 5,
  birth_day: 15,
  birth_hour: 13,
  gender: 'male',
  shichen: 'wei',
};

const HOURS = [
  { value: 'zi', label: '子时 (23:00-01:00)', hour: 23 },
  { value: 'chou', label: '丑时 (01:00-03:00)', hour: 1 },
  { value: 'yin', label: '寅时 (03:00-05:00)', hour: 3 },
  { value: 'mao', label: '卯时 (05:00-07:00)', hour: 5 },
  { value: 'chen', label: '辰时 (07:00-09:00)', hour: 7 },
  { value: 'si', label: '巳时 (09:00-11:00)', hour: 9 },
  { value: 'wu', label: '午时 (11:00-13:00)', hour: 11 },
  { value: 'wei', label: '未时 (13:00-15:00)', hour: 13 },
  { value: 'shen', label: '申时 (15:00-17:00)', hour: 15 },
  { value: 'you', label: '酉时 (17:00-19:00)', hour: 17 },
  { value: 'xu', label: '戌时 (19:00-21:00)', hour: 19 },
  { value: 'hai', label: '亥时 (21:00-23:00)', hour: 21 },
];

const MASTERS = [
  { id: 'huiming', avatar: '🧘', name: '慧明长老', title: '古寺住持', tagline: '庄重持重，引经据典', intro: '通读《渊海子平》《滴天髓》，言语稳重克制。适合希望深度解读、看古籍出处的施主。' },
  { id: 'mingxin', avatar: '🙏', name: '明心师父', title: '尼众法师', tagline: '慈悲温柔，劝人向善', intro: '语调温和，慈悲为怀。适合家庭、感情、亲人祈福场景。' },
  { id: 'xuanzhen', avatar: '☯️', name: '玄真道长', title: '山中道人', tagline: '直爽通透，说大白话', intro: '山中道人，不爱绕弯子。把命理讲成大白话，适合急性子。' },
];

const DETAIL_TABS = [
  { value: 'personality', label: '性格' },
  { value: 'career', label: '事业' },
  { value: 'wealth', label: '财运' },
  { value: 'relationship', label: '感情' },
  { value: 'health', label: '健康' },
];

const ELEMENTS = ['金', '木', '水', '火', '土'];
const ELEMENT_COLORS = {
  金: 'border-yellow-300 bg-yellow-100 text-yellow-800',
  木: 'border-green-300 bg-green-100 text-green-800',
  水: 'border-blue-300 bg-blue-100 text-blue-800',
  火: 'border-red-300 bg-red-100 text-red-800',
  土: 'border-amber-300 bg-amber-100 text-amber-800',
};

function Card({ className, children }) {
  return (
    <div className={cn('rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card', className)}>
      {children}
    </div>
  );
}

function Badge({ children, tone, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', tone ? ELEMENT_COLORS[tone] : 'border-gold/30 bg-gradient-to-r from-gold/20 to-gold/5 text-gold-dark', className)}>
      {children}
    </span>
  );
}

function NumberPicker({ label, value, min, max, suffix, shortcuts = [], onChange }) {
  const [open, setOpen] = useState(false);
  const values = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => max - i), [min, max]);

  return (
    <div className="relative space-y-2">
      <p className="text-sm text-paper-dark/75">{label}</p>
      <div className="relative flex h-16 items-stretch overflow-visible rounded-xl border border-gold/30 bg-xuan-surface">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="flex w-12 items-center justify-center text-paper-dark hover:bg-gold/10 active:bg-gold/15 disabled:opacity-30" aria-label={`减少${label}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <button type="button" onClick={() => setOpen(true)} className="flex flex-1 flex-col items-center justify-center transition-colors hover:bg-gold/5 active:bg-gold/10" aria-label={`点击选择${label}`}>
          <span className="font-number text-2xl text-gold">{value}{suffix}</span>
          <span className="text-[10px] text-paper-dark/45">点击选择</span>
        </button>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="flex w-12 items-center justify-center text-paper-dark hover:bg-gold/10 active:bg-gold/15 disabled:opacity-30" aria-label={`增加${label}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
        </button>
      </div>

      {open && (
        <>
          <button type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-[200] cursor-default bg-black/60" aria-label="关闭" />
          <div className="fixed inset-x-4 top-1/2 z-[201] mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-gold/40 bg-xuan-card p-4 shadow-2xl md:left-1/2 md:right-auto md:-translate-x-1/2">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base text-gold">选择{label}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-paper-dark/85 hover:border-gold/60 hover:text-gold">关闭</button>
            </div>
            {shortcuts.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5 border-b border-gold/15 pb-3">
                {shortcuts.map(item => (
                  <button key={item} type="button" onClick={() => { onChange(item); setOpen(false); }} className={cn('rounded-md border px-2.5 py-1 text-xs', value === item ? 'border-gold/60 bg-gold/15 text-gold' : 'border-gold/25 text-paper-dark hover:border-gold/40 hover:text-gold')}>
                    {item}{suffix}
                  </button>
                ))}
              </div>
            )}
            <div className="grid max-h-[60vh] grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-5 md:grid-cols-6">
              {values.map(item => (
                <button key={item} type="button" onClick={() => { onChange(item); setOpen(false); }} className={cn('rounded-md py-2 text-base transition-colors', value === item ? 'bg-gold/20 text-gold ring-1 ring-gold/60' : 'text-paper-dark hover:bg-gold/10')}>
                  {item}{suffix}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BirthForm({ value, onChange }) {
  const yearShortcuts = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].filter(item => item <= CURRENT_YEAR);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <NumberPicker label="出生年" value={value.birth_year} min={1940} max={CURRENT_YEAR} suffix="年" shortcuts={yearShortcuts} onChange={birth_year => onChange({ ...value, birth_year })} />
        <NumberPicker label="出生月" value={value.birth_month} min={1} max={12} suffix="月" onChange={birth_month => onChange({ ...value, birth_month })} />
        <NumberPicker label="出生日" value={value.birth_day} min={1} max={31} suffix="日" onChange={birth_day => onChange({ ...value, birth_day })} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-paper-dark/75">出生时辰</span>
          <select
            className="h-16 w-full rounded-xl border border-gold/30 bg-xuan-surface px-4 text-lg text-paper-dark focus:border-gold focus:outline-none"
            value={value.shichen}
            onChange={event => {
              const item = HOURS.find(h => h.value === event.target.value);
              onChange({ ...value, shichen: event.target.value, birth_hour: item?.hour ?? value.birth_hour });
            }}
          >
            {HOURS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="space-y-2">
          <p className="text-sm text-paper-dark/75">性别</p>
          <div className="flex h-16 items-stretch overflow-hidden rounded-xl border border-gold/30 bg-xuan-surface">
            {[{ value: 'male', label: '男' }, { value: 'female', label: '女' }].map(item => (
              <button key={item.value} type="button" onClick={() => onChange({ ...value, gender: item.value })} className={cn('flex flex-1 items-center justify-center text-lg transition-colors', value.gender === item.value ? 'bg-gold/15 text-gold' : 'text-paper-dark hover:bg-gold/5')}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterPanel({ value, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-base text-paper-dark/80">请选一位师父为您开示</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {MASTERS.map(master => {
          const active = master.id === value;
          return (
            <button
              key={master.id}
              type="button"
              onClick={() => onChange(master.id)}
              className={cn('group rounded-xl border p-4 text-left transition-all duration-200', active ? 'border-gold/60 bg-gold/10 shadow-lg shadow-gold/5' : 'border-gold/20 bg-xuan-surface/40 hover:border-gold/40 hover:bg-xuan-surface/70')}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{master.avatar}</span>
                <div>
                  <p className={cn('font-display text-lg', active ? 'text-gold' : 'text-paper-dark')}>{master.name}</p>
                  <p className="text-xs text-paper-dark/65">{master.title}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gold/85">{master.tagline}</p>
              <p className="mt-1 text-xs text-paper-dark/65">{master.intro}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FortuneLoading({ active, onComplete }) {
  const [step, setStep] = useState(0);
  const messages = ['师父正在凝神静气...', '排起四柱，定干支根本...', '推演大运，看一生气运...', '查流年穷通，明今岁机锋...', '排盘已成，请看命盘...'];

  useEffect(() => {
    if (!active) return undefined;
    const duration = 4200;
    const timers = [
      window.setTimeout(() => setStep(1), duration * 0.25),
      window.setTimeout(() => setStep(2), duration * 0.5),
      window.setTimeout(() => setStep(3), duration * 0.75),
      window.setTimeout(() => { setStep(4); onComplete?.(); }, duration),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-md flex-col items-center justify-center overflow-hidden">
      <div className="relative size-44">
        <div className="absolute inset-0 animate-[bazi-taiji-spin_4s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="size-full drop-shadow-[0_0_24px_rgba(201,169,110,0.5)]">
            <defs>
              <radialGradient id="baziGoldHalo" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#f0d894" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#c9a05c" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#c9a05c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#baziGoldHalo)" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#c9a05c" strokeWidth="2" />
            <path d="M 50 8 A 42 42 0 0 1 50 92 A 21 21 0 0 1 50 50 A 21 21 0 0 0 50 8 Z" fill="#1a1410" stroke="#c9a05c" strokeWidth="0.8" />
            <circle cx="50" cy="29" r="5" fill="#1a1410" />
            <circle cx="50" cy="71" r="5" fill="#c9a05c" />
          </svg>
        </div>
        {['甲', '乙', '丙', '丁'].map((item, index) => {
          const angle = (index / 4) * Math.PI * 2 - Math.PI / 2;
          return (
            <span key={item} style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${110 * Math.cos(angle)}px, ${110 * Math.sin(angle)}px)`, animationDelay: `${0.25 * index}s` }} className="pointer-events-none absolute animate-[bazi-float-fade_3.6s_ease-in-out_infinite] font-display text-2xl text-gold">
              {item}
            </span>
          );
        })}
        {['子', '丑', '寅', '卯'].map((item, index) => {
          const angle = (index / 4) * Math.PI * 2 - Math.PI / 4;
          return (
            <span key={item} style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${145 * Math.cos(angle)}px, ${145 * Math.sin(angle)}px)`, animationDelay: `${0.3 * index + 0.6}s` }} className="pointer-events-none absolute animate-[bazi-float-fade_3.6s_ease-in-out_infinite] font-display text-xl text-vermillion-light">
              {item}
            </span>
          );
        })}
      </div>
      <div className="mt-12 text-center">
        <p className="animate-pulse font-display text-lg tracking-widest text-gold">{messages[step]}</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2, 3].map(item => <span key={item} className={cn('size-2 rounded-full transition-all duration-500', item <= step ? 'bg-gold' : 'bg-gold/20')} />)}
        </div>
      </div>
    </div>
  );
}

function PillarCell({ value, dayMaster }) {
  return (
    <div className={cn('flex aspect-square items-center justify-center rounded-md border text-center font-mono text-2xl md:text-3xl', dayMaster ? 'border-vermillion bg-vermillion text-white shadow-lg shadow-vermillion/20' : 'border-gold/20 bg-xuan-surface text-paper-dark')}>
      {value}
    </div>
  );
}

function BaziChart({ bazi: chart }) {
  const pillars = [
    { title: '年柱', item: chart?.year },
    { title: '月柱', item: chart?.month },
    { title: '日柱', item: chart?.day },
    { title: '时柱', item: chart?.hour },
  ];

  return (
    <div className="mx-auto grid max-w-md grid-cols-4 gap-2 md:gap-4">
      {pillars.map(item => <div key={item.title} className="text-center text-xs text-ink-muted">{item.title}</div>)}
      {pillars.map((item, index) => <PillarCell key={`${item.title}-gan`} value={item.item?.gan || '-'} dayMaster={index === 2} />)}
      {pillars.map(item => <PillarCell key={`${item.title}-zhi`} value={item.item?.zhi || '-'} />)}
    </div>
  );
}

function WuxingRadar({ detail = [], dayMaster }) {
  const center = 100;
  const maxRadius = 72;
  const points = ELEMENTS.map((element, index) => {
    const item = detail.find(entry => entry.element === element);
    const score = Math.min(100, Math.max(10, item?.score ?? 0));
    const angle = (index / ELEMENTS.length) * Math.PI * 2 - Math.PI / 2;
    const r = (score / 100) * maxRadius;
    return {
      element,
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (maxRadius + 18) * Math.cos(angle),
      labelY: center + (maxRadius + 18) * Math.sin(angle),
    };
  });
  const polygon = points.map(item => `${item.x},${item.y}`).join(' ');
  const rings = [0.35, 0.7, 1];

  return (
    <div className="flex w-full max-w-[260px] flex-col items-center md:max-w-[320px]">
      <svg viewBox="0 0 200 200" className="h-60 w-64">
        {rings.map(ring => (
          <polygon key={ring} points={ELEMENTS.map((_, index) => {
            const angle = (index / ELEMENTS.length) * Math.PI * 2 - Math.PI / 2;
            return `${center + maxRadius * ring * Math.cos(angle)},${center + maxRadius * ring * Math.sin(angle)}`;
          }).join(' ')} fill="none" stroke="rgba(201,169,110,0.2)" />
        ))}
        {ELEMENTS.map((_, index) => {
          const angle = (index / ELEMENTS.length) * Math.PI * 2 - Math.PI / 2;
          return <line key={index} x1={center} y1={center} x2={center + maxRadius * Math.cos(angle)} y2={center + maxRadius * Math.sin(angle)} stroke="rgba(201,169,110,0.18)" />;
        })}
        <polygon points={polygon} fill="rgba(201,169,110,0.15)" stroke="#C9A96E" strokeWidth="2" />
        {points.map(item => (
          <g key={item.element}>
            <circle cx={item.x} cy={item.y} r="3" fill="#C9A96E" />
            <text x={item.labelX} y={item.labelY + 4} textAnchor="middle" fontSize="12" fill="#D4C5A9">{item.element}</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-sm text-paper-dark/70">日主：{dayMaster || '-'}</p>
    </div>
  );
}

function LifeLineChart({ data, highlightAge }) {
  const points = Array.isArray(data) ? data : data?.points;
  if (!points?.length) {
    return <div className="rounded-xl border border-gold/15 bg-xuan-surface/40 p-6 text-center text-paper-dark/65">人生 K 线图加载中...</div>;
  }

  const x = age => 40 + (age / 100) * 720;
  const y = score => 210 - ((score - 20) / 75) * 180;
  const path = points.map((item, index) => `${index === 0 ? 'M' : 'L'} ${x(item.age).toFixed(1)} ${y(item.score).toFixed(1)}`).join(' ');
  const dots = points.filter((_, index) => index % 5 === 0);
  const peak = points.reduce((best, item) => item.score > best.score ? item : best, points[0]);
  const trough = points.reduce((best, item) => item.score < best.score ? item : best, points[0]);
  const current = points.find(item => item.age === highlightAge);

  return (
    <div className="space-y-4 rounded-xl border border-gold/15 bg-xuan-surface/40 p-4">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 800 240" className="min-w-[500px] w-full" preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map(score => {
            const yy = 210 - (score / 100) * 180;
            return (
              <g key={score}>
                <line x1="40" y1={yy} x2="760" y2={yy} stroke="#c9a96e" strokeOpacity="0.12" strokeDasharray="3 3" />
                <text x="34" y={yy + 4} textAnchor="end" fontSize="10" fill="#c9a96e" opacity="0.6">{score}</text>
              </g>
            );
          })}
          {[0, 20, 40, 60, 80, 100].map(age => {
            const xx = x(age);
            return (
              <g key={age}>
                <line x1={xx} y1="210" x2={xx} y2="214" stroke="#c9a96e" opacity="0.4" />
                <text x={xx} y="226" textAnchor="middle" fontSize="10" fill="#d4c5a9" opacity="0.7">{age}岁</text>
              </g>
            );
          })}
          <line x1="40" y1="138" x2="760" y2="138" stroke="#c9a96e" strokeOpacity="0.3" strokeDasharray="6 4" />
          <path d={path} fill="none" stroke="#C9A96E" strokeWidth="2" />
          {dots.map(item => <circle key={item.age} cx={x(item.age)} cy={y(item.score)} r="2.5" fill="#C9A96E" opacity="0.7" />)}
          <circle cx={x(peak.age)} cy={y(peak.score)} r="6" fill="#C43D3D" />
          <text x={x(peak.age)} y={y(peak.score) - 12} textAnchor="middle" fontSize="11" fill="#D65D5D" fontWeight="bold">高峰 {peak.year}</text>
          <circle cx={x(trough.age)} cy={y(trough.score)} r="6" fill="#7BA686" />
          <text x={x(trough.age)} y={y(trough.score) + 18} textAnchor="middle" fontSize="11" fill="#A3C5AB" fontWeight="bold">低谷 {trough.year}</text>
          {current && (
            <g>
              <circle cx={x(current.age)} cy={y(current.score)} r="5" fill="#fff" stroke="#C9A96E" strokeWidth="2" />
              <text x={x(current.age)} y={y(current.score) - 12} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">您此刻</text>
            </g>
          )}
        </svg>
      </div>
      <p className="text-center text-sm leading-relaxed text-paper-dark/85">此图以传统命理结构作阶段性参考，分数高低代表阶段气势起伏，不作绝对吉凶论断。</p>
    </div>
  );
}

function UnlockCard({ result, price, currentAge, onUnlock }) {
  return (
    <Card className="relative overflow-hidden border-2 border-gold/50 bg-gradient-to-br from-xuan-card via-xuan-surface/80 to-xuan-card">
      {result?.lifeline && (
        <div className="pointer-events-none absolute inset-0 opacity-20 blur-sm">
          <LifeLineChart data={result.lifeline} highlightAge={currentAge} />
        </div>
      )}
      <div className="relative space-y-5 px-2 py-4 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-gold/50 bg-gold/15">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z" /></svg>
        </div>
        <div>
          <h2 className="font-display text-3xl text-gold">解锁完整命理</h2>
          <p className="mt-1 text-sm tracking-widest text-gold/85">下方所有内容仅需 ¥{price} 一次解锁，本次命盘终身可看</p>
        </div>
        <p className="font-display text-5xl text-vermillion-light drop-shadow-[0_0_20px_rgba(196,61,61,0.4)]">¥ {price}</p>
        <ul className="mx-auto grid max-w-md gap-3 text-left text-base text-paper">
          {[
            ['人生 K 线图', '100 年逐年运势曲线，看清一生起伏'],
            ['师父深度开示', '事业 / 财运 / 感情 / 健康 四大核心，每段含古籍引证'],
            ['10 步大运推演', '每步十年，吉凶用神配合详解'],
            ['流年逐月走势', '今年 12 个月吉凶时机 + 明年预告'],
            ['古籍引证', '《渊海子平》《滴天髓》《三命通会》等经典'],
          ].map(([title, text]) => (
            <li key={title} className="flex items-start gap-2">
              <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-gold" />
              <span><span className="font-display text-gold">{title}</span> · {text}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onUnlock} className="mx-auto mt-3 flex w-full max-w-sm items-center justify-center rounded-lg bg-vermillion px-6 py-3 text-lg text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M17 8H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6" /></svg>
          解锁全部命理 ¥{price}
        </button>
        <p className="text-xs text-paper-dark/60">一次付费 · 立即解锁 · 本次命盘终身可看</p>
      </div>
    </Card>
  );
}

function DeepReading({ activeTab, readings, onTabChange }) {
  const reading = readings[activeTab] || {};
  const tabLabel = DETAIL_TABS.find(item => item.value === activeTab)?.label || '命理深度分析';

  return (
    <Card className="space-y-6 border-gold/40 bg-xuan-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="animate-brush-reveal text-3xl text-gold">师父开示</h2>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-900/15 px-3 py-1 text-xs text-emerald-300">已解锁完整解读</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {reading.master && <Badge>{reading.master}</Badge>}
        <Badge>{reading.loading ? '命理开示中' : '静候开示'}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {DETAIL_TABS.map(tab => (
          <button key={tab.value} type="button" onClick={() => onTabChange(tab.value)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-base transition-colors', activeTab === tab.value ? 'border-gold/50 bg-gold/10 text-gold' : 'border-gold/20 text-paper hover:text-gold')}>
            {tab.label}
          </button>
        ))}
      </div>
      {reading.error && <div className="rounded-lg border border-vermillion/40 bg-vermillion/10 p-3 text-base text-vermillion-light">{reading.error}</div>}
      <div className="rounded-lg bg-xuan-surface/40 p-4">
        <h3 className="font-display text-gold text-sm mb-2">{reading.master || '慧明长老'} · {tabLabel}</h3>
        {reading.loading && !reading.text && <p className="text-sm text-paper-dark/60">师父正在入定...</p>}
        {reading.text ? <p className="whitespace-pre-line text-base leading-loose text-paper-dark/85">{reading.text}</p> : !reading.loading && <p className="text-base text-paper-dark/65">稍候片刻，开示即至。</p>}
      </div>
      {(reading.references || []).length > 0 && (
        <div className="space-y-3">
          {reading.references.map((ref, index) => (
            <blockquote key={`${ref.book}-${ref.chapter}-${index}`} className="border-l-4 border-gold/50 bg-xuan-surface px-4 py-2 italic text-paper">
              <span className="text-gold">《{ref.book}·{ref.chapter}》：</span>{ref.quote}
            </blockquote>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Bazi() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [master, setMaster] = useState(() => {
    try {
      const stored = window.localStorage.getItem('lingji_master_v1') || window.localStorage.getItem('putiyuan_master_v1');
      return MASTERS.some(item => item.id === stored) ? stored : 'huiming';
    } catch {
      return 'huiming';
    }
  });
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [price, setPrice] = useState('6.6');
  const [activeTab, setActiveTab] = useState('personality');
  const [readings, setReadings] = useState({});

  const currentAge = result ? Math.max(1, CURRENT_YEAR - form.birth_year) : undefined;

  const loadHistory = useCallback(() => {
    auth.history.list('bazi', 5)
      .then(data => setHistory((data?.items || data || []).map(item => ({
        title: item.title,
        subtitle: item.subtitle,
        payload: item.payload,
      }))))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    loadHistory();
    payment.prices()
      .then(data => {
        const product = (data?.products || []).find(item => item.product_id === 'unlock_bazi');
        if (product?.current_price) setPrice(String(product.current_price));
      })
      .catch(() => {});
  }, [loadHistory]);

  const handleMasterChange = useCallback((next) => {
    setMaster(next);
    try {
      window.localStorage.setItem('lingji_master_v1', next);
    } catch {
      // Local storage is optional.
    }
  }, []);

  useEffect(() => {
    if (!result?.session_id) return;
    entitlement.unlockCheck('unlock_bazi', result.session_id)
      .then(data => setUnlocked(Boolean(data?.unlocked)))
      .catch(() => setUnlocked(false));
  }, [result?.session_id]);

  const sessionId = result?.session_id;
  const requestAnalysis = useCallback((category) => {
    if (!sessionId) return;
    setReadings(prev => {
      const current = prev[category];
      if (current?.loading || current?.text) return prev;
      return { ...prev, [category]: { text: '', references: [], loading: true, error: '', master: null } };
    });
    bazi.analyzeSSE({ session_id: sessionId, category, master_id: master }, {
      onMeta: meta => setReadings(prev => ({ ...prev, [category]: { ...(prev[category] || {}), master: meta.master_name || '慧明长老' } })),
      onThinking: () => setReadings(prev => ({ ...prev, [category]: { ...(prev[category] || {}), loading: true } })),
      onToken: text => setReadings(prev => ({ ...prev, [category]: { ...(prev[category] || {}), text: `${prev[category]?.text || ''}${text}`, loading: false } })),
      onReference: ref => setReadings(prev => ({ ...prev, [category]: { ...(prev[category] || {}), references: [...(prev[category]?.references || []), ref] } })),
      onDone: () => setReadings(prev => ({ ...prev, [category]: { ...(prev[category] || {}), loading: false } })),
    }).catch(err => setReadings(prev => ({ ...prev, [category]: { ...(prev[category] || {}), loading: false, error: err.message || '开示暂不可用，请稍后再试' } })));
  }, [master, sessionId]);

  useEffect(() => {
    if (!unlocked || !sessionId) return undefined;
    const reading = readings[activeTab];
    if (reading?.loading || reading?.text) return undefined;
    const timer = window.setTimeout(() => requestAnalysis(activeTab), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, readings, requestAnalysis, sessionId, unlocked]);

  async function handleSubmit() {
    setError('');
    setResult(null);
    setReadings({});
    setUnlocked(false);
    setActiveTab('personality');
    setLoading(true);
    setAnimating(true);
    try {
      const delay = new Promise(resolve => window.setTimeout(resolve, 4200));
      const data = await bazi.calculate({ ...form, master });
      await delay;
      setResult(data);
      auth.history.push(
        'bazi',
        `${data.bazi.year.gan}${data.bazi.year.zhi} ${data.bazi.month.gan}${data.bazi.month.zhi} ${data.bazi.day.gan}${data.bazi.day.zhi} ${data.bazi.hour.gan}${data.bazi.hour.zhi}`,
        data.lunar_birthday,
        { form, result: data }
      ).then(loadHistory).catch(() => {});
    } catch (err) {
      setError(err.message || '排盘服务暂不可用，请稍后重试');
    } finally {
      setLoading(false);
      setAnimating(false);
    }
  }

  function resetResult() {
    setResult(null);
    setReadings({});
    setUnlocked(false);
    setError('');
  }

  const flowYear = result?.flow_year || result?.year_2026;

  return (
    <div className="mx-auto max-w-5xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg className="size-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M 8 12 C 8 8 12 4 12 4 C 12 4 16 8 16 12" />
              <path d="M 6 16 L 18 16" />
              <path d="M 7 10 L 17 10" />
              <path d="M 12 4 L 12 20" />
            </svg>
          </div>
          <h1 className="text-4xl text-gold">八字精批</h1>
          <p className="text-base text-paper-dark/85">输入生辰，洞悉天命，先看命盘，再看流年。</p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.1}>
        <Card>
          <MasterPanel value={master} onChange={handleMasterChange} />
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <Card className="space-y-5">
          <BirthForm value={form} onChange={setForm} />
          {error && <div className="rounded-lg border border-vermillion/40 bg-vermillion/10 p-3 text-base text-vermillion-light">{error}</div>}
          <div className="flex justify-center">
            <button onClick={handleSubmit} disabled={loading || animating} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg bg-vermillion px-8 h-12 text-lg font-medium tracking-wider text-white shadow-lg shadow-vermillion/20 transition-all duration-fast hover:bg-vermillion-light active:bg-vermillion-dark disabled:cursor-not-allowed disabled:opacity-50">
              <span>{loading || animating ? '师父排盘中...' : '请师父排盘'}</span>
            </button>
          </div>
        </Card>
      </ScrollReveal>

      {animating && (
        <ScrollReveal delay={0.2}>
          <Card className="border-gold/40 bg-xuan-card/95">
            <FortuneLoading active={animating} onComplete={() => {}} />
          </Card>
        </ScrollReveal>
      )}

      {history.length > 0 && !result && !animating && (
        <ScrollReveal delay={0.2}>
          <Card className="space-y-3">
            <h2 className="font-display text-xl text-gold">历史排盘</h2>
            <div className="grid gap-2">
              {history.slice(0, 5).map((item, index) => (
                <button key={`${item.title}-${index}`} type="button" onClick={() => { setUnlocked(false); setReadings({}); setForm(item.payload.form); setResult(item.payload.result); }} className="rounded-lg border border-gold/15 bg-xuan-surface/40 px-3 py-2 text-left text-sm hover:border-gold/40">
                  <span className="text-gold">{item.title}</span>
                  {item.subtitle && <span className="ml-2 text-paper-dark/70">{item.subtitle}</span>}
                </button>
              ))}
            </div>
          </Card>
        </ScrollReveal>
      )}

      {result && (
        <>
          <ScrollReveal delay={0.2}>
            <Card className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl text-gold">八字四柱</h2>
                <p className="text-base text-paper-dark/85">{result.day_master} 命，生于 {result.lunar_birthday}</p>
              </div>
              <BaziChart bazi={result.bazi} />
              <div className="flex flex-wrap justify-center gap-2">
                <Badge>{result.pattern}</Badge>
                <Badge>{result.day_master_strength}</Badge>
                {(result.shen_sha || []).map(item => <Badge key={item.name}>{item.name}</Badge>)}
              </div>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Card className="space-y-6">
              <h2 className="text-3xl text-gold">五行分析</h2>
              <div className="grid gap-6 md:grid-cols-[320px_1fr] md:items-center">
                <WuxingRadar detail={result.wuxing_detail || []} dayMaster={result.day_master} />
                <div className="space-y-3">
                  {(result.wuxing_detail || []).map(item => (
                    <div key={item.element} className="rounded-lg border border-gold/15 bg-xuan-surface/50 p-3">
                      <div className="flex items-center justify-between">
                        <Badge tone={item.element}>{item.element}</Badge>
                        <span className="font-number text-lg text-gold">{item.score}</span>
                      </div>
                      <p className="mt-2 text-base text-paper-dark/85">{item.description} · 数量 {item.count}</p>
                    </div>
                  ))}
                  <p className="text-base text-paper-dark">
                    喜用神：<span className="text-gold">{(result.yong_shen || []).join('、') || '-'}</span> ｜ 忌神：<span className="text-vermillion">{(result.ji_shen || []).join('、') || '-'}</span>
                  </p>
                </div>
              </div>
            </Card>
          </ScrollReveal>

          {!unlocked && (
            <ScrollReveal delay={0.4}>
              <UnlockCard result={result} price={price} currentAge={currentAge} onUnlock={() => setPayOpen(true)} />
            </ScrollReveal>
          )}

          {unlocked && result.lifeline && (
            <ScrollReveal delay={0.4}>
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl text-gold">人生 K 线图</h2>
                  <Badge>100 年逐年评分</Badge>
                </div>
                <LifeLineChart data={result.lifeline} highlightAge={currentAge} />
              </Card>
            </ScrollReveal>
          )}

          {unlocked && (
            <ScrollReveal delay={0.5}>
              <DeepReading activeTab={activeTab} readings={readings} onTabChange={setActiveTab} />
            </ScrollReveal>
          )}

          {unlocked && result.luck_pillars && (
            <ScrollReveal delay={0.6}>
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-3xl text-gold">大运流年</h2>
                  {result.current_luck?.pillar && <Badge>当前大运：{result.current_luck.pillar.gan}{result.current_luck.pillar.zhi}</Badge>}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {result.luck_pillars.map(item => (
                    <div key={`${item.start_year}-${item.pillar.gan}`} className="min-w-[220px] rounded-lg border border-gold/15 bg-xuan-surface/50 p-4">
                      <p className="font-display text-lg text-gold">{item.pillar.gan}{item.pillar.zhi}</p>
                      <p className="text-sm text-paper-dark/80">{item.start_year} 年起 · {item.age_range[0]}-{item.age_range[1]} 岁</p>
                      <p className="mt-3 text-base text-paper-dark/85">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </ScrollReveal>
          )}

          {unlocked && flowYear && (
            <ScrollReveal delay={0.7}>
              <Card className="space-y-4">
                <h2 className="text-3xl text-gold">{flowYear.title}</h2>
                <p className="text-base leading-loose text-paper-dark/85">{flowYear.summary}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {(flowYear.monthly || []).map(item => (
                    <div key={item.month} className="rounded-lg border border-gold/15 bg-xuan-surface/40 p-3">
                      <p className="font-display text-lg text-gold">{item.month}</p>
                      <p className="mt-1 text-base text-paper-dark/85">{item.outlook}</p>
                    </div>
                  ))}
                </div>
                {result.next_year && (
                  <details className="rounded-lg border border-gold/15 bg-xuan-surface/30 p-4">
                    <summary className="cursor-pointer font-display text-lg text-gold">展开看 {result.next_year.title}</summary>
                    <p className="mt-3 text-base leading-loose text-paper-dark/85">{result.next_year.summary}</p>
                  </details>
                )}
              </Card>
            </ScrollReveal>
          )}

          <div className="text-center">
            <button type="button" onClick={resetResult} className="inline-flex items-center justify-center rounded-lg border border-gold/30 px-6 py-2.5 text-sm text-gold transition-colors hover:bg-gold/10">重新排盘</button>
          </div>
        </>
      )}

      <PaymentModal
        open={payOpen}
        productId="unlock_bazi"
        title="八字精批完整解锁"
        extras={{ session_id: result?.session_id }}
        onClose={() => setPayOpen(false)}
        onPaid={() => {
          setUnlocked(true);
          setPayOpen(false);
        }}
      />
    </div>
  );
}
