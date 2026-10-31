import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X, CheckCircle, AlertTriangle, Users, Check, Copy, FileText, Navigation, Flag,
  Building2, TrainFront, Plane, MapPin, MessageCircle, ArrowRight, ArrowLeft, Minus, Plus,
  Loader2, Phone, User, Mail, CalendarDays, Clock
} from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import {
  Car, Booking, LocationType, BusyRange, getCars, findConflict, calculateRentalDays, localDateString
} from '@/lib/store';
import { ApiError, fetchBusyRanges, submitBooking, addMyBookingRef } from '@/lib/api';

type LocationKey = 'hotel' | 'train' | 'airport' | 'other';
type Step = 1 | 2 | 3 | 4 | 'success';

const LOCATION_TYPE_LABELS: Record<LocationKey, LocationType> = {
  hotel: 'Hotel',
  train: 'Train Station',
  airport: 'Airport',
  other: 'Other Location'
};

const LOCATION_TYPE_ICONS: Record<LocationKey, typeof Building2> = {
  hotel: Building2,
  train: TrainFront,
  airport: Plane,
  other: MapPin
};

const LOCATION_KEYS: LocationKey[] = ['airport', 'train', 'hotel', 'other'];

const inputClass =
  'w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2';

interface BookingModalProps {
  car: Car | null;
  lang: Language;
  onClose: () => void;
  onViewMyBookings?: () => void;
}

export const BookingModal = ({ car, lang, onClose, onViewMyBookings }: BookingModalProps) => {
  const t = useTranslation(lang);
  const cars = useMemo(() => getCars(), []);

  const [selectedCarId, setSelectedCarId] = useState<string>(car ? car.id : cars[0]?.id || '');
  const currentCar = cars.find((c) => c.id === selectedCarId) || car || cars[0];

  const todayStr = localDateString(0);
  const [step, setStep] = useState<Step>(1);
  const [startDate, setStartDate] = useState<string>(localDateString(1));
  const [endDate, setEndDate] = useState<string>(localDateString(4));
  const [pickupTime, setPickupTime] = useState<string>('10:00');
  const [passengers, setPassengers] = useState<number>(2);

  const [pickupType, setPickupType] = useState<LocationKey | ''>('');
  const [pickupDetails, setPickupDetails] = useState('');
  const [dropoffType, setDropoffType] = useState<LocationKey | ''>('');
  const [dropoffDetails, setDropoffDetails] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Keep the selected vehicle in sync if a different one is passed in.
  const carId = car?.id;
  useEffect(() => {
    if (carId) setSelectedCarId(carId);
  }, [carId]);

  // Lock page scroll behind the modal + close on Escape.
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

  // Load the occupied dates of the selected vehicle from the server.
  const currentCarId = currentCar?.id;
  const loadBusy = useCallback(async () => {
    if (!currentCarId) return;
    setBusyLoading(true);
    try {
      setBusy(await fetchBusyRanges(currentCarId));
    } catch {
      setBusy([]); // server enforces availability again on submit
    } finally {
      setBusyLoading(false);
    }
  }, [currentCarId]);

  useEffect(() => {
    loadBusy();
  }, [loadBusy]);

  if (!car || !currentCar) return null;

  const conflict = findConflict(busy, currentCar.id, startDate, endDate);
  const available = !conflict;
  const rentalDays = calculateRentalDays(startDate, endDate);
  const dayWord = rentalDays === 1 ? t.bk.days1 : t.bk.daysMany;
  const capacity = parseInt(String(currentCar.seats), 10) || 0;

  const getDetailLabel = (type: LocationKey | '', direction: 'pickup' | 'dropoff') => {
    if (type === 'hotel') return t.booking.hotelNameLabel;
    if (type === 'train') return t.booking.trainStationLabel;
    if (type === 'airport') return t.booking.airportLabel;
    if (type === 'other') return direction === 'pickup' ? t.booking.pickupAddressLabel : t.booking.dropoffAddressLabel;
    return '';
  };
  const getDetailPlaceholder = (type: LocationKey | '', direction: 'pickup' | 'dropoff') => {
    if (type === 'hotel') return t.booking.hotelNamePlaceholder;
    if (type === 'train') return t.booking.trainStationPlaceholder;
    if (type === 'airport') return t.booking.airportPlaceholder;
    if (type === 'other') return direction === 'pickup' ? t.booking.pickupAddressPlaceholder : t.booking.dropoffAddressPlaceholder;
    return '';
  };
  const getRequiredMessage = (type: LocationKey, direction: 'pickup' | 'dropoff') => {
    if (type === 'hotel') return t.booking.hotelNameRequired;
    if (type === 'train') return t.booking.trainStationRequired;
    if (type === 'airport') return t.booking.airportRequired;
    return direction === 'pickup' ? t.booking.pickupAddressRequired : t.booking.dropoffAddressRequired;
  };
  const typeName = (k: LocationKey) =>
    k === 'hotel' ? t.booking.optionHotel
      : k === 'train' ? t.booking.optionTrainStation
      : k === 'airport' ? t.booking.optionAirport
      : t.booking.optionOtherLocation;

  // ----- per-step validation -----
  const validateStep = (s: Step): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!available) {
        setError(t.booking.conflictAlert);
        return false;
      }
    }
    if (s === 2) {
      if (!pickupType) errs.pickup = t.booking.selectPickupError;
      else if ((pickupType === 'hotel' || pickupType === 'other') && !pickupDetails.trim()) {
        errs.pickup = getRequiredMessage(pickupType, 'pickup');
      }
      if (dropoffType && (dropoffType === 'hotel' || dropoffType === 'other') && !dropoffDetails.trim()) {
        errs.dropoff = getRequiredMessage(dropoffType, 'dropoff');
      }
    }
    if (s === 3) {
      if (fullName.trim().length < 2) errs.name = t.bk.nameRequired;
      const digits = phone.replace(/\D/g, '');
      if (digits.length > 0 && (digits.length < 7 || digits.length > 15)) errs.phone = t.bk.phoneRequired;
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = t.bk.emailInvalid;
    }
    setFieldErrors(errs);
    setError('');
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (typeof step !== 'number') return;
    if (!validateStep(step)) return;
    setStep((step + 1) as Step);
  };

  const goBack = () => {
    setError('');
    setFieldErrors({});
    if (typeof step === 'number' && step > 1) setStep((step - 1) as Step);
  };

  const buildTelegramMessage = (bookingId?: string) => [
    'Hello! I would like to confirm my Travel Caravan booking.',
    bookingId ? `Booking ID: ${bookingId}` : '',
    `Name: ${fullName.trim()}`,
    `Phone: ${phone.trim() || 'Not provided'}`,
    `Email: ${email.trim() || 'Not provided'}`,
    `Car: ${currentCar.name}`,
    `Dates: ${startDate} to ${endDate}`,
    `Pickup time: ${pickupTime}`,
    `Passengers: ${passengers}`,
    `Pickup: ${typeName(pickupType as LocationKey)}${pickupDetails.trim() ? ` - ${pickupDetails.trim()}` : ''}`,
    `Drop-off: ${dropoffType ? typeName(dropoffType) : 'Not specified'}${dropoffDetails.trim() ? ` - ${dropoffDetails.trim()}` : ''}`,
    notes.trim() ? `Notes: ${notes.trim()}` : '',
    'Please contact me to discuss the final price and details.'
  ].filter(Boolean).join('\n');



  const handleSubmit = async () => {
    if (!pickupType || submitting) return;
    // Open a tab during the click gesture to avoid popup blockers. We redirect
    // to the manager's public Telegram username with the booking text prefilled;
    // the customer must press Send in Telegram to transmit the message.
    const telegramWindow = window.open('about:blank', '_blank');
    setSubmitting(true);
    setError('');
    let bookingId: string | undefined;
    try {
      const booking = await submitBooking({
        carId: currentCar.id,
        carName: currentCar.name,
        carImage: currentCar.images[0] || '',
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        startDate,
        endDate,
        startTime: pickupTime,
        passengers,
        pickupType: LOCATION_TYPE_LABELS[pickupType],
        pickupLocation: pickupDetails.trim() || (pickupType === 'airport' || pickupType === 'train' ? typeName(pickupType) : ''),
        dropoffType: dropoffType ? LOCATION_TYPE_LABELS[dropoffType] : undefined,
        dropoffLocation: dropoffDetails.trim() || (dropoffType === 'airport' || dropoffType === 'train' ? typeName(dropoffType) : ''),
        notes: notes.trim()
      });
      bookingId = booking.id;
      addMyBookingRef({ id: booking.id, phone: booking.customerPhone });
      setCreatedBooking(booking);
      setStep('success');
    } catch (e) {
      // Telegram contact is the most important fallback: still prepare the message
      // even if the booking API/server is temporarily unavailable.
      if (e instanceof ApiError && e.code === 'conflict') {
        await loadBusy();
        setStep(1);
        setError(t.bk.conflictOnSubmit);
      } else if (e instanceof ApiError && e.code === 'validation') {
        const f = e.fields || [];
        if (f.some((x) => x === 'dates' || x === 'dates_past' || x === 'time' || x === 'passengers' || x === 'vehicle')) setStep(1);
        else if (f.some((x) => x === 'pickup' || x === 'dropoff')) setStep(2);
        else setStep(3);
        setError(t.bk.sendError);
      } else {
        setError('Your request could not be saved on the website, but you can still send it to us on Telegram.');
      }
    } finally {
      const bookingMessage = buildTelegramMessage(bookingId);
      const telegramChatUrl = `https://t.me/Xakimovsoxib?text=${encodeURIComponent(bookingMessage)}`;
      if (telegramWindow && !telegramWindow.closed) {
        telegramWindow.location.href = telegramChatUrl;
      } else {
        // Fallback for browsers that block a new tab: open the direct manager chat.
        window.location.assign(telegramChatUrl);
      }
      setSubmitting(false);
    }
  };

  const handleCopyBookingId = async () => {
    if (!createdBooking) return;
    try {
      await navigator.clipboard.writeText(createdBooking.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    } catch {
      /* clipboard not available — the ID is visible on screen anyway */
    }
  };

  const setPickupTypeAndReset = (k: LocationKey) => {
    setPickupType(k);
    setPickupDetails('');
    setFieldErrors((p) => ({ ...p, pickup: '' }));
  };
  const setDropoffTypeAndReset = (k: LocationKey) => {
    setDropoffType(k);
    setDropoffDetails('');
    setFieldErrors((p) => ({ ...p, dropoff: '' }));
  };

  const stepLabels = [t.bk.stepTrip, t.bk.stepRoute, t.bk.stepContact, t.bk.stepReview];
  const currentStepNumber = typeof step === 'number' ? step : 4;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {msg}
      </p>
    ) : null;

  // ---- location picker (used for both pickup and drop-off) ----
  const renderLocationPicker = (
    direction: 'pickup' | 'dropoff',
    type: LocationKey | '',
    details: string,
    setType: (k: LocationKey) => void,
    setDetails: (v: string) => void,
    errorMsg?: string
  ) => {
    const Icon = direction === 'pickup' ? Navigation : Flag;
    return (
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
          {direction === 'pickup' ? t.booking.pickupLocationLabel : t.booking.dropoffLocationLabel}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LOCATION_KEYS.map((k) => {
            const KIcon = LOCATION_TYPE_ICONS[k];
            const active = type === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                  active
                    ? 'border-primary bg-primary/15 text-primary shadow-sm'
                    : 'border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                <KIcon className="w-5 h-5" />
                {typeName(k)}
              </button>
            );
          })}
        </div>
        {type && (
          <div>
            <label className={labelClass}>{getDetailLabel(type, direction)}</label>
            <input
              type="text"
              autoFocus
              maxLength={200}
              placeholder={getDetailPlaceholder(type, direction)}
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                setFieldErrors((p) => ({ ...p, [direction]: '' }));
              }}
              className={inputClass}
            />
          </div>
        )}
        <FieldError msg={errorMsg} />
      </div>
    );
  };

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className="min-w-0">
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="font-semibold break-words">{value || '—'}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full sm:max-w-2xl max-h-[100dvh] sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/60 bg-secondary/30 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-2xl font-black text-foreground truncate">{t.booking.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{currentCar.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.booking.close}
            className="w-10 h-10 shrink-0 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        {step !== 'success' && (
          <div className="px-5 sm:px-6 pt-4 shrink-0">
            <ol className="flex items-center">
              {stepLabels.map((label, i) => {
                const n = i + 1;
                const done = n < currentStepNumber;
                const active = n === currentStepNumber;
                return (
                  <li key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border transition-colors ${
                          done
                            ? 'bg-primary text-primary-foreground border-primary'
                            : active
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" /> : n}
                      </span>
                      <span className={`hidden sm:block text-xs font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </div>
                    {n < stepLabels.length && (
                      <div className={`flex-1 h-0.5 mx-2 rounded ${done ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="sm:hidden mt-2 text-xs font-semibold text-muted-foreground">
              {currentStepNumber}/4 · {stepLabels[currentStepNumber - 1]}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1 — TRIP */}
          {step === 1 && (
            <div className="space-y-5">
              <h4 className="text-base font-black">{t.bk.tripTitle}</h4>

              <div>
                <label className={labelClass}>{t.booking.car}</label>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                  {cars.map((c) => {
                    const active = c.id === currentCar.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCarId(c.id)}
                        aria-pressed={active}
                        className={`snap-start shrink-0 w-36 rounded-2xl border overflow-hidden text-left transition-all ${
                          active ? 'border-primary ring-2 ring-primary/40' : 'border-border/70 hover:border-primary/40'
                        }`}
                      >
                        <div className="relative h-20 bg-secondary">
                          {c.images[0] && <img src={c.images[0]} alt={c.name} loading="lazy" className="w-full h-full object-cover" />}
                          {active && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-bold truncate">{c.name}</div>
                          {active && <div className="text-[10px] font-black text-primary mt-1 uppercase tracking-wide">✓ Selected</div>}
                          <div className="text-[11px] text-muted-foreground">{c.seats} {t.bk.seatsWord}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.booking.startDate}</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) setEndDate(e.target.value);
                        setError('');
                      }}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t.booking.endDate}</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={startDate || todayStr}
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setError('');
                      }}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              {!available ? (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-red-500 text-sm">{t.booking.conflictAlert}</h5>
                    <p className="text-xs text-red-300/90 mt-1">{t.booking.conflictMsg}</p>
                    {conflict && (
                      <div className="mt-2 text-xs font-medium text-red-300">
                        {t.bk.occupiedPeriod}: {conflict.startDate} → {conflict.endDate}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    {busyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {busyLoading ? t.bk.checking : t.bk.availableFor}
                  </span>
                  <span className="font-bold">{rentalDays} {dayWord}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.booking.time}</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="time"
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t.booking.people}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="-"
                      onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                      className="w-11 h-11 rounded-xl bg-secondary/60 border border-border/70 hover:border-primary/50 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 h-11 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-center gap-2 font-black">
                      <Users className="w-4 h-4 text-primary" />
                      {passengers}
                    </div>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => setPassengers((p) => Math.min(60, p + 1))}
                      className="w-11 h-11 rounded-xl bg-secondary/60 border border-border/70 hover:border-primary/50 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {capacity > 0 && passengers > capacity && (
                <p className="text-xs font-semibold text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {t.bk.capacityWarn.replace('{n}', String(capacity))}
                </p>
              )}
            </div>
          )}

          {/* STEP 2 — ROUTE */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-base font-black">{t.bk.routeTitle}</h4>
              {renderLocationPicker('pickup', pickupType, pickupDetails, setPickupTypeAndReset, setPickupDetails, fieldErrors.pickup)}
              {renderLocationPicker('dropoff', dropoffType, dropoffDetails, setDropoffTypeAndReset, setDropoffDetails, fieldErrors.dropoff)}
            </div>
          )}

          {/* STEP 3 — CONTACT */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-base font-black">{t.bk.contactTitle}</h4>

              <div>
                <label className={labelClass}>{t.booking.name} *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <FieldError msg={fieldErrors.name} />
              </div>

              <div>
                <label className={labelClass}>{t.booking.phone} ({lang === 'en' ? 'optional' : lang === 'ru' ? 'необязательно' : 'opzionale'})</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{t.bk.phoneHint}</p>
                <FieldError msg={fieldErrors.phone} />
              </div>

              <div>
                <label className={labelClass}>{t.bk.emailOptional}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <FieldError msg={fieldErrors.email} />
              </div>

              <div>
                <label className={labelClass}>{t.booking.notes}</label>
                <textarea
                  rows={3}
                  maxLength={600}
                  placeholder={t.booking.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}

          {/* STEP 4 — REVIEW */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="text-base font-black">{t.bk.reviewTitle}</h4>
              <div className="rounded-2xl bg-secondary/30 border border-border/60 p-5 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                  <img
                    src={currentCar.images[0]}
                    alt={currentCar.name}
                    className="w-20 h-16 rounded-xl object-cover border border-border/60"
                  />
                  <div className="min-w-0">
                    <h4 className="font-black text-lg truncate">{currentCar.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {currentCar.seats} {t.bk.seatsWord} • {currentCar.transmission} • {currentCar.fuel}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <SummaryRow label={t.bk.datesLabel} value={`${startDate} → ${endDate} (${rentalDays} ${dayWord})`} />
                  <SummaryRow label={t.bk.pickupTimeLabel} value={pickupTime} />
                  <SummaryRow label={t.booking.pickupLocationLabel} value={`${pickupType ? typeName(pickupType) : '—'}${pickupDetails.trim() ? `: ${pickupDetails.trim()}` : ''}`} />
                  <SummaryRow label={t.booking.dropoffLocationLabel} value={`${dropoffType ? typeName(dropoffType) : 'Not specified'}${dropoffDetails.trim() ? `: ${dropoffDetails.trim()}` : ''}`} />
                  <SummaryRow label={t.booking.people} value={`${passengers} ${t.bk.passengersWord}`} />
                  <SummaryRow label={t.booking.name} value={fullName} />
                  <SummaryRow label={t.booking.phone} value={phone} />
                  <SummaryRow label={t.booking.email} value={email} />
                </div>

                {notes.trim() && (
                  <div className="pt-3 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground block">{t.booking.notes}:</span>
                    <span className="italic break-words">{notes}</span>
                  </div>
                )}

                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
                  <div className="text-sm font-black text-foreground">{t.bk.priceNoteTitle}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.bk.priceNoteBody}</p>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && createdBooking && (
            <div className="text-center py-4 space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-10 h-10" />
              </motion.div>

              <div>
                <h4 className="text-2xl sm:text-3xl font-black text-foreground mb-2">{t.bk.successTitle}</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{t.bk.successBody}</p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/50 border border-primary/30 max-w-md mx-auto text-left">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                  {t.booking.bookingId}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-primary">{createdBooking.id}</span>
                  <button
                    onClick={handleCopyBookingId}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId ? t.bk.copied : t.bk.copyId}
                  </button>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between gap-3">
                    <span>{t.bk.vehicleLabel}:</span>
                    <span className="font-semibold text-foreground text-right">{createdBooking.carName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>{t.bk.datesLabel}:</span>
                    <span className="font-semibold text-foreground text-right">
                      {createdBooking.startDate} → {createdBooking.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>{t.bk.priceLabel}:</span>
                    <span className="font-bold text-primary">{t.bk.priceToBeAgreed}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://t.me/Xakimovsoxib?text=${encodeURIComponent(buildTelegramMessage(createdBooking.id))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold hover:bg-sky-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t.bk.contactTelegram}
                </a>
                <a
                  id="telegram-booking-fallback"
                  href={`https://t.me/Xakimovsoxib?text=${encodeURIComponent(buildTelegramMessage(createdBooking.id))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden px-6 py-3 rounded-xl border border-sky-500/30 text-sky-400 font-semibold hover:bg-sky-500/10 transition-all items-center justify-center gap-2"
                >
                  Open manager Telegram chat
                </a>
                {onViewMyBookings && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewMyBookings();
                    }}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {t.booking.viewMyBookings}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl border border-border hover:bg-secondary font-medium transition-colors"
                >
                  {t.booking.close}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== 'success' && (
          <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-border/60 bg-card flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="px-5 py-3.5 rounded-xl border border-border hover:bg-secondary font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.bk.back}
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={step === 1 && !available}
                className={`flex-1 py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg ${
                  step === 1 && !available
                    ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-amber-500/25'
                }`}
              >
                {step === 3 ? t.bk.review : t.bk.next}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl font-black text-base bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.bk.sending}
                  </>
                ) : (
                  t.booking.submit
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
