import { useMemo, useState } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { MasterSelector } from '../components/feature/MasterSelector';
import { lottery } from '../api/client';

function DrawingTube({ phase }) {
  const sticks = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const x = ((index + 0.5) / 12 - 0.5) * 70;
    return { x, tilt: 0.06 * x, height: 36 + (index % 3) * 5 };
  }), []);
  const isMoving = phase === 'shaking' || phase === 'popping';

  return (
    <div
      className="relative mx-auto h-[300px] w-full max-w-[300px] overflow-hidden rounded-3xl border border-gold/25 shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(193,143,55,0.18), transparent 50%), linear-gradient(180deg, #150f08 0%, #1c130b 50%, #0a0604 100%)',
      }}
    >
      <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="ls-bamboo-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5a3818" />
            <stop offset="20%" stopColor="#a87142" />
            <stop offset="50%" stopColor="#d4a464" />
            <stop offset="80%" stopColor="#a87142" />
            <stop offset="100%" stopColor="#3a2310" />
          </linearGradient>
          <linearGradient id="ls-bamboo-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#7c4f1a" />
          </linearGradient>
          <linearGradient id="ls-stick" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#a87142" />
          </linearGradient>
          <radialGradient id="ls-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
          </radialGradient>
        </defs>

        {isMoving && (
          <circle cx="150" cy="150" r="120" fill="url(#ls-glow)" className="lottery-svg-glow" />
        )}

        <text x="150" y="26" textAnchor="middle" fontSize="11" letterSpacing="3" fill="rgba(201,160,92,0.85)" fontFamily='"STKaiti", "KaiTi", serif'>
          ━━ 关圣帝君 · 灵签筒 ━━
        </text>

        {phase === 'popping' && (
          <g className="lottery-svg-fly-stick">
            <rect x="148" y="60" width="4" height="70" rx="2" fill="url(#ls-stick)" stroke="#7c4f1a" strokeWidth="0.5" />
            <circle cx="150" cy="62" r="2.5" fill="#dc2626" stroke="#7c4f1a" strokeWidth="0.4" />
            <text x="150" y="92" textAnchor="middle" fontSize="9" fontFamily='"STKaiti", "KaiTi", serif' fontWeight="bold" fill="#3a1f0a" writingMode="vertical-rl">
              中
            </text>
          </g>
        )}

        <g
          className={phase === 'shaking' ? 'lottery-svg-tube-shake' : phase === 'popping' ? 'lottery-svg-tube-pop' : ''}
          style={{ transformOrigin: '150px 240px' }}
        >
          <ellipse cx="150" cy="278" rx="62" ry="4" fill="rgba(0,0,0,0.5)" />
          <path d="M 100 100 Q 100 180 100 250 L 200 250 Q 200 180 200 100 Z" fill="url(#ls-bamboo-body)" stroke="#3a2310" strokeWidth="1.5" />
          <path d="M 105 105 L 118 105 L 118 245 L 105 245 Z" fill="rgba(255,230,180,0.18)" />
          <ellipse cx="150" cy="100" rx="50" ry="6" fill="url(#ls-bamboo-rim)" stroke="#3a2310" strokeWidth="1" />
          <ellipse cx="150" cy="100" rx="42" ry="4" fill="#0a0604" />
          <rect x="97" y="246" width="106" height="9" rx="3" fill="url(#ls-bamboo-rim)" stroke="#3a2310" strokeWidth="1" />
          <line x1="104" y1="155" x2="196" y2="155" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <line x1="104" y1="205" x2="196" y2="205" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <g transform="translate(150, 180)">
            <circle r="20" fill="rgba(168,35,24,0.85)" stroke="#fcd34d" strokeWidth="2" />
            <text x="0" y="7" textAnchor="middle" fontSize="20" fontFamily='"STKaiti", "KaiTi", serif' fontWeight="bold" fill="#fcd34d">
              籤
            </text>
          </g>
          {phase !== 'popping' && (
            <g className={phase === 'shaking' ? 'lottery-svg-stick-jitter' : ''}>
              {sticks.map((stick, index) => (
                <g key={index} transform={`translate(${150 + stick.x}, 100) rotate(${stick.tilt})`}>
                  <rect x="-0.9" y={-stick.height} width="1.8" height={stick.height} rx="0.4" fill="url(#ls-stick)" />
                  <circle cx="0" cy={-stick.height} r="1.2" fill="#dc2626" />
                </g>
              ))}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function Lottery() {
  const [master, setMaster] = useState('huiming');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawPhase, setDrawPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiMaster, setAiMaster] = useState(null);
  const [showAi, setShowAi] = useState(false);

  async function handleDraw() {
    if (!question.trim()) return;
    setLoading(true);
    setShowAi(false);
    setAiText('');
    setResult(null);
    setDrawPhase('shaking');
    try {
      const [draw] = await Promise.all([
        lottery.draw(question.trim()),
        wait(1600),
      ]);
      setDrawPhase('popping');
      await wait(1150);
      setResult({ draw, interpret: null });
    } catch (e) {
      alert(e.message);
    } finally {
      setDrawPhase('idle');
      setLoading(false);
    }
  }

  function handleInterpret() {
    if (!result) return;
    setShowAi(true);
    setAiText('');
    setAiThinking(false);
    setAiMaster(null);
    lottery.interpretSSE({ session_id: result.draw.session_id, question, master_id: master }, {
      onMeta: (m) => setAiMaster(m.master_name || '慧明长老'),
      onThinking: () => setAiThinking(true),
      onToken: (text) => { setAiText(prev => prev + text); setAiThinking(false); },
      onDone: () => setLoading(false),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">关帝灵签</h1>
          <p className="text-base text-paper-dark/80">心诚则灵 · 默念所求 · 抽一支签</p>
          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-xuan-surface/40 px-3 py-1.5 text-xs text-paper-dark/70">登录后查看每日免费配额</div>
          </div>
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
              <p className="text-base text-paper-dark/80">写下您要问的事，心诚则灵</p>
              <input className="rounded-md border border-gold/20 bg-xuan-surface px-3 text-paper-dark placeholder:text-ink-muted transition-all duration-fast focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 h-14 font-display tracking-widest mx-auto max-w-md text-center text-base w-full" placeholder="例如：家人身体能否安康？" maxLength={80} value={question} onChange={e => setQuestion(e.target.value)} />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-5 text-center">
              <DrawingTube phase={drawPhase} />
              <button onClick={handleDraw} disabled={loading || !question.trim()} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark h-12 px-8 text-lg">
                <span>{drawPhase === 'shaking' ? '签筒摇动中...' : drawPhase === 'popping' ? '灵签飞出...' : '默念所求 · 求一支签'}</span>
              </button>
            </div>
          </ScrollReveal>
        </>
      ) : (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4 text-center">
            <div className="text-5xl mb-2">🎋</div>
            <h2 className="font-display text-2xl text-gold">{result.draw.sign_name || '灵签'}</h2>
            <p className="text-paper-dark/80">第 {result.draw.sign_index} 签 · {result.draw.sign_type || '中平'}</p>
            {result.draw.content && (
              <div className="rounded-lg bg-xuan-surface/40 p-4 text-left text-sm text-paper-dark/80 leading-relaxed whitespace-pre-line">{result.draw.content}</div>
            )}

            {!showAi && (
              <button onClick={handleInterpret} className="inline-flex items-center justify-center gap-2 rounded-lg bg-vermillion px-6 py-2.5 text-sm text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                请师父解签
              </button>
            )}

            {showAi && (
              <div className="rounded-lg bg-xuan-surface/40 p-4 text-left">
                <h3 className="font-display text-gold text-sm mb-2">{aiMaster || '慧明长老'} 解签</h3>
                {aiThinking && !aiText && <p className="text-xs text-paper-dark/50">师父正在解签...</p>}
                {aiText && <p className="text-xs text-paper-dark/70 leading-relaxed whitespace-pre-line">{aiText}</p>}
              </div>
            )}

            <button onClick={() => { setResult(null); setQuestion(''); setShowAi(false); setAiText(''); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors">再求一支签</button>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
