import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MyBookingsModal } from '../components/MyBookingsModal';
import {
  createBooking, saveBookings, initialBookings, updateBookingStatus, archiveBooking, deleteBooking
} from '../lib/store';
import { loginUser, logout } from '../lib/auth';

const seedForYusupov = () =>
  createBooking({
    carId: 'car-1', carName: 'Chevrolet Gentra', carImage: '',
    userId: 'user-seed-yusupov', countryCode: 'uz',
    customerName: 'Akmal Yusupov', customerPhone: '+998901234567', customerEmail: '',
    startDate: '2027-05-01', endDate: '2027-05-03', startTime: '10:00', passengers: 2,
    pickupLocation: 'A', dropoffLocation: 'B', days: 2, dailyRate: 50, totalPrice: 100
  });

describe('MyBookingsModal (customer profile)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveBookings([...initialBookings]);
    logout();
  });

  it('asks a logged-out visitor to log in and shows no bookings', () => {
    render(<MyBookingsModal lang="en" onClose={() => {}} />);
    expect(screen.getByText(/Log in to make a booking/i)).toBeInTheDocument();
    expect(screen.queryByText('TC-84920')).not.toBeInTheDocument();
  });

  it('shows only the logged-in customer\'s bookings and reacts to admin changes live', async () => {
    await loginUser('+998901234567', 'Demo1234!');
    const mine = seedForYusupov();
    render(<MyBookingsModal lang="en" onClose={() => {}} />);

    expect(screen.getByText(mine.id)).toBeInTheDocument();
    // somebody else's booking (Alexander Becker) is not visible
    expect(screen.queryByText('TC-84920')).not.toBeInTheDocument();

    // admin cancels -> stays visible, marked cancelled
    act(() => { updateBookingStatus(mine.id, 'cancelled'); });
    expect(screen.getByText(mine.id)).toBeInTheDocument();
    expect(screen.getAllByText(/cancel/i).length).toBeGreaterThan(0);

    // admin deletes (archive) -> disappears from the profile
    act(() => { archiveBooking(mine.id); });
    expect(screen.queryByText(mine.id)).not.toBeInTheDocument();
  });

  it('permanently deleted bookings disappear too', async () => {
    await loginUser('+998901234567', 'Demo1234!');
    const mine = seedForYusupov();
    render(<MyBookingsModal lang="en" onClose={() => {}} />);
    expect(screen.getByText(mine.id)).toBeInTheDocument();
    act(() => { deleteBooking(mine.id); });
    expect(screen.queryByText(mine.id)).not.toBeInTheDocument();
  });
});
