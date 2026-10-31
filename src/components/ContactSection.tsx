import { motion } from 'framer-motion';
import { Phone, MapPin, Instagram, MessageCircle, Send } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface ContactSectionProps {
  lang: Language;
}

export const ContactSection = ({ lang }: ContactSectionProps) => {
  const t = useTranslation(lang);

  const contacts = [
    {
      icon: Phone,
      label: t.contact.phone,
      href: 'tel:+998907106464', 
    },
    {
      icon: Send,
      label: 'Telegram',
      href: 'https://t.me/+998907106464',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: 'https://wa.me/998907106464',
    },
    {
      icon: Instagram,
      label: '@travel_caravan_',
      href: 'https://www.instagram.com/travel_caravan_',
    },
    {
      icon: MapPin,
      label: t.contact.address,
      href: '#',
    },
  ];

  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">{t.contact.title}</h2>
          <p className="text-muted-foreground text-lg">{t.contact.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {contacts.map((contact, i) => (
            <motion.a
              key={i}
              href={contact.href}
              target={contact.href.startsWith('http') ? '_blank' : undefined}
              rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass-surface rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"
            >
              <contact.icon className="w-6 h-6 text-primary mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-sm font-medium">{contact.label}</div>
            </motion.a>
          ))}
        </div>

        {/* Google Map embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 rounded-3xl overflow-hidden border border-border max-w-4xl mx-auto"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d97754.0!2d64.4167!3d39.7747!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f500e1a482d9897%3A0x422c5e18a891833f!2sBukhara%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1"
            width="100%"
            height="300"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Travel Caravan Location"
          />
        </motion.div>
      </div>
    </section>
  );
};
