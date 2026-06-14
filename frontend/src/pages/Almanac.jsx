import { useState, useEffect } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { almanac } from '../api/client';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

function isToday(dateStr) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

export function Almanac() {
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      almanac.today().then(setTodayData).catch(() => {}),
      almanac.week().then(data => setWeekData(data?.items || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
        <section className="space-y-3 pt-8 text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">今日黄历</h1>
          <p className="text-base text-paper-dark/85">择吉日、看宜忌、知天命</p>
        </section>
        <div className="flex h-[40vh] items-center justify-center text-paper-dark/65">加载今日黄历...</div>
      </div>
    );
  }

  const lunar = todayData?.lunar;
  const ganzhi = todayData?.ganzhi;
  const dir = todayData?.direction;
  const level = todayData?.overall_level;

  return (
    <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">今日黄历</h1>
          <p className="text-base text-paper-dark/85">择吉日、看宜忌、知天命</p>
        </ScrollReveal>
      </section>

      {todayData && (
        <ScrollReveal delay={0.1}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-5">
            <div className="text-center">
              <p className="font-display text-3xl text-gold">
                {lunar ? `${lunar.month_chinese}${lunar.day_chinese}  ${lunar.year_zodiac}年` : ''}
              </p>
              <p className="text-sm text-paper-dark/50 mt-1">
                {ganzhi ? `${ganzhi.year}年 ${ganzhi.month}月 ${ganzhi.day}日` : ''}
                {todayData?.zhixing ? `  ·  ${todayData.zhixing}` : ''}
                {level ? `  ·  ${level.level}` : ''}
              </p>
            </div>

            {level?.summary && (
              <p className="text-center text-sm text-paper-dark/70">{level.summary}</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-green-900/20 border border-green-700/25 p-4">
                <p className="font-display text-green-400 mb-2 text-sm tracking-wider">宜</p>
                <div className="flex flex-wrap gap-1.5">
                  {(todayData.yi || []).map((item, i) => (
                    <span key={i} className="rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs text-green-300/90">{item}</span>
                  ))}
                  {(!todayData.yi || todayData.yi.length === 0) && <span className="text-xs text-paper-dark/50">诸事不宜</span>}
                </div>
              </div>
              <div className="rounded-lg bg-red-900/20 border border-red-700/25 p-4">
                <p className="font-display text-red-400 mb-2 text-sm tracking-wider">忌</p>
                <div className="flex flex-wrap gap-1.5">
                  {(todayData.ji || []).map((item, i) => (
                    <span key={i} className="rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs text-red-300/90">{item}</span>
                  ))}
                  {(!todayData.ji || todayData.ji.length === 0) && <span className="text-xs text-paper-dark/50">无</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center text-sm">
              {dir?.wealth && (
                <div>
                  <p className="text-paper-dark/50 text-xs">财神</p>
                  <p className="text-paper-dark/80">{dir.wealth}</p>
                </div>
              )}
              {dir?.joy && (
                <div>
                  <p className="text-paper-dark/50 text-xs">喜神</p>
                  <p className="text-paper-dark/80">{dir.joy}</p>
                </div>
              )}
              {dir?.god && (
                <div>
                  <p className="text-paper-dark/50 text-xs">福神</p>
                  <p className="text-paper-dark/80">{dir.god}</p>
                </div>
              )}
              {todayData?.chong && (
                <div>
                  <p className="text-paper-dark/50 text-xs">冲煞</p>
                  <p className="text-paper-dark/80">{todayData.chong}</p>
                </div>
              )}
            </div>

            {ganzhi?.nayin && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center text-sm">
                <div>
                  <p className="text-paper-dark/50 text-xs">纳音</p>
                  <p className="text-paper-dark/80">{ganzhi.nayin}</p>
                </div>
                {todayData?.xiu && (
                  <div>
                    <p className="text-paper-dark/50 text-xs">星宿</p>
                    <p className="text-paper-dark/80">{todayData.xiu}（{todayData.xiu_luck || ''}）</p>
                  </div>
                )}
                {todayData?.tai_position && (
                  <div>
                    <p className="text-paper-dark/50 text-xs">太岁</p>
                    <p className="text-paper-dark/80">{todayData.tai_position}</p>
                  </div>
                )}
              </div>
            )}

            {todayData?.shichen && todayData.shichen.length > 0 && (
              <div>
                <p className="font-display text-gold text-sm mb-2">时辰吉凶</p>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {todayData.shichen.map((s, i) => (
                    <div key={i} className={`rounded px-2 py-1 text-center text-xs ${s.lucky === '吉' ? 'bg-green-900/20 text-green-300/90' : 'bg-red-900/20 text-red-300/90'}`}>
                      <span className="block">{s.name}</span>
                      <span className="block">{s.lucky}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      {weekData.length > 0 && (
        <ScrollReveal delay={0.2}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-3">
            <h2 className="font-display text-xl text-gold">本周黄历</h2>
            <div className="grid gap-2">
              {weekData.map((day, i) => {
                const today = isToday(day.date);
                return (
                  <div key={i} className={`rounded-lg p-3 text-sm ${today ? 'border border-gold/40 bg-gold/5' : 'bg-xuan-surface/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-gold">{day.date || ''}</span>
                        <span className="text-xs text-paper-dark/50">星期{day.weekday || WEEK_DAYS[new Date(day.date).getDay()]}</span>
                        {today && <span className="text-[10px] rounded-full bg-gold/20 px-1.5 py-0.5 text-gold">今天</span>}
                      </div>
                      <span className="text-xs text-paper-dark/60">{day.lunar_day || ''}</span>
                    </div>
                    {day.level && <span className="text-xs text-paper-dark/50">运势：{day.level}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
