import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { referral } from '../api/client';

export function Profile() {
  const { user, loading, isAuthenticated, openLogin, logout } = useAuth();
  const [referralInfo, setReferralInfo] = useState(null);
  const [inviteCode, setInviteCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('light') || params.get('invite') || '').trim().toUpperCase();
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [refStatus, setRefStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    referral.me()
      .then(setReferralInfo)
      .catch(e => setRefStatus(e.message || '善缘信息加载失败'));
  }, [isAuthenticated]);

  async function handleApplyInvite() {
    if (!inviteCode.trim()) return;
    setRefStatus('正在结缘...');
    try {
      const data = await referral.apply(inviteCode.trim());
      setRefStatus(data?.message || '传灯码已生效');
      setInviteCode('');
      setReferralInfo(await referral.me());
    } catch (e) {
      setRefStatus(e.message || '结缘未成，请稍后再试');
    }
  }

  async function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (!amount) return;
    setRefStatus('正在提交回向申请...');
    try {
      const data = await referral.withdraw({ amount, note: '用户自助福缘回向申请' });
      setRefStatus(`回向申请已提交，剩余 ¥${data.remaining}`);
      setWithdrawAmount('');
      setReferralInfo(await referral.me());
    } catch (e) {
      setRefStatus(e.message || '回向申请未提交，请稍后再试');
    }
  }

  function copyInvite() {
    const url = `${window.location.origin}/profile?light=${encodeURIComponent(referralInfo?.code || '')}`;
    navigator.clipboard?.writeText(url);
    setRefStatus('传灯链接已复制');
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-paper-dark/65">加载中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 pt-8 text-center">
        <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-8 backdrop-blur-sm">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 className="font-display text-xl text-gold mb-2">我的</h2>
          <p className="text-sm text-paper-dark/65 mb-6">登录后可查看个人记录</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={openLogin} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold/20 px-6 py-2.5 text-sm text-gold hover:bg-gold/30 transition-colors">
              登录/注册
            </button>
            <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/30 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors">返回首页</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-8">
      <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xl text-gold">
            {user.lucky_code?.charAt(0) || user.nickname?.charAt(0) || '?'}
          </div>
          <div>
            <div className="font-display text-lg text-gold">{user.lucky_code || '未设置'}</div>
            {user.nickname && <div className="text-sm text-paper-dark/70">{user.nickname}</div>}
            {user.email && <div className="text-xs text-paper-dark/50">{user.email}</div>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-lg bg-xuan-surface/50 p-2">
            <div className="text-gold font-display text-lg">{user.merit || 0}</div>
            <div className="text-paper-dark/50 text-xs">功德</div>
          </div>
          <div className="rounded-lg bg-xuan-surface/50 p-2">
            <div className="text-gold font-display text-lg">{user.total_merit_added || 0}</div>
            <div className="text-paper-dark/50 text-xs">累计功德</div>
          </div>
          <div className="rounded-lg bg-xuan-surface/50 p-2">
            <div className="text-gold font-display text-lg">{user.is_admin ? '是' : '否'}</div>
            <div className="text-paper-dark/50 text-xs">管理员</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm">
        <h3 className="font-display text-base text-gold mb-3">更多功能</h3>
        <div className="space-y-2 text-sm">
          {user.is_admin && (
            <Link to="/admin" className="flex items-center justify-between rounded-lg bg-xuan-surface/50 px-4 py-3 text-paper-dark hover:text-gold transition-colors">
              <span>管理后台</span>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          )}
          <button onClick={logout} className="flex w-full items-center justify-between rounded-lg bg-xuan-surface/50 px-4 py-3 text-vermillion-light hover:bg-vermillion/10 transition-colors">
            <span>退出登录</span>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gold/20 bg-xuan-card/80 p-5 backdrop-blur-sm">
        <h3 className="font-display text-base text-gold mb-3">善缘传灯</h3>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-xuan-surface/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-paper-dark/60">我的传灯码</span>
              <span className="font-display text-lg text-gold">{referralInfo?.code || '-'}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded bg-xuan-surface/60 p-2"><div className="text-gold">{referralInfo?.used_count || 0}</div><div className="text-xs text-paper-dark/50">已结善缘</div></div>
              <div className="rounded bg-xuan-surface/60 p-2"><div className="text-gold">¥{referralInfo?.earnings || 0}</div><div className="text-xs text-paper-dark/50">可回向</div></div>
            </div>
            <button type="button" onClick={copyInvite} className="mt-3 w-full rounded-lg border border-gold/25 px-3 py-2 text-gold hover:bg-gold/10">复制传灯链接</button>
          </div>

          {!referralInfo?.inviter && (
            <div className="rounded-lg bg-xuan-surface/50 p-3">
              <div className="mb-2 text-xs text-paper-dark/60">填写有缘人的传灯码</div>
              <div className="flex gap-2">
                <input className="h-10 min-w-0 flex-1 rounded-lg border border-gold/20 bg-xuan-surface px-3 text-paper-dark" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="输入传灯码" />
                <button type="button" onClick={handleApplyInvite} className="rounded-lg bg-gold/20 px-3 text-gold hover:bg-gold/30">结缘</button>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-xuan-surface/50 p-3">
            <div className="mb-2 text-xs text-paper-dark/60">福缘回向</div>
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0" className="h-10 min-w-0 flex-1 rounded-lg border border-gold/20 bg-xuan-surface px-3 text-paper-dark" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={`最低 ¥${referralInfo?.settings?.min_withdraw_amount || 10}`} />
              <button type="button" onClick={handleWithdraw} className="rounded-lg bg-gold/20 px-3 text-gold hover:bg-gold/30">申请</button>
            </div>
          </div>

          {refStatus && <p className="rounded-lg border border-gold/10 bg-xuan-surface/30 px-3 py-2 text-xs text-paper-dark/70">{refStatus}</p>}

          {(referralInfo?.commissions || []).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-paper-dark/60">最近善缘</div>
              {referralInfo.commissions.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between rounded bg-xuan-surface/40 px-3 py-2 text-xs">
                  <span>{item.product_name || item.product_id || '善缘回向'}</span>
                  <span className="text-gold">¥{item.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
