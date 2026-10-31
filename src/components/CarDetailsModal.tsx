import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Fuel, Calendar, Gauge, Star, ShieldCheck, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Car } from '@/lib/store';

interface CarDetailsModalProps {
  car: Car | null;
  lang: Language;
  onClose: () => void;
  onBookNow: (car: Car) => void;
}

export const CarDetailsModal = ({ car, lang, onClose, onBookNow }: CarDetailsModalProps) => {
  const t = useTranslation(lang);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!car) return null;

  const currentFeatures = car.features[lang] || car.features.en;
  const currentDesc = car.description[lang] || car.description.en;

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % car.images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-3xl bg-card border border-border/70 shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Bar with Close Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-background/80 hover:bg-background text-foreground flex items-center justify-center backdrop-blur-md border border-border/50 shadow-md transition-all hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Gallery */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-secondary overflow-hidden">
            <img
              src={car.images[activeImageIdx] || car.images[0]}
              alt={car.name}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Navigation Arrows if multiple images */}
            {car.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Title Overlay */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
              <div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary font-semibold text-xs mb-2">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  {car.rating} / 5.0
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">{car.name}</h2>
              </div>

            </div>
          </div>

          {/* Thumbnails Row */}
          {car.images.length > 1 && (
            <div className="flex gap-2 p-4 bg-secondary/30 overflow-x-auto border-b border-border/50">
              {car.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    activeImageIdx === idx ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${car.name}-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Details Content */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[50vh] overflow-y-auto">
            {/* Description */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {currentDesc}
            </p>

            {/* Quick Specs Grid */}
            <div>
              <h3 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">
                {t.carDetails.specs}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60 flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.fleet.seats}</div>
                    <div className="font-bold text-sm">{car.seats} {t.fleet.seats}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60 flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.fleet.transmission}</div>
                    <div className="font-bold text-sm">{car.transmission}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60 flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.fleet.fuel}</div>
                    <div className="font-bold text-sm">{car.fuel}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.fleet.year}</div>
                    <div className="font-bold text-sm">{car.year}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Amenities */}
            <div>
              <h3 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t.carDetails.features}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl bg-secondary/40 px-3.5 py-2.5 text-sm border border-border/40"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety & Guarantee */}
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-foreground/90">
                <span className="font-bold">Travel Caravan Quality Guarantee:</span> All vehicles undergo comprehensive sanitization and technical inspection prior to each reservation. Full passenger insurance included.
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-6 bg-card border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="max-w-sm">
              <div className="text-sm font-black text-foreground">Route-based pricing</div>
              <div className="text-xs text-muted-foreground mt-1">
                Final price depends on your destination and trip details and will be agreed with our manager.
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-border hover:bg-secondary font-medium transition-colors"
              >
                {t.carDetails.close}
              </button>
              <button
                onClick={() => {
                  onClose();
                  onBookNow(car);
                }}
                className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {t.carDetails.bookThisVehicle}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
