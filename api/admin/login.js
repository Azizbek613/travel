import { json, handleCors, readBody, safeEqual, makeToken, ADMIN_USER, ADMIN_PASSWORD } from '../_lib.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();

    if (safeEqual(username, ADMIN_USER) && safeEqual(password, ADMIN_PASSWORD)) {
      return json(res, 200, { token: makeToken() });
    }

    return json(res, 401, { error: 'invalid_credentials' });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
