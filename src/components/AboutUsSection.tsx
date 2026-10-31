import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, Headset, Award, Compass, Car } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface AboutUsSectionProps {
  lang: Language;
}

export const AboutUsSection = ({ lang }: AboutUsSectionProps) => {
  const t = useTranslation(lang);

  const features = [
    {
      icon: ShieldCheck,
      title: t.about.feature1Title,
      desc: t.about.feature1Desc,
    },
    {
      icon: UserCheck,
      title: t.about.feature2Title,
      desc: t.about.feature2Desc,
    },
    {
      icon: Headset,
      title: t.about.feature3Title,
      desc: t.about.feature3Desc,
    },
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Image Collage / Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-border/80 aspect-[4/3]">
              <img
                src="https://getimgurl.com/i/ss8y8562s5rr.png"
                alt="Uzbekistan Silk Road"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary text-black font-black text-xs mb-2">
                  <Award className="w-3.5 h-3.5" />
                  Premium Tourist Transport
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Excellence Across Uzbekistan
                </h3>
              </div>
            </div>

            {/* Floating Experience Badge */}
            <div className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-xl">
                10+
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">Years of Experience</div>
                <div className="text-xs text-muted-foreground">Certified Chauffeurs</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Story & Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-4">
                <Compass className="w-3.5 h-3.5" />
                {t.about.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">
                {t.about.title}
              </h2>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">
              {t.about.p1}
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.about.p2}
            </p>

            {/* 3 Pillars */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-secondary/40 border border-border/60 p-4 space-y-2 hover:border-primary/40 transition-colors"
                >
                  <feat.icon className="w-6 h-6 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground leading-snug">{feat.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
