import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle, MessageSquarePlus, Quote } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';
import { reviews, getUserReviews, addUserReview, UserReview } from '@/lib/data';

interface ReviewsSectionProps {
  lang: Language;
}

interface DisplayReview {
  id: string;
  name: string;
  country?: string;
  rating: number;
  text: string;
  date?: string;
  isUser?: boolean;
}

export const ReviewsSection = ({ lang }: ReviewsSectionProps) => {
  const t = useTranslation(lang);

  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [form, setForm] = useState({ name: '', comment: '' });
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUserReviews(getUserReviews());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(t.reviews.nameRequired);
      return;
    }
    if (rating < 1) {
      setError(t.reviews.ratingRequired);
      return;
    }
    if (!form.comment.trim()) {
      setError(t.reviews.commentRequired);
      return;
    }

    const newReview = addUserReview({
      name: form.name.trim(),
      rating,
      comment: form.comment.trim(),
    });

    setUserReviews((prev) => [newReview, ...prev]);
    setForm({ name: '', comment: '' });
    setRating(5);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const displayReviews: DisplayReview[] = [
    ...userReviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      text: r.comment,
      date: new Date(r.createdAt).toLocaleDateString(),
      isUser: true,
    })),
    ...reviews.map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      rating: r.rating,
      text: r.text[lang as 'en' | 'ru'] || r.text.en,
    })),
  ];

  return (
    <section id="reviews" className="py-24 bg-secondary/10 relative">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 uppercase tracking-wider">
            <Quote className="w-3.5 h-3.5" />
            Verified Feedback
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            {t.reviews.title}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t.reviews.subtitle}
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {displayReviews.slice(0, 6).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="rounded-3xl bg-card border border-border/70 p-6 shadow-md hover:shadow-xl hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < item.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-border'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed italic mb-6">
                  "{item.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {item.country || 'Traveler'}
                  </span>
                </div>
                {item.isUser && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                    New
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Review Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t.reviews.writeReview}
              </h3>
              <p className="text-xs text-muted-foreground">
                Help fellow travelers by sharing your impressions
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-emerald-400">{t.reviews.thankYou}</h4>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Star selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t.reviews.yourRating}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-border'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-primary">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Name field */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t.reviews.yourName}
                </label>
                <input
                  type="text"
                  placeholder={t.reviews.namePlaceholder}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              {/* Comment field */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t.reviews.yourReview}
                </label>
                <textarea
                  rows={3}
                  placeholder={t.reviews.reviewPlaceholder}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full bg-secondary/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t.reviews.submit}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};
