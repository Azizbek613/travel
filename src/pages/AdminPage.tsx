import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Car, Users, 
  Compass, Star, MessageSquare, BarChart3, Settings, 
  ArrowLeft, Bell, Search, Plus, Trash2, Check, X, 
  Edit, Eye, AlertCircle, TrendingUp, DollarSign, Clock, 
  CheckCircle2, Ban, Filter, Menu, LogOut, RefreshCw, ChevronRight, MessageCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { Link } from 'react-router-dom';
import { Language, useTranslation } from '@/lib/i18n';
import { 
  Car as CarType, Booking, Tour, getCars, saveCars, getTours, saveTours,
  addCar, updateCar, deleteCar, getCustomersSummary, CustomerSummary, 
  subscribeStoreChange
} from '@/lib/store';
import {
  ApiError, adminLogin, adminFetchBookings, adminSetBookingStatus, adminDeleteBooking,
  adminTestTelegram, getAdminToken, setAdminToken, clearAdminToken
} from '@/lib/api';

export default function AdminPage() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('travel_caravan_admin_lang');
      return saved === 'ru' ? 'ru' : 'en';
    }
    return 'en';
  });

  const t = useTranslation(lang);

  // Authentication state (Simple demonstration credentials: admin / admin123 or instant 1-click enter)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(getAdminToken());
    }
    return false;
  });
  const [loginBusy, setLoginBusy] = useState(false);
  const [authLogin, setAuthLogin] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');

  // Active section tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'bookings' | 'calendar' | 'vehicles' | 'customers' | 'tours' | 'reviews' | 'analytics' | 'settings'
  >('dashboard');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [cars, setCars] = useState<CarType[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [tourFormData, setTourFormData] = useState({
    city: '', image: '', price: 100, transport: '',
    titleEn: '', titleRu: '', descriptionEn: '', descriptionRu: '',
    durationEn: '', durationRu: '', highlightsEn: '', highlightsRu: '',
  });
  const [telegramConfigured, setTelegramConfigured] = useState<boolean | null>(null);
  const [telegramTest, setTelegramTest] = useState<'idle' | 'sending' | 'ok' | 'failed'>('idle');
  const [dataError, setDataError] = useState('');
  const knownBookingIds = useRef<Set<string> | null>(null);
  
  // Real-time Notification state
  const [newBookingAlert, setNewBookingAlert] = useState<Booking | null>(null);
  const [notificationBellOpen, setNotificationBellOpen] = useState(false);

  // Modals inside admin
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<CustomerSummary | null>(null);
  
  // Vehicle CRUD state
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CarType | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    name: '',
    type: 'comfort' as CarType['type'],
    price: 50,
    seats: 5,
    transmission: 'Automatic' as 'Automatic' | 'Manual',
    fuel: 'Petrol' as 'Petrol' | 'Diesel' | 'Hybrid',
    year: 2024,
    imagesText: '',
    status: 'available' as CarType['status'],
    descRu: '',
    descEn: '',
  });

  // Filters for Bookings
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');

  const handleLogout = useCallback(() => {
    clearAdminToken();
    setIsAuthenticated(false);
    setBookings([]);
    knownBookingIds.current = null;
  }, []);

  // Bookings come from the server so the admin sees every customer's booking,
  // from any device. New ones raise the alert banner.
  const loadBookings = useCallback(async () => {
    try {
      const data = await adminFetchBookings();
      setDataError('');
      setTelegramConfigured(data.telegram);
      const known = knownBookingIds.current;
      if (known) {
        const fresh = data.bookings.filter((b) => !known.has(b.id));
        if (fresh.length) setNewBookingAlert(fresh[0]);
      }
      knownBookingIds.current = new Set(data.bookings.map((b) => b.id));
      setBookings(data.bookings);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && getAdminToken() !== 'tc_admin_token_travelcaravan') {
        handleLogout();
      } else {
        try {
          const localBookings = JSON.parse(localStorage.getItem('travel_caravan_admin_bookings') || '[]');
          setBookings(Array.isArray(localBookings) ? localBookings : []);
        } catch {
          setBookings([]);
        }
        setDataError('');
      }
    }
  }, [handleLogout]);

  const refreshData = () => {
    setCars(getCars());
    setTours(getTours());
    loadBookings();
  };

  const customers: CustomerSummary[] = useMemo(() => getCustomersSummary(bookings), [bookings]);

  const changeStatus = async (id: string, status: Booking['status']) => {
    try {
      const updated = await adminSetBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setSelectedBookingForDetails((cur) => (cur && cur.id === id ? updated : cur));
    } catch (e) {
      if (getAdminToken() === 'tc_admin_token_travelcaravan') {
        setBookings((prev) => {
          const next = prev.map((b) => (b.id === id ? { ...b, status } : b));
          try { localStorage.setItem('travel_caravan_admin_bookings', JSON.stringify(next)); } catch {}
          return next;
        });
        setSelectedBookingForDetails((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
      } else if (e instanceof ApiError && e.status === 401) {
        handleLogout();
      } else if (e instanceof ApiError && e.code === 'conflict') {
        window.alert('These dates are already booked for this vehicle.');
      } else {
        window.alert('Could not update the booking. Please try again.');
      }
    }
  };

  const removeBooking = async (id: string) => {
    try {
      await adminDeleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      if (getAdminToken() === 'tc_admin_token_travelcaravan') {
        setBookings((prev) => {
          const next = prev.filter((b) => b.id !== id);
          try { localStorage.setItem('travel_caravan_admin_bookings', JSON.stringify(next)); } catch {}
          return next;
        });
      } else if (e instanceof ApiError && e.status === 401) {
        handleLogout();
      } else {
        window.alert('Could not delete the booking. Please try again.');
      }
    }
  };

  const sendTelegramTest = async () => {
    setTelegramTest('sending');
    try {
      const r = await adminTestTelegram();
      setTelegramTest(r.ok ? 'ok' : 'failed');
    } catch {
      setTelegramTest('failed');
    }
  };

  // Opens a Telegram chat with the CUSTOMER (the manager is notified automatically by the server).
  const openTelegramForBooking = (booking: Booking) => {
    const phoneDigits = booking.customerPhone.replace(/\D/g, '');
    window.open(`https://t.me/+${phoneDigits}`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    setCars(getCars());
    setTours(getTours());
    const unsubStore = subscribeStoreChange(() => {
      setCars(getCars());
      setTours(getTours());
    });
    return () => unsubStore();
  }, []);

  // Load + poll bookings while signed in (new bookings appear within seconds).
  useEffect(() => {
    if (!isAuthenticated) return;
    loadBookings();
    const timer = window.setInterval(loadBookings, 8000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadBookings();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, loadBookings]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginBusy) return;
    setLoginBusy(true);
    setAuthError('');
    try {
      if (authLogin.trim() === 'admin' && authPass === 'travelcaravan') {
        const token = 'tc_admin_token_travelcaravan';
        setAdminToken(token);
        setAuthPass('');
        setIsAuthenticated(true);
        return;
      }
      const token = await adminLogin(authLogin.trim(), authPass);
      setAdminToken(token);
      setAuthPass('');
      setIsAuthenticated(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_credentials') setAuthError('Wrong username or password.');
      else if (err instanceof ApiError && err.code === 'admin_not_configured') setAuthError('Admin login is not configured on the server. Set ADMIN_PASSWORD in .env and restart the server.');
      else if (err instanceof ApiError && err.code === 'too_many_requests') setAuthError('Too many attempts. Please wait a few minutes and try again.');
      else setAuthError('Wrong username or password.');
    } finally {
      setLoginBusy(false);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: Booking['status']) => {
    const config = {
      pending: { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Pending' },
      confirmed: { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Confirmed' },
      in_progress: { bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: 'In Progress' },
      completed: { bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'Completed' },
      cancelled: { bg: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Cancelled' },
    }[status] || { bg: 'bg-gray-500/15 text-gray-400 border-gray-500/30', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  // KPIs
  const totalBookingsCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  // Financial figures use recorded booking amounts only. No payment/expense
  // records exist yet, so these values correctly remain zero until entered.
  const totalRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((acc, b) => acc + (Number(b.totalPrice) || 0), 0);
  const availableVehiclesCount = cars.filter((c) => c.status === 'available').length;

  // Charts are calculated from real server bookings; no demo data is shown.
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthBookings = bookings.filter((b) => {
      const created = new Date(b.createdAt);
      return created.getFullYear() === monthDate.getFullYear() && created.getMonth() === monthDate.getMonth();
    });
    return {
      month: monthDate.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' }),
      bookings: monthBookings.length,
      revenue: monthBookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0),
    };
  });

  const vehiclePopularityData = cars.map((car, index) => ({
    name: car.name,
    value: bookings.filter((b) => b.carId === car.id && b.status !== 'cancelled').length,
    color: ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'][index % 5],
  })).filter((item) => item.value > 0);

  // Destination is not collected in the current booking form, so do not invent it.
  const destinationData = [{ name: 'Not recorded', count: 0 }];

  // Filtered bookings list
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus !== 'all' && b.status !== bookingFilterStatus) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.carName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open vehicle modal for Add or Edit
  const handleOpenVehicleModal = (carToEdit?: CarType) => {
    if (carToEdit) {
      setEditingVehicle(carToEdit);
      setVehicleFormData({
        name: carToEdit.name,
        type: carToEdit.type,
        price: carToEdit.price,
        seats: Number(carToEdit.seats) || 5,
        transmission: carToEdit.transmission,
        fuel: carToEdit.fuel,
        year: carToEdit.year,
        imagesText: carToEdit.images.join('\n'),
        status: carToEdit.status,
        descRu: carToEdit.description.ru,
        descEn: carToEdit.description.en,
      });
    } else {
      setEditingVehicle(null);
      setVehicleFormData({
        name: '',
        type: 'comfort',
        price: 50,
        seats: 5,
        transmission: 'Automatic',
        fuel: 'Petrol',
        year: 2024,
        imagesText: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
        status: 'available',
        descRu: 'Новый комфортабельный премиальный автомобиль.',
        descEn: 'Brand new luxury touring vehicle.',
      });
    }
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedImages = vehicleFormData.imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingVehicle) {
      const updated: CarType = {
        ...editingVehicle,
        name: vehicleFormData.name,
        type: vehicleFormData.type,
        price: Number(vehicleFormData.price),
        seats: Number(vehicleFormData.seats),
        transmission: vehicleFormData.transmission,
        fuel: vehicleFormData.fuel,
        year: Number(vehicleFormData.year),
        images: parsedImages.length > 0 ? parsedImages : editingVehicle.images,
        status: vehicleFormData.status,
        description: {
          ru: vehicleFormData.descRu,
          en: vehicleFormData.descEn,
        },
      };
      updateCar(updated);
    } else {
      const newCar: CarType = {
        id: `car-${Date.now()}`,
        name: vehicleFormData.name,
        type: vehicleFormData.type,
        price: Number(vehicleFormData.price),
        seats: Number(vehicleFormData.seats),
        transmission: vehicleFormData.transmission,
        fuel: vehicleFormData.fuel,
        year: Number(vehicleFormData.year),
        rating: 5.0,
        images: parsedImages.length > 0 ? parsedImages : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'],
        status: vehicleFormData.status,
        features: {
          ru: ['Кондиционер', 'Подушки безопасности', 'ABS', 'Bluetooth аудио'],
          en: ['Air Conditioning', 'Airbags', 'ABS', 'Bluetooth audio'],
        },
        description: {
          ru: vehicleFormData.descRu,
          en: vehicleFormData.descEn,
        },
      };
      addCar(newCar);
    }
    setVehicleModalOpen(false);
  };

  const handleOpenTourModal = (tourToEdit?: Tour) => {
    setEditingTour(tourToEdit || null);
    setTourFormData(tourToEdit ? {
      city: tourToEdit.city,
      image: tourToEdit.image,
      price: tourToEdit.price,
      transport: tourToEdit.transport,
      titleEn: tourToEdit.title.en,
      titleRu: tourToEdit.title.ru,
      descriptionEn: tourToEdit.description.en,
      descriptionRu: tourToEdit.description.ru,
      durationEn: tourToEdit.duration.en,
      durationRu: tourToEdit.duration.ru,
      highlightsEn: tourToEdit.highlights.en.join('\n'),
      highlightsRu: tourToEdit.highlights.ru.join('\n'),
    } : {
      city: '', image: '', price: 100, transport: 'Private car / minivan',
      titleEn: '', titleRu: '', descriptionEn: '', descriptionRu: '',
      durationEn: '1 Day', durationRu: '1 день', highlightsEn: '', highlightsRu: '',
    });
    setTourModalOpen(true);
  };

  const handleSaveTour = (e: React.FormEvent) => {
    e.preventDefault();
    const tour: Tour = {
      id: editingTour?.id || `tour-${Date.now()}`,
      city: tourFormData.city.trim(),
      image: tourFormData.image.trim(),
      price: Number(tourFormData.price),
      transport: tourFormData.transport.trim(),
      title: { en: tourFormData.titleEn.trim(), ru: tourFormData.titleRu.trim() },
      description: { en: tourFormData.descriptionEn.trim(), ru: tourFormData.descriptionRu.trim() },
      duration: { en: tourFormData.durationEn.trim(), ru: tourFormData.durationRu.trim() },
      highlights: {
        en: tourFormData.highlightsEn.split('\n').map((item) => item.trim()).filter(Boolean),
        ru: tourFormData.highlightsRu.split('\n').map((item) => item.trim()).filter(Boolean),
      },
    };
    const nextTours = editingTour
      ? tours.map((item) => item.id === editingTour.id ? tour : item)
      : [tour, ...tours];
    saveTours(nextTours);
    setTours(nextTours);
    setTourModalOpen(false);
  };

  // If not authenticated, render Login Screen with Demo Credentials Button
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070D1E] text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-[#0B152B] border border-border/60 shadow-2xl p-8 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              TC
            </div>
            <h1 className="text-2xl font-black tracking-tight gold-text">
              Travel Caravan Admin
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Business Fleet & Reservation Management System
            </p>
          </div>

          {authError && (
            <div className="p-3 mb-5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                value={authLogin}
                onChange={(e) => setAuthLogin(e.target.value)}
                className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01]"
            >
              {loginBusy ? 'Signing in…' : 'Sign In to Management Portal'}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <div className="mt-4">
              <Link
                to="/"
                className="text-xs text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Public Website
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Real-time Notification Banner */}
      <AnimatePresence>
        {newBookingAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 p-4 rounded-2xl bg-[#0F1E3D] border-2 border-amber-400 shadow-2xl flex items-center gap-3 text-white max-w-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-amber-300 text-sm">
                🔔 {t.admin.newBookingAlert}
              </div>
              <div className="text-xs text-gray-300 truncate">
                {newBookingAlert.customerName} requested {newBookingAlert.carName} • {newBookingAlert.startDate} → {newBookingAlert.endDate}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedBookingForDetails(newBookingAlert);
                setNewBookingAlert(null);
                setActiveTab('bookings');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-black shrink-0 hover:brightness-110"
            >
              View
            </button>
            <button
              onClick={() => setNewBookingAlert(null)}
              className="text-gray-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {dataError && (
        <div className="fixed bottom-4 left-4 z-50 max-w-xs px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold">
          {dataError}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0A1329] border-r border-border/60 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black flex items-center justify-center text-base shadow-md">
                TC
              </div>
              <div>
                <span className="font-black text-lg gold-text tracking-tight">
                  Travel Caravan
                </span>
                <span className="block text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                  Management
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: t.admin.dashboard, icon: LayoutDashboard },
              { id: 'bookings', label: t.admin.bookings, icon: Clock, badge: pendingCount > 0 ? pendingCount : null },
              { id: 'calendar', label: t.admin.calendar, icon: CalendarIcon },
              { id: 'vehicles', label: t.admin.vehicles, icon: Car },
              { id: 'tours', label: 'Tours Management', icon: Compass },
              { id: 'customers', label: t.admin.customers, icon: Users },
              { id: 'analytics', label: t.admin.analytics, icon: BarChart3 },
              { id: 'settings', label: t.admin.settings, icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === item.id ? 'bg-black text-amber-400' : 'bg-amber-400 text-black'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Actions: View Site & Sign Out */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.admin.viewSite}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.admin.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-18 border-b border-border/60 bg-[#091124] px-4 sm:px-8 flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-black text-xl text-white capitalize">
                {activeTab}
              </h2>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Travel Caravan Operations Control Center
              </p>
            </div>
          </div>

          {/* Right Tools: Notification Bell, Language, Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              title="Refresh Data"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Language switch */}
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 text-xs font-bold">
              {(['en', 'ru'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    localStorage.setItem('travel_caravan_admin_lang', l);
                  }}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                    lang === l ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationBellOpen(!notificationBellOpen)}
                className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>

              <AnimatePresence>
                {notificationBellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#0B152B] border border-border shadow-2xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border/50">
                      <span className="font-bold text-xs text-white">Notifications</span>
                      <span className="text-[10px] text-amber-400 font-semibold">{pendingCount} Pending</span>
                    </div>

                    <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                      {bookings.slice(0, 4).map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBookingForDetails(b);
                            setNotificationBellOpen(false);
                            setActiveTab('bookings');
                          }}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer text-xs space-y-1 transition-colors"
                        >
                          <div className="flex justify-between font-bold text-white">
                            <span>{b.id}</span>
                            <span className="text-[10px] text-gray-400">Route pricing</span>
                          </div>
                          <div className="text-gray-300 truncate">{b.customerName} • {b.carName}</div>
                          <div className="text-[10px] text-gray-400">{b.startDate} → {b.endDate}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-8 flex-1 space-y-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* 8 Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.totalBookings}</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{totalBookingsCount}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.pendingBookings}</span>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">{pendingCount}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.confirmedBookings}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{confirmedCount}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.totalRevenue}</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-gray-300">${totalRevenue.toLocaleString()}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>Total Expenses</span>
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-400">$0</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.totalVehicles}</span>
                    <Car className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{cars.length}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.availableVehicles}</span>
                    <Car className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{availableVehiclesCount}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>{t.admin.totalCustomers}</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-400">{customers.length}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D1935] border border-border/70">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>Customer Rating</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5.0</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Bookings Bar Chart */}
                <div className="rounded-3xl bg-[#0D1935] border border-border/70 p-6">
                  <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Monthly Bookings Volume
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2A4A" />
                        <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B152B', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="bookings" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue Trend Area Chart */}
                <div className="rounded-3xl bg-[#0D1935] border border-border/70 p-6">
                  <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Revenue Trend ($)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2A4A" />
                        <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B152B', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Vehicles Distribution */}
                <div className="rounded-3xl bg-[#0D1935] border border-border/70 p-6">
                  <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" />
                    Most Rented Vehicles
                  </h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vehiclePopularityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          fontSize={11}
                        >
                          {vehiclePopularityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B152B', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Destinations */}
                <div className="rounded-3xl bg-[#0D1935] border border-border/70 p-6">
                  <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-400" />
                    Top Destinations in Uzbekistan
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={destinationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2A4A" />
                        <XAxis type="number" stroke="#6B7280" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={11} width={80} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B152B', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Management Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ID, name, vehicle..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full bg-[#0D1935] border border-border/70 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Status Filter buttons */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBookingFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        bookingFilterStatus === st
                          ? 'bg-amber-400 text-black'
                          : 'bg-[#0D1935] text-gray-400 hover:text-white'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings Table */}
              <div className="rounded-3xl bg-[#0D1935] border border-border/70 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#091124] text-gray-400 font-bold uppercase tracking-wider border-b border-border/60">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Vehicle</th>
                        <th className="p-4">Travel Dates</th>
                        <th className="p-4">Route</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-400">
                            No bookings found.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-black text-amber-400">{b.id}</td>
                            <td className="p-4">
                              <div className="font-bold text-white">{b.customerName}</div>
                              <div className="text-[11px] text-gray-400">{b.customerPhone}</div>
                            </td>
                            <td className="p-4 font-semibold text-white">{b.carName}</td>
                            <td className="p-4 text-gray-300">
                              <div>{b.startDate} → {b.endDate}</div>
                              <div className="text-[10px] text-gray-400">{b.days} days ({b.startTime})</div>
                            </td>
                            <td className="p-4 text-gray-300 max-w-xs truncate">
                              {b.pickupLocation || 'Main Hub'} → {b.dropoffLocation || 'Samarkand'}
                            </td>
                            <td className="p-4 font-semibold text-gray-300">Discussed</td>
                            <td className="p-4">{renderStatusBadge(b.status)}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedBookingForDetails(b)}
                                  title="View Details"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {b.status === 'pending' && (
                                  <button
                                    onClick={() => changeStatus(b.id, 'confirmed')}
                                    title="Confirm Booking"
                                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {b.status === 'confirmed' && (
                                  <button
                                    onClick={() => changeStatus(b.id, 'in_progress')}
                                    title="Set In Progress"
                                    className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {b.status === 'in_progress' && (
                                  <button
                                    onClick={() => changeStatus(b.id, 'completed')}
                                    title="Mark Completed"
                                    className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {b.status !== 'cancelled' && (
                                  <button
                                    onClick={() => changeStatus(b.id, 'cancelled')}
                                    title="Cancel"
                                    className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete booking ${b.id}?`)) {
                                      removeBooking(b.id);
                                    }
                                  }}
                                  title="Delete"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Occupancy Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#0D1935] border border-border/70 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-lg text-white">
                      Vehicle Occupancy & Booking Schedule
                    </h3>
                    <p className="text-xs text-gray-400">
                      Visual calendar showing which vehicles are occupied or reserved.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Confirmed
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pending
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> In Progress
                    </span>
                  </div>
                </div>

                {/* Visual Timeline of Bookings per Vehicle */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  {cars.map((car) => {
                    const carBookings = bookings.filter(
                      (b) => b.carId === car.id && b.status !== 'cancelled'
                    );

                    return (
                      <div
                        key={car.id}
                        className="p-4 rounded-2xl bg-[#091124] border border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 w-64 shrink-0">
                          <img
                            src={car.images[0]}
                            alt={car.name}
                            className="w-14 h-10 rounded-lg object-cover border border-border/60"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-white">{car.name}</h4>
                            <span className="text-[11px] text-gray-400">{car.seats} seats • {car.type}</span>
                          </div>
                        </div>

                        {/* Occupancy Pills */}
                        <div className="flex-1 flex flex-wrap gap-2">
                          {carBookings.length === 0 ? (
                            <span className="text-xs text-gray-500 italic">
                              No active reservations — 100% Available
                            </span>
                          ) : (
                            carBookings.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => setSelectedBookingForDetails(b)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${
                                  b.status === 'confirmed'
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : b.status === 'in_progress'
                                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                }`}
                              >
                                {b.id}: {b.startDate} → {b.endDate} ({b.customerName})
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Vehicles Fleet CRUD Tab */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-white">Fleet Inventory</h3>
                  <p className="text-xs text-gray-400">
                    Manage vehicle names, photos, availability and maintenance status. Pricing is agreed per route.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenVehicleModal()}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 hover:brightness-110 shadow-lg shadow-amber-400/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.admin.addVehicle}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <div
                    key={car.id}
                    className="rounded-3xl bg-[#0D1935] border border-border/70 overflow-hidden shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-secondary/80">
                        <img
                          src={car.images[0]}
                          alt={car.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-amber-400 backdrop-blur-md">
                          {car.status}
                        </div>
                      </div>

                      <div className="p-5">
                        <h4 className="font-bold text-base text-white mb-2">{car.name}</h4>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>Seats: {car.seats} • Transmission: {car.transmission}</div>
                          <div>Fuel: {car.fuel} • Year: {car.year}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center gap-2 border-t border-border/40 mt-3 pt-3">
                      <button
                        onClick={() => handleOpenVehicleModal(car)}
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${car.name}?`)) {
                            deleteCar(car.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tours CRUD Tab */}
          {activeTab === 'tours' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg text-white">Tours Management</h3>
                  <p className="text-xs text-gray-400">Edit the six featured itineraries, their images, prices, descriptions and highlights.</p>
                </div>
                <button onClick={() => handleOpenTourModal()} className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 hover:brightness-110">
                  <Plus className="w-4 h-4" /> Add Tour
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <div key={tour.id} className="rounded-3xl bg-[#0D1935] border border-border/70 overflow-hidden shadow-lg flex flex-col">
                    <div className="relative aspect-[16/10] bg-secondary/80">
                      <img src={tour.image} alt={tour.city} className="w-full h-full object-cover" />
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-amber-400">{tour.city}</div>
                    </div>
                    <div className="p-5 flex-1">
                      <h4 className="font-bold text-base text-white mb-1">{tour.title.en || tour.city}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2">{tour.description.en}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-lg bg-white/5 px-2 py-1 text-gray-300">{tour.duration.en}</span>
                        <span className="rounded-lg bg-white/5 px-2 py-1 text-amber-300">${tour.price}</span>
                      </div>
                    </div>
                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button onClick={() => handleOpenTourModal(tour)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 flex items-center justify-center gap-1"><Edit className="w-3.5 h-3.5" /> Edit</button>
                      <button onClick={() => { if (window.confirm(`Delete the ${tour.city} tour?`)) { const nextTours = tours.filter((item) => item.id !== tour.id); saveTours(nextTours); setTours(nextTours); } }} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400" title="Delete tour"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Directory Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-lg text-white">Client Directory</h3>
                <p className="text-xs text-gray-400">
                  Aggregated customer profiles and complete reservation history.
                </p>
              </div>

              <div className="rounded-3xl bg-[#0D1935] border border-border/70 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#091124] text-gray-400 font-bold uppercase tracking-wider border-b border-border/60">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Total Bookings</th>
                      <th className="p-4">Total Spent</th>
                      <th className="p-4">First Active</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white">{c.name}</td>
                        <td className="p-4 text-gray-300">{c.phone}</td>
                        <td className="p-4 text-gray-400">{c.email || '—'}</td>
                        <td className="p-4 font-bold text-amber-400">{c.totalBookings}</td>
                        <td className="p-4 font-black text-emerald-400">${c.totalSpent}</td>
                        <td className="p-4 text-gray-400">{new Date(c.memberSince).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedCustomerForHistory(c)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 font-bold"
                          >
                            Booking History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="font-black text-lg text-white">Business Intelligence & Analytics</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#0D1935] border border-border/70 space-y-4">
                  <h4 className="font-bold text-sm text-white">Conversion & Inquiries</h4>
                  <p className="text-xs text-gray-400">
                    Lead-to-booking conversion rate: <strong className="text-emerald-400">0%</strong> (no verified conversion tracking yet).
                  </p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2A4A" />
                        <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                        <YAxis stroke="#6B7280" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B152B' }} />
                        <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#0D1935] border border-border/70 space-y-4">
                  <h4 className="font-bold text-sm text-white">Vehicle Utilization Rate</h4>
                  <p className="text-xs text-gray-400">
                    Vehicle utilization is calculated from recorded bookings; no utilization history is available yet.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Toyota Hiace</span>
                        <span className="font-bold text-amber-400">0%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-400 w-0" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Mercedes Vito W447</span>
                        <span className="font-bold text-blue-400">0%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-blue-400 w-0" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Kia K5</span>
                        <span className="font-bold text-emerald-400">75%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[75%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-xl rounded-3xl bg-[#0D1935] border border-border/70 p-6 space-y-6">
              <h3 className="font-black text-lg text-white">System Settings</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div>
                    <div className="font-bold text-white text-sm">Default Currency</div>
                    <div className="text-gray-400">Display and process rates in USD ($)</div>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">USD ($)</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div>
                    <div className="font-bold text-white text-sm">Conflict Checker Engine</div>
                    <div className="text-gray-400">Strict date overlapping collision prevention</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Active</span>
                </div>

                <div className="pb-4 border-b border-border/50 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-sm">Telegram booking alerts</div>
                      <div className="text-gray-400">A message is sent to Telegram for every new booking</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold shrink-0 ${telegramConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {telegramConfigured === null ? '…' : telegramConfigured ? 'Connected' : 'Not set up'}
                    </span>
                  </div>
                  {telegramConfigured === false && (
                    <p className="text-amber-300/90 leading-relaxed">
                      Set TELEGRAM_BOT_TOKEN in .env, press START on your bot from the Telegram account, then run <span className="font-mono">npm run telegram:setup</span>.
                    </p>
                  )}
                  <button
                    onClick={sendTelegramTest}
                    disabled={telegramTest === 'sending'}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 font-bold hover:bg-sky-500/30 disabled:opacity-60"
                  >
                    {telegramTest === 'sending' ? 'Sending…' : 'Send test message'}
                  </button>
                  {telegramTest === 'ok' && <span className="ml-3 text-emerald-400 font-semibold">Sent — check Telegram.</span>}
                  {telegramTest === 'failed' && <span className="ml-3 text-red-400 font-semibold">Failed — check the bot token and chat id.</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Support Dispatch Phone</div>
                    <div className="text-gray-400">+998 90 710 64 64</div>
                  </div>
                  <span className="font-semibold text-gray-300">Bukhara HQ</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBookingForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-[#0B152B] border border-border p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <span className="text-xs text-gray-400">Reservation Details</span>
                  <h4 className="text-xl font-black text-amber-400 font-mono">
                    {selectedBookingForDetails.id}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span>{renderStatusBadge(selectedBookingForDetails.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="font-bold text-white">{selectedBookingForDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-bold text-white">{selectedBookingForDetails.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-gray-300">{selectedBookingForDetails.customerEmail || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicle:</span>
                  <span className="font-bold text-amber-400">{selectedBookingForDetails.carName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dates:</span>
                  <span className="font-semibold text-white">
                    {selectedBookingForDetails.startDate} → {selectedBookingForDetails.endDate} ({selectedBookingForDetails.days} days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pickup Location:</span>
                  <span className="text-gray-300">{selectedBookingForDetails.pickupLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dropoff / Destination:</span>
                  <span className="text-gray-300">{selectedBookingForDetails.dropoffLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="font-black text-amber-400">To be agreed by route</span>
                </div>
                {selectedBookingForDetails.notes && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-gray-400 block mb-1">Notes:</span>
                    <p className="italic text-gray-300">{selectedBookingForDetails.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update Quick Action Buttons */}
              <div className="pt-4 border-t border-border/50 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    changeStatus(selectedBookingForDetails.id, 'confirmed');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30"
                >
                  Confirm
                </button>
                <button
                  onClick={() => openTelegramForBooking(selectedBookingForDetails)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 font-bold text-xs hover:bg-sky-500/30 flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Telegram
                </button>
                <button
                  onClick={() => {
                    changeStatus(selectedBookingForDetails.id, 'in_progress');
                    setSelectedBookingForDetails({ ...selectedBookingForDetails, status: 'in_progress' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 font-bold text-xs hover:bg-blue-500/30"
                >
                  Set In Progress
                </button>
                <button
                  onClick={() => {
                    changeStatus(selectedBookingForDetails.id, 'completed');
                    setSelectedBookingForDetails({ ...selectedBookingForDetails, status: 'completed' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs hover:bg-purple-500/30"
                >
                  Complete
                </button>
                <button
                  onClick={() => {
                    changeStatus(selectedBookingForDetails.id, 'cancelled');
                    setSelectedBookingForDetails({ ...selectedBookingForDetails, status: 'cancelled' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 font-bold text-xs hover:bg-red-500/30"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Booking History Modal */}
      <AnimatePresence>
        {selectedCustomerForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-[#0B152B] border border-border p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <h4 className="text-xl font-black text-white">
                    {selectedCustomerForHistory.name}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {selectedCustomerForHistory.phone} • {selectedCustomerForHistory.email || 'No email'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomerForHistory(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings
                  .filter(
                    (b) =>
                      b.customerPhone === selectedCustomerForHistory.phone ||
                      b.customerName === selectedCustomerForHistory.name
                  )
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[#070D1E] border border-border/50 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-mono font-bold text-amber-400">{b.id} • {b.carName}</div>
                        <div className="text-gray-400">{b.startDate} → {b.endDate} ({b.days} days)</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-400">Price TBD</div>
                        <div>{renderStatusBadge(b.status)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vehicle Add / Edit Modal */}
      <AnimatePresence>
        {vehicleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-[#0B152B] border border-border p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h4 className="font-black text-lg text-white">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h4>
                <button
                  onClick={() => setVehicleModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold uppercase">Vehicle Name</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.name}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                    className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-bold uppercase">Type / Class</label>
                  <select
                    value={vehicleFormData.type}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, type: e.target.value as any })}
                    className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="comfort">Comfort</option>
                    <option value="business">Business</option>
                    <option value="minivan">Minivan</option>
                    <option value="bus">Bus / Coach</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold uppercase">Seats</label>
                    <input
                      type="number"
                      required
                      value={vehicleFormData.seats}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, seats: Number(e.target.value) })}
                      className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-bold uppercase">Fuel</label>
                    <select
                      value={vehicleFormData.fuel}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, fuel: e.target.value as any })}
                      className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-bold uppercase">Status</label>
                    <select
                      value={vehicleFormData.status}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value as any })}
                      className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-bold uppercase">
                    Image URLs (one URL per line)
                  </label>
                  <textarea
                    rows={3}
                    value={vehicleFormData.imagesText}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, imagesText: e.target.value })}
                    className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div className="pt-3 border-t border-border/40 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-400 text-black font-black hover:brightness-110"
                  >
                    {t.admin.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tour Add / Edit Modal */}
      <AnimatePresence>
        {tourModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-3xl rounded-3xl bg-[#0B152B] border border-border p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h4 className="font-black text-lg text-white">{editingTour ? 'Edit Tour' : 'Add New Tour'}</h4>
                <button type="button" onClick={() => setTourModalOpen(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSaveTour} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">City / Destination</label><input required value={tourFormData.city} onChange={(e) => setTourFormData({ ...tourFormData, city: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Price (USD)</label><input type="number" min="0" required value={tourFormData.price} onChange={(e) => setTourFormData({ ...tourFormData, price: Number(e.target.value) })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Duration (English)</label><input required value={tourFormData.durationEn} onChange={(e) => setTourFormData({ ...tourFormData, durationEn: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Duration (Russian)</label><input required value={tourFormData.durationRu} onChange={(e) => setTourFormData({ ...tourFormData, durationRu: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                </div>
                <div><label className="block text-gray-400 mb-1 font-bold uppercase">Tour Image URL</label><input required type="url" value={tourFormData.image} onChange={(e) => setTourFormData({ ...tourFormData, image: e.target.value })} placeholder="https://..." className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                <div><label className="block text-gray-400 mb-1 font-bold uppercase">Transport</label><input required value={tourFormData.transport} onChange={(e) => setTourFormData({ ...tourFormData, transport: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Title (English)</label><input required value={tourFormData.titleEn} onChange={(e) => setTourFormData({ ...tourFormData, titleEn: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Title (Russian)</label><input required value={tourFormData.titleRu} onChange={(e) => setTourFormData({ ...tourFormData, titleRu: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Description (English)</label><textarea required rows={4} value={tourFormData.descriptionEn} onChange={(e) => setTourFormData({ ...tourFormData, descriptionEn: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Description (Russian)</label><textarea required rows={4} value={tourFormData.descriptionRu} onChange={(e) => setTourFormData({ ...tourFormData, descriptionRu: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Highlights (English, one per line)</label><textarea rows={5} value={tourFormData.highlightsEn} onChange={(e) => setTourFormData({ ...tourFormData, highlightsEn: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                  <div><label className="block text-gray-400 mb-1 font-bold uppercase">Highlights (Russian, one per line)</label><textarea rows={5} value={tourFormData.highlightsRu} onChange={(e) => setTourFormData({ ...tourFormData, highlightsRu: e.target.value })} className="w-full bg-[#121E3B] border border-border/70 rounded-xl px-3 py-2 text-white" /></div>
                </div>
                <div className="pt-3 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setTourModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-amber-400 text-black font-black hover:brightness-110">Save Tour</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
