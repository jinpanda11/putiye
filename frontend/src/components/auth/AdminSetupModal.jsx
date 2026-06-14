import { useState } from 'react';
import { setup, setToken, saveUser } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function AdminSetupModal() {
  const { setupRequired, completeSetup } = useAuth();
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!username.trim() || !password) {
      setError('请填写管理员账号和密码');
      return;
    }
    if (password.length < 8) {
      setError('管理员密码至少 8 位');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await setup.createAdmin({
        username: username.trim(),
        nickname: nickname.trim() || undefined,
        email: email.trim() || undefined,
        password,
      });
      if (data.token) setToken(data.token);
      if (data.user) {
        saveUser(data.user);
        completeSetup(data.user);
      }
    } catch (e) {
      setError(e.message || '初始化管理员失败');
    } finally {
      setLoading(false);
    }
  }

  if (!setupRequired) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gold/30 bg-xuan-card p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z"/><path d="M9 12l2 2 4-5"/></svg>
          </div>
          <h2 className="font-display text-2xl text-gold">设置管理员</h2>
          <p className="mt-1 text-sm text-paper-dark/70">首次部署需要先创建后台管理账号</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-paper-dark/70">管理员账号 *</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="3-24 位字母、数字或下划线" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-dark/70">昵称</label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="可选" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-dark/70">邮箱</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="可选，用于找回账号" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-dark/70">管理员密码 *</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少 8 位" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {error && <p className="rounded-md border border-vermillion/30 bg-vermillion/10 px-3 py-2 text-sm text-vermillion-light">{error}</p>}
          <Button onClick={handleSubmit} loading={loading} className="h-12 w-full text-lg">创建管理员</Button>
        </div>
      </div>
    </div>
  );
}
