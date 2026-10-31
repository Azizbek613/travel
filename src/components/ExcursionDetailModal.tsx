import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Clock, Users, Languages, Bus, CheckCircle2, Lock,
  LogIn, UserPlus, CheckCircle, Copy, Check
} from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Excursion, createExcursionBooking, ExcursionBooking } from '@/lib/excursions';
import { toLocalDateString } from '@/lib/store';
import { AppUser, getCurrentUser, subscribeStoreChange, isoToFlagEmoji } from '@/lib/auth';

interface ExcursionDetailModalProps {
  excursion: Excursion;
  lang: Language;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export const ExcursionDetailModal = ({ excursion, lang, onClose, onRequireAuth }: ExcursionDetailModalProps) => {
  const t = useTranslation(lang);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [activeImage, setActiveImage] = useState(excursion.image);
  const [date, setDate] = useState('');
  const [people, setPeople] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [createdBooking, setCreatedBooking] = useState<ExcursionBooking | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const refresh = () => setCurrentUser(getCurrentUser());
    refresh();
    const unsubscribe = subscribeStoreChange(refresh);
    return () => unsubscribe();
  }, []);

  const today = toLocalDateString();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!date) {
      setError(t.auth.requiredField);
      return;
    }
    if (people < 1 || people > excursion.maxPeople) {
      setError(`${t.excursions.numberOfPeople}: 1 - ${excursion.maxPeople}`);
      return;
    }

    setError('');
    const booking = createExcursionBooking({
      excursionId: excursion.id,
      excursionTitle: excursion.title,
      excursionImage: excursion.image,
      userId: currentUser.id,
      customerName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      customerPhone: currentUser.phoneE164,
      countryCode: currentUser.countryIso2,
      date,
      people,
      notes: notes.trim() || undefined
    });
    setCreatedBooking(booking);
  };

  const handleCopyId = () => {
    if (!createdBooking) return;
    navigator.clipboard.writeText(createdBooking.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/60 bg-secondary/30 shrink-0">
            <h3 className="text-lg font-black text-foreground truncate pr-4">{excursion.title}</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 space-y-6">
            {createdBooking ? (
              /* Booking success */
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-foreground">{t.excursions.bookingSuccessTitle}</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    {t.excursions.bookingSuccessMessage}
                  </p>
                </div>
                <button
                  onClick={handleCopyId}
                  className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-border/60 font-mono text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  {createdBooking.id}
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all"
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                {/* Gallery */}
                <div className="space-y-2">
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-secondary">
                    <img src={activeImage} alt={excursion.title} className="w-full h-full object-cover" />
                  </div>
                  {excursion.gallery.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {excursion.gallery.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(img)}
                          className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                            activeImage === img ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{excursion.shortDescription}</p>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary/40 border border-border/60 p-3 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">{t.excursions.location}</div>
                      <div className="text-foreground font-semibold">{excursion.location}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/60 p-3 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">{t.excursions.duration}</div>
                      <div className="text-foreground font-semibold">{excursion.duration}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/60 p-3 flex items-start gap-2">
                    <Bus className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">{t.excursions.transportType}</div>
                      <div className="text-foreground font-semibold">{excursion.transportType}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/60 p-3 flex items-start gap-2">
                    <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">{t.excursions.maxPeople}</div>
                      <div className="text-foreground font-semibold">{excursion.maxPeople} {t.excursions.peopleUnit}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/60 p-3 flex items-start gap-2 col-span-2">
                    <Languages className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-bold">{t.excursions.guideService}</div>
                      <div className="text-foreground font-semibold">
                        {excursion.guideService ? t.excursions.guideIncluded : t.excursions.guideNotIncluded}
                        {excursion.guideService && excursion.guideLanguages.length > 0 && (
                          <span className="text-muted-foreground font-normal"> — {excursion.guideLanguages.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Places visited */}
                {excursion.placesVisited.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">
                      {t.excursions.placesVisited}
                    </div>
                    <div className="space-y-1.5">
                      {excursion.placesVisited.map((place, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/90">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>{place}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking */}
                <div className="pt-2 border-t border-border/60">
                  {!currentUser ? (
                    <div className="text-center py-6 space-y-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-black text-foreground">🔐 {t.auth.loginRequiredTitle}</h4>
                        <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
                          {t.auth.loginRequiredSubtitle}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => onRequireAuth?.()}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          {t.auth.login}
                        </button>
                        <button
                          onClick={() => onRequireAuth?.()}
                          className="px-6 py-3 rounded-xl border border-border/80 hover:bg-secondary text-foreground font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          {t.auth.register}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                        {t.excursions.bookExcursion}
                      </h4>

                      {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                          {error}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                            {t.excursions.selectDate}
                          </label>
                          <input
                            type="date"
                            required
                            min={today}
                            value={date}
                            onChange={(e) => { setDate(e.target.value); setError(''); }}
                            className="w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                            {t.excursions.numberOfPeople}
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={excursion.maxPeople}
                            value={people}
                            onChange={(e) => { setPeople(Number(e.target.value)); setError(''); }}
                            className="w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl bg-secondary/30 border border-border/50 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                        <span>{isoToFlagEmoji(currentUser.countryIso2)}</span>
                        <span className="font-semibold text-foreground">
                          {currentUser.firstName} {currentUser.lastName}
                        </span>
                        <span>• +{currentUser.phoneE164.replace('+', '')}</span>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all"
                      >
                        {t.excursions.confirmBooking}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
