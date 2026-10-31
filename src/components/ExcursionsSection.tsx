import { motion } from 'framer-motion';
import { MapPin, Clock, Compass, ArrowRight } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Excursion } from '@/lib/excursions';

interface ExcursionsSectionProps {
  lang: Language;
  excursions: Excursion[];
  onViewDetails: (excursion: Excursion) => void;
}

export const ExcursionsSection = ({ lang, excursions, onViewDetails }: ExcursionsSectionProps) => {
  const t = useTranslation(lang);

  if (excursions.length === 0) return null;

  return (
    <section id="excursions" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

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
            {t.excursions.sectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground text-balance">
            {t.excursions.sectionTitle}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty">
            {t.excursions.sectionSubtitle}
          </p>
        </motion.div>

        {/* Excursions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {excursions.map((excursion, idx) => (
            <motion.div
              key={excursion.id}
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
                    src={excursion.image}
                    alt={excursion.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-xs">
                    <MapPin className="w-3 h-3 text-primary" />
                    {excursion.location}
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-1 text-xs text-white/90 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {excursion.duration}
                  </div>
                </div>

                {/* Body Info */}
                <div className="p-6">
                  <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                    {excursion.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {excursion.shortDescription}
                  </p>
                </div>
              </div>

              {/* Footer / CTA */}
              <div className="p-6 pt-0 border-t border-border/40 mt-auto pt-4">
                <button
                  onClick={() => onViewDetails(excursion)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-secondary hover:bg-primary hover:text-primary-foreground border border-border/60 transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <span>{t.excursions.detailsButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
