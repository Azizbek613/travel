import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBooking, getBookings, saveBookings, initialBookings, updateBookingStatus,
  archiveBooking, restoreBooking, deleteBooking, checkVehicleAvailability,
  getBookingsForCustomer, subscribeStoreChange, Booking
} from '../lib/store';
import {
  createExcursionBooking, getExcursionBookings, getExcursionBookingsForUser,
  updateExcursionBookingStatus, deleteExcursionBooking, getActiveExcursions,
  toggleExcursionStatus, getExcursions
} from '../lib/excursions';
import { getCustomerDirectory, getUsers, normalizePhone, isPhoneTaken, registerUser, loginUser, resetPassword } from '../lib/auth';

const makeBooking = (over: Partial<Omit<Booking, 'id' | 'createdAt' | 'status'>> = {}) =>
  createBooking({
    carId: 'car-1',
    carName: 'Chevrolet Gentra',
    carImage: '',
    userId: 'user-A',
    countryCode: 'de',
    customerName: 'Anna Test',
    customerPhone: '+491701112233',
    customerEmail: '',
    startDate: '2027-01-10',
    endDate: '2027-01-12',
    startTime: '10:00',
    passengers: 2,
    pickupType: 'Hotel',
    pickupLocation: 'Lyabi House',
    dropoffType: 'Airport',
    dropoffLocation: 'Bukhara Airport',
    days: 2,
    dailyRate: 100,
    totalPrice: 200,
    ...over
  });

describe('Customer profile <-> Admin panel booking lifecycle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveBookings([...initialBookings]);
  });

  it('a new booking shows up in the admin list and in the owner\'s profile only', () => {
    const b = makeBooking();
    expect(getBookings().some((x) => x.id === b.id)).toBe(true);
    expect(getBookingsForCustomer('user-A', '+491701112233').some((x) => x.id === b.id)).toBe(true);
    // another customer never sees it
    expect(getBookingsForCustomer('user-B', '+79990000000').some((x) => x.id === b.id)).toBe(false);
  });

  it('admin cancelling keeps it visible in the customer profile as "cancelled"', () => {
    const b = makeBooking();
    updateBookingStatus(b.id, 'cancelled');
    const mine = getBookingsForCustomer('user-A', '+491701112233').find((x) => x.id === b.id);
    expect(mine).toBeDefined();
    expect(mine?.status).toBe('cancelled');
  });

  it('admin deleting (archive) removes it from the customer profile; restoring brings it back', () => {
    const b = makeBooking();
    archiveBooking(b.id);
    expect(getBookingsForCustomer('user-A', '+491701112233').some((x) => x.id === b.id)).toBe(false);
    restoreBooking(b.id);
    expect(getBookingsForCustomer('user-A', '+491701112233').some((x) => x.id === b.id)).toBe(true);
  });

  it('permanent delete removes it from everywhere', () => {
    const b = makeBooking();
    archiveBooking(b.id);
    deleteBooking(b.id);
    expect(getBookings().some((x) => x.id === b.id)).toBe(false);
    expect(getBookingsForCustomer('user-A', '+491701112233').some((x) => x.id === b.id)).toBe(false);
  });

  it('legacy bookings without userId are matched by phone number', () => {
    const b = makeBooking({ userId: undefined, customerPhone: '+49 170 111 22 33' });
    expect(getBookingsForCustomer('user-Z', '+491701112233').some((x) => x.id === b.id)).toBe(true);
  });

  it('archived and cancelled bookings no longer block the vehicle', () => {
    const b = makeBooking({ carId: 'car-9', startDate: '2027-03-01', endDate: '2027-03-05' });
    expect(checkVehicleAvailability('car-9', '2027-03-02', '2027-03-03').available).toBe(false);
    updateBookingStatus(b.id, 'cancelled');
    expect(checkVehicleAvailability('car-9', '2027-03-02', '2027-03-03').available).toBe(true);
    updateBookingStatus(b.id, 'pending');
    expect(checkVehicleAvailability('car-9', '2027-03-02', '2027-03-03').available).toBe(false);
    archiveBooking(b.id);
    expect(checkVehicleAvailability('car-9', '2027-03-02', '2027-03-03').available).toBe(true);
  });

  it('archived bookings are excluded from customer statistics', () => {
    const before = getCustomerDirectory().find((c) => c.id === 'user-seed-becker');
    expect(before?.totalBookings).toBeGreaterThan(0);
    archiveBooking('TC-84920');
    const after = getCustomerDirectory().find((c) => c.id === 'user-seed-becker');
    expect(after?.totalBookings).toBe((before?.totalBookings || 0) - 1);
    restoreBooking('TC-84920');
    const restored = getCustomerDirectory().find((c) => c.id === 'user-seed-becker');
    expect(restored?.totalBookings).toBe(before?.totalBookings);
  });

  it('notifies subscribers when data changes (live refresh)', () => {
    let calls = 0;
    const unsub = subscribeStoreChange(() => { calls += 1; });
    const b = makeBooking();
    updateBookingStatus(b.id, 'confirmed');
    archiveBooking(b.id);
    unsub();
    expect(calls).toBeGreaterThanOrEqual(3);
  });
});

describe('Excursion bookings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const book = (userId = 'user-A') =>
    createExcursionBooking({
      excursionId: 'excursion-old-city-walk',
      excursionTitle: 'Old city walk',
      excursionImage: '',
      userId,
      customerName: 'Anna Test',
      customerPhone: '+491701112233',
      countryCode: 'de',
      date: '2027-02-01',
      people: 2
    });

  it('is visible to admin and to its owner only', () => {
    const eb = book();
    expect(getExcursionBookings().some((x) => x.id === eb.id)).toBe(true);
    expect(getExcursionBookingsForUser('user-A').some((x) => x.id === eb.id)).toBe(true);
    expect(getExcursionBookingsForUser('user-B').length).toBe(0);
  });

  it('admin confirm / cancel is reflected for the customer; delete removes it', () => {
    const eb = book();
    updateExcursionBookingStatus(eb.id, 'confirmed');
    expect(getExcursionBookingsForUser('user-A')[0].status).toBe('confirmed');
    updateExcursionBookingStatus(eb.id, 'cancelled');
    expect(getExcursionBookingsForUser('user-A')[0].status).toBe('cancelled');
    deleteExcursionBooking(eb.id);
    expect(getExcursionBookingsForUser('user-A').length).toBe(0);
    expect(getExcursionBookings().length).toBe(0);
  });

  it('inactive excursions are hidden from the public site', () => {
    const total = getExcursions().length;
    expect(getActiveExcursions().length).toBe(total);
    toggleExcursionStatus('excursion-old-city-walk');
    expect(getActiveExcursions().length).toBe(total - 1);
  });
});

describe('Phone authentication', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('treats differently formatted numbers as the same phone (no duplicates)', () => {
    expect(normalizePhone('998901234567', 'uz')).toBe('+998901234567');
    expect(normalizePhone('+998 90 123 45 67', 'uz')).toBe('+998901234567');
    expect(isPhoneTaken('+998901234567')).toBe(true); // seeded demo account
  });

  it('rejects invalid numbers for the selected country', () => {
    expect(normalizePhone('12', 'de')).toBeNull();
    expect(normalizePhone('', 'uz')).toBeNull();
  });

  it('registers without SMS, logs in, and resets a forgotten password without SMS', async () => {
    const phone = normalizePhone('4915112345678', 'de') as string;
    expect(phone).toBeTruthy();
    await registerUser({ firstName: 'Max', lastName: 'Muster', phoneE164: phone, countryIso2: 'de', password: 'secret1' });
    expect(getUsers().some((u) => u.phoneE164 === phone)).toBe(true);

    expect(await loginUser(phone, 'wrong')).toBeNull();
    expect(await loginUser(phone, 'secret1')).not.toBeNull();

    expect(await resetPassword(phone, 'newsecret2')).not.toBeNull();
    expect(await loginUser(phone, 'secret1')).toBeNull();
    expect(await loginUser(phone, 'newsecret2')).not.toBeNull();
    expect(await resetPassword('+10000000000', 'x')).toBeNull();
  });
});
