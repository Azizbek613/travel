import { supabase, json, handleCors, readBody } from '../_lib.js';

const digits = (v) => String(v || '').replace(/\D/g, '');

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  try {
    const body = await readBody(req);
    const id = String(body.id || '').trim().toUpperCase();
    const phone = digits(body.phone);

    if (!id || phone.length < 7) {
      return json(res, 400, { error: 'invalid_lookup_params' });
    }

    const { data: row, error } = await supabase
      .from('bookings')
      .select('data')
      .eq('id', id)
      .single();

    if (error || !row || !row.data) {
      return json(res, 404, { error: 'not_found' });
    }

    const b = row.data;
    if (digits(b.customerPhone) !== phone) {
      return json(res, 404, { error: 'not_found' });
    }

    return json(res, 200, { booking: b });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
