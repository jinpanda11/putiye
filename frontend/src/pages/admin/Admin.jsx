import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const API_BASE = '/api/v1';

async function apiPost(path, data) {
  const token = localStorage.getItem('putiyuan_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { method: 'POST', headers, body: JSON.stringify(data) });
  return res.json();
}

function Table({ headers, rows, emptyText }) {
  if (!rows || rows.length === 0) {
    return <div className="py-4 text-center text-sm text-paper-dark/50">{emptyText || '暂无数据'}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gold/10">
            {headers.map((h, i) => <th key={i} className="py-2 px-3 text-left text-xs text-paper-dark/50 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gold/5 hover:bg-xuan-surface/30">
              {row.map((cell, j) => <td key={j} className="py-2 px-3 text-xs text-paper-dark/80">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AiConfigSection({ config }) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [provider, setProvider] = useState(config?.provider_name || 'OpenAI Compatible');
  const [baseUrl, setBaseUrl] = useState(config?.base_url || 'https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [textModel, setTextModel] = useState(config?.text_model || 'gpt-4o-mini');
  const [visionModel, setVisionModel] = useState(config?.vision_model || config?.text_model || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(config?.temperature ?? 0.7);
  const [timeout, setTimeout_] = useState(config?.timeout_seconds || 45);
  const [status, setStatus] = useState(config?.api_key_set ? '已保存 Key' : '未配置 Key');

  async function handleSave() {
    setStatus('正在保存...');
    const res = await apiPost('/admin/ai-config/save', {
      enabled, provider_name: provider, base_url: baseUrl,
      api_key: apiKey, text_model: textModel, vision_model: visionModel,
      temperature, timeout_seconds: timeout,
    });
    if (res.code === 0) {
      setStatus('已保存');
      setApiKey('');
    } else {
      setStatus(res.message || '保存失败');
    }
  }

  async function handleTest() {
    setStatus('正在测试连接...');
    const res = await apiPost('/admin/ai-config/test', {});
    if (res.code === 0) {
      setStatus(`${res.data.provider || 'AI'} / ${res.data.model || ''}: ${res.data.reply || '连接成功'}`);
    } else {
      setStatus(res.message || '连接失败');
    }
  }

  return (
    <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm">
      <h3 className="font-display text-xl text-gold mb-4">大模型配置</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">启用大模型</span>
          <select className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={enabled ? '1' : '0'} onChange={e => setEnabled(e.target.value === '1')}>
            <option value="1">启用</option>
            <option value="0">关闭（使用本地兜底）</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">供应商名称</span>
          <input className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={provider} onChange={e => setProvider(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">API Base URL</span>
          <input className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">API Key</span>
          <input type="password" className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" placeholder={config?.api_key_set ? '已配置，不填则保留' : '请输入 API Key'} value={apiKey} onChange={e => setApiKey(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">文本模型</span>
          <input className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={textModel} onChange={e => setTextModel(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">视觉模型（手相）</span>
          <input className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={visionModel} onChange={e => setVisionModel(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">温度</span>
          <input type="number" step="0.1" min="0" max="2" className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={temperature} onChange={e => setTemperature(Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">超时秒数</span>
          <input type="number" min="5" max="180" className="h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark" value={timeout} onChange={e => setTimeout_(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={handleSave} className="rounded-lg bg-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/30 transition-colors">保存配置</button>
        <button onClick={handleTest} className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-paper-dark hover:border-gold/40 transition-colors">测试连接</button>
        <span className="text-xs text-paper-dark/50">{status}</span>
      </div>
    </div>
  );
}

const fieldClass = 'h-10 w-full rounded-lg border border-gold/20 bg-xuan-surface px-3 text-sm text-paper-dark';

function PaymentConfigSection({ config, onSaved }) {
  const [gateways, setGateways] = useState(config?.gateways || []);
  const [products, setProducts] = useState(config?.products || []);
  const [durations, setDurations] = useState(config?.blessing_durations || []);
  const [status, setStatus] = useState('待保存');

  const updateGateway = (index, patch) => setGateways(items => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateProduct = (index, patch) => setProducts(items => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateDuration = (index, patch) => setDurations(items => items.map((item, i) => i === index ? { ...item, ...patch } : item));

  async function handleSave() {
    setStatus('正在保存...');
    const res = await apiPost('/admin/payment-config/save', {
      gateways,
      products,
      blessing_durations: durations,
    });
    if (res.code === 0) {
      setStatus('已保存');
      onSaved?.(res.data);
    } else {
      setStatus(res.message || '保存失败');
    }
  }

  return (
    <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-gold">支付与价格配置</h3>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="rounded-lg bg-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/30 transition-colors">保存支付配置</button>
          <span className="text-xs text-paper-dark/50">{status}</span>
        </div>
      </div>

      <div className="space-y-4">
        {gateways.map((g, i) => (
          <div key={g.id || i} className="rounded-lg border border-gold/10 bg-xuan-surface/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm text-gold">{g.name || `易支付网关${i + 1}`}</div>
              <label className="inline-flex items-center gap-2 text-xs text-paper-dark/70">
                <input type="checkbox" checked={!!g.enabled} onChange={e => updateGateway(i, { enabled: e.target.checked })} />
                启用
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input className={fieldClass} value={g.name || ''} onChange={e => updateGateway(i, { name: e.target.value })} placeholder="网关名称" />
              <input className={fieldClass} value={g.api_url || ''} onChange={e => updateGateway(i, { api_url: e.target.value })} placeholder="API 地址，如 https://pay.example.com" />
              <input className={fieldClass} value={g.merchant_id || ''} onChange={e => updateGateway(i, { merchant_id: e.target.value })} placeholder="商户 ID" />
              <input type="password" className={fieldClass} value={g.merchant_key || ''} onChange={e => updateGateway(i, { merchant_key: e.target.value })} placeholder={g.merchant_key_set ? `密钥${g.merchant_key_masked ? `：${g.merchant_key_masked}` : '已配置'}` : '商户密钥'} />
              <select className={fieldClass} value={g.pay_type || 'alipay'} onChange={e => updateGateway(i, { pay_type: e.target.value })}>
                <option value="alipay">支付宝</option>
                <option value="wxpay">微信</option>
                <option value="qqpay">QQ 钱包</option>
              </select>
              <input type="number" className={fieldClass} value={g.sort_order || i + 1} onChange={e => updateGateway(i, { sort_order: Number(e.target.value) })} placeholder="排序" />
            </div>
          </div>
        ))}
      </div>

      <h4 className="mt-5 mb-3 text-sm text-gold">产品价格</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-xs text-paper-dark/50">
              <th className="px-2 py-2 text-left font-normal">产品</th>
              <th className="px-2 py-2 text-left font-normal">名称</th>
              <th className="px-2 py-2 text-left font-normal">价格</th>
              <th className="px-2 py-2 text-left font-normal">启用</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.product_id} className="border-b border-gold/5">
                <td className="px-2 py-2 text-xs text-paper-dark/70">{p.product_id}</td>
                <td className="px-2 py-2"><input className={fieldClass} value={p.name || ''} onChange={e => updateProduct(i, { name: e.target.value })} /></td>
                <td className="px-2 py-2"><input type="number" step="0.01" className={fieldClass} value={p.price ?? 0} onChange={e => updateProduct(i, { price: Number(e.target.value) })} /></td>
                <td className="px-2 py-2"><input type="checkbox" checked={!!p.enabled} onChange={e => updateProduct(i, { enabled: e.target.checked })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mt-5 mb-3 text-sm text-gold">供灯时长价格</h4>
      <div className="grid gap-3 md:grid-cols-3">
        {durations.map((d, i) => (
          <div key={d.duration_id} className="rounded-lg border border-gold/10 bg-xuan-surface/30 p-3">
            <div className="mb-2 text-xs text-paper-dark/50">{d.duration_id}</div>
            <div className="grid gap-2">
              <input className={fieldClass} value={d.label || ''} onChange={e => updateDuration(i, { label: e.target.value })} placeholder="显示名称" />
              <input type="number" className={fieldClass} value={d.days ?? 30} onChange={e => updateDuration(i, { days: Number(e.target.value) })} placeholder="天数" />
              <input type="number" step="0.01" className={fieldClass} value={d.price ?? 0} onChange={e => updateDuration(i, { price: Number(e.target.value) })} placeholder="价格" />
              <label className="inline-flex items-center gap-2 text-xs text-paper-dark/70">
                <input type="checkbox" checked={!!d.enabled} onChange={e => updateDuration(i, { enabled: e.target.checked })} />
                启用
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferralConfigSection({ config, onSaved }) {
  const [settings, setSettings] = useState(config?.settings || {});
  const [status, setStatus] = useState('待保存');

  async function handleSave() {
    setStatus('正在保存...');
    const res = await apiPost('/admin/referral-config/save', settings);
    if (res.code === 0) {
      setStatus('已保存');
      onSaved?.(res.data);
    } else {
      setStatus(res.message || '保存失败');
    }
  }

  async function updateWithdrawal(id, nextStatus) {
    const res = await apiPost('/admin/referral-withdrawal/update', { withdrawal_id: id, status: nextStatus });
    if (res.code === 0) onSaved?.(res.data);
    else setStatus(res.message || '操作失败');
  }

  const summary = config?.summary || {};
  const nameOf = (row, prefix = '') => row?.[`${prefix}nickname`] || row?.[`${prefix}username`] || row?.[`${prefix}lucky_code`] || '-';

  return (
    <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-gold">邀请返佣配置</h3>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="rounded-lg bg-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/30 transition-colors">保存返佣配置</button>
          <span className="text-xs text-paper-dark/50">{status}</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">启用邀请返佣</span>
          <select className={fieldClass} value={settings.enabled ? '1' : '0'} onChange={e => setSettings(s => ({ ...s, enabled: e.target.value === '1' }))}>
            <option value="1">启用</option>
            <option value="0">关闭</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">支付返佣比例 %</span>
          <input type="number" step="0.01" min="0" max="100" className={fieldClass} value={settings.commission_rate ?? 10} onChange={e => setSettings(s => ({ ...s, commission_rate: Number(e.target.value) }))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">填邀请码双方功德</span>
          <input type="number" min="0" className={fieldClass} value={settings.invite_merit ?? 5} onChange={e => setSettings(s => ({ ...s, invite_merit: Number(e.target.value) }))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-paper-dark/60">最低提现金额</span>
          <input type="number" step="0.01" min="0" className={fieldClass} value={settings.min_withdraw_amount ?? 10} onChange={e => setSettings(s => ({ ...s, min_withdraw_amount: Number(e.target.value) }))} />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg bg-xuan-surface/50 p-2"><div className="text-gold font-display text-lg">{summary.relations ?? 0}</div><div className="text-paper-dark/50 text-xs">绑定邀请</div></div>
        <div className="rounded-lg bg-xuan-surface/50 p-2"><div className="text-gold font-display text-lg">¥{summary.settled_amount ?? 0}</div><div className="text-paper-dark/50 text-xs">累计返佣</div></div>
        <div className="rounded-lg bg-xuan-surface/50 p-2"><div className="text-gold font-display text-lg">¥{summary.pending_withdraw_amount ?? 0}</div><div className="text-paper-dark/50 text-xs">待审提现</div></div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm text-gold">返佣记录</h4>
          <Table
            headers={['邀请人', '被邀请人', '产品', '返佣', '时间']}
            rows={(config?.commissions || []).map(c => [
              nameOf(c, 'inviter_'),
              nameOf(c, 'invitee_'),
              c.product_name || c.product_id || '-',
              `¥${c.amount} / ${c.rate}%`,
              (c.created_at || '').replace('T', ' ').slice(0, 16),
            ])}
            emptyText="暂无返佣记录"
          />
        </div>
        <div>
          <h4 className="mb-2 text-sm text-gold">提现申请</h4>
          <Table
            headers={['用户', '金额', '状态', '备注', '操作']}
            rows={(config?.withdrawals || []).map(w => [
              nameOf(w),
              `¥${w.amount}`,
              w.status || '-',
              w.note || '-',
              <div className="flex flex-wrap gap-1">
                <button onClick={() => updateWithdrawal(w.id, 'approved')} className="rounded border border-gold/20 px-2 py-1 text-gold">通过</button>
                <button onClick={() => updateWithdrawal(w.id, 'paid')} className="rounded border border-green-500/30 px-2 py-1 text-green-300">已打款</button>
                <button onClick={() => updateWithdrawal(w.id, 'rejected')} className="rounded border border-vermillion/30 px-2 py-1 text-vermillion-light">驳回</button>
              </div>,
            ])}
            emptyText="暂无提现申请"
          />
        </div>
      </div>
    </div>
  );
}

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [blessings, setBlessings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [aiConfig, setAiConfig] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [referralConfig, setReferralConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) return;
    Promise.all([
      apiPost('/admin/stats', {}),
      apiPost('/admin/users', { limit: 30 }),
      apiPost('/admin/blessings', { limit: 30 }),
      apiPost('/admin/orders', { limit: 30 }),
      apiPost('/admin/ai-config', {}),
      apiPost('/admin/payment-config', {}),
      apiPost('/admin/referral-config', {}),
    ]).then(([statsRes, usersRes, blessingsRes, ordersRes, aiRes, paymentRes, referralRes]) => {
      if (statsRes.code === 0) setStats(statsRes.data.stats || {});
      if (usersRes.code === 0) setUsers(usersRes.data?.entries || []);
      if (blessingsRes.code === 0) setBlessings(blessingsRes.data?.entries || []);
      if (ordersRes.code === 0) setOrders(ordersRes.data?.entries || []);
      if (aiRes.code === 0) setAiConfig(aiRes.data || {});
      if (paymentRes.code === 0) setPaymentConfig(paymentRes.data || {});
      if (referralRes.code === 0) setReferralConfig(referralRes.data || {});
    }).finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div className="flex h-[60vh] items-center justify-center text-paper-dark/65">加载中...</div>;

  if (!user?.is_admin) {
    return (
      <div className="mx-auto max-w-md px-4 pt-12 text-center">
        <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-6 backdrop-blur-sm">
          <div className="text-4xl mb-4 text-gold">令</div>
          <h2 className="font-display text-xl text-gold mb-2">需要管理员权限</h2>
          <p className="text-sm text-paper-dark/65 mb-4">只有管理员才能访问此页面</p>
          <Link to="/" className="text-gold text-sm hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-paper-dark/65">加载后台数据...</div>;

  async function updateOrder(id, status) {
    const res = await apiPost('/admin/order/update', { order_id: id, status });
    if (res.code === 0) setOrders(res.data?.entries || []);
  }

  const statItems = [
    ['用户总数', stats?.users],
    ['正式账号', stats?.registered_users],
    ['管理员', stats?.admins],
    ['祈福记录', stats?.blessings],
    ['订单总数', stats?.orders],
    ['已支付', stats?.paid_orders],
    ['总功德', stats?.merit_total],
    ['邀请绑定', stats?.referral_users],
    ['累计返佣', stats?.referral_commissions],
    ['提现待审', stats?.pending_withdrawals],
  ];
  const paymentConfigKey = JSON.stringify({
    gateways: paymentConfig?.gateways?.map(g => [g.id, g.enabled, g.api_url, g.merchant_id, g.pay_type, g.sort_order]),
    products: paymentConfig?.products?.map(p => [p.product_id, p.name, p.price, p.enabled, p.sort_order]),
    durations: paymentConfig?.blessing_durations?.map(d => [d.duration_id, d.label, d.days, d.price, d.enabled, d.sort_order]),
  });
  const referralConfigKey = JSON.stringify({
    settings: referralConfig?.settings,
    summary: referralConfig?.summary,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-section px-4 pb-24">
      <section className="space-y-3 pt-8 text-center">
        <div className="flex justify-start">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-3 py-2 text-sm text-gold hover:bg-gold/10 transition-colors">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/><path d="M21 12H9"/></svg>
            返回首页
          </Link>
        </div>
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
          <span className="text-3xl text-gold">令</span>
        </div>
        <h1 className="text-4xl tracking-widest text-gold">管理员后台</h1>
        <p className="text-base text-paper-dark/85">用户 · 祈福 · 订单 · 功德概览</p>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 lg:grid-cols-10">
        {statItems.map(([label, value], i) => (
          <div key={i} className="rounded-lg border border-gold/20 bg-xuan-card/80 p-3 text-center backdrop-blur-sm">
            <div className="font-display text-2xl text-gold">{value ?? '-'}</div>
            <div className="text-xs text-paper-dark/50 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <AiConfigSection config={aiConfig} />

      <PaymentConfigSection key={paymentConfigKey} config={paymentConfig} onSaved={setPaymentConfig} />

      <ReferralConfigSection key={referralConfigKey} config={referralConfig} onSaved={setReferralConfig} />

      <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm">
        <h3 className="font-display text-xl text-gold mb-4">用户管理</h3>
        <Table
          headers={['昵称', '账号', '吉祥号', '邮箱', '身份', '功德', '创建时间']}
          rows={users.map(u => [
            u.nickname || '-',
            u.username || '-',
            u.lucky_code || '-',
            u.email || '-',
            u.is_admin ? '管理员' : (u.username ? '正式' : '游客'),
            u.total_merit_added || 0,
            (u.created_at || '').replace('T', ' ').slice(0, 16),
          ])}
          emptyText="暂无用户"
        />
      </div>

      <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm">
        <h3 className="font-display text-xl text-gold mb-4">祈福记录</h3>
        <Table
          headers={['用户', '类型', '内容', '公开', '时间']}
          rows={blessings.map(b => [
            b.nickname || b.lucky_code || '-',
            b.blessing_type || '-',
            b.content || '-',
            b.is_public ? '是' : '否',
            (b.created_at || '').replace('T', ' ').slice(0, 16),
          ])}
          emptyText="暂无祈福记录"
        />
      </div>

      <div className="rounded-lg border border-gold/20 bg-xuan-card/95 p-card-pad shadow-paper backdrop-blur-sm">
        <h3 className="font-display text-xl text-gold mb-4">订单记录</h3>
        <Table
          headers={['用户', '产品', '金额', '状态', '渠道', '交易号', '操作']}
          rows={orders.map(o => [
            o.nickname || o.lucky_code || '-',
            o.product_name || o.product_id || '-',
            `${o.amount} ${o.currency || 'CNY'}`,
            o.status || '-',
            o.provider || '-',
            o.trade_no || o.gateway_id || '-',
            <div className="flex flex-wrap gap-1">
              <button onClick={() => updateOrder(o.id, 'paid')} className="rounded border border-green-500/30 px-2 py-1 text-green-300">已支付</button>
              <button onClick={() => updateOrder(o.id, 'cancelled')} className="rounded border border-vermillion/30 px-2 py-1 text-vermillion-light">取消</button>
            </div>,
          ])}
          emptyText="暂无订单"
        />
      </div>
    </div>
  );
}
