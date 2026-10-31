import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Menu, X, Sun, Moon, Bookmark, Shield, User, ChevronDown } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Link } from 'react-router-dom';

interface NavbarProps {
  lang: Language;
  onLangChange: (lang: Language) => void;
  onOpenMyBookings?: () => void;
}

const langLabels: Record<Language, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  ru: { label: 'Русский', flag: '🇷🇺' },
};

export const Navbar = ({ lang, onLangChange, onOpenMyBookings }: NavbarProps) => {
  const t = useTranslation(lang);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('travel_caravan_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('travel_caravan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('travel_caravan_theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { label: t.nav.home, href: '#home' },
    { label: t.nav.cars, href: '#cars' },
    { label: t.nav.tours, href: '#tours' },
    { label: t.nav.guide, href: '#guide' },
    { label: t.nav.reviews, href: '#reviews' },
    { label: t.nav.about, href: '#about' },
    { label: t.nav.contact, href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass-surface border-b border-border/60 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3">
        {/* Brand Logo in Gold */}
        <a href="#home" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-lg shadow-md group-hover:scale-105 transition-transform">
            TC
          </div>
          <div>
            <span className="text-xl font-black tracking-tight gold-text">
              Travel Caravan
            </span>
            <span className="hidden sm:block text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">
              Uzbekistan
            </span>
          </div>
        </a>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs xl:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-1 relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right Side Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Account / My Bookings shortcut */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground transition-all border border-border/60"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">{t.nav.myBookings}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50"
                  onClick={() => setProfileOpen(false)}
                >
                  <button
                    onClick={() => {
                      if (onOpenMyBookings) onOpenMyBookings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary text-left transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-primary" />
                    <span>{t.nav.myBookings}</span>
                  </button>

                  <div className="my-1 border-t border-border/50" />

                  <Link
                    to="/admin"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-primary" />
                    <span>{t.nav.admin}</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 transition-colors"
            title={isDark ? t.theme.light : t.theme.dark}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground transition-colors border border-border/60"
            >
              <span>{langLabels[lang].flag}</span>
              <span className="hidden md:inline uppercase">{lang}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-card border border-border shadow-2xl p-1.5 z-50"
                >
                  {(Object.keys(langLabels) as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        onLangChange(l);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                        lang === l
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <span className="text-base">{langLabels[l].flag}</span>
                      <span>{langLabels[l].label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-secondary border border-border/60 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl px-6 py-5 shadow-2xl"
          >
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-2 border-b border-border/30"
                >
                  {item.label}
                </a>
              ))}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    if (onOpenMyBookings) onOpenMyBookings();
                  }}
                  className="w-full py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span>{t.nav.myBookings}</span>
                </button>

                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-primary/15 text-primary text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t.nav.admin}</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
