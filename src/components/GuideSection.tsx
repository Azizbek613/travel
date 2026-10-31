import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, MapPin, MessageCircle } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface GuideSectionProps {
  lang: Language;
}

export const GuideSection = ({ lang }: GuideSectionProps) => {
  const t = useTranslation(lang);

  return (
    <section id="guide" className="py-20 sm:py-24 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" />
              {t.guide.badge}
            </span>
            <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-black text-balance">
              {t.guide.title}
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground text-pretty">
              {t.guide.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-primary/10 p-3 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{t.guide.cardTitle}</h3>
                  <p className="mt-3 text-muted-foreground leading-7">
                    {t.guide.cardText}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                {t.guide.highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="hero"
                size="lg"
                className="mt-7 w-full sm:w-auto"
                asChild
              >
                <a href="#contact">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t.guide.cta}
                </a>
              </Button>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                  <Clock3 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">{t.guide.infoTitle}</h3>
              </div>
              <p className="text-muted-foreground leading-7">
                {t.guide.infoText}
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-background/50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t.guide.highlights[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
