import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { getBookings, notifyStoreChange, subscribeStoreChange } from './store';

/**
 * Travel Caravan is built for international tourists, so accounts are
 * identified by an international phone number (E.164, e.g. +998901234567)
 * instead of an Uzbekistan-only number or an email address. Email is never
 * required anywhere in the product.
 */
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  phoneE164: string; // normalized international number, e.g. "+998901234567"
  countryIso2: string; // lowercase ISO 3166-1 alpha-2, e.g. "uz", "de", "us"
  passwordHash: string; // SHA-256 hex digest - see hashPassword() note below
  email?: string; // optional, may be added later by the user
  avatar?: string;
  createdAt: string; // ISO registration timestamp
}

export interface CustomerDirectoryEntry {
  id: string;
  name: string;
  phone: string; // E.164, e.g. "+998901234567"
  countryIso2: string;
  memberSince: string; // ISO registration timestamp
  totalBookings: number;
  totalSpent: number;
  status: 'active' | 'inactive';
}

const USERS_KEY = 'travel_caravan_users_v1';
const SESSION_KEY = 'travel_caravan_session_v1';
const OTP_KEY_PREFIX = 'travel_caravan_otp_v1:';

// ---------------------------------------------------------------------------
// Seed accounts - match the international demo bookings already present in
// store.ts (Germany, Russia, Uzbekistan, Italy) so the Admin "Mijozlar"
// (Customers) directory isn't empty on first load.
// Demo password for every seed account: "Demo1234!"
// (SHA-256 hex digest, see hashPassword()).
// ---------------------------------------------------------------------------
const SEED_PASSWORD_HASH = '7dbb7f051b44d7d54584a7bc6c32f00da5a3b5e6973485b9fb176fe56346b3e3';

export const initialUsers: AppUser[] = [
  {
    id: 'user-seed-becker',
    firstName: 'Alexander',
    lastName: 'Becker',
    phoneE164: '+491708293144',
    countryIso2: 'de',
    passwordHash: SEED_PASSWORD_HASH,
    createdAt: '2026-08-02T10:00:00.000Z'
  },
  {
    id: 'user-seed-smirnova',
    firstName: 'Elena',
    lastName: 'Smirnova',
    phoneE164: '+79164502211',
    countryIso2: 'ru',
    passwordHash: SEED_PASSWORD_HASH,
    createdAt: '2026-08-10T09:00:00.000Z'
  },
  {
    id: 'user-seed-yusupov',
    firstName: 'Akmal',
    lastName: 'Yusupov',
    phoneE164: '+998901234567',
    countryIso2: 'uz',
    passwordHash: SEED_PASSWORD_HASH,
    createdAt: '2026-07-28T09:00:00.000Z'
  },
  {
    id: 'user-seed-rossi',
    firstName: 'Marco',
    lastName: 'Rossi',
    phoneE164: '+393471234567',
    countryIso2: 'it',
    passwordHash: SEED_PASSWORD_HASH,
    createdAt: '2026-08-20T09:00:00.000Z'
  }
];

// ---------------------------------------------------------------------------
// Storage helpers (mirrors the pattern used in store.ts)
// ---------------------------------------------------------------------------
export const getUsers = (): AppUser[] => {
  if (typeof window === 'undefined') return initialUsers;
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load users from localStorage', err);
    return initialUsers;
  }
};

const saveUsers = (users: AppUser[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyStoreChange();
};

const setSession = (userId: string | null) => {
  if (typeof window === 'undefined') return;
  if (userId) window.localStorage.setItem(SESSION_KEY, userId);
  else window.localStorage.removeItem(SESSION_KEY);
  notifyStoreChange();
};

export const getCurrentUser = (): AppUser | null => {
  if (typeof window === 'undefined') return null;
  const userId = window.localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  return getUsers().find((u) => u.id === userId) || null;
};

export const isLoggedIn = (): boolean => getCurrentUser() !== null;

export const logout = () => setSession(null);

// Re-export so components only need one import when they already use auth.ts
export { subscribeStoreChange };

// ---------------------------------------------------------------------------
// International phone number normalization & validation
// (uses libphonenumber-js so every supported country is validated against
// its real national format, not just Uzbekistan).
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw phone number (digits only, no leading "+", as returned by
 * react-phone-input-2) plus its selected country into a canonical E.164
 * string, e.g. ("998901234567", "uz") -> "+998901234567".
 * Returns null if the number is not a valid number for that country, so
 * "+998901234567" and "+998 90 123 45 67" always resolve to the exact same
 * value and can never create duplicate accounts.
 */
export const normalizePhone = (rawValue: string, countryIso2: string): string | null => {
  if (!rawValue) return null;
  const withPlus = rawValue.startsWith('+') ? rawValue : `+${rawValue}`;
  try {
    const parsed = parsePhoneNumberFromString(withPlus, countryIso2.toUpperCase() as CountryCode);
    if (!parsed || !parsed.isValid()) return null;
    return parsed.number; // E.164, e.g. +998901234567
  } catch {
    return null;
  }
};

export const isPhoneTaken = (phoneE164: string, excludeUserId?: string): boolean => {
  return getUsers().some((u) => u.phoneE164 === phoneE164 && u.id !== excludeUserId);
};

export const findUserByPhone = (phoneE164: string): AppUser | null => {
  return getUsers().find((u) => u.phoneE164 === phoneE164) || null;
};

/**
 * Converts a 2-letter ISO country code into its flag emoji using the
 * regional-indicator-symbol trick (no extra flag asset dependency needed).
 */
export const isoToFlagEmoji = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '🌍';
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
};

/**
 * Human readable country name via the built-in Intl API - avoids shipping
 * another country-name dataset. Falls back to the raw code if the runtime
 * doesn't have data for the requested locale.
 */
export const getCountryName = (iso2: string, locale: string = 'en'): string => {
  if (!iso2) return '';
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(iso2.toUpperCase()) || iso2.toUpperCase();
  } catch {
    return iso2.toUpperCase();
  }
};

// ---------------------------------------------------------------------------
// Password hashing
// NOTE: This is a client-only demo with no real backend, so there is no
// server to safely hash/store credentials. SHA-256 here is only meant to
// avoid keeping raw passwords in localStorage as plain text - it is NOT a
// substitute for a real server-side auth system (bcrypt/argon2 + backend).
// ---------------------------------------------------------------------------
export const hashPassword = async (password: string): Promise<string> => {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// ---------------------------------------------------------------------------
// OTP - simulated SMS verification.
// There is no real SMS gateway wired up in this demo project, so the "sent"
// code is surfaced back to the caller, which shows it in a toast labeled as
// a demo code. Swapping in a real provider (Twilio/Vonage/etc.) later only
// means replacing sendOtp()'s internals - the rest of the flow is unchanged.
// ---------------------------------------------------------------------------
interface PendingOtp {
  code: string;
  expiresAt: number;
}

export const OTP_TTL_SECONDS = 59;

export const sendOtp = (phoneE164: string): string => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const payload: PendingOtp = { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 };
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(OTP_KEY_PREFIX + phoneE164, JSON.stringify(payload));
  }
  return code;
};

export const verifyOtp = (phoneE164: string, code: string): boolean => {
  if (typeof window === 'undefined') return false;
  const raw = window.sessionStorage.getItem(OTP_KEY_PREFIX + phoneE164);
  if (!raw) return false;
  try {
    const payload: PendingOtp = JSON.parse(raw);
    if (Date.now() > payload.expiresAt) return false;
    return payload.code === code.trim();
  } catch {
    return false;
  }
};

export const clearOtp = (phoneE164: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(OTP_KEY_PREFIX + phoneE164);
};

// ---------------------------------------------------------------------------
// Register / Login / Profile update
// ---------------------------------------------------------------------------
export const registerUser = async (input: {
  firstName: string;
  lastName: string;
  phoneE164: string;
  countryIso2: string;
  password: string;
}): Promise<AppUser> => {
  const passwordHash = await hashPassword(input.password);
  const user: AppUser = {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phoneE164: input.phoneE164,
    countryIso2: input.countryIso2.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString()
  };
  const users = getUsers();
  saveUsers([user, ...users]);
  setSession(user.id);
  return user;
};

export const loginUser = async (phoneE164: string, password: string): Promise<AppUser | null> => {
  const user = findUserByPhone(phoneE164);
  if (!user) return null;
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return null;
  setSession(user.id);
  return user;
};

/**
 * "Forgot password" flow - resets the account's password directly once the
 * owner's phone number is confirmed to exist. No SMS/OTP step is involved.
 */
export const resetPassword = async (phoneE164: string, newPassword: string): Promise<AppUser | null> => {
  const users = getUsers();
  const target = users.find((u) => u.phoneE164 === phoneE164);
  if (!target) return null;

  const passwordHash = await hashPassword(newPassword);
  let updated: AppUser | null = null;
  const next = users.map((u) => {
    if (u.id === target.id) {
      updated = { ...u, passwordHash };
      return updated;
    }
    return u;
  });
  saveUsers(next);
  return updated;
};

/**
 * Updates the logged-in user's phone number after a fresh OTP verification.
 * The previous number is fully replaced - it never remains attached to the
 * account, and no duplicate account is created.
 */
export const updateUserPhone = (
  userId: string,
  newPhoneE164: string,
  newCountryIso2: string
): AppUser | null => {
  const users = getUsers();
  let updated: AppUser | null = null;
  const next = users.map((u) => {
    if (u.id === userId) {
      updated = { ...u, phoneE164: newPhoneE164, countryIso2: newCountryIso2.toLowerCase() };
      return updated;
    }
    return u;
  });
  saveUsers(next);
  notifyStoreChange();
  return updated;
};

// ---------------------------------------------------------------------------
// Admin "Mijozlar" (Customers) directory - built from real registered
// accounts (Country + Registration Date only exist for real accounts) and
// enriched with each customer's non-archived booking history.
// ---------------------------------------------------------------------------
export const getCustomerDirectory = (): CustomerDirectoryEntry[] => {
  const users = getUsers();
  const bookings = getBookings().filter((b) => !b.archived);

  return users
    .map((u) => {
      const ownBookings = bookings.filter(
        (b) => b.userId === u.id || b.customerPhone.replace(/[^\d+]/g, '') === u.phoneE164
      );
      const totalSpent = ownBookings
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        phone: u.phoneE164,
        countryIso2: u.countryIso2,
        memberSince: u.createdAt,
        totalBookings: ownBookings.length,
        totalSpent,
        status: ownBookings.length > 0 ? 'active' : 'inactive'
      } as CustomerDirectoryEntry;
    })
    .sort((a, b) => new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime());
};
