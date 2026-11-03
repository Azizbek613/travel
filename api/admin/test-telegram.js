import { json, handleCors, isAdmin, TG_TOKEN, TG_CHAT, TG_API } from '../_lib.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  if (!isAdmin(req)) {
    return json(res, 401, { error: 'unauthorized' });
  }

  if (!TG_TOKEN || !TG_CHAT) {
    return json(res, 200, { ok: false, reason: 'not_configured' });
  }

  try {
    const r = await fetch(`${TG_API}/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: '✅ Travel Caravan: Telegram notifications are working.' }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await r.json().catch(() => ({}));
    return json(res, r.ok && data.ok ? 200 : 502, { ok: Boolean(r.ok && data.ok), data });
  } catch (err) {
    return json(res, 502, { ok: false, reason: err.message });
  }
}
