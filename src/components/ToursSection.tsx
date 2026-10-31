import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Compass, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { getTours, Tour, subscribeStoreChange } from '@/lib/store';

interface ToursSectionProps {
  lang: Language;
  onBookTour?: (tour: Tour) => void;
}

export const ToursSection = ({ lang, onBookTour }: ToursSectionProps) => {
  const t = useTranslation(lang);
  const [tours, setTours] = useState<Tour[]>(() => getTours());
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => subscribeStoreChange(() => setTours(getTours())), []);

  return (
    <section id="tours" className="py-24 bg-secondary/15 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-4">
            <Compass className="w-3.5 h-3.5" />
            {t.tours.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground text-balance">
            {t.tours.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty">
            {t.tours.subtitle}
          </p>
        </motion.div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour, idx) => {
            const tourTitle = tour.title[lang] || tour.title.en;
            const tourDesc = tour.description[lang] || tour.description.en;
            const tourDuration = tour.duration[lang] || tour.duration.en;
            const tourHighlights = tour.highlights[lang] || tour.highlights.en;

            return (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group rounded-3xl bg-card border border-border/70 overflow-hidden shadow-lg hover:shadow-2xl hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    <img
                      src={tour.image}
                      alt={tour.city}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* City Badge */}
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-xs">
                      <MapPin className="w-3 h-3 text-primary" />
                      {tour.city}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-4 right-4 text-right">
                      <span className="text-xs text-gray-300 block">{t.tours.priceFrom}</span>
                      <span className="text-2xl font-black text-primary">${tour.price}</span>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 text-xs text-white/90 font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {tourDuration}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tourTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-5">
                      {tourDesc}
                    </p>

                    {/* Key Highlights */}
                    <div className="space-y-1.5 mb-6">
                      <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">
                        {t.tours.highlights}:
                      </div>
                      {tourHighlights.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer / CTA */}
                <div className="p-6 pt-0 border-t border-border/40 mt-auto">
                  <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                    <span>{t.tours.transport}:</span>
                    <span className="font-semibold text-foreground">{tour.transport}</span>
                  </div>

                  <a
                    href={`https://t.me/+998907106464?text=${encodeURIComponent(
                      `Hello Travel Caravan! I am interested in booking the tour: ${tour.city} - ${tourTitle} ($${tour.price}).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-secondary hover:bg-primary hover:text-primary-foreground border border-border/60 transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    <span>{t.tours.bookTour}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
