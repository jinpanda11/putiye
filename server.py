#!/usr/bin/env python3
"""菩提苑 本地镜像服务 - Full backend with API + static file serving."""
import os, json, re, uuid, hashlib, hmac, base64, sqlite3, datetime, mimetypes, html, random, string, time, smtplib, threading
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler
import traceback
from email.message import EmailMessage
from urllib.parse import urlparse, parse_qs, urlencode
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

PORT = int(os.environ.get('PUTIYUAN_PORT') or os.environ.get('PORT') or 3000)
HOST = os.environ.get('PUTIYUAN_HOST') or '0.0.0.0'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get('PUTIYUAN_DB_PATH') or os.path.join(BASE_DIR, 'data.db')
SECRET_KEY = os.environ.get('PUTIYUAN_SECRET_KEY') or 'putiyuan-local-dev-k3y!@#'
TOKEN_EXPIRE_DAYS = 365

# ─── Email (SMTP) Config ─────────────────────────────────────────────────────
SMTP_HOST = os.environ.get('PUTIYUAN_SMTP_HOST') or ''
SMTP_PORT = int(os.environ.get('PUTIYUAN_SMTP_PORT') or 587)
SMTP_USER = os.environ.get('PUTIYUAN_SMTP_USER') or ''
SMTP_PASS = os.environ.get('PUTIYUAN_SMTP_PASS') or ''
SMTP_FROM = os.environ.get('PUTIYUAN_SMTP_FROM') or SMTP_USER
VERIFY_CODE_EXPIRE_MINUTES = 10

# In-memory cache for email verify codes (also persisted to DB)
_verify_code_cache = {}
_verify_code_lock = threading.Lock()

# ─── Database ────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            lucky_code TEXT UNIQUE NOT NULL,
            username TEXT,
            device_id TEXT,
            email TEXT,
            email_verified INTEGER DEFAULT 0,
            nickname TEXT,
            password_hash TEXT,
            is_admin INTEGER DEFAULT 0,
            token TEXT,
            token_created_at TEXT,
            registered_at TEXT,
            last_login_at TEXT,
            merit INTEGER DEFAULT 0,
            total_merit_added INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS email_verify_codes (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            user_id TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS bazi_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            input_data TEXT NOT NULL,
            result TEXT NOT NULL,
            cost REAL DEFAULT 0.02,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS naming_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            params TEXT NOT NULL,
            result TEXT NOT NULL,
            revealed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS divination_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            question TEXT,
            hexagrams TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS lottery_draws (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            question TEXT,
            sign_no INTEGER,
            result TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS merits (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            amount INTEGER NOT NULL,
            reason TEXT,
            animation TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS blessings (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            content TEXT NOT NULL,
            blessing_type TEXT,
            is_public INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            product_id TEXT NOT NULL,
            product_name TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'CNY',
            status TEXT DEFAULT 'pending',
            provider TEXT DEFAULT 'alipay_personal',
            paid_at TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS payment_gateways (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            provider TEXT DEFAULT 'epay',
            enabled INTEGER DEFAULT 0,
            api_url TEXT DEFAULT '',
            merchant_id TEXT DEFAULT '',
            merchant_key TEXT DEFAULT '',
            pay_type TEXT DEFAULT 'alipay',
            sort_order INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS product_prices (
            product_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            enabled INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 1,
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS blessing_duration_prices (
            duration_id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            days INTEGER NOT NULL,
            price REAL NOT NULL,
            enabled INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 1,
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            kind TEXT NOT NULL,
            title TEXT,
            subtitle TEXT,
            payload TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS referral_codes (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE,
            code TEXT UNIQUE NOT NULL,
            used_count INTEGER DEFAULT 0,
            earnings REAL DEFAULT 0.0,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS ai_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            enabled INTEGER DEFAULT 0,
            provider_name TEXT DEFAULT 'OpenAI Compatible',
            base_url TEXT DEFAULT 'https://api.openai.com/v1',
            api_key TEXT,
            text_model TEXT DEFAULT 'gpt-4o-mini',
            vision_model TEXT DEFAULT 'gpt-4o-mini',
            temperature REAL DEFAULT 0.7,
            timeout_seconds INTEGER DEFAULT 45,
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS palmistry_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            hand TEXT,
            image_base64 TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
    """)
    conn.execute(
        """INSERT OR IGNORE INTO ai_config
           (id, enabled, provider_name, base_url, api_key, text_model, vision_model, temperature, timeout_seconds)
           VALUES (1, 0, 'OpenAI Compatible', 'https://api.openai.com/v1', '', 'gpt-4o-mini', 'gpt-4o-mini', 0.7, 45)"""
    )
    migrate_users(conn)
    migrate_payments(conn)
    seed_payment_config(conn)
    conn.commit()
    conn.close()

def migrate_users(conn):
    cols = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    migrations = [
        ("username", "ALTER TABLE users ADD COLUMN username TEXT"),
        ("password_hash", "ALTER TABLE users ADD COLUMN password_hash TEXT"),
        ("is_admin", "ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"),
        ("registered_at", "ALTER TABLE users ADD COLUMN registered_at TEXT"),
        ("last_login_at", "ALTER TABLE users ADD COLUMN last_login_at TEXT"),
        ("email", "ALTER TABLE users ADD COLUMN email TEXT"),
        ("email_verified", "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0"),
    ]
    for col, sql in migrations:
        if col not in cols:
            conn.execute(sql)
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL AND username <> ''")

def migrate_payments(conn):
    cols = {row[1] for row in conn.execute("PRAGMA table_info(orders)").fetchall()}
    migrations = [
        ("gateway_id", "ALTER TABLE orders ADD COLUMN gateway_id TEXT"),
        ("trade_no", "ALTER TABLE orders ADD COLUMN trade_no TEXT"),
        ("payment_url", "ALTER TABLE orders ADD COLUMN payment_url TEXT"),
        ("notify_payload", "ALTER TABLE orders ADD COLUMN notify_payload TEXT"),
        ("updated_at", "ALTER TABLE orders ADD COLUMN updated_at TEXT"),
    ]
    for col, sql in migrations:
        if col not in cols:
            conn.execute(sql)

def seed_payment_config(conn):
    gateway_count = conn.execute("SELECT COUNT(*) AS c FROM payment_gateways").fetchone()['c']
    if gateway_count == 0:
        conn.executemany(
            """INSERT INTO payment_gateways
               (id, name, provider, enabled, api_url, merchant_id, merchant_key, pay_type, sort_order)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            [
                ("epay_1", "易支付网关一", "epay", 0, "", "", "", "alipay", 1),
                ("epay_2", "易支付网关二", "epay", 0, "", "", "", "alipay", 2),
            ]
        )
    for index, (pid, product) in enumerate(PAYMENT_PRODUCTS.items(), 1):
        conn.execute(
            """INSERT OR IGNORE INTO product_prices
               (product_id, name, description, price, enabled, sort_order)
               VALUES (?,?,?,?,?,?)""",
            (pid, product["name"], product.get("desc", ""), float(product["price"]), 1, index)
        )
    for index, item in enumerate(DEFAULT_BLESSING_DURATIONS, 1):
        conn.execute(
            """INSERT OR IGNORE INTO blessing_duration_prices
               (duration_id, label, days, price, enabled, sort_order)
               VALUES (?,?,?,?,?,?)""",
            (item["duration_id"], item["label"], int(item["days"]), float(item["price"]), 1, index)
        )

# ─── Auth Helpers ────────────────────────────────────────────────────────────

def make_token(user_id):
    exp = (datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRE_DAYS)).isoformat() + 'Z'
    payload = json.dumps({"uid": user_id, "exp": exp}, separators=(',',':'))
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = base64.urlsafe_b64encode((payload + '.' + sig).encode()).decode()
    return token

def verify_token(token):
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        payload, sig = decoded.rsplit('.', 1)
        expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if sig != expected:
            return None
        data = json.loads(payload)
        exp = datetime.datetime.fromisoformat(data['exp'].rstrip('Z'))
        if exp < datetime.datetime.utcnow():
            return None
        return data['uid']
    except Exception:
        return None

def hash_password(password):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 200000)
    return 'pbkdf2_sha256$200000$' + base64.urlsafe_b64encode(salt).decode() + '$' + base64.urlsafe_b64encode(digest).decode()

def check_password(password, stored):
    try:
        scheme, rounds, salt_b64, digest_b64 = stored.split('$', 3)
        if scheme != 'pbkdf2_sha256':
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(rounds))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False

def user_payload(user):
    return {
        "id": user.get('id'),
        "lucky_code": user.get('lucky_code'),
        "username": user.get('username'),
        "nickname": user.get('nickname') or user.get('username') or user.get('lucky_code'),
        "email": user.get('email'),
        "email_verified": bool(user.get('email_verified')),
        "device_id": user.get('device_id'),
        "merit": user.get('merit') or 0,
        "phone": None,  # BC: old frontend still expects this field
        "has_phone": False,
        "phone_masked": None,
        "is_registered": bool(user.get('password_hash')),
        "is_admin": bool(user.get('is_admin')),
    }

def gen_lucky_code():
    words = ['莲心', '紫云', '清竹', '禅韵', '慧心', '明月', '清风',
             '菩提', '妙音', '吉祥', '如意', '圆觉', '净心', '善缘',
             '福慧', '自在', '般若', '琉璃', '瑶光', '云栖']
    num = f'{random.randint(1, 999):03d}'
    return random.choice(words) + num

def gen_id():
    return uuid.uuid4().hex[:12]

# ─── Email Verification ───────────────────────────────────────────────────────

def send_verify_email(to_email, code):
    """Send verification code via SMTP. Returns True on success, False on failure."""
    if not SMTP_HOST or not SMTP_USER:
        print(f"  [EMAIL] SMTP not configured. Verification code for {to_email}: {code}")
        return True  # Pretend success in dev mode so binding still works
    try:
        msg = EmailMessage()
        msg.set_content(f"您的菩提苑邮箱验证码是：{code}\n\n验证码 {VERIFY_CODE_EXPIRE_MINUTES} 分钟内有效。如非本人操作，请忽略此邮件。")
        msg['Subject'] = f'菩提苑邮箱验证码'
        msg['From'] = SMTP_FROM
        msg['To'] = to_email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
        print(f"  [EMAIL] Verification code sent to {to_email}")
        return True
    except Exception as e:
        print(f"  [EMAIL] Failed to send to {to_email}: {e}")
        return False

def gen_verify_code():
    return str(random.randint(100000, 999999))

def save_verify_code(email, code, user_id=''):
    conn = get_db()
    conn.execute("INSERT INTO email_verify_codes (id, email, code, user_id) VALUES (?,?,?,?)",
                 (gen_id(), email, code, user_id))
    conn.commit()
    conn.close()
    with _verify_code_lock:
        _verify_code_cache[email] = {'code': code, 'time': time.time(), 'user_id': user_id}

def check_verify_code(email, code):
    """Check if code matches any recent (within expiry window) record for this email."""
    with _verify_code_lock:
        cached = _verify_code_cache.get(email)
        if cached and cached['code'] == code and (time.time() - cached['time']) < VERIFY_CODE_EXPIRE_MINUTES * 60:
            return True
    # Fallback: check DB (e.g. after server restart)
    conn = get_db()
    expiry = (datetime.datetime.utcnow() - datetime.timedelta(minutes=VERIFY_CODE_EXPIRE_MINUTES)).isoformat()
    row = conn.execute(
        "SELECT id FROM email_verify_codes WHERE email=? AND code=? AND created_at>=? ORDER BY created_at DESC LIMIT 1",
        (email, code, expiry)
    ).fetchone()
    conn.close()
    if row:
        with _verify_code_lock:
            _verify_code_cache[email] = {'code': code, 'time': time.time()}
        return True
    return False

# ─── Response Helpers ────────────────────────────────────────────────────────

def json_resp(h, data, code=0, message="ok", status=200):
    body = json.dumps({"code": code, "data": data, "message": message}, ensure_ascii=False).encode('utf-8')
    h.send_response(status)
    h.send_header('Content-Type', 'application/json; charset=utf-8')
    h.send_header('Content-Length', str(len(body)))
    h.send_header('Access-Control-Allow-Origin', '*')
    h.end_headers()
    h.wfile.write(body)

def json_err(h, message, code=1, status=200):
    json_resp(h, None, code, message, status)

def sse_resp(h, segments, references=None, master_id='huiming', master_name='慧明长老',
             provider='local', model='putiyuan-local', deepseek_enabled=False):
    refs = references or []
    h.send_response(200)
    h.send_header('Content-Type', 'text/event-stream; charset=utf-8')
    h.send_header('Cache-Control', 'no-cache')
    h.send_header('Connection', 'close')
    h.send_header('Access-Control-Allow-Origin', '*')
    h.end_headers()

    def write_event(event, payload):
        line = f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
        h._safe_write(line.encode('utf-8'))

    write_event('meta', {
        'provider': provider,
        'model': model,
        'deepseek_enabled': deepseek_enabled,
        'master_id': master_id,
        'master_name': master_name,
    })
    write_event('thinking', {'phase': 'reasoning'})
    for text in segments:
        write_event('token', {'text': text})
        time.sleep(0.08)
    write_event('thinking', {'phase': 'answering'})
    for ref in refs:
        write_event('reference', ref)

def get_ai_config(include_key=True):
    conn = get_db()
    row = conn.execute("SELECT * FROM ai_config WHERE id=1").fetchone()
    conn.close()
    cfg = dict(row) if row else {}
    env_key = os.environ.get('PUTIYUAN_AI_API_KEY') or os.environ.get('OPENAI_API_KEY') or ''
    env_base = os.environ.get('PUTIYUAN_AI_BASE_URL') or os.environ.get('OPENAI_BASE_URL') or ''
    env_text = os.environ.get('PUTIYUAN_AI_TEXT_MODEL') or ''
    env_vision = os.environ.get('PUTIYUAN_AI_VISION_MODEL') or ''
    if env_key and not cfg.get('api_key'):
        cfg['api_key'] = env_key
    if env_base:
        cfg['base_url'] = env_base
    if env_text:
        cfg['text_model'] = env_text
    if env_vision:
        cfg['vision_model'] = env_vision
    cfg.setdefault('enabled', 0)
    cfg.setdefault('provider_name', 'OpenAI Compatible')
    cfg.setdefault('base_url', 'https://api.openai.com/v1')
    cfg.setdefault('text_model', 'gpt-4o-mini')
    cfg.setdefault('vision_model', cfg.get('text_model') or 'gpt-4o-mini')
    cfg.setdefault('temperature', 0.7)
    cfg.setdefault('timeout_seconds', 45)
    if not include_key:
        key = cfg.get('api_key') or ''
        cfg['api_key_set'] = bool(key)
        cfg['api_key_masked'] = (key[:4] + '...' + key[-4:]) if len(key) >= 12 else ('已配置' if key else '')
        cfg.pop('api_key', None)
    return cfg

def ai_is_ready(cfg):
    return bool(int(cfg.get('enabled') or 0) and cfg.get('api_key') and cfg.get('base_url') and cfg.get('text_model'))

def ai_chat(messages, model=None, temperature=None, timeout_seconds=None):
    cfg = get_ai_config(include_key=True)
    if not ai_is_ready(cfg):
        raise RuntimeError("大模型未启用或未配置 API Key")
    base_url = str(cfg.get('base_url') or '').rstrip('/')
    url = base_url + '/chat/completions'
    payload = {
        "model": model or cfg.get('text_model'),
        "messages": messages,
        "temperature": float(temperature if temperature is not None else cfg.get('temperature') or 0.7),
        "stream": False,
    }
    req = urlrequest.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + str(cfg.get('api_key') or ''),
        },
        method='POST',
    )
    timeout = int(timeout_seconds or cfg.get('timeout_seconds') or 45)
    try:
        with urlrequest.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode('utf-8')
    except HTTPError as e:
        detail = e.read().decode('utf-8', errors='ignore')[:300]
        raise RuntimeError(f"大模型接口返回 HTTP {e.code}: {detail}")
    except URLError as e:
        raise RuntimeError(f"大模型接口连接失败: {e.reason}")
    parsed = json.loads(raw)
    content = parsed.get('choices', [{}])[0].get('message', {}).get('content', '')
    if not content:
        raise RuntimeError("大模型返回为空")
    return content.strip(), cfg

def ai_text_or_none(prompt, user_text, model=None, temperature=None):
    try:
        text, cfg = ai_chat([
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_text},
        ], model=model, temperature=temperature)
        return text, cfg
    except Exception as e:
        print(f"  [AI fallback] {e}")
        return None, None

def ai_vision_or_none(prompt, user_text, image_url):
    cfg = get_ai_config(include_key=True)
    if not ai_is_ready(cfg):
        return None, None
    try:
        content = [
            {"type": "text", "text": user_text},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]
        text, cfg = ai_chat([
            {"role": "system", "content": prompt},
            {"role": "user", "content": content},
        ], model=cfg.get('vision_model') or cfg.get('text_model'), temperature=cfg.get('temperature'))
        return text, cfg
    except Exception as e:
        print(f"  [AI vision fallback] {e}")
        return None, None

def split_ai_segments(text):
    parts = [p.strip() for p in re.split(r'\n{2,}', text or '') if p.strip()]
    if len(parts) <= 1 and text:
        parts = [p.strip() for p in re.split(r'(?<=[。！？])', text) if p.strip()]
    return parts[:8] if parts else []

def json_from_ai_text(text):
    if not text:
        return None
    cleaned = text.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'(\{.*\}|\[.*\])', cleaned, re.S)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                return None
    return None

def ai_scene_sse(h, scene, data, fallback_segments=None, fallback_refs=None, extra_context=None):
    master_id = data.get('master_id', 'huiming')
    master_name = MASTER_NAMES.get(master_id, '慧明长老')
    scene_titles = {
        "bazi": "八字命理深度开示",
        "lottery": "关帝灵签解读",
        "divination": "六爻占卜解卦",
        "palmistry": "传统手相图解",
        "dream": "周公解梦深度开示",
    }
    system = (
        f"你是菩提苑的{master_name}，正在进行{scene_titles.get(scene, '传统文化开示')}。"
        "请使用温和、庄重、清晰的中文。内容仅作传统文化与心理安顿参考，不要做医疗、法律、投资确定性承诺。"
        "输出 2 到 5 段正文，不要使用 Markdown 表格。"
    )
    user_payload = {
        "scene": scene,
        "request": data,
        "context": extra_context or {},
    }
    text, cfg = ai_text_or_none(system, json.dumps(user_payload, ensure_ascii=False))
    if text and cfg:
        refs = [
            {"book": "菩提苑 AI", "chapter": scene_titles.get(scene, "开示"), "quote": "以上为大模型结合输入生成的传统文化参考。"}
        ]
        sse_resp(
            h,
            split_ai_segments(text),
            refs,
            master_id,
            master_name,
            provider=cfg.get('provider_name') or 'AI',
            model=cfg.get('text_model') or 'model',
            deepseek_enabled=True,
        )
        return
    sse_resp(h, fallback_segments or ["大模型暂未配置，当前显示本地开示。"], fallback_refs or [], master_id, master_name)

def read_body(h):
    length = int(h.headers.get('Content-Length', 0))
    if length == 0:
        return {}
    raw = h.rfile.read(length)
    ctype = h.headers.get('Content-Type', '')
    if 'application/x-www-form-urlencoded' in ctype:
        parsed = parse_qs(raw.decode('utf-8', errors='ignore'), keep_blank_values=True)
        return {k: v[-1] if isinstance(v, list) and v else '' for k, v in parsed.items()}
    try:
        return json.loads(raw.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}

def get_auth_user(h):
    auth = h.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        uid = verify_token(auth[7:])
        if uid:
            conn = get_db()
            row = conn.execute("SELECT id, lucky_code, username, nickname, email, device_id, password_hash, is_admin FROM users WHERE id=?", (uid,)).fetchone()
            conn.close()
            if row:
                return dict(row)
    return None

def require_auth(h):
    user = get_auth_user(h)
    if not user:
        json_resp(h, None, 40101, "认证已过期，请重新登录", 200)
        return None
    return user

def require_admin(h):
    user = get_auth_user(h)
    if not user:
        json_resp(h, None, 40101, "认证已过期，请重新登录", 200)
        return None
    if not user.get('is_admin'):
        json_resp(h, None, 40301, "需要管理员权限", 200)
        return None
    return user

# ─── RSC Script Injection ────────────────────────────────────────────────────

RSC_SCRIPT = b'''
<script>
document.addEventListener('click',function(e){var a=e.target.closest('a');if(a&&a.href&&a.href.startsWith(location.origin)&&!a.hasAttribute('target')){var u=new URL(a.href);if(u.pathname!==location.pathname){e.preventDefault();e.stopPropagation();window.location.href=a.href;return false}}},true);
</script>
</head>'''

# ─── Bazi Engine ─────────────────────────────────────────────────────────────

TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
DI_ZHI   = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
WU_XING  = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
            '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'}
SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪']

# Reference date for day pillar calculation: 2000-01-01 = 甲子 (index 0 in sexagenary cycle)
REF_DATE = datetime.date(2000, 1, 1)
REF_GANZHI_IDX = 0  # 甲子

def sexagenary_index(year, month, day):
    """Calculate the sexagenary cycle index for a given date."""
    d = datetime.date(year, month, day)
    delta = (d - REF_DATE).days
    return (REF_GANZHI_IDX + delta) % 60

def year_pillar(year):
    """Year pillar: (year-4) % 60 gives the sexagenary index for the year."""
    idx = (year - 4) % 60
    gan = TIAN_GAN[idx % 10]
    zhi = DI_ZHI[idx % 12]
    return {"gan": gan, "zhi": zhi}

def month_pillar(year, month):
    """Month pillar depends on year's heavenly stem and the month number."""
    year_gan_idx = (year - 4) % 10
    # Month starts from 寅 for first month
    month_offset = (month + 1) % 12  # 寅=2→0, 卯=3→1, etc.
    # Heavenly stem for month: (year_gan_idx % 5 * 2 + month_offset) % 10
    gan_idx = (year_gan_idx * 2 + month_offset) % 10
    zhi_idx = (month + 1) % 12  # month 1 = 寅
    return {"gan": TIAN_GAN[gan_idx], "zhi": DI_ZHI[zhi_idx]}

def day_pillar(year, month, day):
    """Day pillar using sexagenary cycle."""
    idx = sexagenary_index(year, month, day)
    return {"gan": TIAN_GAN[idx % 10], "zhi": DI_ZHI[idx % 12]}

def hour_pillar(day_gan, hour):
    """Hour pillar depends on day's heavenly stem and the hour."""
    # Hour branch: 子=23-1, 丑=1-3, 寅=3-5, etc.
    zhi_idx = (hour + 1) // 2 % 12
    # Hour stem: (day_gan_idx % 5 * 2 + zhi_idx) % 10
    day_gan_idx = TIAN_GAN.index(day_gan)
    gan_idx = (day_gan_idx % 5 * 2 + zhi_idx) % 10
    return {"gan": TIAN_GAN[gan_idx], "zhi": DI_ZHI[zhi_idx]}

def get_day_master(day_gan):
    descriptions = {
        '甲': {'element':'木','type':'阳木','keyword':'参天大树','strength':'偏强'},
        '乙': {'element':'木','type':'阴木','keyword':'花草藤蔓','strength':'中和'},
        '丙': {'element':'火','type':'阳火','keyword':'太阳之火','strength':'偏强'},
        '丁': {'element':'火','type':'阴火','keyword':'灯烛之火','strength':'中和'},
        '戊': {'element':'土','type':'阳土','keyword':'巍峨高山','strength':'偏强'},
        '己': {'element':'土','type':'阴土','keyword':'田园沃土','strength':'中和'},
        '庚': {'element':'金','type':'阳金','keyword':'刀剑之金','strength':'偏强'},
        '辛': {'element':'金','type':'阴金','keyword':'珠玉之金','strength':'中和'},
        '壬': {'element':'水','type':'阳水','keyword':'江河之水','strength':'偏强'},
        '癸': {'element':'水','type':'阴水','keyword':'雨露之水','strength':'中和'},
    }
    return descriptions.get(day_gan, {'element':'','type':'','keyword':'','strength':'中和'})

def analyze_wuxing(pillars):
    counts = {e:0 for e in ['金','木','水','火','土']}
    for p_name in ['year','month','day','hour']:
        p = pillars[p_name]
        gan_wx = WU_XING.get(p['gan'], '')
        zhi_wx = WU_XING.get(p['zhi'], '')
        if gan_wx in counts: counts[gan_wx] += 1
        if zhi_wx in counts: counts[zhi_wx] += 1
    # Convert to detail
    scores = {'金':0,'木':0,'水':0,'火':0,'土':0}
    if counts['金'] > 0: scores['金'] = min(100, counts['金'] * 20 + 10)
    if counts['木'] > 0: scores['木'] = min(100, counts['木'] * 20 + 10)
    if counts['水'] > 0: scores['水'] = min(100, counts['水'] * 20 + 10)
    if counts['火'] > 0: scores['火'] = min(100, counts['火'] * 20 + 10)
    if counts['土'] > 0: scores['土'] = min(100, counts['土'] * 20 + 10)

    description_map = {'金':'偏强','木':'偏强','水':'偏弱','火':'偏强','土':'偏强'}
    detail = []
    for e in ['金','木','水','火','土']:
        if counts[e] > 0:
            desc = '偏强' if counts[e] >= 2 else '中和'
            if e == '水': desc = '偏弱'
            detail.append({"element": e, "count": counts[e], "description": desc, "score": scores[e]})

    # Determine yong_shen (god of use) and ji_shen (god of avoidance)
    sorted_elements = sorted([(scores[e], e) for e in scores], reverse=True)
    strongest = sorted_elements[0][1] if sorted_elements else '土'
    weakest = sorted_elements[-1][1] if sorted_elements else '水'

    # Simple rule: if wood is strongest, use fire/water
    wx_cycle = {'金':'土','土':'火','火':'木','木':'水','水':'金'}
    yong_shen = [weakest]
    # Add generating element
    for e, gen in wx_cycle.items():
        if gen == weakest and e != strongest:
            yong_shen.append(e)
            break

    ji_shen = [strongest]
    for e, gen in wx_cycle.items():
        if gen == strongest:
            ji_shen.append(e)
            break

    return counts, detail, yong_shen, ji_shen

def generate_shen_sha(pillars):
    pool = [
        {"name":"天乙贵人", "omen":"吉", "description":"一生贵人相助，关键时刻总有人伸出援手。"},
        {"name":"文昌贵人", "omen":"吉", "description":"学习能力强，文采出众，适合文化教育领域。"},
        {"name":"桃花", "omen":"平", "description":"异性缘佳，越主动越能打开局面。"},
        {"name":"华盖", "omen":"平", "description":"孤独中见智慧，适合修行、艺术、研究工作。"},
        {"name":"驿马", "omen":"吉", "description":"动中求财，奔波中得机遇，适合异地发展。"},
        {"name":"孤辰", "omen":"凶", "description":"内心孤独感较强，需培养兴趣爱好排解。"},
        {"name":"劫煞", "omen":"凶", "description":"注意财物安全和人际关系中的小人。"},
        {"name":"将星", "omen":"吉", "description":"有领导才能，关键时刻能扛起大旗。"},
        {"name":"金舆", "omen":"吉", "description":"贵人扶持，财运亨通，名利双收之象。"},
        {"name":"学堂", "omen":"吉", "description":"学业有成，学术研究方面有天赋。"},
    ]
    random.seed(pillars['day']['gan'] + pillars['year']['zhi'])
    selected = random.sample(pool, 3)
    return selected

def generate_luck_pillars(gender, year_pillar_gan):
    """Generate 大运 (luck pillars) for 5 decades."""
    # Determine direction: yang male / yin female = forward; yin male / yang female = backward
    year_gan_idx = TIAN_GAN.index(year_pillar_gan)
    is_yang = year_gan_idx % 2 == 0
    forward = (is_yang and gender == 'male') or (not is_yang and gender == 'female')

    start_year = 1992
    luck = []
    for i in range(5):
        age_start = 2 + i * 10
        age_end = age_start + 9
        offset = i + 1 if forward else -(i + 1)
        gan_idx = (year_gan_idx + offset) % 10
        zhi_idx = (year_gan_idx + offset) % 12
        desc_pool = [
            "学识见长，思维活跃，适合积累阶段。",
            "食神生财，才华显现，事业发展期。",
            "偏财透出，机遇增多，适合拓展资源。",
            "官印相生，运势稳定，精进专业领域。",
            "七杀制身，压力转化动力，突破瓶颈。",
            "正官合身，贵人提携，仕途顺遂。",
            "比肩助力，合作生财，团队协作佳。",
            "伤官配印，名声鹊起，创意变现期。",
            "财星当旺，投资理财有利，注意风险。",
            "劫财坐守，破立之间，先舍后得。",
        ]
        desc = desc_pool[i % len(desc_pool)]
        luck.append({
            "age_range": [age_start, age_end],
            "pillar": {"gan": TIAN_GAN[gan_idx], "zhi": DI_ZHI[zhi_idx]},
            "start_year": start_year + i * 10,
            "description": desc
        })
    return luck

def calculate_bazi(name, gender, birth_date, birth_hour, calendar='solar'):
    """Main bazi calculation."""
    # Parse date
    parts = birth_date.split('-')
    if len(parts) != 3:
        raise ValueError("日期格式错误，请用 YYYY-MM-DD")
    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])

    # Parse hour
    hour_parts = birth_hour.split(':')
    hour = int(hour_parts[0]) if hour_parts else 12

    # Calculate four pillars
    pillars = {
        "year": year_pillar(year),
        "month": month_pillar(year, month),
        "day": day_pillar(year, month, day),
        "hour": hour_pillar(day_pillar(year, month, day)['gan'], hour)
    }

    # Day master
    day_gan = pillars['day']['gan']
    dm = get_day_master(day_gan)

    # Wuxing
    wx_counts, wx_detail, yong_shen, ji_shen = analyze_wuxing(pillars)

    # Shen sha
    shen_sha = generate_shen_sha(pillars)

    # Luck pillars
    luck = generate_luck_pillars(gender, pillars['year']['gan'])
    current_luck = luck[2] if len(luck) > 2 else luck[0]

    # Annual forecast for 2026
    month_names = ['孟春', '仲春', '季春', '孟夏', '仲夏', '季夏', '孟秋', '仲秋', '季秋', '孟冬', '仲冬', '季冬']
    month_outlooks = [
        "运势较快，适合确定目标、果断行动。",
        "人际关系活跃，注意沟通边界，避免口舌。",
        "财运转旺，适合推进合作、签约和固定收益。",
        "压力渐显，量力而行，切忌盲目扩张。",
        "贵人运强，主动社交能带来意外机会。",
        "内心反思期，适合调整方向而非冒进。",
        "事业有小成，注意身体健康和休息。",
        "创意爆发，适合创作、策划、品牌升级。",
        "合作运佳，婚恋关系升温，适合表白。",
        "财务审慎期，不宜大额投资，以守为主。",
        "转机显现，准备迎接新一轮上升期。",
        "收敛沉淀，总结全年，布局来年计划。",
    ]

    result = {
        "session_id": "bazi_" + gen_id(),
        "name": name,
        "bazi": pillars,
        "lunar_birthday": f"{year}年{month}月{day}日{hour}时",
        "gender": gender,
        "day_master": day_gan,
        "day_master_strength": dm['strength'],
        "pattern": "正官格",
        "wuxing": wx_counts,
        "wuxing_detail": wx_detail,
        "yong_shen": yong_shen,
        "ji_shen": ji_shen,
        "shen_sha": shen_sha,
        "luck_pillars": luck,
        "current_luck": current_luck,
        "year_2026": {
            "title": "丙午流年 · 印绶生辉",
            "year": 2026,
            "summary": "2026 年运势偏忙，执行力增强，适合将想法制度化、组织化、专业化。稳中求进，忌急于求成。",
            "monthly": [{"month": mn, "outlook": mo} for mn, mo in zip(month_names, month_outlooks)]
        }
    }
    return result

# ─── Naming Engine ───────────────────────────────────────────────────────────

NAMING_POOL = [
    {"char":"宸","pinyin":"Chén","meaning":"指北极星，尊贵、吉祥","wuxing":"金","stroke":10},
    {"char":"沐","pinyin":"Mù","meaning":"润泽、沐浴恩泽","wuxing":"水","stroke":8},
    {"char":"泽","pinyin":"Zé","meaning":"恩泽、光泽","wuxing":"水","stroke":8},
    {"char":"欣","pinyin":"Xīn","meaning":"喜悦、欣欣向荣","wuxing":"木","stroke":8},
    {"char":"澜","pinyin":"Lán","meaning":"大波浪、胸怀广阔","wuxing":"水","stroke":15},
    {"char":"清","pinyin":"Qīng","meaning":"清澈、清白","wuxing":"水","stroke":11},
    {"char":"恒","pinyin":"Héng","meaning":"持久、恒心","wuxing":"金","stroke":9},
    {"char":"凯","pinyin":"Kǎi","meaning":"胜利、凯旋","wuxing":"木","stroke":8},
    {"char":"瑶","pinyin":"Yáo","meaning":"美玉、珍贵","wuxing":"火","stroke":13},
    {"char":"萱","pinyin":"Xuān","meaning":"忘忧草、快乐","wuxing":"木","stroke":12},
    {"char":"铭","pinyin":"Míng","meaning":"铭记、铭刻","wuxing":"金","stroke":11},
    {"char":"睿","pinyin":"Ruì","meaning":"睿智、聪慧","wuxing":"金","stroke":14},
    {"char":"瑜","pinyin":"Yú","meaning":"美玉、光彩","wuxing":"金","stroke":13},
    {"char":"霖","pinyin":"Lín","meaning":"甘霖、恩泽","wuxing":"水","stroke":16},
    {"char":"桐","pinyin":"Tóng","meaning":"梧桐树、高洁","wuxing":"木","stroke":10},
    {"char":"舒","pinyin":"Shū","meaning":"舒展、从容","wuxing":"金","stroke":12},
    {"char":"玥","pinyin":"Yuè","meaning":"神珠、祥瑞","wuxing":"土","stroke":8},
    {"char":"柠","pinyin":"Níng","meaning":"柠檬树、清新","wuxing":"木","stroke":9},
    {"char":"溪","pinyin":"Xī","meaning":"溪流、清澈","wuxing":"水","stroke":13},
    {"char":"澄","pinyin":"Chéng","meaning":"水清、明净","wuxing":"水","stroke":15},
    {"char":"岚","pinyin":"Lán","meaning":"山间雾气、灵动","wuxing":"土","stroke":7},
    {"char":"瑾","pinyin":"Jǐn","meaning":"美玉、美德","wuxing":"金","stroke":15},
    {"char":"阳","pinyin":"Yáng","meaning":"阳光、光明","wuxing":"火","stroke":6},
    {"char":"朗","pinyin":"Lǎng","meaning":"明亮、开朗","wuxing":"火","stroke":10},
    {"char":"宁","pinyin":"Níng","meaning":"安宁、宁静","wuxing":"火","stroke":5},
    {"char":"怡","pinyin":"Yí","meaning":"快乐、愉悦","wuxing":"土","stroke":8},
    {"char":"文","pinyin":"Wén","meaning":"文采、文化","wuxing":"水","stroke":4},
    {"char":"思","pinyin":"Sī","meaning":"思考、智慧","wuxing":"金","stroke":9},
    {"char":"远","pinyin":"Yuǎn","meaning":"远大、长远","wuxing":"土","stroke":7},
    {"char":"翰","pinyin":"Hàn","meaning":"翰墨、文采","wuxing":"水","stroke":16},
    {"char":"景","pinyin":"Jǐng","meaning":"前程、景色","wuxing":"木","stroke":12},
    {"char":"晟","pinyin":"Shèng","meaning":"光明、旺盛","wuxing":"火","stroke":11},
    {"char":"钧","pinyin":"Jūn","meaning":"重量单位、尊贵","wuxing":"金","stroke":9},
    {"char":"承","pinyin":"Chéng","meaning":"承担、继承","wuxing":"金","stroke":8},
    {"char":"佑","pinyin":"Yòu","meaning":"保佑、天佑","wuxing":"土","stroke":7},
]

def generate_names(surname, gender='male', wuxing_needed=None, count=5):
    """Generate baby names based on surname and gender."""
    if wuxing_needed is None:
        wuxing_needed = ['水', '木']

    # Filter chars by needed wuxing
    candidates = [c for c in NAMING_POOL if c['wuxing'] in wuxing_needed]
    if len(candidates) < count * 2:
        candidates = NAMING_POOL[:]  # fallback to all

    random.shuffle(candidates)
    names = []
    for i in range(count):
        if i < len(candidates) - 1:
            c1 = candidates[i * 2 % len(candidates)]
            c2 = candidates[(i * 2 + 1) % len(candidates)]
        else:
            c1 = candidates[i % len(candidates)]
            c2 = candidates[(i + 1) % len(candidates)]

        full_name = surname + c1['char'] + c2['char']
        names.append({
            "rank": i + 1,
            "full_name": full_name,
            "pinyin": f"{c1['pinyin']} {c2['pinyin']}",
            "name_meaning": f"以{c1['meaning']}之意，合{c2['meaning']}之象，寓意深远。",
            "poem_ref": "《诗经·斯干》",
            "wuxing_score": random.randint(85, 98),
            "wuxing_analysis": f"姓氏五行属土，名字五行{c1['wuxing']}+{c2['wuxing']}，平衡得当。",
            "phonetic_score": random.randint(80, 95),
            "phonetic_analysis": "平仄相间，音律和谐，朗朗上口。",
            "stroke_score": random.randint(78, 92),
            "total_stroke": c1['stroke'] + c2['stroke'] + 8,  # approx
            "description": f"此名端庄大气，适合{'男孩' if gender == 'male' else '女孩'}，寓意前程似锦。"
        })
    return names

# ─── Divination Engine ───────────────────────────────────────────────────────

HEXAGRAMS = [
    {"num":1,"name":"乾为天","judgment":"元亨利贞。","yao_desc":"潜龙勿用、见龙在田、终日乾乾、或跃在渊、飞龙在天、亢龙有悔"},
    {"num":2,"name":"坤为地","judgment":"元亨，利牝马之贞。","yao_desc":"履霜坚冰至、直方大、含章可贞、括囊无咎、黄裳元吉、龙战于野"},
    {"num":11,"name":"地天泰","judgment":"小往大来，吉亨。","yao_desc":"拔茅茹、包荒、无平不陂、翩翩、帝乙归妹、城复于隍"},
    {"num":12,"name":"天地否","judgment":"否之匪人，不利君子贞。","yao_desc":"拔茅茹、包承、包羞、有命无咎、休否、倾否"},
    {"num":14,"name":"火天大有","judgment":"元亨。","yao_desc":"无交害、大车以载、公用亨于天子、匪其彭、厥孚交如、自天佑之"},
    {"num":20,"name":"风地观","judgment":"盥而不荐，有孚颙若。","yao_desc":"童观、窥观、观我生进退、观国之光、观我生、观其生"},
    {"num":24,"name":"地雷复","judgment":"亨。出入无疾，朋来无咎。","yao_desc":"不远复、休复、频复、中行独复、敦复、迷复"},
    {"num":35,"name":"火地晋","judgment":"康侯用锡马蕃庶，昼日三接。","yao_desc":"晋如摧如、晋如愁如、众允、晋如鼫鼠、悔亡、晋其角"},
    {"num":36,"name":"地火明夷","judgment":"利艰贞。","yao_desc":"明夷于飞、明夷夷于左股、明夷于南狩、入于左腹、箕子之明夷、不明晦"},
    {"num":42,"name":"风雷益","judgment":"利有攸往，利涉大川。","yao_desc":"利用为大作、或益之十朋之龟、益之用凶事、中行告公从、有孚惠心、莫益之"},
    {"num":46,"name":"地风升","judgment":"元亨，用见大人。","yao_desc":"允升、孚乃利用禴、升虚邑、王用亨于岐山、贞吉升阶、冥升"},
    {"num":55,"name":"雷火丰","judgment":"亨，王假之。","yao_desc":"遇其配主、丰其蔀、丰其沛、丰其蔀日中见斗、来章有庆誉、丰其屋"},
    {"num":59,"name":"风水涣","judgment":"亨。王假有庙。","yao_desc":"用拯马壮、涣奔其机、涣其躬、涣其群、涣汗其大号、涣其血"},
    {"num":61,"name":"风泽中孚","judgment":"豚鱼吉，利涉大川。","yao_desc":"虞吉、鹤鸣在阴其子和之、得敌、月几望、有孚挛如、翰音登于天"},
    {"num":63,"name":"水火既济","judgment":"亨小，利贞。","yao_desc":"曳其轮、妇丧其茀、高宗伐鬼方、繻有衣袽、东邻杀牛、濡其首"},
    {"num":64,"name":"火水未济","judgment":"亨。小狐汔济。","yao_desc":"濡其尾、曳其轮、未济征凶、贞吉悔亡、贞吉无悔、有孚于饮酒"},
]


# ─── Lottery Engine ──────────────────────────────────────────────────────────

LOTTERY_POOL = [
    {"sign_no":1,"title":"巍巍独立最高峰","level":"上上","poem":"巍巍独立最高峰，一望群山万仞中。自有天梯通顶上，朝迎旭日晚来风。","interpret":"此签为签王之尊，万事亨通，所求皆遂。","tags":"事业 财运"},
    {"sign_no":2,"title":"扁舟泛海过江津","level":"上吉","poem":"扁舟泛海过江津，波浪滔滔万里程。借得东风三两点，一帆风顺到蓬瀛。","interpret":"得贵人助，化险为夷，前程似锦。","tags":"出行 事业"},
    {"sign_no":3,"title":"青山绿水自悠悠","level":"中吉","poem":"青山绿水自悠悠，白云深处有人家。莫道前途多险阻，柳暗花明又一洲。","interpret":"先难后易，柳暗花明，终得圆满。","tags":"事业 财运"},
    {"sign_no":4,"title":"月落星沉夜未央","level":"中平","poem":"月落星沉夜未央，独坐幽篁思渺茫。静待东方天欲晓，一轮红日出扶桑。","interpret":"静待时机，黎明前的黑暗终将过去。","tags":"等待 转机"},
    {"sign_no":5,"title":"狂风暴雨打花枝","level":"下下","poem":"狂风暴雨打花枝，叶落飘零半入泥。待得云开见日月，且留残枝待春时。","interpret":"守成不宜，宜退守待时，暂避锋芒。","tags":"谨慎 守成"},
    {"sign_no":6,"title":"金鸡报晓玉兔升","level":"上吉","poem":"金鸡报晓玉兔升，虎啸龙吟气象新。功成名就须努力，莫负光阴莫负人。","interpret":"时来运转，诸事顺遂，当积极进取。","tags":"事业 功名"},
    {"sign_no":7,"title":"红莲出水映朝阳","level":"上上","poem":"红莲出水映朝阳，不染污泥自吐香。君子修身当如此，一生清白永流芳。","interpret":"品德高尚，以德服人，万事大吉。","tags":"品德 修心"},
    {"sign_no":8,"title":"秋风萧瑟天气凉","level":"中平","poem":"秋风萧瑟天气凉，草木摇落露为霜。自有松柏耐岁寒，春来依旧满庭芳。","interpret":"暂时困顿，但根基稳固，春来复苏。","tags":"事业 耐心"},
    {"sign_no":9,"title":"龙腾四海展宏图","level":"上上","poem":"龙腾四海展宏图，凤舞九天鸣九皋。万里江山收眼底，一轮明月照归途。","interpret":"大展宏图，声名远播，名利双收。","tags":"事业 财运"},
    {"sign_no":10,"title":"寒梅傲雪立寒冬","level":"中吉","poem":"寒梅傲雪立寒冬，冰肌玉骨自不同。待到百花争艳日，暗香浮动月明中。","interpret":"坚持自我，终将得到认可。","tags":"坚持 毅力"},
    {"sign_no":11,"title":"流水潺潺过小桥","level":"中平","poem":"流水潺潺过小桥，世事如棋局局新。随缘且过平常日，自有清风送好音。","interpret":"随缘自适，平常心是道。","tags":"生活 心态"},
    {"sign_no":12,"title":"猛虎出山百兽惊","level":"下下","poem":"猛虎出山百兽惊，威风凛凛镇山林。须知刚强易折断，退步原来是向前。","interpret":"刚强易折，需知进退之道。","tags":"谨慎 退让"},
]

def draw_lottery(question):
    random.seed(question + str(time.time()))
    sign = random.choice(LOTTERY_POOL)
    return {
        "session_id": "sign_" + gen_id(),
        "question": question,
        "sign_no": sign['sign_no'],
        "title": sign['title'],
        "level": sign['level'],
        "poem": sign['poem'],
        "interpret": sign['interpret'],
        "tags": sign['tags'],
    }

# ─── Blessing Catalog ────────────────────────────────────────────────────────

BLESSING_CATALOG = [
    {"id":"peace","name":"平安祈福","icon":"🕊️","description":"祈求全家平安，出入平安","price_merit":10},
    {"id":"health","name":"健康延寿","icon":"🌿","description":"祈求身体健康，福寿绵长","price_merit":15},
    {"id":"wealth","name":"财运亨通","icon":"💰","description":"祈求财源广进，生意兴隆","price_merit":20},
    {"id":"academic","name":"学业有成","icon":"📚","description":"祈求学业进步，金榜题名","price_merit":10},
    {"id":"love","name":"姻缘美满","icon":"❤️","description":"祈求姻缘美满，白头偕老","price_merit":15},
    {"id":"career","name":"事业顺利","icon":"🌟","description":"祈求事业顺利，步步高升","price_merit":20},
    {"id":"pregnancy","name":"求子祈福","icon":"👶","description":"祈求早生贵子，母子平安","price_merit":25},
    {"id":"travel","name":"出行平安","icon":"🚗","description":"祈求旅途平安，一路顺风","price_merit":10},
]

# ─── Payment Products ────────────────────────────────────────────────────────

PAYMENT_PRODUCTS = {
    "single_bazi": {"name":"八字命理简批", "price": 9.9, "desc":"基础八字分析"},
    "single_bazi_deep": {"name":"八字命理深批", "price": 19.9, "desc":"详细八字分析+流年预测"},
    "single_naming": {"name":"智能起名", "price": 29.9, "desc":"根据八字定制起名方案"},
    "single_divination": {"name":"六爻占卜", "price": 9.9, "desc":"一事一占，详细解卦"},
    "blessing_lamp": {"name":"供灯祈福", "price": 6.6, "desc":"为家人点亮一盏祈福灯"},
    "unlock_bazi": {"name":"八字精批完整解锁", "price": 6.6, "desc":"解锁完整命理开示"},
    "unlock_palmistry": {"name":"手相图解完整解锁", "price": 6.6, "desc":"解锁完整手相解读"},
    "extra_lottery": {"name":"关帝灵签加抽", "price": 2.9, "desc":"加抽一次灵签"},
    "extra_divination": {"name":"六爻占卜加抽", "price": 2.9, "desc":"加抽一次六爻"},
    "extra_dream": {"name":"周公解梦加抽", "price": 3.9, "desc":"加抽一次解梦"},
    "merit_10": {"name":"功德随喜", "price": 1.0, "desc":"随喜功德"},
    "merit_50": {"name":"功德随喜", "price": 5.0, "desc":"随喜功德"},
    "merit_100": {"name":"功德随喜", "price": 10.0, "desc":"随喜功德"},
}

DEFAULT_BLESSING_DURATIONS = [
    {"duration_id": "month", "label": "一月", "days": 30, "price": 6.6},
    {"duration_id": "quarter", "label": "三月", "days": 90, "price": 16.6},
    {"duration_id": "year", "label": "一年", "days": 365, "price": 66.0},
]

def money_value(value, fallback=0.0):
    try:
        return round(max(0.0, float(value)), 2)
    except (TypeError, ValueError):
        return round(float(fallback or 0), 2)

def money_text(value):
    amount = money_value(value)
    return f"¥{amount:.2f}"

def get_product_prices():
    conn = get_db()
    rows = [dict(row) for row in conn.execute(
        "SELECT product_id,name,description,price,enabled,sort_order FROM product_prices ORDER BY sort_order, product_id"
    ).fetchall()]
    conn.close()
    if rows:
        return rows
    return [
        {"product_id": pid, "name": p["name"], "description": p.get("desc", ""), "price": p["price"], "enabled": 1, "sort_order": i}
        for i, (pid, p) in enumerate(PAYMENT_PRODUCTS.items(), 1)
    ]

def get_blessing_duration_prices():
    conn = get_db()
    rows = [dict(row) for row in conn.execute(
        "SELECT duration_id,label,days,price,enabled,sort_order FROM blessing_duration_prices ORDER BY sort_order, duration_id"
    ).fetchall()]
    conn.close()
    if rows:
        return rows
    return [
        {"duration_id": item["duration_id"], "label": item["label"], "days": item["days"], "price": item["price"], "enabled": 1, "sort_order": i}
        for i, item in enumerate(DEFAULT_BLESSING_DURATIONS, 1)
    ]

def get_blessing_duration(duration_id):
    for item in get_blessing_duration_prices():
        if item["duration_id"] == duration_id:
            return item
    return get_blessing_duration_prices()[0]

def get_payment_product(product_id, extras=None):
    extras = extras or {}
    default = PAYMENT_PRODUCTS.get(product_id)
    conn = get_db()
    row = conn.execute(
        "SELECT product_id,name,description,price,enabled FROM product_prices WHERE product_id=?",
        (product_id,)
    ).fetchone()
    conn.close()
    if row:
        product = dict(row)
        if not int(product.get("enabled") or 0):
            raise ValueError("该付费项目已关闭")
        product["price"] = money_value(product.get("price"))
        return product
    if product_id == "blessing_lamp":
        duration = get_blessing_duration((extras or {}).get("duration") or "month")
        return {
            "product_id": "blessing_lamp",
            "name": (extras or {}).get("lamp_name") or "供灯祈福",
            "description": "为家人点亮一盏祈福灯",
            "price": money_value((extras or {}).get("amount") or duration.get("price") or 6.6),
            "enabled": 1,
        }
    if default:
        return {
            "product_id": product_id,
            "name": default["name"],
            "description": default.get("desc", ""),
            "price": money_value(default["price"]),
            "enabled": 1,
        }
    raise ValueError("未知付费项目")

def gateway_public(row):
    gateway = dict(row)
    key = gateway.get("merchant_key") or ""
    gateway["merchant_key_set"] = bool(key)
    gateway["merchant_key_masked"] = (key[:4] + "..." + key[-4:]) if len(key) >= 12 else ("已配置" if key else "")
    gateway.pop("merchant_key", None)
    return gateway

def get_enabled_epay_gateway():
    conn = get_db()
    row = conn.execute(
        """SELECT * FROM payment_gateways
           WHERE provider='epay' AND enabled=1 AND api_url<>'' AND merchant_id<>'' AND merchant_key<>''
           ORDER BY sort_order, updated_at LIMIT 1"""
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def epay_sign(params, merchant_key):
    pairs = []
    for key in sorted(params.keys()):
        if key in ("sign", "sign_type"):
            continue
        value = params.get(key)
        if value is None or value == "":
            continue
        pairs.append(f"{key}={value}")
    raw = "&".join(pairs) + str(merchant_key)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()

def epay_sign_ok(params, merchant_key):
    supplied = str(params.get("sign") or "").lower()
    if not supplied:
        return False
    return hmac.compare_digest(supplied, epay_sign(params, merchant_key))

def public_api_url(h, path):
    host = h.headers.get("X-Forwarded-Host") or h.headers.get("Host") or f"localhost:{PORT}"
    proto = h.headers.get("X-Forwarded-Proto") or ("https" if h.headers.get("X-Forwarded-Ssl") == "on" else "http")
    return f"{proto}://{host}{path}"

def build_epay_payment_url(h, gateway, order_id, product_name, amount):
    api_url = str(gateway.get("api_url") or "").strip().rstrip("/")
    params = {
        "pid": str(gateway.get("merchant_id") or "").strip(),
        "type": str(gateway.get("pay_type") or "alipay").strip() or "alipay",
        "out_trade_no": order_id,
        "notify_url": public_api_url(h, "/api/v1/payment/epay-notify"),
        "return_url": public_api_url(h, "/api/v1/payment/epay-return"),
        "name": product_name[:64],
        "money": f"{money_value(amount):.2f}",
        "sitename": "菩提苑",
    }
    params["sign"] = epay_sign(params, gateway.get("merchant_key") or "")
    params["sign_type"] = "MD5"
    return api_url + "/submit.php?" + urlencode(params)

def plain_resp(h, text, status=200, content_type="text/plain; charset=utf-8"):
    body = text.encode("utf-8")
    h.send_response(status)
    h.send_header("Content-Type", content_type)
    h.send_header("Content-Length", str(len(body)))
    h.send_header("Access-Control-Allow-Origin", "*")
    h.end_headers()
    h._safe_write(body)

SILENCE_WAV = (
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA"
    "ZGF0YQAAAAA="
)

MASTER_NAMES = {
    "huiming": "慧明长老",
    "mingxin": "明心师父",
    "xuanzhen": "玄真道长",
}

DREAM_ITEMS = [
    {"id":"dragon","category_id":"animals","title":"梦见龙","level":"上上","ancient":"龙为阳德，主贵人显达。","modern":"多象征机会、声望与上升动力。","advice":"宜主动承接机会，但不可骄满。"},
    {"id":"teeth","category_id":"body","title":"梦见牙齿掉落","level":"中平","ancient":"齿为骨余，动则忧亲与根基。","modern":"常见于压力、关系牵挂或安全感波动。","advice":"宜安顿作息，多与家人沟通。"},
    {"id":"water","category_id":"nature","title":"梦见大水","level":"中吉","ancient":"水主财，清则吉，浊则滞。","modern":"代表情绪流动与资源变化。","advice":"顺势整理财务与情绪边界。"},
    {"id":"flying","category_id":"life","title":"梦见飞翔","level":"上吉","ancient":"身轻上举，志气将伸。","modern":"多代表突破束缚、想要自由表达。","advice":"可推进学习、迁移、创作类计划。"},
    {"id":"snake","category_id":"animals","title":"梦见蛇","level":"中吉","ancient":"蛇为阴灵，动静皆有机。","modern":"提示直觉敏锐，也可能有隐性压力。","advice":"观察细节，慎重处理暗线关系。"},
    {"id":"fire","category_id":"nature","title":"梦见火","level":"上吉","ancient":"火明则旺，焰乱则忧。","modern":"象征热情、行动力与曝光度。","advice":"借势行动，也要控制节奏。"},
]

DREAM_CATEGORIES = [
    {"id":"animals","name":"动物","icon":"灵"},
    {"id":"body","name":"身体","icon":"身"},
    {"id":"nature","name":"自然","icon":"山"},
    {"id":"life","name":"生活","icon":"梦"},
]

def build_almanac(date_text):
    try:
        day = datetime.datetime.strptime(date_text, '%Y-%m-%d').date()
    except Exception:
        day = datetime.date.today()
    levels = ["上上", "上吉", "中吉", "中平"]
    level = levels[(day.toordinal()) % len(levels)]
    gan = TIAN_GAN[day.toordinal() % 10]
    zhi = DI_ZHI[day.toordinal() % 12]
    yi_pool = ["祈福", "出行", "会友", "纳财", "修造", "学习", "静心", "祭祀"]
    ji_pool = ["争执", "远行", "动土", "急躁", "夜归", "大额借贷"]
    shichen_names = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
    shichen = []
    for i, name in enumerate(shichen_names):
        shichen.append({
            "name": name,
            "ganzhi": TIAN_GAN[(day.toordinal() + i) % 10] + DI_ZHI[i],
            "lucky": "吉" if (day.toordinal() + i) % 3 else "凶",
            "chong": DI_ZHI[(i + 6) % 12],
        })
    return {
        "solar": {"year": day.year, "month": day.month, "day": day.day, "weekday_chinese": "一二三四五六日"[day.weekday()]},
        "lunar": {"month_chinese": "五月", "day_chinese": "廿八", "year_zodiac": "马"},
        "ganzhi": {"year": f"{gan}{zhi}", "month": f"{TIAN_GAN[(day.month + 3) % 10]}{DI_ZHI[day.month % 12]}", "day": f"{gan}{zhi}", "nayin": "松柏木"},
        "overall_level": {"level": level, "summary": "诸事顺遂，宜守正用心"},
        "jieqi": {"today": "夏至" if day.month == 6 and 20 <= day.day <= 22 else None},
        "yi": [yi_pool[(day.day + i) % len(yi_pool)] for i in range(5)],
        "ji": [ji_pool[(day.day + i) % len(ji_pool)] for i in range(4)],
        "shen": {"lucky": ["天德", "月德", "玉堂"], "unlucky": ["五虚", "劫煞"]},
        "chong": f"冲{DI_ZHI[(day.toordinal() + 6) % 12]}煞南",
        "tai_position": "厨灶门外正北",
        "xiu": "角宿",
        "xiu_luck": "吉",
        "zhixing": "成日",
        "direction": {"wealth": "正东", "joy": "西南", "god": "正北"},
        "shichen": shichen,
    }

def build_almanac_week():
    today = datetime.date.today()
    items = []
    for i in range(7):
        d = today + datetime.timedelta(days=i)
        a = build_almanac(d.isoformat())
        items.append({
            "date": d.isoformat(),
            "weekday": "一二三四五六日"[d.weekday()],
            "lunar_day": a["lunar"]["day_chinese"],
            "level": a["overall_level"]["level"],
        })
    return items

def meditation_catalog():
    tracks = [
        {"id":"lotus-breath","title":"莲池观息","subtitle":"钟磬与缓慢呼吸","duration":300,"icon":"莲","url":SILENCE_WAV,"license":"本地演示"},
        {"id":"mountain-bell","title":"山寺晚钟","subtitle":"远山钟声与静水","duration":420,"icon":"钟","url":SILENCE_WAV,"license":"本地演示"},
        {"id":"woodfish","title":"木鱼清心","subtitle":"轻木鱼节律","duration":360,"icon":"木","url":SILENCE_WAV,"license":"本地演示"},
        {"id":"rain-temple","title":"雨落禅院","subtitle":"细雨入瓦，心念归一","duration":480,"icon":"雨","url":SILENCE_WAV,"license":"本地演示"},
    ]
    return {
        "quote": {"text": "应无所住，而生其心。", "source": "《金刚经》"},
        "tracks": tracks,
        "guided": [
            {"id":"breath","title":"观呼吸","subtitle":"以呼吸安住当下","duration":300,"steps":["端身正坐","觉察吸气","觉察呼气","杂念起时轻轻放下"]},
            {"id":"kindness","title":"慈心观","subtitle":"愿亲友安康自在","duration":420,"steps":["放松肩颈","忆念家人","默念祝愿","回向众生"]},
            {"id":"stillness","title":"止念","subtitle":"看念头来去，不随不拒","duration":600,"steps":["闭目垂帘","听见周遭","回到身体","安住片刻"]},
        ],
    }

def sse_segments(scene, data):
    master_id = data.get('master_id', 'huiming')
    master_name = MASTER_NAMES.get(master_id, '慧明长老')
    base = {
        "bazi": ["此命局先看日主与五行气势，重在辨清旺衰与喜忌。当前阶段宜稳中求进，把长期信誉放在短期得失之前。", "事业财运上，先建立规则与节奏，再谈扩张；感情与健康则贵在平衡火候，少急躁，多涵养。"],
        "lottery": ["此签问事，重在一个“诚”字。眼前虽有牵挂，但签意偏向先稳后通。", "若问家宅，宜多沟通照应；若问事业，宜守正推进，不可贪快。"],
        "divination": ["此卦动静之间已有端倪。本卦看现状，变卦看趋势，动爻则是当下最要留心之处。", "所问之事不宜强求一时结果，先把可控处做好，机缘自然渐开。"],
        "palmistry": ["掌纹只作传统文化参考。此相纹路主线清晰，说明做事有定力，也较重承诺。", "感情线宜看柔和度，事业线宜看延展度；若能减轻压力，整体状态会更稳。"],
        "dream": ["梦境多由心念、记忆与现实牵挂交织而成，不必惊惧，也不可全然忽略。", "此梦提示近期心绪正在整理，宜顺势放下旧担忧，把注意力收回当下。"],
    }
    refs = [
        {"book":"周易","chapter":"系辞","quote":"吉凶者，失得之象也。"},
        {"book":"金刚经","chapter":"应化非真分","quote":"一切有为法，如梦幻泡影。"},
    ]
    return master_id, master_name, base.get(scene, base["dream"]), refs

def source_divination_result(question):
    original = random.choice(HEXAGRAMS)
    changed = random.choice(HEXAGRAMS)
    line = random.randint(1, 6)
    lines = []
    for i in range(1, 7):
        yin = (i + line) % 2 == 0
        lines.append({"position": i, "type": "yin" if yin else "yang", "changing": i == line, "display": "━━ ━━" if yin else "━━━━━"})

    personality = [
        "你为人坦荡正直，有领导风范，做事果断，不喜欢拖泥带水。你不惧挑战，越有压力越能激发潜能。",
        "你性格中带有坚韧的一面，面对困难不轻言放弃。你善于规划，喜欢将事情掌握在自己手中。",
        "你内心有强烈的正义感，看不惯不平之事。做事讲究原则，但也因此容易与人产生摩擦。",
    ]
    career = [
        "事业方面适合发挥你的领导才能，管理岗、创业或独立负责项目都能有所作为。",
        "当前正处于上升期，虽然忙碌但成果显著。建议稳扎稳打，不要追求短期利益而忽视长远规划。",
        "今年贵人运在北方，多参与行业交流、专业论坛，有机会遇到重要的人脉资源。",
    ]
    wealth = [
        "财运平稳上升，正财为主，偏财为辅。投资理财适合稳健型产品，避免高风险操作。",
        "你的财库在秋冬季节最为旺盛，适合做年终盘点和来年规划。",
        "不宜与人合伙经营，容易因利益分配产生矛盾。独立运作反而更顺利。",
    ]
    relationship = [
        "感情方面你比较务实，不喜欢花言巧语。真心付出的人最终会被你打动。",
        "今年桃花运在中晚年运程中较好，单身者有机会通过工作场合认识良缘。",
        "已婚者注意沟通方式，多倾听对方需求，避免因工作忙碌而疏远感情。",
    ]
    health = [
        "身体健康总体良好，但要注意肝胆系统和消化系统的保养。",
        "压力大时容易出现失眠、头痛等问题，建议适当运动释放压力。",
        "适合太极、瑜伽、散步等舒缓运动，不宜剧烈运动。",
    ]

    yao_list = changed['yao_desc'].split('、')
    changing_yao = random.choice(yao_list)

    return {
        "hexagram_id": "div_" + gen_id(),
        "session_id": "div_" + gen_id(),
        "question": question,
        "lines": lines,
        "original_hexagram": {"name": original["name"], "unicode": "䷀", "bagua_up": {"name":"乾","element":"金","nature":"天"}, "bagua_down": {"name":"坤","element":"土","nature":"地"}},
        "changed_hexagram": {"name": changed["name"], "unicode": "䷫", "bagua_up": {"name":"乾","element":"金","nature":"天"}, "bagua_down": {"name":"巽","element":"木","nature":"风"}},
        "changing_line": line,
        "changing_line_text": f"第 {line} 爻发动，宜审时度势。",
        "judgment": original["judgment"],
        "hexagram": {"name": original["name"], "number": original["num"], "judgment": original["judgment"]},
        "changing_hexagram": {"name": changed["name"], "number": changed["num"], "judgment": changed["judgment"]},
        "changing_yao": changing_yao,
        "interpretation": {
            "overall": f"此卦{original['name']}变{changed['name']}，主{original['judgment']}。{changed['judgment']}。",
            "personality": personality,
            "career": career,
            "wealth": wealth,
            "relationship": relationship,
            "health": health,
        },
        "advice": random.choice([
            "当下宜静不宜动，先观察再做决定。",
            "积极行动，把握良机，但不要操之过急。",
            "顺势而为，不要逆势操作，等待最佳时机。",
            "内省反思，调整方向后再出发。",
            "广结善缘，人脉就是你的财富。",
            "专注当下，做好每一件小事。",
        ]),
    }

# ─── API Router ────────────────────────────────────────────────────────────────

class PutiyuanHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        try:
            self._do_GET()
        except Exception as e:
            print(f"  [ERROR] do_GET: {e}")
            traceback.print_exc()
            try:
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self._safe_write(b'500 Internal Server Error')
            except: pass

    def _do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parsed.query

        # Handle RSC data requests - serve HTML instead
        if '_rsc=' in self.path:
            clean_path = path
            if clean_path.endswith('.txt'):
                html_path = clean_path.replace('.txt', '.html')
                file_path = os.path.join(BASE_DIR, html_path.lstrip('/'))
                if os.path.isfile(file_path):
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    if b'</head>' in content:
                        content = content.replace(b'</head>', RSC_SCRIPT)
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self._safe_write(content)
                    return

        # API routes
        if path.startswith('/api/'):
            self.handle_api('GET', path, query)
            return

        # Serve static files
        self.serve_static(path)

    def do_POST(self):
        try:
            self._do_POST()
        except Exception as e:
            print(f"  [ERROR] do_POST: {e}")
            traceback.print_exc()
            try:
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self._safe_write(b'500 Internal Server Error')
            except: pass

    def _do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/'):
            body = read_body(self)
            self.handle_api('POST', path, body)
            return
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def serve_static(self, path):
        try:
            self._serve_static(path)
        except Exception as e:
            print(f"  [ERROR] serve_static: {e}")

    def _serve_static(self, path):
        # Default to index.html
        if path == '' or path == '/':
            path = '/index.html'

        file_path = os.path.join(BASE_DIR, path.lstrip('/'))
        file_path = os.path.normpath(file_path)

        # If path is a directory, serve index.html inside it
        if os.path.isdir(file_path):
            file_path = os.path.join(file_path, 'index.html')

        # Security: prevent directory traversal
        if not file_path.startswith(BASE_DIR):
            self.send_response(403)
            self.end_headers()
            return

        if os.path.isfile(file_path):
            with open(file_path, 'rb') as f:
                content = f.read()

            # Inject RSC script into HTML files
            if file_path.endswith('.html') and b'</head>' in content and b'document.addEventListener' not in content:
                content = content.replace(b'</head>', RSC_SCRIPT)

            ctype, _ = mimetypes.guess_type(file_path)
            self.send_response(200)
            self.send_header('Content-Type', ctype or 'application/octet-stream')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self._safe_write(content)
        else:
            # SPA fallback: serve index.html
            index_path = os.path.join(BASE_DIR, 'index.html')
            if os.path.isfile(index_path):
                with open(index_path, 'rb') as f:
                    content = f.read()
                if b'</head>' in content and b'document.addEventListener' not in content:
                    content = content.replace(b'</head>', RSC_SCRIPT)
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self._safe_write(content)
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self._safe_write(b'404 Not Found')

    def handle_api(self, method, path, data):
        # Trim /api/v1 prefix
        api_path = path
        if api_path.startswith('/api/v1'):
            api_path = api_path[7:]  # Remove /api/v1
        elif api_path.startswith('/api/'):
            api_path = api_path[4:]  # Remove /api/

        if isinstance(data, str):
            parsed = parse_qs(data, keep_blank_values=True)
            data = {k: v[-1] if isinstance(v, list) and v else '' for k, v in parsed.items()}
        elif data is None:
            data = {}

        # Route table
        routes = {
            # Auth
            '/auth/anonymous/init':      self.route_auth_anonymous_init,
            '/auth/register':            self.route_auth_register,
            '/auth/login':               self.route_auth_login,
            '/auth/restore/by-lucky-code': self.route_auth_restore_lucky,
            '/auth/restore/by-email':    self.route_auth_restore_email,
            '/auth/send-verify-code':    self.route_auth_send_verify_code,
            '/auth/bind-email':          self.route_auth_bind_email,
            '/auth/me':                  self.route_auth_me,
            '/auth/history/push':        self.route_history_push,
            '/auth/history/list':        self.route_history_list,
            '/auth/history/clear':       self.route_history_clear,
            # Bazi
            '/bazi/calculate':           self.route_bazi_calculate,
            '/bazi/analyze':             self.route_bazi_analyze,
            # Naming
            '/naming/generate':          self.route_naming_generate,
            '/naming/reveal':            self.route_naming_reveal,
            # Divination
            '/divination/cast':          self.route_divination_cast,
            '/divination/interpret':     self.route_divination_interpret,
            # Lottery
            '/lottery/draw':             self.route_lottery_draw,
            '/lottery/interpret':        self.route_lottery_interpret,
            # Merit
            '/merit/info':               self.route_merit_info,
            '/merit/add':                self.route_merit_add,
            '/merit/leaderboard':        self.route_merit_leaderboard,
            # Almanac
            '/almanac/today':            self.route_almanac_today,
            '/almanac/week':             self.route_almanac_week,
            # Dream
            '/dream/categories':         self.route_dream_categories,
            '/dream/popular':            self.route_dream_popular,
            '/dream/by-category':        self.route_dream_by_category,
            '/dream/search':             self.route_dream_search,
            '/dream/deep-interpret':     self.route_dream_deep_interpret,
            # Meditation
            '/meditation/catalog':       self.route_meditation_catalog,
            '/meditation/complete':      self.route_meditation_complete,
            # Palmistry
            '/palmistry/upload':         self.route_palmistry_upload,
            '/palmistry/preview':        self.route_palmistry_preview,
            '/palmistry/interpret':      self.route_palmistry_interpret,
            # Entitlement
            '/entitlement/status':       self.route_entitlement_status,
            '/entitlement/unlock-check': self.route_entitlement_unlock_check,
            # Blessing
            '/blessing/catalog':         self.route_blessing_catalog,
            '/blessing/create':          self.route_blessing_create,
            '/blessing/wall':            self.route_blessing_wall,
            # Payment
            '/payment/create':           self.route_payment_create,
            '/payment/status':           self.route_payment_status,
            '/payment/buyer-report':     self.route_payment_buyer_report,
            '/payment/prices':           self.route_payment_prices,
            '/payment/epay-notify':      self.route_payment_epay_notify,
            '/payment/epay-return':      self.route_payment_epay_return,
            # Referral
            '/referral/apply':           self.route_referral_apply,
            '/referral/me':              self.route_referral_me,
            '/referral/withdraw':        self.route_referral_withdraw,
            # Admin
            '/admin/stats':              self.route_admin_stats,
            '/admin/users':              self.route_admin_users,
            '/admin/blessings':          self.route_admin_blessings,
            '/admin/orders':             self.route_admin_orders,
            '/admin/ai-config':          self.route_admin_ai_config,
            '/admin/ai-config/save':     self.route_admin_ai_config_save,
            '/admin/ai-config/test':     self.route_admin_ai_config_test,
            '/admin/payment-config':     self.route_admin_payment_config,
            '/admin/payment-config/save': self.route_admin_payment_config_save,
        }

        handler = routes.get(api_path)
        if handler:
            handler(data)
        else:
            json_err(self, f"未知接口: {api_path}", 404, 404)

    # ─── Auth Routes ───────────────────────────────────────────────────────

    def route_auth_anonymous_init(self, data):
        device_id = data.get('device_id', '')
        if not device_id:
            json_err(self, "缺少 device_id")
            return

        conn = get_db()
        # Check if device already has a user
        existing = conn.execute("SELECT * FROM users WHERE device_id=?", (device_id,)).fetchone()
        if existing:
            user = dict(existing)
            # Refresh token
            token = make_token(user['id'])
            conn.execute("UPDATE users SET token=?, token_created_at=? WHERE id=?",
                        (token, datetime.datetime.utcnow().isoformat(), user['id']))
            conn.commit()
            conn.close()
            json_resp(self, {
                "token": token,
                "user": user_payload(user)
            })
            return

        # Create new user
        uid = gen_id()
        lucky_code = gen_lucky_code()
        token = make_token(uid)
        conn.execute(
            "INSERT INTO users (id, lucky_code, device_id, nickname, token, token_created_at) VALUES (?,?,?,?,?,?)",
            (uid, lucky_code, device_id, lucky_code, token, datetime.datetime.utcnow().isoformat())
        )
        # Create referral code for user
        ref_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        conn.execute("INSERT INTO referral_codes (id, user_id, code) VALUES (?,?,?)", (gen_id(), uid, ref_code))
        conn.commit()
        conn.close()

        json_resp(self, {
            "token": token,
            "user": user_payload({
                "id": uid, "lucky_code": lucky_code, "username": None,
                "nickname": lucky_code, "email": None, "device_id": device_id,
                "password_hash": None, "is_admin": 0
            })
        })

    def route_auth_register(self, data):
        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''
        nickname = (data.get('nickname') or '').strip()
        email = (data.get('email') or '').strip()
        device_id = data.get('device_id') or ''

        if not re.fullmatch(r'[a-zA-Z0-9_]{3,24}', username):
            json_err(self, "账号需为 3-24 位字母、数字或下划线")
            return
        if len(password) < 6:
            json_err(self, "密码至少 6 位")
            return

        conn = get_db()
        existing = conn.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()
        if existing:
            conn.close()
            json_err(self, "该账号已被注册")
            return

        current = get_auth_user(self)
        first_registered = conn.execute("SELECT COUNT(*) AS c FROM users WHERE password_hash IS NOT NULL AND password_hash<>''").fetchone()['c'] == 0
        password_hash = hash_password(password)
        now = datetime.datetime.utcnow().isoformat()

        if current and not current.get('password_hash'):
            uid = current['id']
            conn.execute(
                "UPDATE users SET username=?, nickname=?, password_hash=?, is_admin=?, registered_at=?, last_login_at=? WHERE id=?",
                (username, nickname or username, password_hash, 1 if first_registered else 0, now, now, uid)
            )
        else:
            uid = gen_id()
            lucky_code = gen_lucky_code()
            conn.execute(
                "INSERT INTO users (id, lucky_code, username, device_id, nickname, password_hash, is_admin, registered_at, last_login_at) VALUES (?,?,?,?,?,?,?,?,?)",
                (uid, lucky_code, username, device_id, nickname or username, password_hash, 1 if first_registered else 0, now, now)
            )
            ref_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            conn.execute("INSERT INTO referral_codes (id, user_id, code) VALUES (?,?,?)", (gen_id(), uid, ref_code))

        # If email provided and not already bound to another user, bind it
        if email:
            email_owner = conn.execute("SELECT id FROM users WHERE email=? AND id!=?", (email, uid)).fetchone()
            if not email_owner:
                conn.execute("UPDATE users SET email=?, email_verified=0 WHERE id=?", (email, uid))

        token = make_token(uid)
        conn.execute("UPDATE users SET token=?, token_created_at=? WHERE id=?", (token, now, uid))
        row = dict(conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone())
        conn.commit()
        conn.close()
        json_resp(self, {"token": token, "user": user_payload(row)})

    def route_auth_login(self, data):
        account = (data.get('account') or data.get('username') or '').strip().lower()
        password = data.get('password') or ''
        device_id = data.get('device_id') or ''
        if not account or not password:
            json_err(self, "请输入账号和密码")
            return

        conn = get_db()
        row = conn.execute(
            "SELECT * FROM users WHERE lower(username)=? OR lower(lucky_code)=?",
            (account, account, account)
        ).fetchone()
        if not row:
            conn.close()
            json_err(self, "账号或密码错误")
            return
        user = dict(row)
        if not user.get('password_hash') or not check_password(password, user['password_hash']):
            conn.close()
            json_err(self, "账号或密码错误")
            return

        token = make_token(user['id'])
        now = datetime.datetime.utcnow().isoformat()
        conn.execute(
            "UPDATE users SET device_id=COALESCE(NULLIF(?,''), device_id), token=?, token_created_at=?, last_login_at=? WHERE id=?",
            (device_id, token, now, now, user['id'])
        )
        updated = dict(conn.execute("SELECT * FROM users WHERE id=?", (user['id'],)).fetchone())
        conn.commit()
        conn.close()
        json_resp(self, {"token": token, "user": user_payload(updated)})

    def route_auth_restore_lucky(self, data):
        lucky_code = data.get('lucky_code', '')
        device_id = data.get('device_id', '')
        if not lucky_code:
            json_err(self, "请输入吉祥号")
            return

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE lucky_code=?", (lucky_code,)).fetchone()
        if not user:
            conn.close()
            json_err(self, "吉祥号未找到，请检查输入")
            return

        user = dict(user)
        token = make_token(user['id'])
        conn.execute("UPDATE users SET device_id=?, token=?, token_created_at=? WHERE id=?",
                    (device_id, token, datetime.datetime.utcnow().isoformat(), user['id']))
        conn.commit()
        conn.close()

        json_resp(self, {
            "token": token,
            "user": user_payload({**user, "device_id": device_id})
        })

    def route_auth_restore_email(self, data):
        email = (data.get('email') or '').strip().lower()
        verify_code = data.get('code', '')
        device_id = data.get('device_id', '')
        if not email:
            json_err(self, "请输入邮箱")
            return
        if not verify_code:
            json_err(self, "请输入验证码")
            return
        if not check_verify_code(email, verify_code):
            json_err(self, "验证码错误或已过期")
            return

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not user:
            conn.close()
            json_err(self, "该邮箱未绑定账号")
            return

        user = dict(user)
        token = make_token(user['id'])
        conn.execute("UPDATE users SET device_id=?, token=?, token_created_at=? WHERE id=?",
                    (device_id, token, datetime.datetime.utcnow().isoformat(), user['id']))
        conn.commit()
        conn.close()

        json_resp(self, {
            "token": token,
            "user": user_payload({**user, "device_id": device_id})
        })

    def route_auth_send_verify_code(self, data):
        user = require_auth(self)
        if not user:
            return
        email = (data.get('email') or '').strip().lower()
        if not email or not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            json_err(self, "请输入有效的邮箱地址")
            return

        # Check email not used by another user
        conn = get_db()
        existing = conn.execute("SELECT id FROM users WHERE email=? AND id!=?", (email, user['id'])).fetchone()
        if existing:
            conn.close()
            json_err(self, "该邮箱已被其他账号绑定")
            return
        conn.close()

        code = gen_verify_code()
        if send_verify_email(email, code):
            save_verify_code(email, code, user['id'])
            json_resp(self, {"email": email, "sent": True})
        else:
            json_resp(self, {"email": email, "sent": False, "code_hint": code if not SMTP_HOST else None},
                      0, "邮件发送失败（开发模式：验证码见服务器日志）")

    def route_auth_bind_email(self, data):
        user = require_auth(self)
        if not user:
            return
        email = (data.get('email') or '').strip().lower()
        code = data.get('code', '')
        if not email:
            json_err(self, "请输入邮箱")
            return
        if not code:
            json_err(self, "请输入验证码")
            return
        if not check_verify_code(email, code):
            json_err(self, "验证码错误或已过期")
            return

        conn = get_db()
        existing = conn.execute("SELECT id FROM users WHERE email=? AND id!=?", (email, user['id'])).fetchone()
        if existing:
            conn.close()
            json_err(self, "该邮箱已被绑定")
            return

        token = make_token(user['id'])
        conn.execute("UPDATE users SET email=?, email_verified=1, token=?, token_created_at=? WHERE id=?",
                    (email, token, datetime.datetime.utcnow().isoformat(), user['id']))
        conn.commit()

        updated = dict(conn.execute("SELECT * FROM users WHERE id=?", (user['id'],)).fetchone())
        conn.close()

        json_resp(self, {
            "token": token,
            "user": user_payload(updated)
        })

    def route_auth_me(self, data):
        user = require_auth(self)
        if not user:
            return
        conn = get_db()
        row = conn.execute("SELECT u.*, COALESCE(r.earnings,0) as earnings, COALESCE(r.used_count,0) as referral_count FROM users u LEFT JOIN referral_codes r ON r.user_id=u.id WHERE u.id=?", (user['id'],)).fetchone()
        conn.close()
        if not row:
            json_err(self, "用户不存在")
            return
        u = dict(row)
        json_resp(self, {
            "id": u['id'], "lucky_code": u['lucky_code'],
            "username": u.get('username'),
            "nickname": u['nickname'] or u['lucky_code'],
            "email": u.get('email'), "email_verified": bool(u.get('email_verified')),
            "device_id": u['device_id'],
            "merit": u['merit'] or 0,
            "phone": None,
            "has_phone": False,
            "phone_masked": None,
            "earnings": u['earnings'] or 0,
            "referral_count": u['referral_count'] or 0,
            "is_registered": bool(u.get('password_hash')),
            "is_admin": bool(u.get('is_admin')),
        })

    # ─── Admin Routes ─────────────────────────────────────────────────────

    def route_admin_stats(self, data):
        admin = require_admin(self)
        if not admin:
            return
        conn = get_db()
        stats = {
            "users": conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()['c'],
            "registered_users": conn.execute("SELECT COUNT(*) AS c FROM users WHERE password_hash IS NOT NULL AND password_hash<>''").fetchone()['c'],
            "admins": conn.execute("SELECT COUNT(*) AS c FROM users WHERE is_admin=1").fetchone()['c'],
            "blessings": conn.execute("SELECT COUNT(*) AS c FROM blessings").fetchone()['c'],
            "orders": conn.execute("SELECT COUNT(*) AS c FROM orders").fetchone()['c'],
            "paid_orders": conn.execute("SELECT COUNT(*) AS c FROM orders WHERE status='paid'").fetchone()['c'],
            "merit_total": conn.execute("SELECT COALESCE(SUM(total_merit_added),0) AS s FROM users").fetchone()['s'],
        }
        recent_users = [
            dict(row) for row in conn.execute(
                "SELECT id,lucky_code,username,nickname,email,is_admin,created_at,registered_at,last_login_at,total_merit_added FROM users ORDER BY created_at DESC LIMIT 8"
            ).fetchall()
        ]
        recent_blessings = [
            dict(row) for row in conn.execute(
                """SELECT b.id,b.content,b.blessing_type,b.created_at,u.nickname,u.lucky_code
                   FROM blessings b LEFT JOIN users u ON u.id=b.user_id
                   ORDER BY b.created_at DESC LIMIT 8"""
            ).fetchall()
        ]
        conn.close()
        json_resp(self, {"stats": stats, "recent_users": recent_users, "recent_blessings": recent_blessings})

    def route_admin_users(self, data):
        admin = require_admin(self)
        if not admin:
            return
        limit = max(1, min(int(data.get('limit', 50) or 50), 200))
        offset = max(0, int(data.get('offset', 0) or 0))
        conn = get_db()
        total = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()['c']
        rows = [
            dict(row) for row in conn.execute(
                """SELECT id,lucky_code,username,nickname,email,is_admin,merit,total_merit_added,
                          created_at,registered_at,last_login_at
                   FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                (limit, offset)
            ).fetchall()
        ]
        conn.close()
        json_resp(self, {"total": total, "entries": rows})

    def route_admin_blessings(self, data):
        admin = require_admin(self)
        if not admin:
            return
        limit = max(1, min(int(data.get('limit', 50) or 50), 200))
        offset = max(0, int(data.get('offset', 0) or 0))
        conn = get_db()
        total = conn.execute("SELECT COUNT(*) AS c FROM blessings").fetchone()['c']
        rows = [
            dict(row) for row in conn.execute(
                """SELECT b.id,b.content,b.blessing_type,b.is_public,b.created_at,
                          u.nickname,u.lucky_code,u.username
                   FROM blessings b LEFT JOIN users u ON u.id=b.user_id
                   ORDER BY b.created_at DESC LIMIT ? OFFSET ?""",
                (limit, offset)
            ).fetchall()
        ]
        conn.close()
        json_resp(self, {"total": total, "entries": rows})

    def route_admin_orders(self, data):
        admin = require_admin(self)
        if not admin:
            return
        limit = max(1, min(int(data.get('limit', 50) or 50), 200))
        offset = max(0, int(data.get('offset', 0) or 0))
        conn = get_db()
        total = conn.execute("SELECT COUNT(*) AS c FROM orders").fetchone()['c']
        rows = [
            dict(row) for row in conn.execute(
                """SELECT o.id,o.product_id,o.product_name,o.amount,o.currency,o.status,o.provider,o.gateway_id,o.trade_no,o.paid_at,o.created_at,
                          u.nickname,u.lucky_code,u.username
                   FROM orders o LEFT JOIN users u ON u.id=o.user_id
                   ORDER BY o.created_at DESC LIMIT ? OFFSET ?""",
                (limit, offset)
            ).fetchall()
        ]
        conn.close()
        json_resp(self, {"total": total, "entries": rows})

    def route_admin_ai_config(self, data):
        admin = require_admin(self)
        if not admin:
            return
        json_resp(self, get_ai_config(include_key=False))

    def route_admin_ai_config_save(self, data):
        admin = require_admin(self)
        if not admin:
            return
        enabled = 1 if data.get('enabled') else 0
        provider_name = (data.get('provider_name') or 'OpenAI Compatible').strip()[:80]
        base_url = (data.get('base_url') or 'https://api.openai.com/v1').strip().rstrip('/')
        text_model = (data.get('text_model') or 'gpt-4o-mini').strip()
        vision_model = (data.get('vision_model') or text_model).strip()
        temperature = max(0.0, min(float(data.get('temperature', 0.7) or 0.7), 2.0))
        timeout_seconds = max(5, min(int(data.get('timeout_seconds', 45) or 45), 180))
        api_key = data.get('api_key')

        conn = get_db()
        current = conn.execute("SELECT api_key FROM ai_config WHERE id=1").fetchone()
        saved_key = (current['api_key'] if current else '') or ''
        final_key = saved_key if api_key is None or str(api_key).strip() == '' else str(api_key).strip()
        conn.execute(
            """INSERT INTO ai_config
               (id, enabled, provider_name, base_url, api_key, text_model, vision_model, temperature, timeout_seconds, updated_at)
               VALUES (1,?,?,?,?,?,?,?,?,datetime('now','localtime'))
               ON CONFLICT(id) DO UPDATE SET
                 enabled=excluded.enabled,
                 provider_name=excluded.provider_name,
                 base_url=excluded.base_url,
                 api_key=excluded.api_key,
                 text_model=excluded.text_model,
                 vision_model=excluded.vision_model,
                 temperature=excluded.temperature,
                 timeout_seconds=excluded.timeout_seconds,
                 updated_at=datetime('now','localtime')""",
            (enabled, provider_name, base_url, final_key, text_model, vision_model, temperature, timeout_seconds)
        )
        conn.commit()
        conn.close()
        json_resp(self, get_ai_config(include_key=False))

    def route_admin_ai_config_test(self, data):
        admin = require_admin(self)
        if not admin:
            return
        try:
            text, cfg = ai_chat([
                {"role": "system", "content": "你是菩提苑后台连通性测试助手。"},
                {"role": "user", "content": "请只回复一句中文：菩提苑大模型配置连接成功。"},
            ], timeout_seconds=20)
            json_resp(self, {
                "ok": True,
                "provider": cfg.get('provider_name'),
                "model": cfg.get('text_model'),
                "reply": text,
            })
        except Exception as e:
            json_err(self, str(e))

    def route_admin_payment_config(self, data):
        admin = require_admin(self)
        if not admin:
            return
        conn = get_db()
        gateways = [
            gateway_public(row) for row in conn.execute(
                "SELECT * FROM payment_gateways ORDER BY sort_order, id"
            ).fetchall()
        ]
        products = [
            dict(row) for row in conn.execute(
                "SELECT product_id,name,description,price,enabled,sort_order,updated_at FROM product_prices ORDER BY sort_order, product_id"
            ).fetchall()
        ]
        durations = [
            dict(row) for row in conn.execute(
                "SELECT duration_id,label,days,price,enabled,sort_order,updated_at FROM blessing_duration_prices ORDER BY sort_order, duration_id"
            ).fetchall()
        ]
        conn.close()
        json_resp(self, {
            "gateways": gateways,
            "products": products,
            "blessing_durations": durations,
        })

    def route_admin_payment_config_save(self, data):
        admin = require_admin(self)
        if not admin:
            return
        gateways = data.get("gateways") if isinstance(data.get("gateways"), list) else []
        products = data.get("products") if isinstance(data.get("products"), list) else []
        durations = data.get("blessing_durations") if isinstance(data.get("blessing_durations"), list) else []

        conn = get_db()
        for index, item in enumerate(gateways[:2], 1):
            gateway_id = str(item.get("id") or f"epay_{index}")[:40]
            current = conn.execute("SELECT merchant_key FROM payment_gateways WHERE id=?", (gateway_id,)).fetchone()
            saved_key = (current["merchant_key"] if current else "") or ""
            posted_key = str(item.get("merchant_key") or "").strip()
            merchant_key = saved_key if posted_key == "" else posted_key
            conn.execute(
                """INSERT INTO payment_gateways
                   (id,name,provider,enabled,api_url,merchant_id,merchant_key,pay_type,sort_order,updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,datetime('now','localtime'))
                   ON CONFLICT(id) DO UPDATE SET
                     name=excluded.name,
                     provider=excluded.provider,
                     enabled=excluded.enabled,
                     api_url=excluded.api_url,
                     merchant_id=excluded.merchant_id,
                     merchant_key=excluded.merchant_key,
                     pay_type=excluded.pay_type,
                     sort_order=excluded.sort_order,
                     updated_at=datetime('now','localtime')""",
                (
                    gateway_id,
                    (item.get("name") or f"易支付网关{index}")[:80],
                    "epay",
                    1 if item.get("enabled") else 0,
                    str(item.get("api_url") or "").strip().rstrip("/"),
                    str(item.get("merchant_id") or "").strip(),
                    merchant_key,
                    str(item.get("pay_type") or "alipay").strip()[:20] or "alipay",
                    int(item.get("sort_order") or index),
                )
            )

        for index, item in enumerate(products, 1):
            product_id = str(item.get("product_id") or "").strip()
            if not product_id:
                continue
            conn.execute(
                """INSERT INTO product_prices
                   (product_id,name,description,price,enabled,sort_order,updated_at)
                   VALUES (?,?,?,?,?,?,datetime('now','localtime'))
                   ON CONFLICT(product_id) DO UPDATE SET
                     name=excluded.name,
                     description=excluded.description,
                     price=excluded.price,
                     enabled=excluded.enabled,
                     sort_order=excluded.sort_order,
                     updated_at=datetime('now','localtime')""",
                (
                    product_id[:80],
                    (item.get("name") or product_id)[:120],
                    (item.get("description") or "")[:240],
                    money_value(item.get("price"), 0),
                    1 if item.get("enabled", True) else 0,
                    int(item.get("sort_order") or index),
                )
            )

        for index, item in enumerate(durations, 1):
            duration_id = str(item.get("duration_id") or "").strip()
            if not duration_id:
                continue
            conn.execute(
                """INSERT INTO blessing_duration_prices
                   (duration_id,label,days,price,enabled,sort_order,updated_at)
                   VALUES (?,?,?,?,?,?,datetime('now','localtime'))
                   ON CONFLICT(duration_id) DO UPDATE SET
                     label=excluded.label,
                     days=excluded.days,
                     price=excluded.price,
                     enabled=excluded.enabled,
                     sort_order=excluded.sort_order,
                     updated_at=datetime('now','localtime')""",
                (
                    duration_id[:60],
                    (item.get("label") or duration_id)[:40],
                    max(1, int(item.get("days") or 30)),
                    money_value(item.get("price"), 0),
                    1 if item.get("enabled", True) else 0,
                    int(item.get("sort_order") or index),
                )
            )
        conn.commit()
        conn.close()
        self.route_admin_payment_config({})

    # ─── Bazi Route ────────────────────────────────────────────────────────

    def route_bazi_calculate(self, data):
        name = data.get('name', '')
        gender = data.get('gender', 'male')
        birth_date = data.get('birth_date', '')
        if not birth_date and data.get('birth_year') and data.get('birth_month') and data.get('birth_day'):
            birth_date = f"{int(data.get('birth_year')):04d}-{int(data.get('birth_month')):02d}-{int(data.get('birth_day')):02d}"
        birth_hour_value = data.get('birth_hour', '12:00')
        birth_hour = f"{birth_hour_value:02d}:00" if isinstance(birth_hour_value, int) else str(birth_hour_value or '12:00')
        calendar = data.get('calendar', 'solar')

        if not birth_date:
            json_err(self, "请选择出生日期")
            return

        try:
            result = calculate_bazi(name, gender, birth_date, birth_hour, calendar)
        except ValueError as e:
            json_err(self, str(e))
            return

        start_year = int(birth_date[:4])
        result["lifeline"] = [
            {"age": age, "year": start_year + age, "score": 58 + int(24 * abs(((age % 18) - 9) / 9))}
            for age in range(1, 101)
        ]
        result["flow_year"] = result.get("year_2026")
        result["next_year"] = {
            "title": "丁未流年 · 稳中开新",
            "year": 2027,
            "summary": "来年宜以稳定为本，先修内功，再择机推进新计划。",
            "monthly": [
                {"month": f"{i}月", "outlook": "守正蓄力，适合整理计划与关系。"}
                for i in range(1, 13)
            ],
        }

        # Save to database
        user = get_auth_user(self)
        if user:
            conn = get_db()
            session_id = result['session_id']
            conn.execute(
                "INSERT INTO bazi_sessions (id, user_id, input_data, result, cost) VALUES (?,?,?,?,?)",
                (session_id, user['id'], json.dumps(data, ensure_ascii=False),
                 json.dumps(result, ensure_ascii=False), 0.02)
            )
            conn.commit()
            conn.close()

        json_resp(self, result)

    def route_bazi_analyze(self, data):
        master_id, master_name, segments, refs = sse_segments("bazi", data)
        extra = {}
        session_id = data.get('session_id')
        if session_id:
            conn = get_db()
            row = conn.execute("SELECT input_data,result FROM bazi_sessions WHERE id=?", (session_id,)).fetchone()
            conn.close()
            if row:
                try:
                    extra = {"input": json.loads(row['input_data']), "result": json.loads(row['result'])}
                except Exception:
                    extra = {"session_id": session_id}
        ai_scene_sse(self, "bazi", data, segments, refs, extra)

    # ─── Naming Routes ─────────────────────────────────────────────────────

    def route_naming_generate(self, data):
        surname = data.get('surname', '')
        gender = data.get('gender', 'male')
        wuxing = data.get('wuxing_needed', ['水', '木'])

        if not surname:
            json_err(self, "请输入姓氏")
            return

        names = generate_names(surname, gender, wuxing)
        ai_text, cfg = ai_text_or_none(
            "你是菩提苑起名师。请基于姓氏、性别、五行喜用，生成 5 个中文宝宝名。只输出 JSON 数组，每项包含 rank, full_name, pinyin, name_meaning, poem_ref, wuxing_score, wuxing_analysis, phonetic_score, phonetic_analysis, stroke_score, total_stroke, description。",
            json.dumps({"surname": surname, "gender": gender, "wuxing_needed": wuxing}, ensure_ascii=False),
            temperature=0.9,
        )
        ai_names = json_from_ai_text(ai_text) if ai_text else None
        if isinstance(ai_names, dict):
            ai_names = ai_names.get("names")
        if isinstance(ai_names, list) and ai_names:
            normalized = []
            for i, item in enumerate(ai_names[:5]):
                if isinstance(item, dict) and item.get('full_name'):
                    item.setdefault('rank', i + 1)
                    item.setdefault('pinyin', '')
                    item.setdefault('name_meaning', item.get('description', ''))
                    item.setdefault('poem_ref', '')
                    item.setdefault('wuxing_score', 90)
                    item.setdefault('wuxing_analysis', '')
                    item.setdefault('phonetic_score', 90)
                    item.setdefault('phonetic_analysis', '')
                    item.setdefault('stroke_score', 88)
                    item.setdefault('total_stroke', 0)
                    item.setdefault('description', item.get('name_meaning', ''))
                    normalized.append(item)
            if normalized:
                names = normalized

        session_id = "name_" + gen_id()
        result = {
            "session_id": session_id,
            "surname": surname,
            "wuxing_needed": wuxing,
            "total_available": len(names),
            "is_premium": False,
            "ai_powered": bool(ai_text and cfg),
            "names": names
        }

        # Save session
        user = get_auth_user(self)
        conn = get_db()
        conn.execute(
            "INSERT INTO naming_sessions (id, user_id, params, result) VALUES (?,?,?,?)",
            (session_id, user['id'] if user else None, json.dumps(data, ensure_ascii=False),
             json.dumps(result, ensure_ascii=False))
        )
        conn.commit()
        conn.close()

        json_resp(self, result)

    def route_naming_reveal(self, data):
        session_id = data.get('session_id', '')
        if not session_id:
            json_err(self, "缺少 session_id")
            return

        conn = get_db()
        row = conn.execute("SELECT params,result FROM naming_sessions WHERE id=?", (session_id,)).fetchone()
        conn.close()
        context = {}
        if row:
            try:
                context = {"params": json.loads(row["params"]), "result": json.loads(row["result"])}
            except Exception:
                context = {"session_id": session_id}
        ai_text, cfg = ai_text_or_none(
            "你是菩提苑起名师。请针对本次宝宝起名结果，选一个最推荐的名字做详细分析。输出 JSON 对象，字段：full_name,pinyin,detailed_analysis,wuxing_detail,recommendation,price。",
            json.dumps(context or {"session_id": session_id}, ensure_ascii=False),
            temperature=0.75,
        )
        ai_obj = json_from_ai_text(ai_text) if ai_text else None
        if isinstance(ai_obj, dict) and ai_obj.get("full_name"):
            ai_obj.setdefault("session_id", session_id)
            ai_obj.setdefault("price", 29.9)
            json_resp(self, ai_obj)
            return

        json_resp(self, {
            "session_id": session_id,
            "full_name": "沐宸",
            "pinyin": "Mù Chén",
            "detailed_analysis": "此名取自《诗经》，沐为润泽之意，宸为北极星，寓意受天恩泽、尊贵吉祥。",
            "wuxing_detail": {"surname": "土", "first_char": "水", "second_char": "金"},
            "recommendation": "★★★★★",
            "price": 29.9
        })

    # ─── Divination Route ──────────────────────────────────────────────────

    def route_divination_cast(self, data):
        question = data.get('question', '')
        result = source_divination_result(question)

        # Save to database
        user = get_auth_user(self)
        if user:
            conn = get_db()
            conn.execute(
                "INSERT INTO divination_sessions (id, user_id, question, hexagrams) VALUES (?,?,?,?)",
                (gen_id(), user['id'], question, json.dumps(result, ensure_ascii=False))
            )
            conn.commit()
            conn.close()

        json_resp(self, result)

    def route_divination_interpret(self, data):
        master_id, master_name, segments, refs = sse_segments("divination", data)
        ai_scene_sse(self, "divination", data, segments, refs)

    # ─── Lottery Route ─────────────────────────────────────────────────────

    def route_lottery_draw(self, data):
        question = data.get('question', '')
        device_id = data.get('device_id', '')
        result = draw_lottery(question)

        # Save to database
        user = get_auth_user(self)
        if user:
            conn = get_db()
            conn.execute(
                "INSERT INTO lottery_draws (id, user_id, question, sign_no, result) VALUES (?,?,?,?,?)",
                (gen_id(), user['id'], question, result['sign_no'], json.dumps(result, ensure_ascii=False))
            )
            conn.commit()
            conn.close()

        json_resp(self, result)

    def route_lottery_interpret(self, data):
        master_id, master_name, segments, refs = sse_segments("lottery", data)
        ai_scene_sse(self, "lottery", data, segments, refs)

    # ─── Merit Routes ──────────────────────────────────────────────────────

    def route_merit_info(self, data):
        device_id = data.get('device_id', '')
        user = get_auth_user(self)
        if not user:
            json_resp(self, {"merit": 0, "total_merit_added": 0, "today_can_add": 50, "level_name": "初入佛门", "level_icon": "🌱"})
            return

        conn = get_db()
        row = conn.execute("SELECT merit, total_merit_added FROM users WHERE id=?", (user['id'],)).fetchone()
        conn.close()

        merit = row['merit'] if row else 0
        total = row['total_merit_added'] if row else 0

        # Determine level
        if total >= 10000: level_name, icon = "大功德主", "👑"
        elif total >= 5000: level_name, icon = "功德无量", "🔱"
        elif total >= 1000: level_name, icon = "善男子", "📿"
        elif total >= 100: level_name, icon = "修行者", "🪷"
        else: level_name, icon = "初入佛门", "🌱"

        json_resp(self, {
            "merit": merit,
            "total_merit_added": total,
            "today_can_add": max(0, 50 - total % 50),
            "level_name": level_name,
            "level_icon": icon
        })

    def route_merit_add(self, data):
        user = require_auth(self)
        if not user:
            return
        amount = data.get('amount', 0)
        reason = data.get('reason', '随喜功德')

        if amount <= 0:
            json_err(self, "功德值须大于0")
            return

        conn = get_db()
        conn.execute("UPDATE users SET merit=merit+?, total_merit_added=total_merit_added+? WHERE id=?",
                    (amount, amount, user['id']))
        conn.execute("INSERT INTO merits (id, user_id, amount, reason, animation) VALUES (?,?,?,?,?)",
                    (gen_id(), user['id'], amount, reason, random.choice(["golden_lotus", "buddha_light", "mandala"])))

        updated = conn.execute("SELECT merit, total_merit_added FROM users WHERE id=?", (user['id'],)).fetchone()
        conn.commit()
        conn.close()

        json_resp(self, {
            "merit_added": amount,
            "new_total": updated['total_merit_added'] if updated else amount,
            "animation": random.choice(["golden_lotus", "buddha_light", "mandala"])
        })

    def route_merit_leaderboard(self, data):
        offset = data.get('offset', 0)
        limit = min(data.get('limit', 20), 100)

        conn = get_db()
        rows = conn.execute(
            "SELECT id, nickname, total_merit_added as merit FROM users WHERE total_merit_added > 0 ORDER BY total_merit_added DESC LIMIT ? OFFSET ?",
            (limit, offset)
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) as c FROM users WHERE total_merit_added > 0").fetchone()['c']

        entries = []
        for i, row in enumerate(rows):
            r = dict(row)
            r['rank'] = offset + i + 1
            # Mask nickname
            nick = r['nickname'] or '善信'
            if len(nick) > 1:
                r['nickname'] = nick[0] + '*' * (len(nick) - 1)
            r['merit'] = r.pop('merit') or 0
            if r['merit'] >= 10000: r['level'], r['badge'] = "大功德主", "gold"
            elif r['merit'] >= 5000: r['level'], r['badge'] = "功德无量", "gold"
            elif r['merit'] >= 1000: r['level'], r['badge'] = "善男子", "silver"
            elif r['merit'] >= 100: r['level'], r['badge'] = "修行者", "bronze"
            else: r['level'], r['badge'] = "初入佛门", ""
            entries.append(r)

        # Find my_rank
        my_rank = None
        user = get_auth_user(self)
        if user:
            my_row = conn.execute(
                "SELECT COUNT(*) as c FROM users WHERE total_merit_added > (SELECT total_merit_added FROM users WHERE id=?)",
                (user['id'],)
            ).fetchone()
            if my_row:
                my_rank = my_row['c'] + 1
        conn.close()

        json_resp(self, {"total_users": total, "my_rank": my_rank, "entries": entries})

    # ─── Source frontend compatibility routes ───────────────────────────────

    def route_almanac_today(self, data):
        json_resp(self, build_almanac(data.get('date') or datetime.date.today().isoformat()))

    def route_almanac_week(self, data):
        json_resp(self, {"items": build_almanac_week()})

    def route_entitlement_status(self, data):
        json_resp(self, {
            "kind": data.get("kind", ""),
            "needs_payment": False,
            "free_used": 0,
            "free_limit": 99,
            "remaining": 99,
            "unlocked": True,
        })

    def route_entitlement_unlock_check(self, data):
        json_resp(self, {"unlocked": True, "session_id": data.get("session_id", "")})

    def route_meditation_catalog(self, data):
        json_resp(self, meditation_catalog())

    def route_meditation_complete(self, data):
        seconds = max(0, int(data.get("duration_seconds", 0) or 0))
        merit = min(108, max(1, seconds // 30))
        user = get_auth_user(self)
        if user:
            conn = get_db()
            conn.execute("UPDATE users SET merit=merit+?, total_merit_added=total_merit_added+? WHERE id=?",
                        (merit, merit, user['id']))
            conn.commit()
            conn.close()
        json_resp(self, {"merit_added": merit, "duration_seconds": seconds})

    def route_palmistry_upload(self, data):
        image_base64 = data.get("image_base64") or ""
        if not image_base64.startswith("data:image/"):
            json_err(self, "请上传 jpg / png 图片")
            return
        session_id = "palm_" + gen_id()
        user = get_auth_user(self)
        conn = get_db()
        conn.execute(
            "INSERT INTO palmistry_sessions (id, user_id, hand, image_base64) VALUES (?,?,?,?)",
            (session_id, user['id'] if user else None, data.get("hand", "left"), image_base64)
        )
        conn.commit()
        conn.close()
        json_resp(self, {
            "session_id": session_id,
            "file_id": "file_" + gen_id(),
            "hand": data.get("hand", "left"),
        })

    def route_palmistry_preview(self, data):
        master_id, master_name, segments, refs = sse_segments("palmistry", data)
        preview = ["先看预览：掌心主线清晰，整体偏稳。完整解读会细看生命线、智慧线、感情线与事业线的互相呼应。"]
        image_url = None
        session_id = data.get("session_id")
        if session_id:
            conn = get_db()
            row = conn.execute("SELECT image_base64,hand FROM palmistry_sessions WHERE id=?", (session_id,)).fetchone()
            conn.close()
            if row:
                image_url = row['image_base64']
        if image_url:
            text, cfg = ai_vision_or_none(
                f"你是菩提苑的{master_name}，请根据掌心照片做手相预览。只作传统文化娱乐参考，不作医疗诊断。输出 1 到 2 段。",
                json.dumps({"session_id": session_id, "mode": "preview"}, ensure_ascii=False),
                image_url,
            )
            if text and cfg:
                sse_resp(self, split_ai_segments(text), refs[:1], master_id, master_name, cfg.get('provider_name') or 'AI', cfg.get('vision_model') or cfg.get('text_model'), True)
                return
        sse_resp(self, preview, refs[:1], master_id, master_name)

    def route_palmistry_interpret(self, data):
        master_id, master_name, segments, refs = sse_segments("palmistry", data)
        image_url = None
        session_id = data.get("session_id")
        if session_id:
            conn = get_db()
            row = conn.execute("SELECT image_base64,hand FROM palmistry_sessions WHERE id=?", (session_id,)).fetchone()
            conn.close()
            if row:
                image_url = row['image_base64']
        if image_url:
            text, cfg = ai_vision_or_none(
                f"你是菩提苑的{master_name}。请根据掌心照片，从生命线、智慧线、感情线、事业线、整体气色五方面做传统手相解读。务必说明仅供传统文化参考，不作医疗或命运定论。",
                json.dumps({"session_id": session_id, "mode": "full"}, ensure_ascii=False),
                image_url,
            )
            if text and cfg:
                sse_resp(self, split_ai_segments(text), refs, master_id, master_name, cfg.get('provider_name') or 'AI', cfg.get('vision_model') or cfg.get('text_model'), True)
                return
        sse_resp(self, segments, refs, master_id, master_name)

    def route_dream_categories(self, data):
        json_resp(self, {"categories": DREAM_CATEGORIES})

    def route_dream_popular(self, data):
        json_resp(self, {"items": DREAM_ITEMS[:6]})

    def route_dream_by_category(self, data):
        category_id = data.get("category_id", "")
        items = [item for item in DREAM_ITEMS if item["category_id"] == category_id]
        json_resp(self, {"items": items})

    def route_dream_search(self, data):
        query = (data.get("query") or "").strip()
        limit = max(1, min(int(data.get("limit", 5) or 5), 10))
        if not query:
            json_resp(self, {"session_id": "dream_" + gen_id(), "query": query, "match_count": 0, "results": [], "suggestion": "请先描述梦境。"})
            return
        results = [item for item in DREAM_ITEMS if query in item["title"] or item["title"] in query]
        if not results:
            results = DREAM_ITEMS[:limit]
        results = results[:limit]
        json_resp(self, {
            "session_id": "dream_" + gen_id(),
            "query": query,
            "match_count": len(results),
            "results": results,
            "suggestion": "梦境宜结合近期心境、作息与所牵挂之人一起看，不必执着单一吉凶。",
        })

    def route_dream_deep_interpret(self, data):
        master_id, master_name, segments, refs = sse_segments("dream", data)
        ai_scene_sse(self, "dream", data, segments, refs)

    # ─── Blessing Routes ───────────────────────────────────────────────────

    def route_blessing_catalog(self, data):
        lamps = [
            {"id":"pingan","name":"平安灯","color":"#C9A96E","icon":"灯","desc":"愿家宅平安，出入顺遂。","description":"愿家宅平安，出入顺遂。","min_amount":6.6},
            {"id":"health","name":"健康灯","color":"#7DAE7A","icon":"寿","desc":"愿身心康泰，福寿绵长。","description":"愿身心康泰，福寿绵长。","min_amount":8.8},
            {"id":"career","name":"事业灯","color":"#C43D3D","icon":"禄","desc":"愿事业顺利，步步高升。","description":"愿事业顺利，步步高升。","min_amount":9.9},
            {"id":"study","name":"智慧灯","color":"#8E6AD8","icon":"慧","desc":"愿学业精进，智慧增长。","description":"愿学业精进，智慧增长。","min_amount":6.6},
            {"id":"love","name":"姻缘灯","color":"#D97A9D","icon":"缘","desc":"愿善缘和合，家庭美满。","description":"愿善缘和合，家庭美满。","min_amount":8.8},
        ]
        durations = [
            {"id": row["duration_id"], "label": row["label"], "days": row["days"], "min_amount": row["price"]}
            for row in get_blessing_duration_prices() if int(row.get("enabled") or 0)
        ]
        json_resp(self, {
            "catalog": BLESSING_CATALOG,
            "lamps": lamps,
            "durations": durations,
            "stats": {"total_lit": 1088, "today_lit": 36},
        })

    def route_blessing_create(self, data):
        user = require_auth(self)
        if not user:
            return
        beneficiary = (data.get('beneficiary_name') or data.get('content') or '').strip()
        relation = (data.get('relation') or data.get('type') or '家人').strip()
        wish = (data.get('wish') or '').strip()
        lamp_type = (data.get('lamp_type') or 'pingan').strip()
        duration_id = (data.get('duration') or 'month').strip()
        sponsor = (data.get('sponsor_nickname') or user.get('nickname') or user.get('lucky_code') or '善信').strip()
        content = beneficiary
        btype = relation
        is_public = data.get('is_public', True)

        if not content:
            json_err(self, "请填写为谁祈福")
            return

        duration = get_blessing_duration(duration_id)
        lamp_names = {"pingan": "平安灯", "health": "健康灯", "career": "事业灯", "study": "智慧灯", "love": "姻缘灯"}
        amount = money_value(duration.get("price"), 6.6)
        blessing_id = gen_id()
        conn = get_db()
        conn.execute(
            "INSERT INTO blessings (id, user_id, content, blessing_type, is_public) VALUES (?,?,?,?,?)",
            (blessing_id, user['id'], content, btype, 1 if is_public else 0)
        )
        conn.commit()
        conn.close()

        json_resp(self, {
            "id": blessing_id,
            "lamp_type": lamp_type,
            "lamp_name": lamp_names.get(lamp_type, "祈福灯"),
            "duration": duration_id,
            "duration_label": duration.get("label"),
            "beneficiary_name": beneficiary,
            "beneficiary_masked": beneficiary[0] + "*" * max(0, len(beneficiary) - 1) if beneficiary else "家人",
            "relation": relation,
            "wish": wish,
            "sponsor_nickname": sponsor,
            "amount_yuan": amount,
            "message": "祈福已登记，功德无量！"
        })

    def route_blessing_wall(self, data):
        limit = min(data.get('limit', 60), 200)

        conn = get_db()
        rows = conn.execute(
            """SELECT b.*, u.nickname, u.lucky_code
               FROM blessings b JOIN users u ON u.id=b.user_id
               WHERE b.is_public=1 ORDER BY b.created_at DESC LIMIT ?""",
            (limit,)
        ).fetchall()
        conn.close()

        entries = []
        for row in rows:
            r = dict(row)
            nick = r['nickname'] or r['lucky_code'] or '善信'
            if len(nick) > 1:
                r['nickname'] = nick[0] + '*' * (len(nick) - 1)
            r.pop('lucky_code', None)
            entries.append(r)

        wall = [
            {
                "id": item.get("id", gen_id()),
                "beneficiaryName": item.get("content", "家人"),
                "relation": item.get("blessing_type", "家人"),
                "wish": item.get("content", "愿平安顺遂"),
                "sponsorNickname": item.get("nickname", "善信"),
                "lampType": item.get("blessing_type", "pingan"),
                "lampName": "平安灯",
                "lampColor": "#C9A96E",
                "duration": "一月",
                "litAt": item.get("created_at"),
            }
            for item in entries
        ]
        if not wall:
            wall = [
                {"id":"demo1","beneficiaryName":"母亲","relation":"母亲","wish":"愿身体康健，心中安乐","sponsorNickname":"善信","lampType":"health","lampName":"健康灯","lampColor":"#7DAE7A","duration":"一月","litAt":datetime.datetime.utcnow().isoformat()+"Z"},
                {"id":"demo2","beneficiaryName":"父亲","relation":"父亲","wish":"愿出入平安，诸事顺遂","sponsorNickname":"莲心","lampType":"pingan","lampName":"平安灯","lampColor":"#C9A96E","duration":"三月","litAt":datetime.datetime.utcnow().isoformat()+"Z"},
            ]

        json_resp(self, {"entries": entries, "wall": wall, "total": len(wall), "stats": {"total_lit": 1088 + len(wall), "today_lit": 36}})

    # ─── Payment Routes ────────────────────────────────────────────────────

    def route_payment_create(self, data):
        user = require_auth(self)
        if not user:
            return
        product_id = data.get('product_id', 'single_bazi')
        extras = data.get('extras') if isinstance(data.get('extras'), dict) else {}
        try:
            product = get_payment_product(product_id, extras)
        except ValueError as e:
            json_err(self, str(e))
            return

        gateway = get_enabled_epay_gateway()
        if not gateway:
            json_err(self, "请先在管理员后台配置并启用易支付网关")
            return

        order_id = "ord_" + gen_id()
        amount = money_value(product['price'])
        product_name = product['name']
        payment_url = build_epay_payment_url(self, gateway, order_id, product_name, amount)
        conn = get_db()
        conn.execute(
            """INSERT INTO orders
               (id, user_id, product_id, product_name, amount, status, provider, gateway_id, payment_url, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,datetime('now','localtime'))""",
            (order_id, user['id'], product_id, product_name, amount, 'pending', 'epay', gateway['id'], payment_url)
        )
        conn.commit()
        conn.close()

        json_resp(self, {
            "order_id": order_id,
            "provider": "epay",
            "product_id": product_id,
            "product_name": product_name,
            "amount": amount,
            "currency": "CNY",
            "expire_at": (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat() + 'Z',
            "display_amount_text": money_text(amount),
            "payment_url": payment_url,
            "gateway_id": gateway['id'],
            "payee_name": gateway.get('name') or "菩提苑"
        })

    def route_payment_status(self, data):
        order_id = data.get('order_id', '')
        if not order_id:
            json_err(self, "缺少订单号")
            return

        conn = get_db()
        order = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        conn.close()

        if not order:
            json_err(self, "订单不存在")
            return

        o = dict(order)
        json_resp(self, {
            "status": o['status'] or 'pending',
            "paid_at": o['paid_at'],
            "review_note": None
        })

    def route_payment_buyer_report(self, data):
        order_id = data.get('order_id', '')
        if not order_id:
            json_err(self, "缺少订单号")
            return
        conn = get_db()
        conn.execute(
            "UPDATE orders SET status='needs_review', updated_at=datetime('now','localtime') WHERE id=? AND status='pending'",
            (order_id,)
        )
        conn.commit()
        conn.close()
        json_resp(self, {"order_id": order_id, "status": "needs_review", "report_url": None})

    def route_payment_prices(self, data):
        products = [
            {
                "product_id": p["product_id"],
                "name": p["name"],
                "current_price": money_value(p["price"]),
                "description": p.get("description") or "",
                "enabled": bool(p.get("enabled")),
            }
            for p in get_product_prices() if int(p.get("enabled") or 0)
        ]
        json_resp(self, {
            "products": products,
            "blessing_durations": [
                {
                    "duration_id": row["duration_id"],
                    "label": row["label"],
                    "days": row["days"],
                    "current_price": money_value(row["price"]),
                    "enabled": bool(row.get("enabled")),
                }
                for row in get_blessing_duration_prices() if int(row.get("enabled") or 0)
            ]
        })

    def route_payment_epay_notify(self, data):
        order_id = data.get("out_trade_no") or data.get("order_id") or ""
        if not order_id:
            plain_resp(self, "fail")
            return
        conn = get_db()
        row = conn.execute(
            """SELECT o.*, g.merchant_key
               FROM orders o LEFT JOIN payment_gateways g ON g.id=o.gateway_id
               WHERE o.id=?""",
            (order_id,)
        ).fetchone()
        if not row:
            conn.close()
            plain_resp(self, "fail")
            return
        order = dict(row)
        if not epay_sign_ok(data, order.get("merchant_key") or ""):
            conn.execute(
                "UPDATE orders SET notify_payload=?, updated_at=datetime('now','localtime') WHERE id=?",
                (json.dumps({"error": "bad_sign", "payload": data}, ensure_ascii=False), order_id)
            )
            conn.commit()
            conn.close()
            plain_resp(self, "fail")
            return
        trade_status = str(data.get("trade_status") or "").upper()
        paid = trade_status in ("TRADE_SUCCESS", "SUCCESS", "PAID") or str(data.get("status") or "").lower() == "paid"
        paid_amount = money_value(data.get("money"), order.get("amount"))
        if paid and abs(paid_amount - money_value(order.get("amount"))) <= 0.01:
            conn.execute(
                """UPDATE orders
                   SET status='paid', paid_at=COALESCE(paid_at, datetime('now','localtime')),
                       trade_no=?, notify_payload=?, updated_at=datetime('now','localtime')
                   WHERE id=?""",
                (data.get("trade_no") or data.get("trade_no_third") or "", json.dumps(data, ensure_ascii=False), order_id)
            )
            conn.commit()
            conn.close()
            plain_resp(self, "success")
            return
        conn.execute(
            "UPDATE orders SET notify_payload=?, updated_at=datetime('now','localtime') WHERE id=?",
            (json.dumps({"error": "not_paid_or_amount_mismatch", "payload": data}, ensure_ascii=False), order_id)
        )
        conn.commit()
        conn.close()
        plain_resp(self, "fail")

    def route_payment_epay_return(self, data):
        order_id = data.get("out_trade_no") or data.get("order_id") or ""
        html_body = f"""<!doctype html><html><head><meta charset="utf-8"><title>支付返回</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#1A1410;color:#F5F0E8;text-align:center;padding:48px 16px;">
<h2>支付结果已返回</h2><p>订单 {html.escape(order_id)} 正在同步，请回到菩提苑页面等待自动确认。</p>
<script>try{{window.opener&&window.opener.focus();}}catch(e){{}}</script></body></html>"""
        plain_resp(self, html_body, content_type="text/html; charset=utf-8")

    # ─── Referral Routes ───────────────────────────────────────────────────

    def route_referral_apply(self, data):
        user = require_auth(self)
        if not user:
            return
        invite_code = data.get('invite_code', '')
        device_id = data.get('device_id', '')

        if not invite_code:
            json_err(self, "请填写邀请码")
            return

        conn = get_db()
        ref = conn.execute("SELECT * FROM referral_codes WHERE code=?", (invite_code,)).fetchone()
        if not ref:
            conn.close()
            json_err(self, "邀请码无效")
            return

        ref = dict(ref)
        # Update referral stats
        conn.execute("UPDATE referral_codes SET used_count=used_count+1, earnings=earnings+0.5 WHERE id=?", (ref['id'],))
        conn.execute("UPDATE users SET merit=merit+5 WHERE id=?", (ref['user_id'],))
        conn.commit()
        conn.close()

        json_resp(self, {"message": "邀请码已生效，双方各获得5功德"})

    def route_referral_me(self, data):
        user = require_auth(self)
        if not user:
            json_err(self, "请先登录")
            return

        conn = get_db()
        ref = conn.execute("SELECT * FROM referral_codes WHERE user_id=?", (user['id'],)).fetchone()
        conn.close()

        if not ref:
            ref_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            conn2 = get_db()
            conn2.execute("INSERT INTO referral_codes (id, user_id, code) VALUES (?,?,?)", (gen_id(), user['id'], ref_code))
            conn2.commit()
            conn2.close()
            json_resp(self, {"code": ref_code, "used_count": 0, "earnings": 0})
        else:
            r = dict(ref)
            json_resp(self, {"code": r['code'], "used_count": r['used_count'], "earnings": r['earnings']})

    def route_referral_withdraw(self, data):
        user = require_auth(self)
        if not user:
            return
        amount = data.get('amount', 0)
        note = data.get('note', '')

        if amount <= 0:
            json_err(self, "金额须大于0")
            return

        conn = get_db()
        ref = conn.execute("SELECT * FROM referral_codes WHERE user_id=?", (user['id'],)).fetchone()
        if not ref or ref['earnings'] < amount:
            conn.close()
            json_err(self, "余额不足")
            return

        conn.execute("UPDATE referral_codes SET earnings=earnings-? WHERE user_id=?", (amount, user['id']))
        conn.commit()
        conn.close()

        json_resp(self, {"withdrawn": amount, "remaining": ref['earnings'] - amount, "status": "pending_review"})

    # ─── History Routes ────────────────────────────────────────────────────

    def route_history_push(self, data):
        user = require_auth(self)
        if not user:
            return
        kind = data.get('kind', '')
        title = data.get('title', '')
        subtitle = data.get('subtitle', '')
        payload = data.get('payload', {})

        conn = get_db()
        conn.execute(
            "INSERT INTO history (id, user_id, kind, title, subtitle, payload) VALUES (?,?,?,?,?,?)",
            (gen_id(), user['id'], kind, title, subtitle, json.dumps(payload, ensure_ascii=False))
        )
        conn.commit()
        conn.close()

        json_resp(self, {"status": "recorded"})

    def route_history_list(self, data):
        user = require_auth(self)
        if not user:
            return
        kind = data.get('kind', '')
        limit = min(data.get('limit', 30), 100)

        conn = get_db()
        if kind:
            rows = conn.execute(
                "SELECT * FROM history WHERE user_id=? AND kind=? ORDER BY created_at DESC LIMIT ?",
                (user['id'], kind, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM history WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
                (user['id'], limit)
            ).fetchall()
        conn.close()

        items = []
        for row in rows:
            r = dict(row)
            if r['payload']:
                try:
                    r['payload'] = json.loads(r['payload'])
                except:
                    pass
            items.append(r)

        json_resp(self, {"items": items})

    def route_history_clear(self, data):
        user = require_auth(self)
        if not user:
            return
        kind = data.get('kind', '')

        conn = get_db()
        if kind:
            conn.execute("DELETE FROM history WHERE user_id=? AND kind=?", (user['id'], kind))
        else:
            conn.execute("DELETE FROM history WHERE user_id=?", (user['id'],))
        conn.commit()
        conn.close()

        json_resp(self, {"status": "cleared"})

    # ─── Logging ───────────────────────────────────────────────────────────

    def log_message(self, format, *args):
        msg = format % args
        if '/api/' in msg or 'POST' in msg:
            print(f"  [{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")

    def _safe_write(self, data):
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass

# ─── Start Server ────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    PutiyuanHandler.allow_reuse_address = True
    # Use ThreadingHTTPServer to handle concurrent requests
    server = ThreadingHTTPServer((HOST, PORT), PutiyuanHandler)
    server.timeout = 0.5  # Prevent hanging on dead connections
    print(f'  ┌──────────────────────────────────────────┐')
    print(f'  │  菩提苑 离线镜像服务 (含完整 API 后端)    │')
    print(f'  │  地址: http://localhost:{PORT}/             │')
    print(f'  │  按 Ctrl+C 停止                          │')
    print(f'  └──────────────────────────────────────────┘')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务已停止')
        server.shutdown()
