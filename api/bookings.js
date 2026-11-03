import { supabase, json, handleCors, isAdmin, readBody, TG_TOKEN, TG_CHAT, TG_API } from './_lib.js';
import crypto from 'node:crypto';

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + 'T00:00:00Z').getTime());
const todayIso = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const digits = (v) => String(v || '').replace(/\D/g, '');
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const LOCATION_TYPES = ['Hotel', 'Train Station', 'Airport', 'Other Location'];

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

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const url = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });

      const { data, error } = await supabase
        .from('bookings')
        .select('data')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return json(res, 500, { error: 'database_error', details: error.message });
      }

      const bookings = (data || []).map((row) => row.data);
      return json(res, 200, { bookings, telegram: Boolean(TG_TOKEN && TG_CHAT) });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const { b, errors } = validateBooking(body);
      if (errors.length) return json(res, 400, { error: 'validation', fields: errors });

      // Check conflict in database
      const { data: existingRows } = await supabase
        .from('bookings')
        .select('data');

      const allBookings = (existingRows || []).map((r) => r.data);
      const conflict = allBookings.find(
        (ex) =>
          ex.carId === b.carId &&
          ex.status !== 'cancelled' &&
          b.startDate <= ex.endDate &&
          b.endDate >= ex.startDate
      );

      if (conflict) {
        return json(res, 409, { error: 'conflict' });
      }

      const id = `TC-${crypto.randomInt(10000, 100000)}`;
      const days = rentalDays(b.startDate, b.endDate);
      const totalPrice = days * (b.dailyRate || 0);

      const booking = {
        ...b,
        id,
        days,
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        telegramNotified: false,
      };

      const { error: insertErr } = await supabase
        .from('bookings')
        .insert({ id, data: booking, created_at: booking.createdAt });

      if (insertErr) {
        console.error('Error saving booking:', insertErr);
        return json(res, 500, { error: 'database_error', details: insertErr.message });
      }

      return json(res, 201, { booking });
    }

    if (req.method === 'PATCH') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });

      const body = await readBody(req);
      const id = url.searchParams.get('id') || body.id;
      const status = body.status;

      if (!id || !STATUSES.includes(status)) {
        return json(res, 400, { error: 'invalid_status_or_id' });
      }

      const { data: existing } = await supabase
        .from('bookings')
        .select('data')
        .eq('id', id)
        .single();

      if (!existing || !existing.data) {
        return json(res, 404, { error: 'not_found' });
      }

      const updatedBooking = { ...existing.data, status };

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({ data: updatedBooking })
        .eq('id', id);

      if (updateErr) {
        return json(res, 500, { error: 'database_error', details: updateErr.message });
      }

      return json(res, 200, { booking: updatedBooking });
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return json(res, 401, { error: 'unauthorized' });

      const id = url.searchParams.get('id') || (await readBody(req)).id;
      if (!id) return json(res, 400, { error: 'missing_id' });

      const { error: deleteErr } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (deleteErr) {
        return json(res, 500, { error: 'database_error', details: deleteErr.message });
      }

      return json(res, 200, { ok: true, deleted: id });
    }

    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    console.error('api/bookings error:', err);
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
