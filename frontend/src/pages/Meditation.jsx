import { useState, useEffect, useRef } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { meditation } from '../api/client';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Meditation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    meditation.catalog()
      .then(res => setData(res || null))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  function handlePlay(track) {
    if (!track?.url) return;
    if (currentTrack?.id === track.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.url);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
      audio.play().catch(() => {});
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  }

  function startTimer() {
    if (timerRunning) return;
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    if (timerSeconds >= 60) {
      meditation.complete(timerSeconds).catch(() => {});
    }
  }

  function resetTimer() {
    stopTimer();
    setTimerSeconds(0);
  }

  const tracks = data?.tracks || [];
  const guided = data?.guided || [];
  const quote = data?.quote;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
        <section className="space-y-3 pt-8 text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">静心禅坐</h1>
          <p className="text-base text-paper-dark/85">一曲禅音，安住当下</p>
        </section>
        <div className="flex h-[40vh] items-center justify-center text-paper-dark/65">加载禅修曲目...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">静心禅坐</h1>
          <p className="text-base text-paper-dark/85">一曲禅音，安住当下</p>
        </ScrollReveal>
      </section>

      {quote && (
        <ScrollReveal delay={0.05}>
          <div className="rounded-lg border border-gold/20 bg-gold/5 p-card-pad text-center">
            <p className="text-lg text-gold/90 italic">"{quote.text}"</p>
            {quote.source && <p className="text-xs text-paper-dark/50 mt-1">—— {quote.source}</p>}
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-5 text-center">
          <div className="font-display text-6xl text-gold tracking-widest">{formatTime(timerSeconds)}</div>
          <div className="flex justify-center gap-3">
            {!timerRunning ? (
              <button onClick={startTimer} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark h-12 px-8 text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                开始禅坐
              </button>
            ) : (
              <button onClick={stopTimer} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast rounded-lg border border-gold/30 text-gold hover:bg-gold/10 h-12 px-8 text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                结束禅坐
              </button>
            )}
            <button onClick={resetTimer} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast rounded-lg border border-gold/20 text-paper-dark hover:text-gold h-12 px-6 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              重置
            </button>
          </div>
          {timerRunning && <p className="text-sm text-paper-dark/50">安住当下，心无挂碍</p>}
          {!timerRunning && timerSeconds > 0 && (
            <p className="text-sm text-green-400/80">本次禅坐 {formatTime(timerSeconds)}，功德无量</p>
          )}
        </div>
      </ScrollReveal>

      {tracks.length > 0 && (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-3">
            <h2 className="font-display text-xl text-gold">禅音乐曲</h2>
            <div className="space-y-1">
              {tracks.map((track, i) => (
                <button key={track.id || i} type="button" onClick={() => handlePlay(track)} className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors ${currentTrack?.id === track.id && isPlaying ? 'bg-gold/10 border border-gold/30' : 'hover:bg-xuan-surface/40 border border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-full ${currentTrack?.id === track.id && isPlaying ? 'bg-vermillion text-white' : 'border border-gold/30 text-gold'}`}>
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-paper-dark/90">{track.title || track.name || `曲目 ${i + 1}`}</p>
                      {track.subtitle && <p className="text-xs text-paper-dark/50">{track.subtitle}</p>}
                    </div>
                  </div>
                  {track.duration != null && <span className="text-xs text-paper-dark/50">{typeof track.duration === 'number' ? formatTime(track.duration) : track.duration}</span>}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {guided.length > 0 && (
        <ScrollReveal delay={0.2}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-3">
            <h2 className="font-display text-xl text-gold">引导禅修</h2>
            <div className="space-y-1">
              {guided.map((g, i) => (
                <details key={g.id || i} className="group rounded-lg border border-gold/10 hover:border-gold/30 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm text-paper-dark/90 list-none">
                    <div>
                      <p className="text-paper-dark/90">{g.title}</p>
                      {g.subtitle && <p className="text-xs text-paper-dark/50 mt-0.5">{g.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {g.duration != null && <span className="text-xs text-paper-dark/50">{typeof g.duration === 'number' ? formatTime(g.duration) : g.duration}</span>}
                      <svg className="size-4 text-paper-dark/40 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                  </summary>
                  {g.steps && g.steps.length > 0 && (
                    <div className="px-4 pb-3 space-y-1">
                      {g.steps.map((step, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-paper-dark/60">
                          <span className="mt-0.5 size-4 shrink-0 rounded-full bg-gold/15 text-center text-[10px] leading-4 text-gold">{j + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
