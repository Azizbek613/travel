import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, Calendar, Clock, MapPin, MessageCircle, Send,
  CheckCircle2, Clock3, Ban, HelpCircle, Loader2, AlertTriangle
} from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Booking } from '@/lib/store';
import {
  ApiError, getMyBookingRefs, addMyBookingRef, removeMyBookingRef,
  lookupBooking, cancelMyBooking
} from '@/lib/api';

interface MyBookingsModalProps {
  lang: Language;
  onClose: () => void;
  onNewBooking?: () => void;
}

export const MyBookingsModal = ({ lang, onClose, onNewBooking }: MyBookingsModalProps) => {
  const t = useTranslation(lang);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [lookupId, setLookupId] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Load the bookings made on this device. The server only returns a booking
  // when its ID and phone number match, so nobody else's data is ever shown.
  const loadSaved = useCallback(async () => {
    const refs = getMyBookingRefs();
    if (!refs.length) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    const results = await Promise.allSettled(refs.map((r) => lookupBooking(r.id, r.phone)));
    const found: Booking[] = [];
    let networkProblem = false;
    results.forEach((res, i) => {
      if (res.status === 'fulfilled') found.push(res.value);
      else if (res.reason instanceof ApiError && res.reason.status === 404) removeMyBookingRef(refs[i].id);
      else networkProblem = true;
    });
    found.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setBookings(found);
    setLoadError(networkProblem);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupBusy) return;
    setLookupBusy(true);
    setLookupError('');
    try {
      const b = await lookupBooking(lookupId.trim().toUpperCase(), lookupPhone.trim());
      addMyBookingRef({ id: b.id, phone: b.customerPhone });
      setBookings((prev) => [b, ...prev.filter((x) => x.id !== b.id)]);
      setLookupId('');
      setLookupPhone('');
    } catch (err) {
      setLookupError(err instanceof ApiError && err.status === 404 ? t.myBookingsNew.notFound : t.bk.sendError);
    } finally {
      setLookupBusy(false);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.myBookings.statusConfirmed}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock3 className="w-3.5 h-3.5" />
            {t.myBookings.statusInProgress}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.myBookings.statusCompleted}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <Ban className="w-3.5 h-3.5" />
            {t.myBookings.statusCancelled}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            {t.myBookings.statusPending}
          </span>
        );
    }
  };

  const handleCancelBooking = async (b: Booking) => {
    if (!window.confirm(t.myBookings.cancelConfirm)) return;
    setCancelError('');
    try {
      const updated = await cancelMyBooking(b.id, b.customerPhone);
      setBookings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      setCancelError(t.myBookingsNew.cancelFailed);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/60 bg-secondary/30">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {t.myBookings.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t.myBookings.subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Find a booking by ID + phone */}
          <form onSubmit={handleLookup} className="p-6 pb-2 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                type="text"
                required
                maxLength={20}
                placeholder={t.myBookingsNew.lookupId}
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                className="w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              />
              <input
                type="tel"
                required
                maxLength={40}
                placeholder={t.myBookingsNew.lookupPhone}
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={lookupBusy}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {lookupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {t.myBookingsNew.find}
              </button>
            </div>
            {lookupError && (
              <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {lookupError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">{t.myBookingsNew.hint}</p>
          </form>

          {/* List of Bookings */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {cancelError && (
              <p className="text-xs font-semibold text-red-400">{cancelError}</p>
            )}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.myBookingsNew.loading}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-foreground">
                  {t.myBookings.noBookings}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t.myBookingsNew.hint}
                </p>
                {loadError && (
                  <p className="text-xs font-semibold text-red-400">{t.bk.sendError}</p>
                )}
                {onNewBooking && (
                  <button
                    onClick={() => {
                      onClose();
                      onNewBooking();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all"
                  >
                    {t.myBookingsNew.reserve}
                  </button>
                )}
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-border/70 bg-secondary/30 p-5 hover:border-primary/40 transition-all"
                >
                  {/* Top line: ID and Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">ID:</span>
                      <span className="font-mono font-black text-primary text-base">{booking.id}</span>
                      <span className="text-xs text-muted-foreground">({new Date(booking.createdAt).toLocaleDateString()})</span>
                    </div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>

                  {/* Body: Vehicle image & route */}
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {booking.carImage ? (
                        <img
                          src={booking.carImage}
                          alt={booking.carName}
                          className="w-16 h-12 rounded-xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-xl bg-secondary shrink-0" />
                      )}
                      <div>
                        <h4 className="font-black text-base">{booking.carName}</h4>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{booking.customerName}</span>
                          <span>•</span>
                          <span>{booking.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-border/50 sm:pl-4">
                      <div className="text-xs text-muted-foreground">{t.myBookingsNew.price}</div>
                      <div className="text-base font-black text-primary">{t.myBookingsNew.priceAgreed}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t.myBookingsNew.priceRoute}
                      </div>
                    </div>
                  </div>

                  {/* Itinerary info */}
                  <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        <strong className="text-foreground">{booking.startDate}</strong> → <strong className="text-foreground">{booking.endDate}</strong> ({booking.startTime})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {booking.pickupLocation} → {booking.dropoffLocation}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://t.me/+998907106464?text=${encodeURIComponent(
                          `Hello Travel Caravan! I am checking my booking ${booking.id} (${booking.carName}).`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {t.myBookingsNew.telegramManager}
                      </a>

                      <a
                        href={`https://wa.me/998907106464?text=${encodeURIComponent(
                          `Hello Travel Caravan! My booking ID is ${booking.id}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-medium"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                      >
                        {t.myBookings.cancelBtn}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};
