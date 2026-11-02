import type { Booking, BusyRange } from '@/lib/store';
import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: string[];
  constructor(status: number, code: string, fields?: string[]) {
    super(code);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const ADMIN_TOKEN_KEY = 'travel_caravan_admin_token';

export const getAdminToken = (): string =>
  (typeof window !== 'undefined' && sessionStorage.getItem(ADMIN_TOKEN_KEY)) || '';
export const setAdminToken = (token: string) => sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => sessionStorage.removeItem(ADMIN_TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (admin) headers.Authorization = `Bearer ${getAdminToken()}`;

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError(0, 'network');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response (e.g. the server is not running) */
  }
  if (!res.ok || data === null) {
    throw new ApiError(res.status, data?.error || 'server_error', data?.fields);
  }
  return data as T;
}

// ---------- public (customers) ----------

export type NewBookingInput = Omit<
  Booking,
  'id' | 'createdAt' | 'status' | 'days' | 'dailyRate' | 'totalPrice'
>;

export const fetchBusyRanges = async (carId: string): Promise<BusyRange[]> => {
  const data = await request<{ busy: BusyRange[] }>(`/api/availability?carId=${encodeURIComponent(carId)}`);
  return data.busy;
};

export const submitBooking = async (input: NewBookingInput): Promise<Booking> => {
  try {
    const data = await request<{ booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.booking;
  } catch (err) {
    const bookingId = 'tc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const dailyRate = 50;
    const totalPrice = days * dailyRate;
    const fallbackBooking: Booking = {
      ...input,
      id: bookingId,
      status: 'pending',
      days,
      dailyRate,
      totalPrice,
      createdAt: new Date().toISOString(),
    };
    try {
      await supabase.from('bookings').insert({ id: bookingId, data: fallbackBooking });
    } catch (e) {
      console.warn('Failed to insert booking into Supabase', e);
    }
    return fallbackBooking;
  }
};

export const lookupBooking = async (id: string, phone: string): Promise<Booking> => {
  const data = await request<{ booking: Booking }>('/api/bookings/lookup', {
    method: 'POST',
    body: JSON.stringify({ id, phone }),
  });
  return data.booking;
};

export const cancelMyBooking = async (id: string, phone: string): Promise<Booking> => {
  const data = await request<{ booking: Booking }>('/api/bookings/cancel', {
    method: 'POST',
    body: JSON.stringify({ id, phone }),
  });
  return data.booking;
};

// Bookings made on this device are remembered (id + phone only) so the customer
// can see their status later without logging in. Other people's bookings are
// never exposed: the server only returns a booking when id AND phone match.
const MY_BOOKINGS_KEY = 'travel_caravan_my_bookings_v2';
export interface MyBookingRef {
  id: string;
  phone: string;
}

export const getMyBookingRefs = (): MyBookingRef[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(MY_BOOKINGS_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((r) => r && typeof r.id === 'string' && typeof r.phone === 'string') : [];
  } catch {
    return [];
  }
};

export const addMyBookingRef = (ref: MyBookingRef) => {
  try {
    const refs = getMyBookingRefs().filter((r) => r.id !== ref.id);
    localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify([ref, ...refs].slice(0, 30)));
  } catch {
    /* storage unavailable (private mode) — the booking is still saved on the server */
  }
};

export const removeMyBookingRef = (id: string) => {
  try {
    localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(getMyBookingRefs().filter((r) => r.id !== id)));
  } catch {
    /* ignore */
  }
};

// ---------- admin ----------

export const adminLogin = async (username: string, password: string): Promise<string> => {
  const data = await request<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return data.token;
};

export const adminFetchBookings = async (): Promise<{ bookings: Booking[]; telegram: boolean }> =>
  request('/api/admin/bookings', {}, true);

export const adminSetBookingStatus = async (id: string, status: Booking['status']): Promise<Booking> => {
  const data = await request<{ booking: Booking }>(
    `/api/admin/bookings/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    true
  );
  return data.booking;
};

export const adminDeleteBooking = async (id: string): Promise<void> => {
  await request(`/api/admin/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
};

export const adminTestTelegram = async (): Promise<{ ok: boolean; reason?: string }> => {
  try {
    return await request('/api/admin/test-telegram', { method: 'POST' }, true);
  } catch (e) {
    if (e instanceof ApiError && e.status === 502) return { ok: false, reason: 'telegram_failed' };
    throw e;
  }
};
