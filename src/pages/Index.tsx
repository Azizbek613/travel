import { useState } from 'react';
import { Language } from '@/lib/i18n';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FleetSection } from '@/components/FleetSection';
import { ToursSection } from '@/components/ToursSection';
import { GuideSection } from '@/components/GuideSection';
import { AboutUsSection } from '@/components/AboutUsSection';
import { ReviewsSection } from '@/components/ReviewsSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { MyBookingsModal } from '@/components/MyBookingsModal';
import { BookingModal } from '@/components/BookingModal';
import { getCars } from '@/lib/store';

const Index = () => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('travel_caravan_lang') as Language;
      // English is the main language; an old saved 'uz' choice falls back to English.
      if (savedLang === 'ru' || savedLang === 'en') {
        return savedLang;
      }
    }
    return 'en';
  });

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('travel_caravan_lang', newLang);
    }
  };

  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [generalBookingOpen, setGeneralBookingOpen] = useState(false);

  const cars = getCars();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <Navbar
        lang={lang}
        onLangChange={handleLangChange}
        onOpenMyBookings={() => setMyBookingsOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection
        lang={lang}
        onReserveClick={() => setGeneralBookingOpen(true)}
      />

      {/* Fleet Section */}
      <FleetSection
        lang={lang}
        onOpenMyBookings={() => setMyBookingsOpen(true)}
      />

      {/* Uzbekistan Tours Section */}
      <ToursSection lang={lang} />

      {/* Local Guide Section */}
      <GuideSection lang={lang} />

      {/* About Us Section */}
      <AboutUsSection lang={lang} />

      {/* Reviews Section */}
      <ReviewsSection lang={lang} />

      {/* Contact Section */}
      <ContactSection lang={lang} />

      {/* Footer */}
      <Footer lang={lang} />

      {/* My Bookings Tracker Modal */}
      {myBookingsOpen && (
        <MyBookingsModal
          lang={lang}
          onClose={() => setMyBookingsOpen(false)}
          onNewBooking={() => setGeneralBookingOpen(true)}
        />
      )}

      {/* Direct Reserve Vehicle Modal */}
      {generalBookingOpen && (
        <BookingModal
          car={cars[0] || null}
          lang={lang}
          onClose={() => setGeneralBookingOpen(false)}
          onViewMyBookings={() => {
            setGeneralBookingOpen(false);
            setMyBookingsOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default Index;
