import { Language, useTranslation } from '@/lib/i18n';
import { Instagram, Phone, MessageCircle, Send } from 'lucide-react';

interface FooterProps {
  lang: Language;
}

export const Footer = ({ lang }: FooterProps) => {
  const t = useTranslation(lang);

  return (
    <footer className="border-t border-border py-12 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xl font-bold gold-text">Travel Caravan</span>
            <p className="text-sm text-muted-foreground mt-1">Premium travel service</p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+998907106464"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a
              href="https://t.me/+998907106464"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a
              href="https://www.instagram.com/travel_caravan_"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Instagram className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </div>

          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Travel Caravan. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
