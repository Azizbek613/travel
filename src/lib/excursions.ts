import { notifyStoreChange, subscribeStoreChange } from './store';

/**
 * "Buxoro bo'ylab ekskursiyalar" (Excursions around Bukhara).
 * A self-contained catalog separate from the multi-city Tours package
 * (src/lib/store.ts -> Tour) - excursions are shorter, guided, Bukhara-only
 * experiences with no price, fully managed from the Admin panel.
 */
export interface Excursion {
  id: string;
  title: string;
  location: string;
  image: string; // main/cover photo
  gallery: string[]; // additional photos
  shortDescription: string;
  duration: string; // free text, e.g. "3 soat", "Yarim kun"
  placesVisited: string[];
  guideService: boolean; // is a guide included
  guideLanguages: string[]; // languages the guide speaks
  transportType: string; // e.g. "Piyoda", "Mikroavtobus"
  maxPeople: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type ExcursionBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ExcursionBooking {
  id: string;
  excursionId: string;
  excursionTitle: string;
  excursionImage: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  countryCode: string;
  date: string; // YYYY-MM-DD
  people: number;
  notes?: string;
  status: ExcursionBookingStatus;
  createdAt: string;
}

const EXCURSIONS_KEY = 'travel_caravan_excursions_v1';
const EXCURSION_BOOKINGS_KEY = 'travel_caravan_excursion_bookings_v1';

// A Bukhara photo already verified to load correctly elsewhere in this
// project (used by the "tour-bukhara" package), reused here for accuracy.
const BUKHARA_COVER = 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=80';
const BUKHARA_GALLERY_1 = 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80';
const BUKHARA_GALLERY_2 = 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80';

export const initialExcursions: Excursion[] = [
  {
    id: 'excursion-old-city-walk',
    title: 'Buxoro Eski Shahri Bo‘ylab Piyoda Ekskursiya',
    location: 'Buxoro, Eski Shahar',
    image: BUKHARA_COVER,
    gallery: [BUKHARA_COVER, BUKHARA_GALLERY_1, BUKHARA_GALLERY_2],
    shortDescription: 'Buxoroning tarixiy markazidagi eng mashhur yodgorliklar bo‘ylab tajribali gid hamrohligida sokin sayr.',
    duration: '3 soat',
    placesVisited: ['Lyabi-Hovuz ansambli', 'Kalon minorasi va masjidi', 'Ark qal’asi', 'Bolo-Hovuz masjidi'],
    guideService: true,
    guideLanguages: ['O‘zbek', 'Rus', 'Ingliz'],
    transportType: 'Piyoda',
    maxPeople: 15,
    status: 'active',
    createdAt: '2026-08-05T09:00:00.000Z'
  },
  {
    id: 'excursion-sufi-heritage',
    title: 'Naqshband Ziyorati va Ma’naviy Meros Ekskursiyasi',
    location: 'Buxoro Viloyati',
    image: BUKHARA_GALLERY_2,
    gallery: [BUKHARA_GALLERY_2, BUKHARA_COVER],
    shortDescription: 'Bahouddin Naqshband majmuasi va atrofdagi qadimiy ziyoratgohlarga tinch va ma’rifiy sayohat.',
    duration: 'Yarim kun (4 soat)',
    placesVisited: ['Bahouddin Naqshband majmuasi', 'Chor-Bakr nekropoli'],
    guideService: true,
    guideLanguages: ['O‘zbek', 'Rus'],
    transportType: 'Mikroavtobus',
    maxPeople: 12,
    status: 'active',
    createdAt: '2026-08-12T09:00:00.000Z'
  },
  {
    id: 'excursion-craft-workshops',
    title: 'Hunarmandchilik Ustaxonalari Ekskursiyasi',
    location: 'Buxoro, Toqi Sarrofon atrofi',
    image: BUKHARA_GALLERY_1,
    gallery: [BUKHARA_GALLERY_1, BUKHARA_COVER, BUKHARA_GALLERY_2],
    shortDescription: 'Mahalliy hunarmandlarning gilam to‘qish, mis quyish va miniatyura san’ati ustaxonalariga tashrif.',
    duration: '2 soat',
    placesVisited: ['Toqi Sarrofon', 'Toqi Telpak Furushon', 'Mahalliy hunarmandchilik ustaxonalari'],
    guideService: true,
    guideLanguages: ['O‘zbek', 'Ingliz'],
    transportType: 'Piyoda',
    maxPeople: 10,
    status: 'active',
    createdAt: '2026-08-18T09:00:00.000Z'
  }
];

// ---------------------------------------------------------------------------
// Excursion catalog CRUD
// ---------------------------------------------------------------------------
export const getExcursions = (): Excursion[] => {
  if (typeof window === 'undefined') return initialExcursions;
  try {
    const raw = window.localStorage.getItem(EXCURSIONS_KEY);
    if (!raw) {
      window.localStorage.setItem(EXCURSIONS_KEY, JSON.stringify(initialExcursions));
      return initialExcursions;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load excursions from localStorage', err);
    return initialExcursions;
  }
};

export const saveExcursions = (excursions: Excursion[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXCURSIONS_KEY, JSON.stringify(excursions));
  notifyStoreChange();
};

/** Only "active" excursions are ever shown on the public site. */
export const getActiveExcursions = (): Excursion[] =>
  getExcursions().filter((e) => e.status === 'active');

export const addExcursion = (excursion: Excursion) => {
  const excursions = getExcursions();
  saveExcursions([excursion, ...excursions]);
};

export const updateExcursion = (updated: Excursion) => {
  const excursions = getExcursions();
  saveExcursions(excursions.map((e) => (e.id === updated.id ? updated : e)));
};

export const deleteExcursion = (id: string) => {
  const excursions = getExcursions();
  saveExcursions(excursions.filter((e) => e.id !== id));
};

/** Quick 🔴 active/inactive toggle from the admin excursion card. */
export const toggleExcursionStatus = (id: string) => {
  const excursions = getExcursions();
  saveExcursions(
    excursions.map((e) =>
      e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e
    )
  );
};

export { subscribeStoreChange };

// ---------------------------------------------------------------------------
// Excursion bookings - kept separate from vehicle rental Bookings since an
// excursion has no pickup/drop-off, price or rental days. Booking one still
// requires a logged-in account (see AuthModal / getCurrentUser()).
// ---------------------------------------------------------------------------
export const getExcursionBookings = (): ExcursionBooking[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EXCURSION_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load excursion bookings from localStorage', err);
    return [];
  }
};

const saveExcursionBookings = (bookings: ExcursionBooking[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXCURSION_BOOKINGS_KEY, JSON.stringify(bookings));
  notifyStoreChange();
};

export const createExcursionBooking = (
  input: Omit<ExcursionBooking, 'id' | 'status' | 'createdAt'>
): ExcursionBooking => {
  const booking: ExcursionBooking = {
    ...input,
    id: `EX-${Date.now().toString().slice(-8)}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const bookings = getExcursionBookings();
  saveExcursionBookings([booking, ...bookings]);
  return booking;
};

/** Admin (or the customer, for pending ones) changes an excursion booking's status. */
export const updateExcursionBookingStatus = (id: string, status: ExcursionBookingStatus) => {
  saveExcursionBookings(
    getExcursionBookings().map((b) => (b.id === id ? { ...b, status } : b))
  );
};

/** Deleting removes it everywhere - admin list and the customer's profile. */
export const deleteExcursionBooking = (id: string) => {
  saveExcursionBookings(getExcursionBookings().filter((b) => b.id !== id));
};

export const getExcursionBookingsForUser = (userId: string): ExcursionBooking[] =>
  getExcursionBookings().filter((b) => b.userId === userId);
