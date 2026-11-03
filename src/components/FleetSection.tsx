import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Fuel, Calendar, ChevronLeft, ChevronRight, Gauge, Star, Info } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Car, getCars, subscribeStoreChange } from '@/lib/store';
import { BookingModal } from './BookingModal';
import { CarDetailsModal } from './CarDetailsModal';

interface FleetSectionProps {
  lang: Language;
  onOpenMyBookings?: () => void;
}

export const FleetSection = ({ lang, onOpenMyBookings }: FleetSectionProps) => {
  const t = useTranslation(lang);
  const [carsList, setCarsList] = useState<Car[]>(() => getCars());
  
  const [activeCarForDetails, setActiveCarForDetails] = useState<Car | null>(null);
  const [activeCarForBooking, setActiveCarForBooking] = useState<Car | null>(null);
  const [imageIndex, setImageIndex] = useState<{ [key: string]: number }>({});

  const loadCars = () => {
    setCarsList(getCars());
  };

  useEffect(() => {
    loadCars();
    const unsubscribe = subscribeStoreChange(loadCars);
    return () => unsubscribe();
  }, []);

  const filteredCars = carsList;

  return (
    <section id="cars" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-4">
            {t.fleet.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 text-balance">
            {t.fleet.title}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg text-pretty">
            {t.fleet.subtitle}
          </p>

        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCars.map((car, idx) => {
            const currentImgIdx = imageIndex[car.id] || 0;
            const currentImg = car.images[currentImgIdx] || car.images[0];

            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="group rounded-3xl bg-card border border-border/70 overflow-hidden shadow-md hover:shadow-2xl hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Container with Carousel Arrows */}
                  <div className="relative aspect-[4/3] bg-secondary/80 overflow-hidden">
                    <img
                      src={currentImg}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Left Carousel Arrow */}
                    {car.images.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageIndex((prev) => ({
                            ...prev,
                            [car.id]:
                              ((prev[car.id] || 0) - 1 + car.images.length) % car.images.length,
                          }));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}

                    {/* Right Carousel Arrow */}
                    {car.images.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageIndex((prev) => ({
                            ...prev,
                            [car.id]: ((prev[car.id] || 0) + 1) % car.images.length,
                          }));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Rating Badge */}
                    <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-primary font-bold text-xs flex items-center gap-1 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span>{car.rating}</span>
                    </div>

                    {/* Pricing is discussed individually based on the route. */}
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {car.name}
                    </h3>

                    {/* Specs Summary Row: 5 passengers | Petrol | Automatic | 2024 */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-muted-foreground pb-4 border-b border-border/50">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        {car.seats} {t.fleet.seats}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-primary" />
                        {car.fuel}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-primary" />
                        {car.transmission}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {car.year}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (View Details & Book Now) */}
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => setActiveCarForDetails(car)}
                    className="flex-1 py-3 rounded-xl border border-border/80 hover:bg-secondary text-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{t.fleet.viewDetails}</span>
                  </button>

                  <button
                    onClick={() => setActiveCarForBooking(car)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black text-xs font-black shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t.fleet.bookNow}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Car Details Modal */}
      {activeCarForDetails && (
        <CarDetailsModal
          car={activeCarForDetails}
          lang={lang}
          onClose={() => setActiveCarForDetails(null)}
          onBookNow={(carToBook) => {
            setActiveCarForDetails(null);
            setActiveCarForBooking(carToBook);
          }}
        />
      )}

      {/* Booking Modal */}
      {activeCarForBooking && (
        <BookingModal
          car={activeCarForBooking}
          lang={lang}
          onClose={() => setActiveCarForBooking(null)}
          onViewMyBookings={onOpenMyBookings}
        />
      )}
    </section>
  );
};