import { useState, useRef } from 'react';
import { ScrollReveal } from '../components/feature/ScrollReveal';
import { MasterSelector } from '../components/feature/MasterSelector';
import { palmistry } from '../api/client';
import { PaymentModal } from '../components/payment/PaymentModal';

export function Palmistry() {
  const [master, setMaster] = useState('huiming');
  const [hand, setHand] = useState('left');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiMaster, setAiMaster] = useState(null);
  const [interpreting, setInterpreting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!image) return;
    setLoading(true);
    setAiText('');
    setInterpreting(false);
    try {
      const data = await palmistry.upload(image, hand);
      setResult(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInterpret() {
    if (!result?.session_id) return;
    setPayOpen(true);
  }

  function startInterpret() {
    if (!result?.session_id) return;
    setPayOpen(false);
    setInterpreting(true);
    setAiText('');
    setAiThinking(false);
    setAiMaster(null);
    palmistry.interpretSSE(result.session_id, master, {
      onMeta: (m) => setAiMaster(m.master_name || '慧明长老'),
      onThinking: () => setAiThinking(true),
      onToken: (text) => { setAiText(prev => prev + text); setAiThinking(false); },
      onDone: () => setInterpreting(false),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <ScrollReveal>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-gold"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>
          </div>
          <h1 className="text-4xl tracking-widest text-gold">手相图解</h1>
          <p className="text-base text-paper-dark/85">拍一张清晰的掌心照，由师父依传统手相学开示</p>
          <p className="mt-2 text-sm text-gold/85">可观性情心境、感情姻缘、事业财运、健康状态与人生阶段走势</p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.1}>
        <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card">
          <MasterSelector selected={master} onChange={setMaster} />
        </div>
      </ScrollReveal>

      {!result ? (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-5">
            <div className="space-y-2">
              <p className="text-base text-paper-dark/85">看哪只手</p>
              <div className="flex h-14 overflow-hidden rounded-xl border border-gold/30 bg-xuan-surface">
                <button type="button" onClick={() => setHand('left')} className={`flex flex-1 items-center justify-center gap-2 text-base transition-colors ${hand === 'left' ? 'bg-gold/15 text-gold' : 'text-paper-dark hover:bg-gold/5'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>左手（先天）
                </button>
                <button type="button" onClick={() => setHand('right')} className={`flex flex-1 items-center justify-center gap-2 text-base transition-colors ${hand === 'right' ? 'bg-gold/15 text-gold' : 'text-paper-dark hover:bg-gold/5'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 scale-x-[-1]"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>右手（后天）
                </button>
              </div>
              <p className="text-xs text-paper-dark/60">传统认为：男左女右；左手主先天本性，右手主后天发展。</p>
            </div>

            <div className="rounded-xl border border-gold/15 bg-xuan-surface/40 p-4">
              <p className="mb-2 font-display text-base text-gold">拍摄要求</p>
              <ul className="space-y-1 text-sm text-paper-dark/80">
                <li>· 自然光下，掌心张开正对镜头</li>
                <li>· 五指自然伸展，不要过分用力</li>
                <li>· 主要线条（生命线、智慧线、感情线）清晰可见</li>
                <li>· 图片小于 5MB，jpg/png 格式</li>
              </ul>
            </div>

            <div className="space-y-3">
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="手相预览" className="w-full object-contain max-h-80" />
                  <button type="button" onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-vermillion/40 bg-vermillion/10 text-vermillion-light hover:border-vermillion/60 hover:bg-vermillion/15">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-12"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" /></svg>
                    <p className="font-display text-lg">拍摄手相</p>
                    <p className="text-xs text-paper-dark/60">现在打开摄像头</p>
                  </button>
                  <button type="button" onClick={() => galleryRef.current?.click()} className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/30 bg-xuan-surface/40 text-gold/85 hover:border-gold/50 hover:bg-xuan-surface/70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-12"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    <p className="font-display text-lg">从相册选</p>
                    <p className="text-xs text-paper-dark/60">已有照片直接传</p>
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={loading || !image} className="inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] rounded-lg bg-vermillion tracking-wider text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light active:bg-vermillion-dark h-12 px-8 w-full text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 size-5"><path d="M12 3v12" /><path d="m17 8-5-5-5 5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>
              <span>{loading ? '解析中...' : '请师父开示'}</span>
            </button>
            <p className="text-center text-xs text-paper-dark/60">图片仅用于本次解读，不会用于其他用途。</p>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={0.15}>
          <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm hover:border-gold/30 hover:shadow-card space-y-4 text-center">
            <div className="text-4xl">✋</div>
            <h2 className="font-display text-2xl text-gold">手相解读</h2>
            {aiText && (
              <div className="rounded-lg bg-xuan-surface/40 p-4 text-left">
                <h3 className="font-display text-gold text-sm mb-2">{aiMaster || '慧明长老'} 手相开示</h3>
                {aiText && <p className="text-sm text-paper-dark/80 leading-relaxed whitespace-pre-line">{aiText}</p>}
              </div>
            )}
            {result && !interpreting && !aiText && (
              <button onClick={handleInterpret} className="inline-flex items-center justify-center gap-2 rounded-lg bg-vermillion px-6 py-2.5 text-sm text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                请师父开示
              </button>
            )}
            {interpreting && aiThinking && !aiText && <p className="text-xs text-paper-dark/50">师父正在看掌...</p>}
            <button onClick={() => { setResult(null); setImage(null); setImagePreview(null); setAiText(''); setInterpreting(false); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors">重新拍摄</button>
          </div>
        </ScrollReveal>
      )}
      <PaymentModal
        open={payOpen}
        productId="unlock_palmistry"
        title="手相图解解锁"
        extras={{ session_id: result?.session_id }}
        onClose={() => setPayOpen(false)}
        onPaid={startInterpret}
      />

      {!result && (
        <ScrollReveal delay={0.2}>
          <div className="rounded-xl border border-gold/25 bg-xuan-surface/40 overflow-hidden">
            <button type="button" onClick={() => setAccordionOpen(!accordionOpen)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="flex items-center gap-2 text-sm text-gold">
                <span className="text-lg">🖐️</span>手相主线位置参考（点击展开对照）
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-4 text-gold/60 transition-transform ${accordionOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {accordionOpen && (
              <div className="px-4 pb-4 text-sm text-paper-dark/70 space-y-2">
                <p><span className="text-gold">生命线</span> — 围绕拇指的弧线，反映元气与生命力。</p>
                <p><span className="text-gold">智慧线</span> — 横贯掌中央，主思维模式与决断力。</p>
                <p><span className="text-gold">感情线</span> — 位于智慧线上方，主情感与姻缘。</p>
                <p><span className="text-gold">命运线</span> — 纵贯掌中，主事业与人生走势。</p>
              </div>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
