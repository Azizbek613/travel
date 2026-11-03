import { supabase, json, handleCors, isAdmin, readBody } from './_lib.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const url = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('cars')
        .select('data')
        .like('id', 'car-%');

      if (error) {
        console.error('Error fetching cars:', error);
        return json(res, 500, { error: 'database_error', details: error.message });
      }

      const cars = (data || []).map((row) => row.data);
      return json(res, 200, { cars });
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const car = body.car || body;
      if (!car || !car.id || !car.name) {
        return json(res, 400, { error: 'invalid_car_data' });
      }

      const { error } = await supabase
        .from('cars')
        .upsert({ id: car.id, data: car });

      if (error) {
        console.error('Error saving car:', error);
        return json(res, 500, { error: 'database_error', details: error.message });
      }

      return json(res, 201, { ok: true, car });
    }

    if (req.method === 'PUT') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const car = body.car || body;
      if (!car || !car.id) {
        return json(res, 400, { error: 'invalid_car_data' });
      }

      const { error } = await supabase
        .from('cars')
        .upsert({ id: car.id, data: car });

      if (error) {
        console.error('Error updating car:', error);
        return json(res, 500, { error: 'database_error', details: error.message });
      }

      return json(res, 200, { ok: true, car });
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });
      const id = url.searchParams.get('id') || (await readBody(req)).id;
      if (!id) return json(res, 400, { error: 'missing_id' });

      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting car:', error);
        return json(res, 500, { error: 'database_error', details: error.message });
      }

      return json(res, 200, { ok: true, deleted: id });
    }

    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    console.error('api/cars error:', err);
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
