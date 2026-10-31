import { motion } from 'framer-motion';
import { ChevronDown, Car, Users, MapPin, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import heroBg from '@/assets/hero-bg.jpg';

interface HeroSectionProps {
  lang: Language;
  onReserveClick?: () => void;
}

export const HeroSection = ({ lang, onReserveClick }: HeroSectionProps) => {
  const t = useTranslation(lang);

  const stats = [
    { icon: Car, value: '50+', label: t.stats.cars },
    { icon: Users, value: '1200+', label: t.stats.clients },
    { icon: MapPin, value: '15+', label: t.stats.tours },
    { icon: Star, value: '4.9', label: t.stats.rating },
  ];

  return (
    <section
      id="home"
      className="relative min-h-[95vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-16"
    >
      {/* Background Image with Dark Navy Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroBg})`,
        }}
      />
      {/* Deep dark navy overlays for international luxury contrast */}
      <div className="absolute inset-0 bg-[#060D1E]/80 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060D1E] via-transparent to-[#060D1E]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center max-w-5xl">
        {/* Rating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs sm:text-sm font-bold mb-6 backdrop-blur-md shadow-lg shadow-primary/10">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span>{t.hero.badge}</span>
          </div>
        </motion.div>

        {/* Brand Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-primary font-black uppercase tracking-widest text-sm sm:text-base mb-2 drop-shadow"
        >
          Travel Caravan
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6 text-balance drop-shadow-md"
        >
          {t.hero.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 text-pretty leading-relaxed drop-shadow"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {onReserveClick ? (
            <button
              onClick={onReserveClick}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-base bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{t.hero.cta}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <a
              href="#cars"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-base bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{t.hero.cta}</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          )}

          <a
            href="#tours"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{t.hero.secondary}</span>
          </a>
        </motion.div>

        {/* 4 Company Statistics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl text-center group hover:border-primary/40 transition-all"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl sm:text-3xl font-black text-white tabular-nums drop-shadow">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
};
