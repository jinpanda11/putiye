/* ===========================================================
   菩提苑 · 主应用
   包含: API 通信, 用户认证, UI 工具
   =========================================================== */

const API_BASE = '/api/v1';
let TOKEN = localStorage.getItem('putiyuan_token');
let CURRENT_USER = null;

// ─── API Client ───

async function api(method, path, data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (TOKEN) {
    opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  }
  if (data && (method === 'POST' || method === 'PUT')) {
    opts.body = JSON.stringify(data);
  }
  try {
    const res = await fetch(API_BASE + path, opts);
    const json = await res.json();
    if (json.code !== 0 && json.code !== 40101) {
      console.warn('[API]', path, json);
    }
    return json;
  } catch (err) {
    console.error('[API]', path, err);
    return { code: -1, message: '网络错误', data: null };
  }
}

function api_get(path) { return api('GET', path); }
function api_post(path, data) { return api('POST', path, data); }

// ─── Auth ───

async function ensureAuth() {
  if (TOKEN) {
    const res = await api_post('/auth/me', {});
    if (res.code === 0 && res.data) {
      CURRENT_USER = res.data;
      return res.data;
    }
    // Token expired
    TOKEN = null;
    localStorage.removeItem('putiyuan_token');
  }
  // Anonymous init
  let deviceId = localStorage.getItem('putiyuan_device_id');
  if (!deviceId) {
    deviceId = 'web_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('putiyuan_device_id', deviceId);
  }
  const res = await api_post('/auth/anonymous/init', { device_id: deviceId });
  if (res.code === 0 && res.data) {
    TOKEN = res.data.token;
    CURRENT_USER = res.data.user;
    localStorage.setItem('putiyuan_token', TOKEN);
    return res.data.user;
  }
  return null;
}

async function getUser() {
  if (CURRENT_USER) return CURRENT_USER;
  return await ensureAuth();
}

function getUserSync() {
  return CURRENT_USER;
}

// ─── Toast ───

let toastTimer = null;

function showToast(msg, duration = 2500) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ─── Modal ───

function openModal(html) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
}

// ─── Share ───

async function handleShare() {
  const url = window.location.href;
  const title = '菩提苑 · 为家人祈福求灵签';
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(url);
    showToast('链接已复制，分享功德无量 🙏');
  }
}

// ─── Music Player (禅修音乐) ───

let isPlaying = false;
let audioCtx = null;
let gainNode = null;
let isMusicOn = localStorage.getItem('putiyuan_music') === 'on';

function toggleMusic() {
  isMusicOn = !isMusicOn;
  localStorage.setItem('putiyuan_music', isMusicOn ? 'on' : 'off');
  updateMusicIcon();
  if (isMusicOn) {
    startMusic();
  } else {
    stopMusic();
  }
}

function updateMusicIcon() {
  const btn = document.getElementById('music-btn');
  if (!btn) return;
  btn.innerHTML = isMusicOn ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 5l12-2"/></svg>
  ` : `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  `;
}

function startMusic() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.08;
    gainNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isPlaying = true;
  playChantLoop();
}

function stopMusic() {
  isPlaying = false;
}

function playChantLoop() {
  if (!isPlaying || !audioCtx || !isMusicOn) return;
  const now = audioCtx.currentTime;
  const baseFreq = 120;
  const overtones = [1, 2, 3, 4.5, 6, 8];
  overtones.forEach((ratio, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = baseFreq * ratio;
    gain.gain.setValueAtTime(0.02 / (i + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3 + Math.random() * 2);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(now + Math.random() * 0.5);
    osc.stop(now + 3 + Math.random() * 2);
  });
  // Schedule next loop
  setTimeout(() => playChantLoop(), 3000 + Math.random() * 2000);
}

// ─── Restore Modal ───

function showRestoreModal() {
  openModal(`
    <h2>找回缘分记录</h2>
    <p style="color:var(--ink-muted);font-size:0.85rem;text-align:center;margin-bottom:1.25rem;">
      通过吉祥号或绑定邮箱找回你的历史记录
    </p>
    <div class="form-group">
      <label class="form-label">吉祥号</label>
      <input class="form-input" id="restore-lucky" placeholder="例如：莲心042" />
    </div>
    <p style="text-align:center;color:var(--ink-muted);font-size:0.8rem;margin:0.5rem 0;">— 或 —</p>
    <div class="form-group">
      <label class="form-label">邮箱</label>
      <input class="form-input" id="restore-email" type="email" placeholder="输入绑定邮箱" />
    </div>
    <div class="form-group" id="restore-code-group" style="display:none;">
      <label class="form-label">验证码</label>
      <div style="display:flex;gap:0.5rem;">
        <input class="form-input" id="restore-code" type="text" placeholder="6 位验证码" style="flex:1;" />
        <button class="btn btn-ghost" id="restore-send-code-btn" onclick="sendRestoreCode()">发送验证码</button>
      </div>
    </div>
    <button class="btn btn-gold btn-block" onclick="doRestore()" style="margin-top:0.5rem;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
      找回记录
    </button>
  `);
  // Enter key support
  setTimeout(() => {
    const inp = document.getElementById('restore-lucky');
    if (inp) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRestore(); });
    const emailInp = document.getElementById('restore-email');
    if (emailInp) emailInp.addEventListener('input', () => {
      document.getElementById('restore-code-group').style.display = emailInp.value.trim() ? 'block' : 'none';
    });
  }, 100);
}

async function sendRestoreCode() {
  const email = document.getElementById('restore-email')?.value.trim();
  if (!email) { showToast('请输入邮箱'); return; }
  const btn = document.getElementById('restore-send-code-btn');
  btn.disabled = true;
  btn.textContent = '发送中...';
  const res = await api_post('/auth/send-verify-code', { email });
  btn.disabled = false;
  if (res.code === 0) {
    btn.textContent = '已发送';
    showToast(res.data?.sent ? '验证码已发送到邮箱' : (res.message || '验证码已发送（开发模式见日志）'));
  } else {
    btn.textContent = '重新发送';
    showToast(res.message || '发送失败');
  }
}

async function doRestore() {
  const lucky = document.getElementById('restore-lucky')?.value?.trim();
  const email = document.getElementById('restore-email')?.value?.trim();
  const code = document.getElementById('restore-code')?.value?.trim();
  let deviceId = localStorage.getItem('putiyuan_device_id');
  if (!deviceId) {
    deviceId = 'web_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('putiyuan_device_id', deviceId);
  }
  let res;
  if (lucky) {
    res = await api_post('/auth/restore/by-lucky-code', { lucky_code: lucky, device_id: deviceId });
  } else if (email && code) {
    res = await api_post('/auth/restore/by-email', { email, code, device_id: deviceId });
  } else {
    showToast('请输入吉祥号，或填写邮箱和验证码');
    return;
  }
  if (res.code === 0 && res.data) {
    TOKEN = res.data.token;
    CURRENT_USER = res.data.user;
    localStorage.setItem('putiyuan_token', TOKEN);
    closeModal();
    showToast('欢迎回来，' + (CURRENT_USER.nickname || CURRENT_USER.lucky_code) + ' 🙏');
    updateUserBadge();
  } else {
    showToast(res.message || '查找失败');
  }
}

function getDeviceId() {
  let deviceId = localStorage.getItem('putiyuan_device_id');
  if (!deviceId) {
    deviceId = 'web_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('putiyuan_device_id', deviceId);
  }
  return deviceId;
}

function showLoginModal() {
  openModal(`
    <h2>登录账号</h2>
    <p style="color:var(--ink-muted);font-size:0.85rem;text-align:center;margin-bottom:1rem;">
      可用账号或吉祥号登录
    </p>
    <div class="form-group">
      <label class="form-label">账号</label>
      <input class="form-input" id="login-account" placeholder="账号 / 吉祥号" autocomplete="username" />
    </div>
    <div class="form-group">
      <label class="form-label">密码</label>
      <input class="form-input" id="login-password" type="password" placeholder="输入密码" autocomplete="current-password" />
    </div>
    <button class="btn btn-gold btn-block" onclick="doLogin()">登录</button>
    <button class="btn btn-ghost btn-block" onclick="showRegisterModal()" style="margin-top:0.5rem;">还没有账号，去注册</button>
  `);
}

function showRegisterModal() {
  openModal(`
    <h2>注册账号</h2>
    <p style="color:var(--ink-muted);font-size:0.85rem;text-align:center;margin-bottom:1rem;">
      注册后可跨设备找回记录。第一个注册账号会自动成为管理员。
    </p>
    <div class="form-group">
      <label class="form-label">账号</label>
      <input class="form-input" id="reg-username" placeholder="3-24 位字母、数字或下划线" autocomplete="username" />
    </div>
    <div class="form-group">
      <label class="form-label">昵称</label>
      <input class="form-input" id="reg-nickname" placeholder="可选" />
    </div>
    <div class="form-group">
      <label class="form-label">邮箱</label>
      <input class="form-input" id="reg-email" type="email" placeholder="可选，用于找回账号" />
    </div>
    <div class="form-group">
      <label class="form-label">密码</label>
      <input class="form-input" id="reg-password" type="password" placeholder="至少 6 位" autocomplete="new-password" />
    </div>
    <button class="btn btn-gold btn-block" onclick="doRegister()">注册</button>
    <button class="btn btn-ghost btn-block" onclick="showLoginModal()" style="margin-top:0.5rem;">已有账号，去登录</button>
  `);
}

async function doLogin() {
  const account = document.getElementById('login-account')?.value.trim();
  const password = document.getElementById('login-password')?.value || '';
  if (!account || !password) {
    showToast('请输入账号和密码');
    return;
  }
  const res = await api_post('/auth/login', { account, password, device_id: getDeviceId() });
  if (res.code === 0 && res.data) {
    TOKEN = res.data.token;
    CURRENT_USER = res.data.user;
    localStorage.setItem('putiyuan_token', TOKEN);
    closeModal();
    updateUserBadge();
    showToast('登录成功');
    window.dispatchEvent(new CustomEvent('putiyuan:user-updated', { detail: CURRENT_USER }));
  } else {
    showToast(res.message || '登录失败');
  }
}

async function doRegister() {
  const username = document.getElementById('reg-username')?.value.trim();
  const nickname = document.getElementById('reg-nickname')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value || '';
  if (!username || !password) {
    showToast('请输入账号和密码');
    return;
  }
  const res = await api_post('/auth/register', {
    username, nickname, email: email || undefined, password, device_id: getDeviceId()
  });
  if (res.code === 0 && res.data) {
    TOKEN = res.data.token;
    CURRENT_USER = res.data.user;
    localStorage.setItem('putiyuan_token', TOKEN);
    closeModal();
    updateUserBadge();
    showToast(CURRENT_USER.is_admin ? '注册成功，你已成为管理员' : '注册成功');
    window.dispatchEvent(new CustomEvent('putiyuan:user-updated', { detail: CURRENT_USER }));
  } else {
    showToast(res.message || '注册失败');
  }
}

function showBindEmailModal() {
  openModal(`
    <h2>绑定邮箱</h2>
    <p style="color:var(--ink-muted);font-size:0.85rem;text-align:center;margin-bottom:1rem;">
      绑定后可通过邮箱验证码找回账号
    </p>
    <div class="form-group">
      <label class="form-label">邮箱</label>
      <input class="form-input" id="bind-email" type="email" placeholder="输入邮箱" />
    </div>
    <div class="form-group">
      <label class="form-label">验证码</label>
      <div style="display:flex;gap:0.5rem;">
        <input class="form-input" id="bind-code" type="text" placeholder="6 位验证码" style="flex:1;" />
        <button class="btn btn-ghost" id="bind-send-code-btn" onclick="sendBindEmailCode()">发送验证码</button>
      </div>
    </div>
    <button class="btn btn-gold btn-block" onclick="doBindEmail()">绑定</button>
  `);
}

async function sendBindEmailCode() {
  const email = document.getElementById('bind-email')?.value.trim();
  if (!email) { showToast('请输入邮箱'); return; }
  const btn = document.getElementById('bind-send-code-btn');
  btn.disabled = true;
  btn.textContent = '发送中...';
  const res = await api_post('/auth/send-verify-code', { email });
  btn.disabled = false;
  if (res.code === 0) {
    btn.textContent = '已发送';
    showToast(res.data?.sent ? '验证码已发送到邮箱' : (res.message || '验证码已发送（开发模式见日志）'));
  } else {
    btn.textContent = '重新发送';
    showToast(res.message || '发送失败');
  }
}

async function doBindEmail() {
  const email = document.getElementById('bind-email')?.value.trim();
  const code = document.getElementById('bind-code')?.value.trim();
  if (!email || !code) {
    showToast('请输入邮箱和验证码');
    return;
  }
  const res = await api_post('/auth/bind-email', { email, code });
  if (res.code === 0 && res.data) {
    TOKEN = res.data.token;
    CURRENT_USER = res.data.user;
    localStorage.setItem('putiyuan_token', TOKEN);
    closeModal();
    updateUserBadge();
    showToast('邮箱已绑定');
    window.dispatchEvent(new CustomEvent('putiyuan:user-updated', { detail: CURRENT_USER }));
  } else {
    showToast(res.message || '绑定失败');
  }
}

function logout() {
  TOKEN = null;
  CURRENT_USER = null;
  localStorage.removeItem('putiyuan_token');
  showToast('已退出登录');
  updateUserBadge();
  ensureAuth().then(() => {
    updateUserBadge();
    window.dispatchEvent(new CustomEvent('putiyuan:user-updated', { detail: CURRENT_USER }));
  });
}

// ─── User Badge Update ───

function updateUserBadge() {
  const el = document.getElementById('user-badge');
  if (!el) return;
  if (!CURRENT_USER) {
    el.innerHTML = `<button type="button" class="btn-restore" style="display:inline-flex;" onclick="showLoginModal()">登录/注册</button>`;
    return;
  }
  if (CURRENT_USER.is_registered) {
    el.innerHTML = `
      <span class="merit-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>
        ${CURRENT_USER.nickname || CURRENT_USER.lucky_code || '善信'}
      </span>
      ${CURRENT_USER.is_admin ? '<a class="btn-restore" style="display:inline-flex;" href="/admin/">后台</a>' : ''}
    `;
  } else {
    el.innerHTML = `<button type="button" class="btn-restore" style="display:inline-flex;" onclick="showLoginModal()">登录/注册</button>`;
  }
}

// ─── Background Inject ───

function injectBackground() {
  if (document.getElementById('bg-injected')) return;
  const div = document.createElement('div');
  div.id = 'bg-injected';
  div.innerHTML = `
    <div class="bg-layer bg-gradient-layer"></div>
    <div class="bg-layer bg-mountain"></div>
    <div class="bg-layer bg-vignette"></div>
    <div class="bg-top-glow"></div>
    <div class="particles" aria-hidden="true">
      <span class="particle"></span><span class="particle"></span><span class="particle"></span>
      <span class="particle"></span><span class="particle"></span><span class="particle"></span>
      <span class="particle"></span><span class="particle"></span><span class="particle"></span>
      <span class="particle"></span><span class="particle"></span><span class="particle"></span>
    </div>
  `;
  document.body.prepend(div);
}

// ─── Header Inject ───

function injectHeader(activeNav = '') {
  const navItems = [
    { path: '/', label: '首页', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' },
    { path: '/qifu/', label: '祈福', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' },
    { path: '/almanac/', label: '黄历', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>' },
    { path: '/lottery/', label: '灵签', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>' },
    { path: '/profile/', label: '我的', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { path: '/more/', label: '更多', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>' },
  ];

  if (document.getElementById('main-header')) return;
  const header = document.createElement('header');
  header.id = 'main-header';
  header.className = 'header';
  header.innerHTML = `
    <div class="header-inner">
      <a href="/" class="logo">
        <svg class="logo-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M32 6 C 22 6, 12 12, 10 22 C 8 32, 14 44, 24 50 C 28 53, 30 56, 31 60 L 32 62 L 33 60 C 34 56, 36 53, 40 50 C 50 44, 56 32, 54 22 C 52 12, 42 6, 32 6 Z" fill="currentColor" fill-opacity="0.12"></path>
          <path d="M32 8 V 60" stroke-width="1.4"></path>
          <path d="M32 16 C 26 18, 20 22, 16 28"></path>
          <path d="M32 16 C 38 18, 44 22, 48 28"></path>
          <path d="M32 28 C 24 30, 18 36, 16 42"></path>
          <path d="M32 28 C 40 30, 46 36, 48 42"></path>
          <path d="M32 42 C 28 46, 26 50, 26 54"></path>
          <path d="M32 42 C 36 46, 38 50, 38 54"></path>
        </svg>
        <span class="logo-text">菩提苑</span>
      </a>
      <nav class="desktop-nav">
        <a href="/qifu/">为家人祈福</a>
        <a href="/almanac/">今日黄历</a>
        <a href="/lottery/">求灵签</a>
        <a href="/bazi/">八字精批</a>
        <a href="/dream/">周公解梦</a>
        <a href="/palmistry/">看手相</a>
        <a href="/naming/">宝宝起名</a>
        <a href="/divination/">六爻占卜</a>
        <a href="/meditation/">静心禅坐</a>
      </nav>
      <div class="header-actions">
        <button type="button" id="music-btn" class="icon-btn" onclick="toggleMusic()" title="禅修背景音乐">${isMusicOn ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 5l12-2"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'}</button>
        <button type="button" class="btn-restore" onclick="showRestoreModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
          找回记录
        </button>
        <span id="user-badge"></span>
      </div>
    </div>
  `;
  document.body.prepend(header);

  // Scroll effect
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── Bottom Nav Inject ───

function injectBottomNav(activeNav = '') {
  if (document.getElementById('bottom-nav')) return;
  // Normalize active path
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const items = [
    { path: '/', label: '首页', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' },
    { path: '/qifu/', label: '祈福', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' },
    { path: '/almanac/', label: '黄历', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>' },
    { path: '/lottery/', label: '灵签', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>' },
    { path: '/profile/', label: '我的', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { path: '/more/', label: '更多', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>' },
  ];
  const nav = document.createElement('nav');
  nav.id = 'bottom-nav';
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <div class="bottom-nav-inner">
      ${items.map(item => {
        const isActive = (item.path === '/') ? (path === '/' || path === '') : path.startsWith(item.path.replace(/\/$/, ''));
        return `<a href="${item.path}" class="nav-item ${isActive ? 'active' : ''}">${item.icon}<span>${item.label}</span></a>`;
      }).join('')}
    </div>
  `;
  document.body.appendChild(nav);
}

// ─── Share FAB ───

function injectShareFab() {
  if (document.getElementById('share-fab')) return;
  const fab = document.createElement('button');
  fab.id = 'share-fab';
  fab.className = 'share-fab';
  fab.setAttribute('aria-label', '分享菩提苑');
  fab.title = '分享传播 · 功德倍增';
  fab.onclick = handleShare;
  fab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>';
  document.body.appendChild(fab);
}

// ─── Init ───

async function initApp() {
  injectBackground();
  injectHeader();
  injectBottomNav();
  injectShareFab();
  await ensureAuth();
  updateUserBadge();
}

// Wait for DOM and run
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
