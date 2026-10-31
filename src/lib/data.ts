export interface Car {
  id: string;
  name: string;
  type: 'start' | 'comfort' | 'business';
  price: number;
  image: string;
  seats: number;
  transmission: string;
  fuel: string;
  year: number;
}

export const cars: Car[] = [
  {
    id: '1',
    name: 'Damas',
    type: 'start',
    price: 25,
    image: '',
    seats: 7,
    transmission: 'Manual',
    fuel: 'Petrol',
    year: 2022,
  },
  {
    id: '2',
    name: 'Chevrolet Cobalt',
    type: 'start',
    price: 35,
    image: '',
    seats: 5,
    transmission: 'Manual',
    fuel: 'Petrol',
    year: 2023,
  },
  {
    id: '3',
    name: 'Chevrolet Malibu',
    type: 'comfort',
    price: 60,
    image: '',
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
  },
  {
    id: '4',
    name: 'Hyundai Sonata',
    type: 'comfort',
    price: 70,
    image: '',
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
  },
  {
    id: '5',
    name: 'Kia Carnival',
    type: 'comfort',
    price: 110,
    image: '',
    seats: 8,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
  },
  {
    id: '6',
    name: 'Toyota Land Cruiser Prado',
    type: 'business',
    price: 120,
    image: '',
    seats: 7,
    transmission: 'Automatic',
    fuel: 'Diesel',
    year: 2023,
  },
  {
    id: '7',
    name: 'Chevrolet Tahoe',
    type: 'business',
    price: 150,
    image: '',
    seats: 7,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
  },
  {
    id: '8',
    name: 'Mercedes-Benz V-Class',
    type: 'business',
    price: 180,
    image: '',
    seats: 7,
    transmission: 'Automatic',
    fuel: 'Diesel',
    year: 2024,
  },
];

export interface Review {
  id: string;
  name: string;
  country: string;
  rating: number;
  text: {
    en: string;
    ru: string;
    it: string;
  };
  avatar: string;
}

export const reviews: Review[] = [
  {
    id: '1',
    name: 'Alexander K.',
    country: 'Germany',
    rating: 5,
    text: {
      en: 'Excellent service! The Toyota Prado was in perfect condition. The trip to Samarkand was unforgettable.',
      ru: 'Отличный сервис! Toyota Prado была в идеальном состоянии. Поездка в Самарканд стала лучшим опытом.',
      it: 'Servizio eccellente! La Toyota Prado era in condizioni perfette. Il viaggio a Samarcanda è stato indimenticabile.',
    },
    avatar: '',
  },
  {
    id: '2',
    name: 'Maria S.',
    country: 'Russia',
    rating: 5,
    text: {
      en: 'Quick and easy booking. The driver was very professional. Highly recommended!',
      ru: 'Быстрое и удобное бронирование. Водитель был очень профессионален. Рекомендую!',
      it: "Prenotazione rapida e semplice. L'autista è stato molto professionale. Altamente consigliato!",
    },
    avatar: '',
  },
  {
    id: '3',
    name: 'John W.',
    country: 'USA',
    rating: 4,
    text: {
      en: 'Affordable prices, clean and new vehicles. Will definitely use again on my next trip.',
      ru: 'Доступные цены, чистые и новые автомобили. Обязательно обращусь снова.',
      it: 'Prezzi accessibili, veicoli puliti e nuovi. Li userò sicuramente di nuovo nel mio prossimo viaggio.',
    },
    avatar: '',
  },
  {
    id: '4',
    name: 'Yuki T.',
    country: 'Japan',
    rating: 5,
    text: {
      en: 'Rented a minivan for Bukhara and Khiva. The whole family was happy!',
      ru: 'Арендовали минивэн для поездки в Бухару и Хиву. Вся семья осталась довольна!',
      it: 'Abbiamo noleggiato un minivan per Bukhara e Khiva. Tutta la famiglia è stata felice!',
    },
    avatar: '',
  },
];

// ---- User-submitted reviews ----
// Stored in the visitor's browser (localStorage) so the demo works without a
// backend. NOTE: this means a review is visible to everyone browsing on that
// SAME device/browser, but not yet synced across different visitors' devices.
// To make reviews visible to every visitor everywhere, this app needs to be
// connected to a real backend/database (e.g. Supabase) to store reviews
// centrally instead of in localStorage.
export interface UserReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const USER_REVIEWS_KEY = 'travelCaravan_userReviews';
const USER_REVIEWS_CLEANUP_KEY = 'travelCaravan_testReviewsCleaned';

// Remove old local-only test submissions once. The four published reviews above
// are untouched, and reviews submitted after this cleanup continue to be saved.
if (typeof window !== 'undefined' && !window.localStorage.getItem(USER_REVIEWS_CLEANUP_KEY)) {
  window.localStorage.removeItem(USER_REVIEWS_KEY);
  window.localStorage.setItem(USER_REVIEWS_CLEANUP_KEY, '1');
}

export const getUserReviews = (): UserReview[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_REVIEWS_KEY);
    return raw ? (JSON.parse(raw) as UserReview[]) : [];
  } catch {
    return [];
  }
};

export const addUserReview = (review: { name: string; rating: number; comment: string }): UserReview => {
  const newReview: UserReview = {
    id: `user-${Date.now()}`,
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date().toISOString(),
  };
  const updated = [newReview, ...getUserReviews()];
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USER_REVIEWS_KEY, JSON.stringify(updated));
  }
  return newReview;
};
