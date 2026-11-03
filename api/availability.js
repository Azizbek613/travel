import { supabase, json, handleCors } from './_lib.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const url = new URL(req.url, 'http://localhost');
  const carId = url.searchParams.get('carId');

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('data');

    if (error) {
      return json(res, 500, { error: 'database_error', details: error.message });
    }

    const allBookings = (data || []).map((row) => row.data);
    const busy = allBookings
      .filter((b) => b.status !== 'cancelled' && (!carId || b.carId === carId))
      .map((b) => ({ carId: b.carId, startDate: b.startDate, endDate: b.endDate }));

    return json(res, 200, { busy });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
