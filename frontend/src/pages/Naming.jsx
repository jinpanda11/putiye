import { useState } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { naming } from '../api/client';

const HOURS = [
  { id: 'zi', label: '子时 (23:00-01:00)' },
  { id: 'chou', label: '丑时 (01:00-03:00)' },
  { id: 'yin', label: '寅时 (03:00-05:00)' },
  { id: 'mao', label: '卯时 (05:00-07:00)' },
  { id: 'chen', label: '辰时 (07:00-09:00)' },
  { id: 'si', label: '巳时 (09:00-11:00)' },
  { id: 'wu', label: '午时 (11:00-13:00)' },
  { id: 'wei', label: '未时 (13:00-15:00)' },
  { id: 'shen', label: '申时 (15:00-17:00)' },
  { id: 'you', label: '酉时 (17:00-19:00)' },
  { id: 'xu', label: '戌时 (19:00-21:00)' },
  { id: 'hai', label: '亥时 (21:00-23:00)' },
];

const STYLES = ['诗意', '刚毅', '儒雅', '清逸', '典雅', '温润'];

const FEATURES = [
  { icon: '✦', title: '真排八字 · 平衡五行', desc: '补喜忌、避冲克' },
  { icon: '✦', title: '字字考究 · 古籍典出', desc: '《诗经》《楚辞》《论语》' },
  { icon: '✦', title: '音韵铿锵 · 笔画吉数', desc: '避同音、忌生僻' },
  { icon: '✦', title: '完整 30 个候选', desc: '每名附释义 / 五行 / 出处' },
];

function Stepper({ label, value, onMinus, onPlus, min, max, unit }) {
  return (
    <div className="relative space-y-2">
      <p className="text-sm text-paper-dark/75">{label}</p>
      <div className="relative flex h-16 items-stretch overflow-visible rounded-xl border border-gold/30 bg-xuan-surface">
        <button type="button" onClick={onMinus} disabled={value <= min} className="flex w-12 items-center justify-center text-paper-dark hover:bg-gold/10 active:bg-gold/15 disabled:opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <button type="button" onClick={() => { const v = prompt(`输入${label}`, value); if (v) { const n = parseInt(v); if (n >= min && n <= max) onPlus(0, n); } }} className="flex flex-1 flex-col items-center justify-center transition-colors hover:bg-gold/5 active:bg-gold/10">
          <span className="font-number text-2xl text-gold">{value}{unit}</span>
          <span className="text-[10px] text-paper-dark/45">点击选择</span>
        </button>
        <button type="button" onClick={onPlus} disabled={value >= max} className="flex w-12 items-center justify-center text-paper-dark hover:bg-gold/10 active:bg-gold/15 disabled:opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="m18 15-6-6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}

export function Naming() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState('wu');
  const [gender, setGender] = useState('male');
  const [surname, setSurname] = useState('李');
  const [wordCount, setWordCount] = useState(2);
  const [styles, setStyles] = useState(['诗意']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function toggleStyle(s) {
    setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit() {
    if (!surname.trim()) return;
    setLoading(true);
    try {
      const data = await naming.generate({
        surname: surname.trim(),
        gender,
        birth_year: year,
        birth_month: month,
        birth_day: day,
        birth_hour: hour,
        word_count: wordCount,
        styles,
      });
      setResult(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-section px-4 pb-24">
      <section className="space-y-4 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg className="size-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 12 2 L 12 6" /><path d="M 4.93 4.93 L 7.76 7.76" /><path d="M 2 12 L 6 12" /><path d="M 19.07 4.93 L 16.24 7.76" /><path d="M 22 12 L 18 12" />
              <circle cx="12" cy="14" r="5" /><path d="M 9 22 L 15 22" /><path d="M 10 19 L 14 19" />
            </svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">宝宝起名</h1>
          <p className="text-paper-dark/85 text-base leading-loose md:text-lg">
            名字伴随孩子一生 — 影响性情、姻缘、事业、贵人。<br className="hidden sm:inline" />一个好名字，是父母给孩子最早的福报。
          </p>
          <div className="mx-auto grid max-w-2xl gap-2 pt-2 text-left text-sm text-paper-dark/85 md:grid-cols-2 md:text-base">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-gold/15 bg-xuan-surface/40 px-3 py-2">
                <span className="text-gold">{f.icon}</span>
                <span><span className="font-display text-gold">{f.title}</span>：{f.desc}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {!result ? (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_200px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Stepper label="出生年" value={year} min={2020} max={2030} unit="年" onMinus={() => setYear(y => Math.max(2020, y - 1))} onPlus={(_, v) => v !== undefined ? setYear(v) : setYear(y => Math.min(2030, y + 1))} />
                  <Stepper label="出生月" value={month} min={1} max={12} unit="月" onMinus={() => setMonth(m => Math.max(1, m - 1))} onPlus={(_, v) => v !== undefined ? setMonth(v) : setMonth(m => Math.min(12, m + 1))} />
                  <Stepper label="出生日" value={day} min={1} max={31} unit="日" onMinus={() => setDay(d => Math.max(1, d - 1))} onPlus={(_, v) => v !== undefined ? setDay(v) : setDay(d => Math.min(31, d + 1))} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-paper-dark/75">出生时辰</span>
                    <select className="h-16 w-full rounded-xl border border-gold/30 bg-xuan-surface px-4 text-lg text-paper-dark focus:border-gold focus:outline-none" value={hour} onChange={e => setHour(e.target.value)}>
                      {HOURS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                    </select>
                  </label>
                  <div className="space-y-2">
                    <p className="text-sm text-paper-dark/75">性别</p>
                    <div className="flex h-16 items-stretch overflow-hidden rounded-xl border border-gold/30 bg-xuan-surface">
                      <button type="button" onClick={() => setGender('male')} className={`flex flex-1 items-center justify-center text-lg transition-colors ${gender === 'male' ? 'bg-gold/15 text-gold' : 'text-paper-dark hover:bg-gold/5'}`}>男</button>
                      <button type="button" onClick={() => setGender('female')} className={`flex flex-1 items-center justify-center text-lg transition-colors ${gender === 'female' ? 'bg-gold/15 text-gold' : 'text-paper-dark hover:bg-gold/5'}`}>女</button>
                    </div>
                  </div>
                </div>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-paper-dark/70">姓氏</span>
                <input className="h-16 rounded-xl border border-gold/30 bg-xuan-surface px-4 text-2xl text-gold font-display text-center focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 w-full" maxLength="2" value={surname} onChange={e => setSurname(e.target.value)} />
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-paper-dark/70">姓名总字数（含姓）</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setWordCount(2)} className={`rounded-full border px-4 py-2 text-sm transition-colors duration-fast ${wordCount === 2 ? 'border-gold/40 bg-gold/10 text-gold' : 'border-gold/20 text-paper-dark'}`}>2 字（如 李安）</button>
                <button type="button" onClick={() => setWordCount(3)} className={`rounded-full border px-4 py-2 text-sm transition-colors duration-fast ${wordCount === 3 ? 'border-gold/40 bg-gold/10 text-gold' : 'border-gold/20 text-paper-dark'}`}>3 字（如 李思远）</button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-paper-dark/70">偏好风格</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button key={s} type="button" onClick={() => toggleStyle(s)} className={`rounded-full border px-4 py-2 text-sm transition-colors duration-fast ${styles.includes(s) ? 'border-gold/40 bg-gold/10 text-gold' : 'border-gold/20 text-paper-dark/75'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={handleSubmit} disabled={loading || !surname.trim()} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark h-12 px-8 text-lg">
                <span>{loading ? '起名中...' : '请师父起名'}</span>
              </button>
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4 text-center">
            <div className="text-4xl">🌟</div>
            <h2 className="font-display text-2xl text-gold">为您推荐的姓名</h2>
            {result.names && result.names.length > 0 ? (
              <div className="space-y-3">
                {result.names.map((n, i) => (
                  <div key={i} className="rounded-lg bg-xuan-surface/40 p-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl text-gold">{n.full_name || n.name || `候选 ${i + 1}`}</span>
                      <div className="flex gap-1 text-xs">
                        {n.wuxing_score != null && <span className={`rounded px-1.5 py-0.5 ${n.wuxing_score >= 80 ? 'bg-green-900/30 text-green-300' : 'bg-gold/10 text-gold'}`}>五{n.wuxing_score}</span>}
                        {n.phonetic_score != null && <span className={`rounded px-1.5 py-0.5 ${n.phonetic_score >= 80 ? 'bg-green-900/30 text-green-300' : 'bg-gold/10 text-gold'}`}>音{n.phonetic_score}</span>}
                        {n.stroke_score != null && <span className={`rounded px-1.5 py-0.5 ${n.stroke_score >= 80 ? 'bg-green-900/30 text-green-300' : 'bg-gold/10 text-gold'}`}>笔{n.stroke_score}</span>}
                      </div>
                    </div>
                    {(n.name_meaning || n.description) && <p className="mt-1 text-sm text-paper-dark/70">{n.name_meaning || n.description}</p>}
                    {n.pinyin && <p className="text-xs text-paper-dark/50 mt-0.5">拼音：{n.pinyin}</p>}
                    {n.poem_ref && <p className="text-xs text-paper-dark/50">出处：{n.poem_ref}</p>}
                    {n.wuxing_analysis && <p className="text-xs text-paper-dark/50">五行：{n.wuxing_analysis}</p>}
                    {n.total_stroke != null && n.total_stroke > 0 && <p className="text-xs text-paper-dark/50">总笔画：{n.total_stroke}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-paper-dark/65">暂无结果</p>
            )}
            <button onClick={() => setResult(null)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors">重新起名</button>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
