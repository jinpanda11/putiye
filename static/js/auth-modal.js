/* ===========================================================
   菩提苑 · 登录注册弹窗 (独立版)
   不注入任何 DOM 元素，专用于 Next.js 页面
   =========================================================== */

const AM_API_BASE = '/api/v1';
let AM_TOKEN = localStorage.getItem('putiyuan_token');
let AM_USER = null;

// ─── API Client ───

async function amApi(method, path, data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (AM_TOKEN) opts.headers['Authorization'] = 'Bearer ' + AM_TOKEN;
  if (data && method === 'POST') opts.body = JSON.stringify(data);
  try {
    const res = await fetch(AM_API_BASE + path, opts);
    return await res.json();
  } catch {
    return { code: -1, message: '网络错误', data: null };
  }
}

// ─── Toast ───

let amToastTimer;

function amToast(msg, duration) {
  duration = duration || 2500;
  var el = document.getElementById('am-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'am-toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(26,20,16,0.92);color:#f0e6d3;padding:10px 24px;border-radius:999px;font-size:0.9rem;border:1px solid rgba(201,160,94,0.3);backdrop-filter:blur(8px);transition:opacity 0.3s;opacity:0;pointer-events:none;white-space:nowrap;max-width:90vw';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(amToastTimer);
  amToastTimer = setTimeout(function(){ el.style.opacity = '0'; }, duration);
}

// ─── Modal ───

function amOpenModal(html) {
  var overlay = document.getElementById('am-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'am-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);opacity:0;transition:opacity 0.25s';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) amCloseModal(); });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = '<div style="background:linear-gradient(145deg,#1a1410,#2a2018);border:1px solid rgba(201,160,94,0.3);border-radius:16px;padding:2rem;max-width:400px;width:92vw;color:#f0e6d3;box-shadow:0 20px 60px rgba(0,0,0,0.5);max-height:90vh;overflow-y:auto">' + html + '</div>';
  requestAnimationFrame(function(){ overlay.style.opacity = '1'; });
}

function amCloseModal() {
  var overlay = document.getElementById('am-modal-overlay');
  if (overlay) overlay.style.opacity = '0';
}

// ─── Login / Register ───

function amShowLoginModal() {
  amOpenModal(
    '<h2 style="text-align:center;font-size:1.4rem;font-weight:600;margin-bottom:0.25rem;color:#c9a05e">登录账号</h2>' +
    '<p style="text-align:center;color:#a09080;font-size:0.85rem;margin-bottom:1.25rem">可用账号或吉祥号登录</p>' +
    '<div style="margin-bottom:1rem">' +
      '<label style="display:block;font-size:0.8rem;color:#a09080;margin-bottom:0.3rem">账号</label>' +
      '<input id="am-login-account" style="width:100%;padding:0.65rem 0.8rem;border-radius:8px;border:1px solid rgba(201,160,94,0.25);background:rgba(255,255,255,0.06);color:#f0e6d3;font-size:0.95rem;outline:none;box-sizing:border-box" placeholder="账号 / 吉祥号" />' +
    '</div>' +
    '<div style="margin-bottom:1.25rem">' +
      '<label style="display:block;font-size:0.8rem;color:#a09080;margin-bottom:0.3rem">密码</label>' +
      '<input id="am-login-password" type="password" style="width:100%;padding:0.65rem 0.8rem;border-radius:8px;border:1px solid rgba(201,160,94,0.25);background:rgba(255,255,255,0.06);color:#f0e6d3;font-size:0.95rem;outline:none;box-sizing:border-box" placeholder="输入密码" />' +
    '</div>' +
    '<button onclick="amDoLogin()" style="width:100%;padding:0.7rem;border-radius:8px;border:none;background:linear-gradient(135deg,#c9a05e,#b8924a);color:#1a1410;font-size:1rem;font-weight:600;cursor:pointer;margin-bottom:0.75rem">登录</button>' +
    '<button onclick="amShowRegisterModal()" style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(201,160,94,0.3);background:transparent;color:#c9a05e;font-size:0.9rem;cursor:pointer">还没有账号，去注册</button>'
  );
  setTimeout(function(){
    var inp = document.getElementById('am-login-account');
    if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') amDoLogin(); });
    var pw = document.getElementById('am-login-password');
    if (pw) pw.addEventListener('keydown', function(e) { if (e.key === 'Enter') amDoLogin(); });
  }, 50);
}

function amShowRegisterModal() {
  amOpenModal(
    '<h2 style="text-align:center;font-size:1.4rem;font-weight:600;margin-bottom:0.25rem;color:#c9a05e">注册账号</h2>' +
    '<p style="text-align:center;color:#a09080;font-size:0.85rem;margin-bottom:1.25rem">注册后可跨设备找回记录。第一个注册账号会自动成为管理员。</p>' +
    '<div style="margin-bottom:0.8rem">' +
      '<label style="display:block;font-size:0.8rem;color:#a09080;margin-bottom:0.3rem">账号</label>' +
      '<input id="am-reg-username" style="width:100%;padding:0.65rem 0.8rem;border-radius:8px;border:1px solid rgba(201,160,94,0.25);background:rgba(255,255,255,0.06);color:#f0e6d3;font-size:0.95rem;outline:none;box-sizing:border-box" placeholder="3-24 位字母、数字或下划线" />' +
    '</div>' +
    '<div style="margin-bottom:0.8rem">' +
      '<label style="display:block;font-size:0.8rem;color:#a09080;margin-bottom:0.3rem">昵称</label>' +
      '<input id="am-reg-nickname" style="width:100%;padding:0.65rem 0.8rem;border-radius:8px;border:1px solid rgba(201,160,94,0.25);background:rgba(255,255,255,0.06);color:#f0e6d3;font-size:0.95rem;outline:none;box-sizing:border-box" placeholder="可选" />' +
    '</div>' +
    '<div style="margin-bottom:0.8rem">' +
      '<label style="display:block;font-size:0.8rem;color:#a09080;margin-bottom:0.3rem">邮箱</label>' +
      '<input id="am-reg-email" type="email" style="width:100%;padding:0.65rem 0.8rem;border-radius:8px;border:1px solid rgba(201,160,94,0.25);background:rgba(255,255,255,0.06);color:#f0e6d3;font-size:0.95rem;outline:none;box-sizing:border-box" placeholder="可选，用于找回账号" />' +
    '</div>' +
    '<div style="margin-bottom:1.25rem">' +
      '<label style="display:block;font-size:0.8rem;color:#a09080;margin-bottom:0.3rem">密码</label>' +
      '<input id="am-reg-password" type="password" style="width:100%;padding:0.65rem 0.8rem;border-radius:8px;border:1px solid rgba(201,160,94,0.25);background:rgba(255,255,255,0.06);color:#f0e6d3;font-size:0.95rem;outline:none;box-sizing:border-box" placeholder="至少 6 位" />' +
    '</div>' +
    '<button onclick="amDoRegister()" style="width:100%;padding:0.7rem;border-radius:8px;border:none;background:linear-gradient(135deg,#c9a05e,#b8924a);color:#1a1410;font-size:1rem;font-weight:600;cursor:pointer;margin-bottom:0.75rem">注册</button>' +
    '<button onclick="amShowLoginModal()" style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(201,160,94,0.3);background:transparent;color:#c9a05e;font-size:0.9rem;cursor:pointer">已有账号，去登录</button>'
  );
}

async function amDoLogin() {
  var account = document.getElementById('am-login-account');
  var password = document.getElementById('am-login-password');
  if (!account || !password) return;
  var a = account.value.trim(), p = password.value;
  if (!a || !p) { amToast('请输入账号和密码'); return; }
  var deviceId = localStorage.getItem('putiyuan_device_id') || 'web_' + Math.random().toString(36).slice(2, 10);
  if (!localStorage.getItem('putiyuan_device_id')) localStorage.setItem('putiyuan_device_id', deviceId);
  var res = await amApi('POST', '/auth/login', { account: a, password: p, device_id: deviceId });
  if (res.code === 0 && res.data) {
    AM_TOKEN = res.data.token;
    AM_USER = res.data.user;
    localStorage.setItem('putiyuan_token', AM_TOKEN);
    amCloseModal();
    amToast('登录成功');
    amNotifyUpdate();
  } else {
    amToast(res.message || '登录失败');
  }
}

async function amDoRegister() {
  var username = document.getElementById('am-reg-username');
  var nickname = document.getElementById('am-reg-nickname');
  var email = document.getElementById('am-reg-email');
  var password = document.getElementById('am-reg-password');
  if (!username || !password) return;
  var u = username.value.trim(), n = nickname ? nickname.value.trim() : '';
  var e = email ? email.value.trim() : '', p = password.value;
  if (!u || !p) { amToast('请输入账号和密码'); return; }
  var deviceId = localStorage.getItem('putiyuan_device_id') || 'web_' + Math.random().toString(36).slice(2, 10);
  if (!localStorage.getItem('putiyuan_device_id')) localStorage.setItem('putiyuan_device_id', deviceId);
  var res = await amApi('POST', '/auth/register', { username: u, nickname: n || undefined, email: e || undefined, password: p, device_id: deviceId });
  if (res.code === 0 && res.data) {
    AM_TOKEN = res.data.token;
    AM_USER = res.data.user;
    localStorage.setItem('putiyuan_token', AM_TOKEN);
    amCloseModal();
    amToast(AM_USER.is_admin ? '注册成功，你已成为管理员' : '注册成功');
    amNotifyUpdate();
  } else {
    amToast(res.message || '注册失败');
  }
}

function amLogout() {
  AM_TOKEN = null;
  AM_USER = null;
  localStorage.removeItem('putiyuan_token');
  amToast('已退出登录');
  amNotifyUpdate();
  setTimeout(function(){ location.reload(); }, 300);
}

// ─── Auth check ───

async function amEnsure() {
  if (!AM_TOKEN) {
    AM_TOKEN = localStorage.getItem('putiyuan_token');
    if (!AM_TOKEN) return null;
  }
  var res = await amApi('POST', '/auth/me', {});
  if (res.code === 0 && res.data) {
    AM_USER = res.data;
    return AM_USER;
  }
  AM_TOKEN = null;
  AM_USER = null;
  localStorage.removeItem('putiyuan_token');
  return null;
}

function amNotifyUpdate() {
  window.dispatchEvent(new CustomEvent('am:user-updated', { detail: AM_USER }));
}
