import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { auth, setToken, saveUser } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export function AuthModal() {
  const { modalOpen, closeModal, modalMode, setUser, switchMode } = useAuth();
  const mode = modalMode || 'login';
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!account || !password) { setError('请输入账号和密码'); return; }
    setLoading(true); setError(null);
    try {
      const data = await auth.login(account, password);
      if (data.token) setToken(data.token);
      if (data.user) { saveUser(data.user); setUser(data.user); }
      closeModal();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!username || !password) { setError('请输入账号和密码'); return; }
    if (password.length < 6) { setError('密码至少 6 位'); return; }
    setLoading(true); setError(null);
    try {
      const data = await auth.register({ username, password, nickname: nickname || undefined, email: email || undefined });
      if (data.token) setToken(data.token);
      if (data.user) { saveUser(data.user); setUser(data.user); }
      closeModal();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={modalOpen} onClose={closeModal}>
      {mode === 'login' ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 className="font-display text-2xl text-gold">登录账号</h2>
            <p className="mt-1 text-sm text-paper-dark/75">可用账号或吉祥号登录</p>
          </div>
          <div>
            <label className="block text-xs text-paper-dark/70 mb-1">账号 / 吉祥号</label>
            <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="账号 / 吉祥号" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <label className="block text-xs text-paper-dark/70 mb-1">密码</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入密码" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p className="text-sm text-vermillion-light bg-vermillion/10 rounded-md px-3 py-2 border border-vermillion/30">{error}</p>}
          <Button onClick={handleLogin} loading={loading} className="w-full h-12 text-lg">登录</Button>
          <button type="button" onClick={() => { setError(null); switchMode('register'); }} className="w-full py-2 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-colors">
            还没有账号，去注册
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h2 className="font-display text-2xl text-gold">注册账号</h2>
            <p className="mt-1 text-sm text-paper-dark/75">注册后可跨设备找回记录</p>
          </div>
          <div>
            <label className="block text-xs text-paper-dark/70 mb-1">账号 *</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="3-24 位字母、数字或下划线" />
          </div>
          <div>
            <label className="block text-xs text-paper-dark/70 mb-1">昵称</label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="可选" />
          </div>
          <div>
            <label className="block text-xs text-paper-dark/70 mb-1">邮箱</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="可选，用于找回账号" />
          </div>
          <div>
            <label className="block text-xs text-paper-dark/70 mb-1">密码 *</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少 6 位" onKeyDown={e => e.key === 'Enter' && handleRegister()} />
          </div>
          {error && <p className="text-sm text-vermillion-light bg-vermillion/10 rounded-md px-3 py-2 border border-vermillion/30">{error}</p>}
          <Button onClick={handleRegister} loading={loading} className="w-full h-12 text-lg">注册</Button>
          <button type="button" onClick={() => { setError(null); switchMode('login'); }} className="w-full py-2 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-colors">
            已有账号，去登录
          </button>
        </div>
      )}
    </Modal>
  );
}
