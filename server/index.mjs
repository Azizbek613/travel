// Travel Caravan backend — zero dependencies (Node 18+).
//  - stores bookings in a JSON file (shared by every visitor and the admin panel)
//  - sends a Telegram message to the manager for every new booking
//  - serves the built website from ./dist so everything runs from one process
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------- tiny .env loader (no dotenv dependency) ----------
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const v = m[2].replace(/^['"]|['"]$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DIST_DIR = path.join(ROOT, 'dist');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '';
const TG_API = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const SITE_URL = process.env.SITE_URL || '';

fs.mkdirSync(DATA_DIR, { recursive: true });
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// ---------- storage ----------
let bookings = [];
try {
  bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
  if (!Array.isArray(bookings)) bookings = [];
} catch {
  bookings = [];
}
let writing = Promise.resolve();
const persist = () => {
  const snapshot = JSON.stringify(bookings, null, 2);
  writing = writing.then(async () => {
    const tmp = BOOKINGS_FILE + '.tmp';
    await fs.promises.writeFile(tmp, snapshot);
    await fs.promises.rename(tmp, BOOKINGS_FILE);
  }).catch((e) => console.error('[storage] write failed', e));
  return writing;
};

// ---------- helpers ----------
const json = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(data);
};

const readBody = (req, limit = 50_000) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const digits = (v) => String(v || '').replace(/\D/g, '');
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + 'T00:00:00Z').getTime());
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const LOCATION_TYPES = ['Hotel', 'Train Station', 'Airport', 'Other Location'];

// very small in-memory rate limiter
const hits = new Map();
const limited = (key, max, windowMs) => {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
};
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) if (!arr.some((t) => now - t < 3_600_000)) hits.delete(k);
}, 600_000).unref();

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

// ---------- admin auth (signed, expiring token) ----------
const sign = (payload) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
const makeToken = () => {
  const payload = Buffer.from(JSON.stringify({ u: ADMIN_USER, exp: Date.now() + 12 * 3600 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};
const isAdmin = (req) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
};

// ---------- Telegram ----------
const telegramConfigured = () => Boolean(TG_TOKEN && TG_CHAT);

async function sendTelegram(text) {
  if (!telegramConfigured()) {
    console.warn('[telegram] not configured (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID) — message skipped');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const r = await fetch(`${TG_API}/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) {
      console.error('[telegram] send failed:', r.status, data.description || '');
      return { ok: false, reason: data.description || `http_${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error('[telegram] network error:', e.message);
    return { ok: false, reason: e.message };
  }
}

const bookingMessage = (b, title) =>
  [
    `<b>${esc(title)}</b>  <code>${esc(b.id)}</code>`,
    '',
    `👤 <b>${esc(b.customerName)}</b>`,
    b.customerPhone ? `📞 ${esc(b.customerPhone)}` : null,
    b.customerEmail ? `✉️ ${esc(b.customerEmail)}` : null,
    '',
    `🚐 ${esc(b.carName)}`,
    `📅 ${esc(b.startDate)} → ${esc(b.endDate)} (${b.days} d), ${esc(b.startTime)}`,
    `👥 Passengers: ${b.passengers}`,
    b.pickupLocation ? `📍 From: ${b.pickupType ? esc(b.pickupType) + ' — ' : ''}${esc(b.pickupLocation)}` : null,
    b.dropoffLocation ? `🏁 To: ${b.dropoffType ? esc(b.dropoffType) + ' — ' : ''}${esc(b.dropoffLocation)}` : null,
    b.notes ? `📝 ${esc(b.notes)}` : null,
    '',
    '💬 Price: to be agreed with the customer',
    SITE_URL ? `🔗 ${esc(SITE_URL.replace(/\/$/, ''))}/admin` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');

// ---------- booking logic ----------
const findConflict = (carId, start, end, ignoreId) =>
  bookings.find(
    (b) => b.carId === carId && b.id !== ignoreId && b.status !== 'cancelled' && start <= b.endDate && end >= b.startDate,
  );

const publicBooking = (b) => ({ ...b }); // used for the owner (id + phone verified) and for admin
const todayIso = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10); // Uzbekistan (UTC+5)

function validateBooking(input) {
  const errors = [];
  const b = {
    carId: str(input.carId, 60),
    carName: str(input.carName, 120),
    carImage: /^https?:\/\//i.test(input.carImage || '') ? str(input.carImage, 500) : '',
    customerName: str(input.customerName, 100),
    customerPhone: str(input.customerPhone, 40),
    customerEmail: str(input.customerEmail, 120),
    startDate: str(input.startDate, 10),
    endDate: str(input.endDate, 10),
    startTime: str(input.startTime, 5),
    passengers: Math.round(Number(input.passengers)),
    pickupType: LOCATION_TYPES.includes(input.pickupType) ? input.pickupType : undefined,
    pickupLocation: str(input.pickupLocation, 200),
    dropoffType: LOCATION_TYPES.includes(input.dropoffType) ? input.dropoffType : undefined,
    dropoffLocation: str(input.dropoffLocation, 200),
    notes: str(input.notes, 600),
  };
  if (!b.carId || !b.carName) errors.push('vehicle');
  if (b.customerName.length < 2) errors.push('name');
  const d = digits(b.customerPhone);
  if (d.length > 0 && (d.length < 7 || d.length > 15)) errors.push('phone');
  if (b.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.customerEmail)) errors.push('email');
  if (!isDate(b.startDate) || !isDate(b.endDate) || b.endDate < b.startDate) errors.push('dates');
  else if (b.startDate < todayIso()) errors.push('dates_past');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.startTime)) errors.push('time');
  if (!Number.isFinite(b.passengers) || b.passengers < 1 || b.passengers > 60) errors.push('passengers');
  if (!b.pickupLocation) errors.push('pickup');
  // Drop-off is optional; customers may arrange it later with the manager.
  return { b, errors };
}

const rentalDays = (s, e) => Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86_400_000));

const newId = () => {
  for (let i = 0; i < 50; i++) {
    const id = `TC-${crypto.randomInt(10000, 100000)}`;
    if (!bookings.some((b) => b.id === id)) return id;
  }
  return `TC-${Date.now().toString().slice(-8)}`;
};

// ---------- routes ----------
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const ip = clientIp(req);

  if (route === 'GET /api/health') {
    return json(res, 200, { ok: true, telegram: telegramConfigured(), adminConfigured: Boolean(ADMIN_PASSWORD) });
  }

  // Public: which dates are taken for a vehicle (no personal data).
  if (route === 'GET /api/availability') {
    const carId = url.searchParams.get('carId');
    const busy = bookings
      .filter((b) => b.status !== 'cancelled' && (!carId || b.carId === carId))
      .map((b) => ({ carId: b.carId, startDate: b.startDate, endDate: b.endDate }));
    return json(res, 200, { busy });
  }

  // Public: customer creates a booking.
  if (route === 'POST /api/bookings') {
    if (limited(`book:${ip}`, 8, 3_600_000)) return json(res, 429, { error: 'too_many_requests' });
    const { b, errors } = validateBooking(await readBody(req));
    if (errors.length) return json(res, 400, { error: 'validation', fields: errors });
    if (findConflict(b.carId, b.startDate, b.endDate)) return json(res, 409, { error: 'conflict' });

    const booking = {
      ...b,
      id: newId(),
      days: rentalDays(b.startDate, b.endDate),
      dailyRate: 0,
      totalPrice: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      telegramNotified: false,
    };
    bookings.unshift(booking);
    await persist(); // saved to disk BEFORE we tell the customer it worked

    // Do not send booking details to Telegram automatically. The customer is
    // redirected to the manager's Telegram chat with a prefilled draft and must
    // press Send themselves. The website booking is saved here for the admin panel.
    return json(res, 201, { booking: publicBooking(booking) });
  }

  // Public: customer looks up own booking (needs ID + phone).
  if (route === 'POST /api/bookings/lookup') {
    if (limited(`lookup:${ip}`, 30, 3_600_000)) return json(res, 429, { error: 'too_many_requests' });
    const body = await readBody(req);
    const id = str(body.id, 20).toUpperCase();
    const ph = digits(body.phone);
    const b = bookings.find((x) => x.id === id && ph.length >= 7 && digits(x.customerPhone) === ph);
    return b ? json(res, 200, { booking: publicBooking(b) }) : json(res, 404, { error: 'not_found' });
  }

  // Public: customer cancels own pending booking (needs ID + phone).
  if (route === 'POST /api/bookings/cancel') {
    if (limited(`cancel:${ip}`, 20, 3_600_000)) return json(res, 429, { error: 'too_many_requests' });
    const body = await readBody(req);
    const id = str(body.id, 20).toUpperCase();
    const ph = digits(body.phone);
    const b = bookings.find((x) => x.id === id && ph.length >= 7 && digits(x.customerPhone) === ph);
    if (!b) return json(res, 404, { error: 'not_found' });
    if (b.status !== 'pending') return json(res, 409, { error: 'not_cancellable' });
    b.status = 'cancelled';
    await persist();
    sendTelegram(bookingMessage(b, '❌ Booking cancelled by customer'));
    return json(res, 200, { booking: publicBooking(b) });
  }

  // ----- admin -----
  if (route === 'POST /api/admin/login') {
    if (limited(`login:${ip}`, 8, 900_000)) return json(res, 429, { error: 'too_many_requests' });
    if (!ADMIN_PASSWORD) return json(res, 503, { error: 'admin_not_configured' });
    const body = await readBody(req);
    if (safeEqual(str(body.username, 80), ADMIN_USER) && safeEqual(str(body.password, 200), ADMIN_PASSWORD)) {
      return json(res, 200, { token: makeToken() });
    }
    return json(res, 401, { error: 'invalid_credentials' });
  }

  if (url.pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });

    if (route === 'GET /api/admin/bookings') {
      return json(res, 200, { bookings, telegram: telegramConfigured() });
    }

    if (route === 'POST /api/admin/test-telegram') {
      const r = await sendTelegram('✅ Travel Caravan: Telegram notifications are working.');
      return json(res, r.ok ? 200 : 502, r);
    }

    const m = url.pathname.match(/^\/api\/admin\/bookings\/([A-Za-z0-9-]+)$/);
    if (m) {
      const b = bookings.find((x) => x.id === m[1]);
      if (!b) return json(res, 404, { error: 'not_found' });
      if (req.method === 'PATCH') {
        const { status } = await readBody(req);
        if (!STATUSES.includes(status)) return json(res, 400, { error: 'invalid_status' });
        if (status !== 'cancelled' && b.status === 'cancelled' && findConflict(b.carId, b.startDate, b.endDate, b.id)) {
          return json(res, 409, { error: 'conflict' });
        }
        b.status = status;
        await persist();
        return json(res, 200, { booking: b });
      }
      if (req.method === 'DELETE') {
        bookings = bookings.filter((x) => x.id !== b.id);
        await persist();
        return json(res, 200, { ok: true });
      }
    }
  }

  return json(res, 404, { error: 'not_found' });
}

// ---------- static website ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.map': 'application/json',
};

function serveStatic(req, res, url) {
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('API is running. Build the website first:  npm run build');
  }
  let rel = decodeURIComponent(url.pathname);
  let file = path.join(DIST_DIR, rel);
  if (!file.startsWith(DIST_DIR)) {
    res.writeHead(403);
    return res.end();
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, 'index.html'); // SPA fallback
  const ext = path.extname(file).toLowerCase();
  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error('[server]', e);
    if (!res.headersSent) json(res, status, { error: status === 500 ? 'server_error' : e.message });
  }
});

server.listen(PORT, () => {
  console.log(`Travel Caravan server on http://localhost:${PORT}`);
  console.log(`  Telegram: ${telegramConfigured() ? 'configured' : 'NOT configured (see .env.example)'}`);
  console.log(`  Admin login: ${ADMIN_PASSWORD ? 'enabled' : 'DISABLED — set ADMIN_PASSWORD in .env'}`);
  if (!process.env.SESSION_SECRET) console.log('  Tip: set SESSION_SECRET so admin sessions survive restarts.');
});
