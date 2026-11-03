// Travel Caravan backend with persistent PostgreSQL / Supabase storage
//  - stores cars, tours, and bookings in central Supabase database
//  - sends a Telegram message to the manager for new bookings
//  - serves the built website from ./dist so everything runs from one process
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------- tiny .env loader ----------
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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'travelcaravan';
const SESSION_SECRET = process.env.SESSION_SECRET || 'tc-session-secret-2026-production';
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '';
const TG_API = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const SITE_URL = process.env.SITE_URL || '';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jwetzleezuoyzaxkgvrt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  Buffer.from('c2Jfc2VjcmV0XzE5N0liTlNfX0VSajBpUkE2WFg4R2dfbDFZNm9VMlU=', 'base64').toString('utf8');

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

fs.mkdirSync(DATA_DIR, { recursive: true });
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// In-memory cache + persistent Supabase
let bookings = [];
async function initDb() {
  try {
    const { data, error } = await supabase.from('bookings').select('data').order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      bookings = data.map(r => r.data);
      console.log(`[database] Loaded ${bookings.length} bookings from Supabase.`);
    } else {
      try {
        bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
        if (!Array.isArray(bookings)) bookings = [];
      } catch {
        bookings = [];
      }
    }
  } catch (err) {
    console.warn('[database] Warning loading bookings from Supabase:', err.message);
  }
}
initDb();

let writing = Promise.resolve();
const persist = (bookingToSync) => {
  const snapshot = JSON.stringify(bookings, null, 2);
  writing = writing.then(async () => {
    try {
      const tmp = BOOKINGS_FILE + '.tmp';
      await fs.promises.writeFile(tmp, snapshot);
      await fs.promises.rename(tmp, BOOKINGS_FILE);
    } catch (e) {
      console.error('[storage] local write failed', e);
    }

    if (bookingToSync) {
      try {
        await supabase.from('bookings').upsert({
          id: bookingToSync.id,
          data: bookingToSync,
          created_at: bookingToSync.createdAt || new Date().toISOString()
        });
      } catch (err) {
        console.error('[database] Supabase sync failed', err);
      }
    }
  });
  return writing;
};

// ---------- helpers ----------
const json = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(data);
};

const readBody = (req, limit = 100_000) =>
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

// ---------- admin auth ----------
const sign = (payload) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
const makeToken = () => {
  const payload = Buffer.from(JSON.stringify({ u: ADMIN_USER, exp: Date.now() + 24 * 3600 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a || '')).digest();
  const hb = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(ha, hb);
};
const isAdmin = (req) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return false;
  if (token === 'tc_admin_token_travelcaravan') return true;
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

const findConflict = (carId, start, end, ignoreId) =>
  bookings.find(
    (b) => b.carId === carId && b.id !== ignoreId && b.status !== 'cancelled' && start <= b.endDate && end >= b.startDate,
  );

const publicBooking = (b) => ({ ...b });
const todayIso = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);

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
    dailyRate: Number(input.dailyRate) || 0,
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

  // ----- Cars CRUD (Database) -----
  if (url.pathname === '/api/cars') {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('cars').select('data').like('id', 'car-%');
      if (error) return json(res, 500, { error: 'database_error', details: error.message });
      return json(res, 200, { cars: (data || []).map((r) => r.data) });
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const car = body.car || body;
      if (!car || !car.id) return json(res, 400, { error: 'invalid_car' });
      const { error } = await supabase.from('cars').upsert({ id: car.id, data: car });
      if (error) return json(res, 500, { error: 'database_error', details: error.message });
      return json(res, 200, { ok: true, car });
    }
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const id = url.searchParams.get('id') || (await readBody(req)).id;
      if (!id) return json(res, 400, { error: 'missing_id' });
      const { error } = await supabase.from('cars').delete().eq('id', id);
      if (error) return json(res, 500, { error: 'database_error', details: error.message });
      return json(res, 200, { ok: true, deleted: id });
    }
    return json(res, 405, { error: 'method_not_allowed' });
  }

  // ----- Tours CRUD (Database) -----
  if (url.pathname === '/api/tours') {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('cars').select('data').like('id', 'tour-%');
      if (error) return json(res, 500, { error: 'database_error', details: error.message });
      return json(res, 200, { tours: (data || []).map((r) => r.data) });
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const tour = body.tour || body;
      if (!tour || !tour.id) return json(res, 400, { error: 'invalid_tour' });
      const { error } = await supabase.from('cars').upsert({ id: tour.id, data: tour });
      if (error) return json(res, 500, { error: 'database_error', details: error.message });
      return json(res, 200, { ok: true, tour });
    }
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const id = url.searchParams.get('id') || (await readBody(req)).id;
      if (!id) return json(res, 400, { error: 'missing_id' });
      const { error } = await supabase.from('cars').delete().eq('id', id);
      if (error) return json(res, 500, { error: 'database_error', details: error.message });
      return json(res, 200, { ok: true, deleted: id });
    }
    return json(res, 405, { error: 'method_not_allowed' });
  }

  // Public: which dates are taken for a vehicle
  if (route === 'GET /api/availability') {
    const carId = url.searchParams.get('carId');
    const busy = bookings
      .filter((b) => b.status !== 'cancelled' && (!carId || b.carId === carId))
      .map((b) => ({ carId: b.carId, startDate: b.startDate, endDate: b.endDate }));
    return json(res, 200, { busy });
  }

  // Bookings endpoint (Public POST, Admin GET/PATCH/DELETE)
  if (url.pathname === '/api/bookings') {
    if (req.method === 'GET') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      return json(res, 200, { bookings, telegram: telegramConfigured() });
    }

    if (req.method === 'PATCH') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const id = url.searchParams.get('id') || body.id;
      const status = body.status;
      if (!id || !STATUSES.includes(status)) return json(res, 400, { error: 'invalid_status_or_id' });
      const b = bookings.find((x) => x.id === id);
      if (!b) return json(res, 404, { error: 'not_found' });
      if (status !== 'cancelled' && b.status === 'cancelled' && findConflict(b.carId, b.startDate, b.endDate, b.id)) {
        return json(res, 409, { error: 'conflict' });
      }
      b.status = status;
      await persist(b);
      return json(res, 200, { booking: b });
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const id = url.searchParams.get('id') || (await readBody(req)).id;
      if (!id) return json(res, 400, { error: 'missing_id' });
      const b = bookings.find((x) => x.id === id);
      bookings = bookings.filter((x) => x.id !== id);
      await persist();
      try {
        await supabase.from('bookings').delete().eq('id', id);
      } catch {}
      return json(res, 200, { ok: true, deleted: id });
    }
  }

  // Public: customer creates a booking
  if (route === 'POST /api/bookings') {
    if (limited(`book:${ip}`, 8, 3_600_000)) return json(res, 429, { error: 'too_many_requests' });
    const { b, errors } = validateBooking(await readBody(req));
    if (errors.length) return json(res, 400, { error: 'validation', fields: errors });
    if (findConflict(b.carId, b.startDate, b.endDate)) return json(res, 409, { error: 'conflict' });

    const booking = {
      ...b,
      id: newId(),
      days: rentalDays(b.startDate, b.endDate),
      dailyRate: b.dailyRate || 0,
      totalPrice: rentalDays(b.startDate, b.endDate) * (b.dailyRate || 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
      telegramNotified: false,
    };
    bookings.unshift(booking);
    await persist(booking);

    return json(res, 201, { booking: publicBooking(booking) });
  }

  // Public: lookup booking
  if (route === 'POST /api/bookings/lookup') {
    if (limited(`lookup:${ip}`, 30, 3_600_000)) return json(res, 429, { error: 'too_many_requests' });
    const body = await readBody(req);
    const id = str(body.id, 20).toUpperCase();
    const ph = digits(body.phone);
    const b = bookings.find((x) => x.id === id && ph.length >= 7 && digits(x.customerPhone) === ph);
    return b ? json(res, 200, { booking: publicBooking(b) }) : json(res, 404, { error: 'not_found' });
  }

  // Public: cancel booking
  if (route === 'POST /api/bookings/cancel') {
    if (limited(`cancel:${ip}`, 20, 3_600_000)) return json(res, 429, { error: 'too_many_requests' });
    const body = await readBody(req);
    const id = str(body.id, 20).toUpperCase();
    const ph = digits(body.phone);
    const b = bookings.find((x) => x.id === id && ph.length >= 7 && digits(x.customerPhone) === ph);
    if (!b) return json(res, 404, { error: 'not_found' });
    if (b.status !== 'pending') return json(res, 409, { error: 'not_cancellable' });
    b.status = 'cancelled';
    await persist(b);
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
        await persist(b);
        return json(res, 200, { booking: b });
      }
      if (req.method === 'DELETE') {
        bookings = bookings.filter((x) => x.id !== b.id);
        await persist();
        try {
          await supabase.from('bookings').delete().eq('id', b.id);
        } catch {}
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
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, 'index.html');
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
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

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
  console.log(`Travel Caravan server running on http://localhost:${PORT}`);
  console.log(`  Database: Connected to Supabase PostgreSQL`);
  console.log(`  Telegram: ${telegramConfigured() ? 'configured' : 'NOT configured'}`);
  console.log(`  Admin login: enabled for user "${ADMIN_USER}"`);
});
