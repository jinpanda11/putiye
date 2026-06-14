const API_BASE = '/api/v1';

function getToken() {
  try { return localStorage.getItem('putiyuan_token'); } catch { return null; }
}

function setToken(t) {
  try {
    if (t) localStorage.setItem('putiyuan_token', t);
  } catch {
    // localStorage can be unavailable in privacy modes.
  }
}

function clearToken() {
  try { localStorage.removeItem('putiyuan_token'); } catch {
    // Ignore storage failures; the in-memory request will simply omit auth.
  }
}

function getDeviceId() {
  try {
    let d = localStorage.getItem('putiyuan_device_id');
    if (!d) {
      d = 'web_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('putiyuan_device_id', d);
    }
    return d;
  } catch {
    return 'ssr_' + Date.now();
  }
}

export { getToken, setToken, clearToken, getDeviceId };

export function getSavedUser() {
  try {
    const raw = localStorage.getItem('putiyuan_user_v2');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(u) {
  try {
    if (u) localStorage.setItem('putiyuan_user_v2', JSON.stringify(u));
  } catch {
    // Best-effort cache only.
  }
}

async function request(method, path, data, requireAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

  if (json.code === 0) return json.data;
  if (json.code === 40101) {
    clearToken();
    window.dispatchEvent(new CustomEvent('putiyuan:auth-expired'));
  }
  throw new Error(json.message || 'Request failed');
}

function persistAuth(data) {
  if (data?.token) setToken(data.token);
  if (data?.user) saveUser(data.user);
  return data;
}

function normalizeLotteryDraw(draw) {
  if (!draw || typeof draw !== 'object') return draw;
  return {
    ...draw,
    sign_name: draw.sign_name || draw.title,
    sign_index: draw.sign_index ?? draw.sign_no,
    sign_type: draw.sign_type || draw.level,
    content: draw.content || [draw.poem, draw.interpret].filter(Boolean).join('\n\n'),
  };
}

function normalizeDivinationResult(result) {
  if (!result || typeof result !== 'object') return result;
  return {
    ...result,
    hexagram_name: result.hexagram_name || result.hexagram?.name || result.original_hexagram?.name,
    yao_lines: result.yao_lines || (Array.isArray(result.lines)
      ? result.lines.map(line => line.type === 'yang' ? 1 : 0)
      : undefined),
  };
}

function normalizeBlessingPayload(data = {}) {
  const days = Number(data.duration_days || data.days || 0);
  return {
    ...data,
    beneficiary_name: data.beneficiary_name || data.name || data.content,
    sponsor_nickname: data.sponsor_nickname || data.nickname,
    duration: data.duration || (days >= 365 ? 'year' : days >= 90 ? 'quarter' : 'month'),
  };
}

function normalizeBlessingWall(data) {
  const list = Array.isArray(data) ? data : (data?.wall || data?.entries || []);
  return list.map(item => ({
    ...item,
    lamp_type: item.lamp_type || item.lampType,
    relation: item.relation || item.blessing_type,
    nickname: item.nickname || item.sponsorNickname,
    wish: item.wish || item.content || item.beneficiaryName,
  }));
}

export const auth = {
  anonymousInit: () => request('POST', '/auth/anonymous/init', { device_id: getDeviceId() }, false).then(persistAuth),
  login: (account, password) => request('POST', '/auth/login', { account, password, device_id: getDeviceId() }, false).then(persistAuth),
  register: (data) => request('POST', '/auth/register', { ...data, device_id: getDeviceId() }).then(persistAuth),
  me: () => request('POST', '/auth/me', {}),
  restoreByLuckyCode: (code) => request('POST', '/auth/restore/by-lucky-code', { lucky_code: code, device_id: getDeviceId() }, false).then(persistAuth),
  restoreByEmail: (email, code) => request('POST', '/auth/restore/by-email', { email, code, device_id: getDeviceId() }, false).then(persistAuth),
  sendVerifyCode: (email) => request('POST', '/auth/send-verify-code', { email }),
  bindEmail: (email, code) => request('POST', '/auth/bind-email', { email, code }).then(persistAuth),
  history: {
    push: (kind, title, subtitle, payload) => request('POST', '/auth/history/push', { kind, title, subtitle, payload }),
    list: (kind, limit = 30) => request('GET', `/auth/history/list?kind=${encodeURIComponent(kind)}&limit=${limit}`),
    clear: (kind) => request('POST', '/auth/history/clear', { kind }),
  },
};

export const bazi = {
  calculate: (data) => request('POST', '/bazi/calculate', data),
  analyzeSSE: (data, cb) => readSSE('/bazi/analyze', data, cb),
};

export const entitlement = {
  status: (productId, sessionId) => request('POST', '/entitlement/status', {
    product_id: productId,
    kind: productId,
    session_id: sessionId,
  }),
  unlockCheck: (kind, sessionId) => request('POST', '/entitlement/unlock-check', {
    kind,
    session_id: sessionId,
  }),
};

export const lottery = {
  draw: (question) => request('POST', '/lottery/draw', { question, device_id: getDeviceId() }).then(normalizeLotteryDraw),
  interpretSSE: (data, cb) => readSSE('/lottery/interpret', data, cb),
};

export const divination = {
  cast: (question) => request('POST', '/divination/cast', { question }).then(normalizeDivinationResult),
  interpretSSE: (data, cb) => readSSE('/divination/interpret', data, cb),
};

export const naming = {
  generate: (data) => request('POST', '/naming/generate', data),
  reveal: (data) => request('POST', '/naming/reveal', data),
};

export const dream = {
  categories: () => request('GET', '/dream/categories').then(data => data?.categories || []),
  popular: () => request('GET', '/dream/popular').then(data => data?.items || []),
  byCategory: (cat) => request('GET', `/dream/by-category?category_id=${encodeURIComponent(cat)}`),
  search: (q, limit = 20) => request('GET', `/dream/search?query=${encodeURIComponent(q)}&limit=${limit}`),
  deepInterpretSSE: (data, cb) => readSSE('/dream/deep-interpret', data, cb),
};

export const blessing = {
  catalog: () => request('GET', '/blessing/catalog'),
  create: (data) => request('POST', '/blessing/create', normalizeBlessingPayload(data)),
  wall: () => request('GET', '/blessing/wall').then(normalizeBlessingWall),
};

export const almanac = {
  today: () => request('GET', '/almanac/today'),
  week: () => request('GET', '/almanac/week'),
};

export const merit = {
  info: () => request('GET', '/merit/info'),
  add: (amount, reason) => request('POST', '/merit/add', { amount, reason }),
  leaderboard: () => request('GET', '/merit/leaderboard'),
};

export const meditation = {
  catalog: () => request('GET', '/meditation/catalog'),
  complete: (seconds) => request('POST', '/meditation/complete', { duration_seconds: seconds }),
};

export const palmistry = {
  upload: (imageBase64, hand) => request('POST', '/palmistry/upload', { image_base64: imageBase64, hand }),
  preview: (sessionId) => request('POST', '/palmistry/preview', { session_id: sessionId }),
  interpretSSE: (sessionId, masterId, cb) => readSSE('/palmistry/interpret', { session_id: sessionId, master_id: masterId }, cb),
};

export const payment = {
  prices: () => request('GET', '/payment/prices'),
  create: (productId, extras = {}) => request('POST', '/payment/create', { product_id: productId, extras }),
  status: (orderId) => request('GET', `/payment/status?order_id=${encodeURIComponent(orderId)}`),
  buyerReport: (orderId) => request('POST', '/payment/buyer-report', { order_id: orderId }),
};

export const referral = {
  apply: (code) => request('POST', '/referral/apply', { invite_code: code, device_id: getDeviceId() }),
  me: () => request('GET', '/referral/me'),
  withdraw: (data) => request('POST', '/referral/withdraw', data),
};

export async function readSSE(url, body, callbacks = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(API_BASE + url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) throw new Error(`SSE failed (${response.status})`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
  let currentEvent = '';
  while (!done) {
    const { done: d, value } = await reader.read();
    done = d;
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        try {
          const payload = JSON.parse(line.slice(6));
          if (currentEvent === 'token' && callbacks.onToken) callbacks.onToken(payload.text || '');
          else if (currentEvent === 'meta' && callbacks.onMeta) callbacks.onMeta(payload);
          else if (currentEvent === 'thinking' && callbacks.onThinking) callbacks.onThinking(payload.text || payload.phase || '');
          else if (currentEvent === 'reference' && callbacks.onReference) callbacks.onReference(payload);
          else if (currentEvent === 'done' && callbacks.onDone) callbacks.onDone(payload);
        } catch {
          // Ignore malformed SSE payload chunks.
        }
      }
    }
  }
}

export default {
  getToken, setToken, clearToken, getDeviceId,
  auth, bazi, lottery, divination, naming, dream,
  blessing, almanac, merit, meditation, palmistry, payment, referral, entitlement,
  readSSE,
};
