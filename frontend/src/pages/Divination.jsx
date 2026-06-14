import { useState } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { MasterSelector } from '../components/feature/MasterSelector';
import { divination } from '../api/client';

function LotTube({ shaking }) {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[340px] overflow-hidden rounded-3xl border border-gold/25 shadow-[0_8px_32px_rgba(0,0,0,0.6)]" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(193,143,55,0.18), transparent 50%), linear-gradient(180deg, #150f08 0%, #1c130b 50%, #0a0604 100%)' }}>
      <div className="absolute inset-x-0 top-3 z-20 text-center text-xs tracking-[0.36em] text-gold/85">━━ 关圣帝君 · 灵签筒 ━━</div>
      <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center">
        <div className="relative h-[240px] w-[140px]">
          <div className="absolute inset-x-0 bottom-0 h-[200px] rounded-t-[32px] rounded-b-lg shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]" style={{ background: 'linear-gradient(90deg, #5a3818 0%, #8b5a2b 12%, #a87142 22%, #d4a464 35%, #a87142 50%, #8b5a2b 65%, #6b421f 78%, #4a2d14 100%)' }}>
            <div className="absolute inset-x-0 top-0 h-3 rounded-t-[32px] shadow-[0_2px_4px_rgba(0,0,0,0.4)]" style={{ background: 'linear-gradient(to right, #92400e, #fcd34d, #92400e)' }} />
            <div className="absolute inset-x-0 bottom-0 h-3 rounded-b-lg" style={{ background: 'linear-gradient(to right, #b45309, #fbbf24, #b45309)' }} />
            <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/80 bg-amber-700/30 flex items-center justify-center">
              <span className="font-display text-xl text-amber-200">籤</span>
            </div>
          </div>
          <div className={`absolute inset-x-0 top-[40px] z-20 flex justify-center gap-[2px] px-3 ${shaking ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}>
            {[10, 18, 14, 22, 26, 30, 28, 24, 20, 16, 12].map((h, i) => (
              <div key={i} className="origin-bottom rounded-t-sm relative" style={{ width: '5px', height: `${h}px`, background: 'linear-gradient(to top, #8b5a2b, #d4a464 40%, #f0d894)', transform: `rotate(${i - 5}deg)`, boxShadow: '0 0 2px rgba(0,0,0,0.4)' }}>
                <div className="absolute -top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-vermillion" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Divination() {
  const [master, setMaster] = useState('huiming');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiMaster, setAiMaster] = useState(null);
  const [showAi, setShowAi] = useState(false);

  async function handleCast() {
    if (!question.trim()) return;
    setLoading(true);
    setShowAi(false);
    setAiText('');
    setShaking(true);
    setTimeout(async () => {
      try {
        const data = await divination.cast(question.trim());
        setShaking(false);
        setResult(data);
      } catch (e) {
        setShaking(false);
        alert(e.message);
      } finally {
        setLoading(false);
      }
    }, 1500);
  }

  function handleInterpret() {
    if (!result) return;
    setShowAi(true);
    setAiText('');
    setAiThinking(false);
    setAiMaster(null);
    divination.interpretSSE({ session_id: result.session_id, question, master_id: master }, {
      onMeta: (m) => setAiMaster(m.master_name || '慧明长老'),
      onThinking: () => setAiThinking(true),
      onToken: (text) => { setAiText(prev => prev + text); setAiThinking(false); },
      onDone: () => setLoading(false),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">六爻占卜</h1>
          <p className="text-base text-paper">心诚则灵 · 摇动签筒 · 六爻成卦</p>
          <div className="flex justify-center pt-2"><div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-xuan-surface/40 px-3 py-1.5 text-xs text-paper-dark/70">登录后查看每日免费配额</div></div>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.1}>
        <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card">
          <MasterSelector selected={master} onChange={setMaster} />
        </div>
      </ScrollReveal>

      {!result ? (
        <>
          <ScrollReveal delay={0.15}>
            <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4 text-center">
              <p className="text-base text-paper">默念心中所问，写下您要问的事</p>
              <div className="mx-auto max-w-md">
                <input className="rounded-md border border-gold/20 bg-xuan-surface px-3 text-paper-dark placeholder:text-ink-muted transition-all duration-fast focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 h-14 font-display tracking-widest text-center text-base w-full" placeholder="例如：这次出行是否顺利？" value={question} onChange={e => setQuestion(e.target.value)} />
              </div>
              <p className="text-sm text-paper/75">先静心默念，再摇签筒，一卦一事。</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-6">
              <LotTube shaking={shaking} />
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={handleCast} disabled={loading || !question.trim()} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark h-12 px-8 text-lg">
                  <span>{loading ? '摇签中...' : '摇动签筒'}</span>
                </button>
              </div>
            </div>
          </ScrollReveal>
        </>
      ) : (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4 text-center">
            <div className="text-4xl">☯️</div>
            <h2 className="font-display text-2xl text-gold">{result.hexagram_name || '六爻卦象'}</h2>
            {result.yao_lines && (
              <div className="flex flex-col items-center gap-1 py-2">
                {result.yao_lines.map((line, i) => (
                  <div key={i} className={`h-2 rounded-full ${line === 1 ? 'w-24 bg-gold' : 'flex gap-2 w-24'}`}>
                    {line === 0 && <><div className="h-2 flex-1 rounded-full bg-gold" /><div className="h-2 flex-1 rounded-full bg-gold" /></>}
                  </div>
                ))}
              </div>
            )}
            {!showAi && (
              <button onClick={handleInterpret} className="inline-flex items-center justify-center gap-2 rounded-lg bg-vermillion px-6 py-2.5 text-sm text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                请师父解卦
              </button>
            )}

            {showAi && (
              <div className="rounded-lg bg-xuan-surface/40 p-4 text-left">
                <h3 className="font-display text-gold text-sm mb-2">{aiMaster || '慧明长老'} 解卦</h3>
                {aiThinking && !aiText && <p className="text-xs text-paper-dark/50">师父正在观卦...</p>}
                {aiText && <p className="text-xs text-paper-dark/70 leading-relaxed whitespace-pre-line">{aiText}</p>}
              </div>
            )}

            <button onClick={() => { setResult(null); setQuestion(''); setShowAi(false); setAiText(''); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors">再占一卦</button>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
