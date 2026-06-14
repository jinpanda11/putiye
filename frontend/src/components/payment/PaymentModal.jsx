import { useEffect, useRef, useState } from 'react';
import { payment } from '../../api/client';

export function PaymentModal({ open, productId, extras, title = '确认支付', onClose, onPaid }) {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current || !productId) return;
    startedRef.current = true;
    setOrder(null);
    setLoading(true);
    setStatus('正在创建订单...');
    payment.create(productId, extras || {})
      .then(data => {
        setOrder(data);
        setStatus('订单已创建，请打开支付页完成付款');
      })
      .catch(e => setStatus(e.message || '创建订单失败'))
      .finally(() => setLoading(false));
  }, [open, productId, extras]);

  useEffect(() => {
    if (!open || !order?.order_id) return undefined;
    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const data = await payment.status(order.order_id);
        if (stopped) return;
        if (data?.status === 'paid') {
          setStatus('支付成功');
          window.clearInterval(timer);
          onPaid?.(order, data);
        } else if (data?.status === 'needs_review') {
          setStatus('已提交人工核验，请稍后刷新查看');
        }
      } catch {
        // Keep polling; transient network errors should not close the modal.
      }
    }, 2500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [open, order, onPaid]);

  if (!open) return null;

  function closeModal() {
    setOrder(null);
    setStatus('');
    setLoading(false);
    startedRef.current = false;
    onClose?.();
  }

  async function handleReport() {
    if (!order?.order_id) return;
    setLoading(true);
    try {
      const data = await payment.buyerReport(order.order_id);
      setStatus(data?.status === 'needs_review' ? '已提交人工核验，请稍后刷新查看' : '已提交');
    } catch (e) {
      setStatus(e.message || '提交失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={closeModal}>
      <div className="w-full max-w-md rounded-xl border border-gold/30 bg-xuan-card p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl text-gold">{title}</h3>
          <button type="button" onClick={closeModal} className="rounded-full border border-gold/20 px-2 py-1 text-xs text-paper-dark/70 hover:text-gold">关闭</button>
        </div>
        <div className="space-y-3 text-sm text-paper-dark/75">
          {order ? (
            <>
              <div className="rounded-lg bg-xuan-surface/40 p-3">
                <div className="flex justify-between gap-3"><span>项目</span><span className="text-gold">{order.product_name}</span></div>
                <div className="mt-1 flex justify-between gap-3"><span>金额</span><span className="font-display text-lg text-gold">{order.display_amount_text || `¥${order.amount}`}</span></div>
                <div className="mt-1 flex justify-between gap-3"><span>订单</span><span className="text-xs">{order.order_id}</span></div>
              </div>
              {order.payment_url && (
                <a href={order.payment_url} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center rounded-lg bg-vermillion px-4 py-3 text-white shadow-lg shadow-vermillion/20 hover:bg-vermillion-light">
                  打开支付页
                </a>
              )}
              <button type="button" onClick={handleReport} disabled={loading} className="w-full rounded-lg border border-gold/25 px-4 py-2.5 text-gold hover:bg-gold/10 disabled:opacity-50">
                我已支付，提交人工核验
              </button>
            </>
          ) : (
            <div className="rounded-lg bg-xuan-surface/40 p-4 text-center">{loading ? '正在创建订单...' : '暂未生成订单'}</div>
          )}
          {status && <p className="rounded-lg border border-gold/10 bg-xuan-surface/30 px-3 py-2 text-xs text-paper-dark/70">{status}</p>}
        </div>
      </div>
    </div>
  );
}
