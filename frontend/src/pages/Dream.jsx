import { useState, useEffect } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { dream } from '../api/client';

export function Dream() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiThinking] = useState(false);
  const [aiMaster] = useState(null);

  useEffect(() => {
    dream.categories().then(setCategories).catch(() => {});
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setAiText('');
    try {
      const data = await dream.search(query.trim());
      setResult({ type: 'search', data });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCategory(cat) {
    setLoading(true);
    setAiText('');
    try {
      const data = await dream.byCategory(cat);
      setResult({ type: 'category', category: cat, data });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">周公解梦</h1>
          <p className="text-base text-paper-dark/85">周公解梦 · 古今相参</p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.1}>
        <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-3">
          <p className="text-base text-paper-dark/85">请描述您梦中所见</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="rounded-md border border-gold/20 bg-xuan-surface px-3 text-paper-dark placeholder:text-ink-muted transition-all duration-fast focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 h-12 w-full text-base sm:flex-1" placeholder="如：梦见龙、梦见牙齿掉了" maxLength="100" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button onClick={handleSearch} disabled={loading || !query.trim()} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark px-5 text-base h-12 w-full whitespace-nowrap sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 size-4"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
              <span>{loading ? '解梦中...' : '解梦'}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {result && (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4 text-center">
            {(result.type === 'search' || result.type === 'category') && (result.data?.results?.length > 0 || result.data?.items?.length > 0) ? (
              <>
                {(result.data.results || result.data.items || []).map((item, i) => (
                  <div key={i} className="rounded-lg bg-xuan-surface/40 p-4 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-lg text-gold">{item.title || '梦境解析'}</h3>
                      {item.level && <span className="text-xs rounded bg-gold/10 px-1.5 py-0.5 text-gold">{item.level}</span>}
                    </div>
                    {item.ancient && <p className="text-sm text-paper-dark/80 leading-relaxed">{item.ancient}</p>}
                    {item.modern && <p className="mt-1 text-sm text-paper-dark/60 leading-relaxed">{item.modern}</p>}
                    {item.advice && <p className="mt-2 text-xs text-paper-dark/50 leading-relaxed">建议：{item.advice}</p>}
                  </div>
                ))}
                {result.data.suggestion && (
                  <p className="text-xs text-paper-dark/50 leading-relaxed px-2">{result.data.suggestion}</p>
                )}
              </>
            ) : result.type === 'interpret' ? (
              <div className="rounded-lg bg-xuan-surface/40 p-4 text-left">
                <h3 className="font-display text-lg text-gold mb-2">
                  {aiMaster ? `${aiMaster} 深度解梦` : '深度解梦'}
                </h3>
                {aiThinking && !aiText && <p className="text-sm text-paper-dark/50">师父正在思量...</p>}
                {aiText && <p className="text-sm text-paper-dark/80 leading-relaxed whitespace-pre-line">{aiText}</p>}
                {!aiText && !aiThinking && result.data === null && <p className="text-sm text-paper-dark/50">正在连接...</p>}
              </div>
            ) : (
              <p className="text-paper-dark/65">未找到相关梦境解析</p>
            )}
            <button onClick={() => { setResult(null); setAiText(''); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors">继续解梦</button>
          </div>
        </ScrollReveal>
      )}

      {!result && (
        <ScrollReveal delay={0.2}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-3">
            <h2 className="font-display text-xl text-gold">按类查梦</h2>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <button key={i} onClick={() => handleCategory(cat.id || cat)} className="rounded-full border border-gold/20 px-4 py-1.5 text-sm text-paper-dark/80 hover:border-gold/40 hover:text-gold transition-colors">
                    {cat.name || cat}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-paper-dark/50">暂无分类</p>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}

