import { describe, it, expect } from 'vitest';
import { findConflict, calculateRentalDays, localDateString, getCustomersSummary, Booking } from '../lib/store';

const busy = [{ carId: 'car-6', startDate: '2026-09-20', endDate: '2026-09-23' }];

describe('Travel Caravan - date helpers & conflict detection', () => {
  it('calculates rental duration correctly', () => {
    expect(calculateRentalDays('2026-09-20', '2026-09-23')).toBe(3);
    expect(calculateRentalDays('2026-09-20', '2026-09-21')).toBe(1);
    expect(calculateRentalDays('2026-09-20', '2026-09-20')).toBe(1);
  });

  it('detects overlapping dates on the same vehicle', () => {
    expect(findConflict(busy, 'car-6', '2026-09-21', '2026-09-24')).toBeDefined();
    expect(findConflict(busy, 'car-6', '2026-09-23', '2026-09-25')).toBeDefined(); // shares the last day
  });

  it('allows non-overlapping dates and other vehicles', () => {
    expect(findConflict(busy, 'car-6', '2026-10-01', '2026-10-05')).toBeUndefined();
    expect(findConflict(busy, 'car-1', '2026-09-21', '2026-09-22')).toBeUndefined();
  });

  it('formats local dates as YYYY-MM-DD', () => {
    expect(localDateString(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(localDateString(1) > localDateString(0)).toBe(true);
  });

  it('summarises customers from a list of bookings', () => {
    const base = {
      carId: 'car-1', carName: 'X', carImage: '', customerEmail: '', startDate: '2026-10-01', endDate: '2026-10-02',
      startTime: '10:00', passengers: 2, pickupLocation: 'A', dropoffLocation: 'B', days: 1, dailyRate: 0, totalPrice: 0,
      status: 'pending' as const, createdAt: '2026-09-01T00:00:00.000Z'
    };
    const list: Booking[] = [
      { ...base, id: 'TC-1', customerName: 'Ali', customerPhone: '+998901112233' },
      { ...base, id: 'TC-2', customerName: 'Ali', customerPhone: '+998901112233' }
    ];
    const customers = getCustomersSummary(list);
    expect(customers).toHaveLength(1);
    expect(customers[0].totalBookings).toBe(2);
  });
});
