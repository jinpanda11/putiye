import { useState } from 'react';
import { merit } from '../api/client';

export function Temple() {
  const [offered, setOffered] = useState(false);
  const [status, setStatus] = useState('');

  async function offerIncense() {
    setOffered(true);
    setStatus('清香已敬上');
    try {
      const data = await merit.add(3, '在线上香');
      setStatus(`清香已敬上，功德 +${data.merit_added || 3}`);
    } catch {
      setStatus('清香已敬上');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 text-center">
      <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-4xl">香</div>
      <h1 className="text-4xl tracking-widest text-gold">在线上香</h1>
      <p className="mx-auto mt-3 max-w-md text-paper-dark/75">静心三息，敬上一炷清香。愿家宅安宁，所念皆善。</p>
      <div className="relative mx-auto my-10 h-72 max-w-sm rounded-xl border border-gold/20 bg-xuan-card/80 p-8">
        <div className="absolute left-1/2 top-10 h-24 w-px -translate-x-1/2 bg-gradient-to-t from-gold/40 to-transparent" />
        <div className={`mx-auto mt-20 h-32 w-2 rounded-full bg-vermillion ${offered ? 'shadow-[0_0_24px_rgba(176,58,46,0.7)]' : ''}`} />
        <div className="mx-auto h-8 w-24 rounded-t-full bg-gold/20" />
      </div>
      <button type="button" onClick={offerIncense} disabled={offered} className="rounded-lg bg-vermillion px-8 py-3 text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light disabled:opacity-60">
        {offered ? '已上香' : '敬上一炷清香'}
      </button>
      {status && <p className="mt-4 text-sm text-gold">{status}</p>}
    </div>
  );
}
