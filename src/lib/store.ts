export interface Car {
  id: string;
  name: string;
  type: 'sedan' | 'comfort' | 'business' | 'minivan' | 'bus';
  price: number;
  images: string[];
  seats: string | number;
  transmission: 'Automatic' | 'Manual';
  fuel: 'Petrol' | 'Diesel' | 'Hybrid';
  year: number;
  rating: number;
  status: 'available' | 'reserved' | 'unavailable' | 'maintenance';
  features: {
    ru: string[];
    en: string[];
  };
  description: {
    ru: string;
    en: string;
  };
}

// Category of a pickup/drop-off point. Stored as a stable, human-readable
// label (not translated) so admin/reporting data stays consistent
// regardless of which language the customer booked in.
export type LocationType = 'Hotel' | 'Train Station' | 'Airport' | 'Other Location';

export interface Booking {
  id: string;
  carId: string;
  carName: string;
  carImage: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  passengers: number;
  pickupType?: LocationType;
  pickupLocation: string;
  dropoffType?: LocationType;
  dropoffLocation: string;
  notes?: string;
  days: number;
  dailyRate: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  telegramNotified?: boolean; // set by the server once the manager was notified
}

export interface Tour {
  id: string;
  city: string;
  image: string;
  duration: { ru: string; en: string };
  price: number;
  transport: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  highlights: { ru: string[]; en: string[] };
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  memberSince: string;
}

// Initial Seed Cars with high quality imagery
export const initialCars: Car[] = [
  {
    id: 'car-1',
    name: 'Chevrolet Gentra',
    type: 'comfort',
    price: 35,
    images: [
      'https://i.postimg.cc/CxrFtMxb/images.jpg',
      'https://i.postimg.cc/NFQFtJqH/3.jpg',
      'https://i.postimg.cc/ZRpv4vWg/8.webp',
      'https://i.postimg.cc/PrxfM8th/7.webp',
      'https://i.postimg.cc/Qt4wNCvc/salon.webp'
    ],
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
    rating: 4.8,
    status: 'available',
    features: {
      ru: ['Кондиционер', 'Bluetooth Аудио', 'Вместительный багажник', 'Подушки безопасности', 'ABS'],
      en: ['Air Conditioning', 'Bluetooth Audio', 'Spacious Trunk', 'Airbags', 'ABS System']
    },
    description: {
      ru: 'Надёжный и экономичный седан для комфортных междугородних поездок.',
      en: 'Reliable and economical sedan ideal for comfortable intercity travels.'
    }
  },
  {
    id: 'car-2',
    name: 'Chevrolet Malibu 2',
    type: 'business',
    price: 60,
    images: [
      'https://i.postimg.cc/q7x3NybB/Malibu-2.jpg',
      'https://i.postimg.cc/2SpbT2gr/Malibu-2-back.jpg',
      'https://i.postimg.cc/Y9yjF3Qd/Malibu-2-side.jpg',
      'https://i.postimg.cc/sgRx51Zj/Malibu-2-salon-toward.jpg',
      'https://i.postimg.cc/sfhZWk0c/malibu-2-salon.jpg'
    ],
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
    rating: 4.9,
    status: 'available',
    features: {
      ru: ['Кожаный салон', 'Двухзонный климат-контроль', 'Круиз-контроль', 'Apple CarPlay / Android Auto', 'Премиум аудио'],
      en: ['Leather Interior', 'Dual-zone Climate Control', 'Cruise Control', 'Apple CarPlay / Android Auto', 'Premium Audio']
    },
    description: {
      ru: 'Седан бизнес-класса с высоким уровнем комфорта и динамики.',
      en: 'Premium business-class sedan delivering exceptional comfort and elegance.'
    }
  },
  {
    id: 'car-3',
    name: 'Kia K5',
    type: 'business',
    price: 65,
    images: [
      'https://i.postimg.cc/PJjfYRCk/main-3.jpg',
      'https://i.postimg.cc/pdfd0vzQ/6.jpg',
      'https://i.postimg.cc/YC1k7302/2.jpg',
      'https://i.postimg.cc/QdBmK41L/3.jpg',
      'https://i.postimg.cc/fRk2jTnk/4.jpg'
    ],
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
    rating: 4.9,
    status: 'available',
    features: {
      ru: ['Панорамная крыша', 'Вентиляция сидений', 'Акустика Harman Kardon', 'Камера 360°', 'Ассистенты водителя'],
      en: ['Panoramic Sunroof', 'Ventilated Seats', 'Harman Kardon Sound', '360° Camera', 'Driver Assist']
    },
    description: {
      ru: 'Футуристический дизайн, плавный ход и передовые технологии.',
      en: 'Futuristic design, serene driving dynamics, and cutting-edge technology.'
    }
  },
  {
    id: 'car-4',
    name: 'Mercedes Vito W447',
    type: 'minivan',
    price: 110,
    images: [
      'https://i.postimg.cc/sDPrfhhs/3.jpg',
      'https://i.postimg.cc/KYhxDhgs/7.webp',
      'https://i.postimg.cc/nzmWdy45/2.webp',
      'https://i.postimg.cc/d1tM5sQN/images4.jpg',
      'https://i.postimg.cc/GhTW7SR7/5.webp'
    ],
    seats: 9,
    transmission: 'Automatic',
    fuel: 'Diesel',
    year: 2025,
    rating: 5.0,
    status: 'available',
    features: {
      ru: ['VIP кожаные кресла', 'Раздельный климат задней зоны', 'USB-зарядки у каждого места', 'Огромный багажник', 'Wi-Fi роутер'],
      en: ['VIP Leather Captain Seats', 'Dedicated Rear Climate', 'Individual USB Ports', 'Massive Luggage Space', 'Wi-Fi Onboard']
    },
    description: {
      ru: 'Премиальный немецкий минивэн для комфортных групповых и семейных туров.',
      en: 'Luxury German minivan crafted for premier family and VIP delegations.'
    }
  },
  {
    id: 'car-5',
    name: 'Hyundai Staria VIP',
    type: 'minivan',
    price: 95,
    images: [
      'https://i.postimg.cc/yxkJ9Cwr/main.jpg',
      'https://i.postimg.cc/KYjymcLd/photo-1-2026-03-23-22-14-06.jpg',
      'https://i.postimg.cc/Y2Z0VZcr/photo-3-2026-03-23-22-14-06.jpg',
      'https://i.postimg.cc/7brx6vDq/photo-2-2026-03-23-22-14-06.jpg',
      'https://i.postimg.cc/T3X85qb9/1.jpg'
    ],
    seats: 9,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2024,
    rating: 4.9,
    status: 'available',
    features: {
      ru: ['Космический интерьер', 'Сиденья с режимом релаксации', 'Электропривод дверей', 'Панорамный обзор', 'Тихий салон'],
      en: ['Futuristic Interior', 'Relaxation Reclining Seats', 'Power Sliding Doors', 'Panoramic Windows', 'Quiet Cabin']
    },
    description: {
      ru: 'Панорамный комфорт для захватывающих пейзажей Узбекистана.',
      en: 'Panoramic comfort designed for admiring the historic landscapes of Uzbekistan.'
    }
  },
  {
    id: 'car-6',
    name: 'Toyota Hiace Luxury',
    type: 'minivan',
    price: 120,
    images: [
      'https://i.postimg.cc/xC9p9tWD/1.webp',
      'https://i.postimg.cc/ZK4zsxfw/photo-7-2026-03-23-22-13-22.jpg',
      'https://i.postimg.cc/pVQgjn2J/photo-8-2026-03-23-22-13-22.jpg',
      'https://i.postimg.cc/YSmPCvnY/photo-2-2026-03-23-22-13-22.jpg',
      'https://i.postimg.cc/qM36Q05p/photo-2026-03-25-11-58-19.jpg'
    ],
    seats: '10+1',
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2026,
    rating: 5.0,
    status: 'available',
    features: {
      ru: ['Индивидуальные мягкие кресла', 'Микрофон для гида', 'Высокий потолок', 'Мощный кондиционер', 'Продвинутая безопасность'],
      en: ['Individual Plush Seats', 'Tour Guide PA Microphone', 'High Ceiling', 'Dual Air Conditioning', 'Advanced Safety System']
    },
    description: {
      ru: 'Эталонный туристический микроавтобус для комфортных туров по городам.',
      en: 'The world benchmark tourist minibus offering top reliability and roominess.'
    }
  },
  {
    id: 'car-9',
    name: 'Asiastar Eurise VIP Coach',
    type: 'bus',
    price: 180,
    images: [
      'https://i.postimg.cc/PqrGffGQ/6.jpg',
      'https://i.postimg.cc/DzYN2qdP/4.jpg',
      'https://i.postimg.cc/TwzHbfsq/3.jpg',
      'https://i.postimg.cc/prkzHBKP/photo-2026-03-25-11-54-46.jpg',
      'https://i.postimg.cc/Nfz2kFDh/7.jpg'
    ],
    seats: '19+1',
    transmission: 'Manual',
    fuel: 'Diesel',
    year: 2025,
    rating: 5.0,
    status: 'available',
    features: {
      ru: ['19 анатомических кресел', 'Холодильник и ТВ-монитор', 'Вместительный багажный отсек', 'Климат-контроль', 'Плавный ход'],
      en: ['19 Anatomical Passenger Seats', 'Refrigerator & TV Display', 'Massive Luggage Compartment', 'Dual Climate System', 'Pneumatic Suspension']
    },
    description: {
      ru: 'Идеальный туристический автобус для больших групп по историческим городам.',
      en: 'Ideal luxury coach for large tour groups traveling along the Great Silk Road.'
    }
  }
];

// Initial Seed Tours across Uzbekistan
export const initialTours: Tour[] = [
  {
    id: 'tour-bukhara',
    city: 'Bukhara',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=80',
    duration: { ru: '2 дня / 1 ночь', en: '2 Days / 1 Night' },
    price: 180,
    transport: 'Mercedes Vito / Toyota Hiace',
    title: {
      ru: 'Священная Бухара — Жемчужина Востока',
      en: 'Sacred Bukhara — Jewel of the Silk Road'
    },
    description: {
      ru: 'Незабываемое путешествие по ансамблю Пои-Калян, крепости Арк, Ляби-Хаузу и старинным торговым куполам.',
      en: 'Unforgettable exploration of Kalyan Minaret, Ark Fortress, Lyabi-Khauz, and medieval trading domes.'
    },
    highlights: {
      ru: ['Крепость Арк', 'Комплекс Пои-Калян', 'Ляби-Хауз', 'Мавзолей Саманидов', 'Ситораи Мохи-Хоса'],
      en: ['Ark Fortress', 'Poi Kalyan Ensemble', 'Lyabi Khauz', 'Samanid Mausoleum', 'Sitorai Mokhi-Khosa Palace']
    }
  },
  {
    id: 'tour-samarkand',
    city: 'Samarkand',
    image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=80',
    duration: { ru: '2 дня / 1 ночь', en: '2 Days / 1 Night' },
    price: 210,
    transport: 'Kia K5 / Hyundai Staria',
    title: {
      ru: 'Лазурный Самарканд — Столица Темуридов',
      en: 'Azure Samarkand — Capital of the Timurids'
    },
    description: {
      ru: 'Ощутите величие площади Регистан, мавзолея Гур-Эмир, некрополя Шахи-Зинда и мечети Биби-Ханым.',
      en: 'Witness the majesty of Registan Square, Gur-e-Amir, the turquoise Shahi-Zinda necropolis, and Bibi-Khanym.'
    },
    highlights: {
      ru: ['Площадь Регистан', 'Гур-Эмир', 'Шахи-Зинда', 'Мечеть Биби-Ханым', 'Обсерватория Улугбека'],
      en: ['Registan Square', 'Gur-e-Amir', 'Shahi-Zinda Complex', 'Bibi-Khanym Mosque', 'Ulugbek Observatory']
    }
  },
  {
    id: 'tour-khiva',
    city: 'Khiva',
    image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
    duration: { ru: '3 дня / 2 ночи', en: '3 Days / 2 Nights' },
    price: 280,
    transport: 'Toyota Hiace / Vito VIP',
    title: {
      ru: 'Музей под открытым небом — Ичан-Кала',
      en: 'Open-Air Museum of the Desert — Ichan Kala'
    },
    description: {
      ru: 'Атмосфера сказок «Тысячи и одной ночи» в прекрасно сохранившемся древнем городе-крепости.',
      en: 'Immerse yourself into the fairytale Arabian Nights atmosphere within the fully intact fortress walls.'
    },
    highlights: {
      ru: ['Стены Ичан-Калы', 'Калта-Минор', 'Куня-Арк', 'Джума-мечеть (218 колонн)', 'Пахлаван Махмуд'],
      en: ['Ichan Kala Walls', 'Kalta Minor', 'Kunya Ark', 'Juma Mosque (218 columns)', 'Pakhlavan Mahmud']
    }
  },
  {
    id: 'tour-tashkent',
    city: 'Tashkent',
    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80',
    duration: { ru: '1 день', en: '1 Day Full Tour' },
    price: 120,
    transport: 'Chevrolet Malibu 2 / Camry',
    title: {
      ru: 'Ташкент — Гармония прошлого и будущего',
      en: 'Tashkent — Modern Metropolis & Ancient Soul'
    },
    description: {
      ru: 'Комплекс Хазрати Имам (Коран Усмана), колоритный базар Чорсу, станции метро и Tashkent City.',
      en: 'Hazrati Imam complex with ancient Quran, colorful Chorsu bazaar, historic metro art, and Tashkent City.'
    },
    highlights: {
      ru: ['Хазрати Имам', 'Базар Чорсу', 'Ташкентское метро', 'Телебашня', 'Парк Tashkent City'],
      en: ['Hazrati Imam', 'Chorsu Bazaar', 'Tashkent Metro Stations', 'TV Tower', 'Tashkent City Park']
    }
  },
  {
    id: 'tour-shakhrisabz',
    city: 'Shakhrisabz',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    duration: { ru: '1 день', en: '1 Day Excursion' },
    price: 140,
    transport: 'Tracker 2 / Malibu 2',
    title: {
      ru: 'Шахрисабз — Родина Амира Темура',
      en: 'Shakhrisabz — Birthplace of Amir Timur'
    },
    description: {
      ru: 'Величественный дворец Аксарай, комплекс Дорус-Сиядат и живописный горный перевал Тахтакарача.',
      en: 'The colossal ruins of Ak-Saray Palace, Dorus-Siyodat, and panoramic views of Takhtakaracha Pass.'
    },
    highlights: {
      ru: ['Дворец Аксарай', 'Дорус-Саодат', 'Мечеть Кок-Гумбаз', 'Горный перевал Тахтакарача'],
      en: ['Ak-Saray Palace ruins', 'Dorus-Saodat', 'Kok Gumbaz Mosque', 'Takhtakaracha Mountain Pass']
    }
  },
  {
    id: 'tour-fergana',
    city: 'Fergana Valley',
    image: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
    duration: { ru: '2 дня / 1 ночь', en: '2 Days / 1 Night' },
    price: 240,
    transport: 'Mercedes Vito / Hiace',
    title: {
      ru: 'Ферганская Долина — Край ремесленников',
      en: 'Fergana Valley — Cradle of Crafts & Silk'
    },
    description: {
      ru: 'Риштанская лазурная керамика, шелковая фабрика «Йодгорлик» в Маргилане и дворец Худояр-хана.',
      en: 'Famous Rishtan ceramics workshops, Margilan silk factory, and the splendid Palace of Khudayar Khan.'
    },
    highlights: {
      ru: ['Дворец Худояр-хана в Коканде', 'Керамика Риштана', 'Шелковая фабрика «Ёдгорлик» в Маргилане'],
      en: ['Khudayar Khan Palace (Kokand)', 'Rishtan Master Ceramicists', 'Margilan Silk Weaving Factory']
    }
  }
];

// LocalStorage Keys for temporary offline fallback
const CARS_STORAGE_KEY = 'travel_caravan_cars_v4';
const TOURS_STORAGE_KEY = 'travel_caravan_tours_v4';

import {
  apiFetchCars,
  apiCreateCar,
  apiUpdateCar,
  apiDeleteCar,
  apiFetchTours,
  apiCreateTour,
  apiUpdateTour,
  apiDeleteTour,
} from './api';

// In-memory state synchronized with the central database
let currentCars: Car[] = initialCars;
let currentTours: Tour[] = initialTours;

// Initialize from local cache if available for instant paint
if (typeof window !== 'undefined') {
  try {
    const cachedCars = window.localStorage.getItem(CARS_STORAGE_KEY);
    if (cachedCars) {
      const parsed = JSON.parse(cachedCars);
      if (Array.isArray(parsed) && parsed.length > 0) currentCars = parsed;
    }
    const cachedTours = window.localStorage.getItem(TOURS_STORAGE_KEY);
    if (cachedTours) {
      const parsed = JSON.parse(cachedTours);
      if (Array.isArray(parsed) && parsed.length > 0) currentTours = parsed;
    }
  } catch {}
}

export const loadCars = async (): Promise<Car[]> => {
  try {
    const cars = await apiFetchCars();
    if (Array.isArray(cars) && cars.length > 0) {
      currentCars = cars;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(cars));
      }
      notifyStoreChange();
      return cars;
    }
  } catch (err) {
    console.warn('Could not fetch cars from database, using cached/fallback cars:', err);
  }
  return currentCars;
};

export const loadTours = async (): Promise<Tour[]> => {
  try {
    const tours = await apiFetchTours();
    if (Array.isArray(tours) && tours.length > 0) {
      currentTours = tours;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
      }
      notifyStoreChange();
      return tours;
    }
  } catch (err) {
    console.warn('Could not fetch tours from database, using cached/fallback tours:', err);
  }
  return currentTours;
};

// Start background database sync immediately when app starts
if (typeof window !== 'undefined') {
  loadCars();
  loadTours();
  window.addEventListener('focus', () => {
    loadCars();
    loadTours();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadCars();
      loadTours();
    }
  });
}

export const getCars = (): Car[] => currentCars;

export const saveCars = (cars: Car[]) => {
  currentCars = cars;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(cars));
  }
  notifyStoreChange();
};

export const addCar = async (car: Car): Promise<Car> => {
  const saved = await apiCreateCar(car);
  currentCars = [saved, ...currentCars.filter((c) => c.id !== saved.id)];
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(currentCars));
  }
  notifyStoreChange();
  return saved;
};

export const updateCar = async (car: Car): Promise<Car> => {
  const saved = await apiUpdateCar(car);
  currentCars = currentCars.map((c) => (c.id === saved.id ? saved : c));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(currentCars));
  }
  notifyStoreChange();
  return saved;
};

export const deleteCar = async (carId: string): Promise<void> => {
  await apiDeleteCar(carId);
  currentCars = currentCars.filter((c) => c.id !== carId);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(currentCars));
  }
  notifyStoreChange();
};

export const getTours = (): Tour[] => currentTours;

export const saveTours = (tours: Tour[]) => {
  currentTours = tours;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
  }
  notifyStoreChange();
};

export const addTour = async (tour: Tour): Promise<Tour> => {
  const saved = await apiCreateTour(tour);
  currentTours = [saved, ...currentTours.filter((t) => t.id !== saved.id)];
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(currentTours));
  }
  notifyStoreChange();
  return saved;
};

export const updateTour = async (tour: Tour): Promise<Tour> => {
  const saved = await apiUpdateTour(tour);
  currentTours = currentTours.map((t) => (t.id === saved.id ? saved : t));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(currentTours));
  }
  notifyStoreChange();
  return saved;
};

export const deleteTour = async (tourId: string): Promise<void> => {
  await apiDeleteTour(tourId);
  currentTours = currentTours.filter((t) => t.id !== tourId);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(currentTours));
  }
  notifyStoreChange();
};

/**
 * Booking helpers. Bookings themselves live on the server (see src/lib/api.ts)
 * so every visitor and the admin panel see the same data.
 */
export interface BusyRange {
  carId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Overlap test: (reqStart <= busyEnd && reqEnd >= busyStart).
 * Returns the first busy range that collides with the requested dates.
 */
export const findConflict = (
  ranges: BusyRange[],
  carId: string,
  startDate: string,
  endDate: string
): BusyRange | undefined => {
  if (!carId || !startDate || !endDate) return undefined;
  return ranges.find((r) => r.carId === carId && startDate <= r.endDate && endDate >= r.startDate);
};

/**
 * Calculates rental days given start and end dates (min 1 day).
 */
export const calculateRentalDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

/** Today's date as YYYY-MM-DD in the user's LOCAL time zone (toISOString() would use UTC). */
export const localDateString = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/**
 * Compute unique customer profiles from booking history.
 */
export const getCustomersSummary = (bookings: Booking[]): CustomerSummary[] => {
  const customerMap = new Map<string, CustomerSummary>();

  bookings.forEach((b) => {
    const key = b.customerPhone.trim() || b.customerEmail.trim() || b.customerName.trim();
    if (!key) return;

    const existing = customerMap.get(key);
    const bookingTotal = b.status !== 'cancelled' ? b.totalPrice : 0;

    if (existing) {
      existing.totalBookings += 1;
      existing.totalSpent += bookingTotal;
      if (new Date(b.createdAt) < new Date(existing.memberSince)) {
        existing.memberSince = b.createdAt;
      }
    } else {
      customerMap.set(key, {
        id: `cust-${Math.abs(key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))}`,
        name: b.customerName,
        phone: b.customerPhone,
        email: b.customerEmail,
        totalBookings: 1,
        totalSpent: bookingTotal,
        memberSince: b.createdAt
      });
    }
  });

  return Array.from(customerMap.values());
};

// Global Store change notifier
export const STORE_CHANGE_EVENT = 'travel_caravan_store_updated';

export const notifyStoreChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
  }
};

export const subscribeStoreChange = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};

  // Same-tab updates use our custom event. The native storage event keeps
  // the public site and admin panel synchronized when they are open in
  // different tabs/windows on the same browser.
  const handleStorageChange = (event: StorageEvent) => {
    if (
      event.key === CARS_STORAGE_KEY ||
      event.key === TOURS_STORAGE_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(STORE_CHANGE_EVENT, callback);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, callback);
    window.removeEventListener('storage', handleStorageChange);
  };
};
