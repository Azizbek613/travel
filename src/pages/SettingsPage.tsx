import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Settings, X, Bookmark, User, LogIn, UserPlus, LogOut, Shield, ArrowLeft
} from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { AppUser, getCurrentUser, logout as logoutUser } from '@/lib/auth';
import { MyBookingsModal } from '@/components/MyBookingsModal';
import { BookingModal } from '@/components/BookingModal';
import { AuthModal } from '@/components/AuthModal';
import { ProfileModal } from '@/components/ProfileModal';
import { getCars } from '@/lib/store';

/**
 * Standalone "Sozlamalar" (Settings) page.
 * This is a real route (/settings) - navigating here is a full page change,
 * not an overlay on top of the home page.
 */
const SettingsPage = () => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('travel_caravan_lang') as Language;
      if (savedLang && (savedLang === 'uz' || savedLang === 'ru' || savedLang === 'en')) {
        return savedLang;
      }
    }
    return 'uz';
  });
  const t = useTranslation(lang);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('travel_caravan_lang', newLang);
    }
  };

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [generalBookingOpen, setGeneralBookingOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const cars = getCars();

  const refreshUser = () => setCurrentUser(getCurrentUser());

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    toast.success(t.auth.logoutSuccess, { duration: 2000 });
  };

  const langLabels: Record<Language, { label: string; flag: string }> = {
    uz: { label: "O'zbekcha", flag: '🇺🇿' },
    ru: { label: 'Русский', flag: '🇷🇺' },
    en: { label: 'English', flag: '🇬🇧' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-6 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">{t.nav.settings}</h1>
        </div>
        <Link
          to="/"
          className="w-11 h-11 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors"
          title="Bosh sahifaga qaytish"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      {/* Body */}
      <div className="min-h-[calc(100vh-89px)] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Bosh sahifaga qaytish</span>
          </Link>

          {/* Language switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(langLabels) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => handleLangChange(l)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  lang === l
                    ? 'bg-primary/15 text-primary border-primary/40'
                    : 'bg-secondary/50 text-muted-foreground border-border/60 hover:text-foreground'
                }`}
              >
                <span className="text-base">{langLabels[l].flag}</span>
                <span>{langLabels[l].label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <button
              onClick={() => setMyBookingsOpen(true)}
              className="flex flex-col items-start gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/70 hover:border-primary/60 hover:bg-secondary/40 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-primary" />
              </div>
              <span className="text-base sm:text-lg font-black text-foreground">{t.nav.myBookings}</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex flex-col items-start gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/70 hover:border-primary/60 hover:bg-secondary/40 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <span className="text-base sm:text-lg font-black text-foreground">
                  {currentUser.firstName} · {t.auth.profile}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setAuthModalView('login')}
                  className="flex flex-col items-start gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/70 hover:border-primary/60 hover:bg-secondary/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-black text-foreground">{t.auth.login}</span>
                </button>

                <button
                  onClick={() => setAuthModalView('register')}
                  className="flex flex-col items-start gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/70 hover:border-primary/60 hover:bg-secondary/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-black text-foreground">{t.auth.register}</span>
                </button>
              </>
            )}

            <Link
              to="/admin"
              className="flex flex-col items-start gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-primary/40 hover:border-primary/70 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-base sm:text-lg font-black text-primary">{t.nav.admin}</span>
            </Link>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="flex flex-col items-start gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-base sm:text-lg font-black text-red-400">{t.auth.logout}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* My Bookings Tracker Modal */}
      {myBookingsOpen && (
        <MyBookingsModal
          lang={lang}
          onClose={() => setMyBookingsOpen(false)}
          onNewBooking={() => setGeneralBookingOpen(true)}
          onRequireAuth={() => setAuthModalView('login')}
        />
      )}

      {/* Direct Reserve Vehicle Modal (opened from My Bookings -> New Booking) */}
      {generalBookingOpen && (
        <BookingModal
          car={cars[0] || null}
          lang={lang}
          onClose={() => setGeneralBookingOpen(false)}
          onViewMyBookings={() => {
            setGeneralBookingOpen(false);
            setMyBookingsOpen(true);
          }}
          onRequireAuth={() => setAuthModalView('login')}
        />
      )}

      {/* Login / Register */}
      {authModalView && (
        <AuthModal
          lang={lang}
          initialView={authModalView}
          onClose={() => {
            setAuthModalView(null);
            refreshUser();
          }}
        />
      )}

      {/* Profile (view account, change phone, logout) */}
      {profileModalOpen && (
        <ProfileModal
          lang={lang}
          onClose={() => {
            setProfileModalOpen(false);
            refreshUser();
          }}
        />
      )}
    </div>
  );
};

export default SettingsPage;
