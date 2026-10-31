import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, LogOut, ShieldCheck, RotateCw, ArrowLeft, Phone, Calendar } from 'lucide-react';
import { CountryData } from 'react-phone-input-2';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Language, useTranslation } from '@/lib/i18n';
import { PhoneInputField } from '@/components/PhoneInputField';
import {
  getCurrentUser, logout, isoToFlagEmoji, getCountryName,
  normalizePhone, isPhoneTaken, sendOtp, verifyOtp, clearOtp,
  updateUserPhone, OTP_TTL_SECONDS, AppUser
} from '@/lib/auth';

interface ProfileModalProps {
  lang: Language;
  onClose: () => void;
}

type View = 'view' | 'changePhone' | 'otp';

export const ProfileModal = ({ lang, onClose }: ProfileModalProps) => {
  const t = useTranslation(lang);
  const [user, setUser] = useState<AppUser | null>(() => getCurrentUser());
  const [view, setView] = useState<View>('view');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [phoneRaw, setPhoneRaw] = useState('');
  const [countryIso2, setCountryIso2] = useState('uz');
  const [pendingPhoneE164, setPendingPhoneE164] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(OTP_TTL_SECONDS);

  useEffect(() => {
    if (view !== 'otp') return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [view, countdown]);

  if (!user) return null;

  const resetErrors = () => setError('');

  const handlePhoneChange = (value: string, country: CountryData) => {
    setPhoneRaw(value);
    setCountryIso2(country.countryCode);
    resetErrors();
  };

  const handleSendChangeCode = (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const e164 = normalizePhone(phoneRaw, countryIso2);
    if (!e164) {
      setError(t.auth.invalidPhone);
      return;
    }
    if (isPhoneTaken(e164, user.id)) {
      setError(t.auth.phoneTaken);
      return;
    }

    setPendingPhoneE164(e164);
    const demoCode = sendOtp(e164);
    setCountdown(OTP_TTL_SECONDS);
    setOtpCode('');
    setView('otp');
    toast.message(`Demo OTP (${e164}): ${demoCode}`, { duration: 6000 });
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    const demoCode = sendOtp(pendingPhoneE164);
    setCountdown(OTP_TTL_SECONDS);
    setOtpCode('');
    toast.message(`Demo OTP (${pendingPhoneE164}): ${demoCode}`, { duration: 6000 });
  };

  const handleVerifyChangeOtp = (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (otpCode.length !== 6 || !verifyOtp(pendingPhoneE164, otpCode)) {
      setError(t.auth.invalidOtp);
      return;
    }

    setSubmitting(true);
    const updated = updateUserPhone(user.id, pendingPhoneE164, countryIso2);
    clearOtp(pendingPhoneE164);
    setSubmitting(false);

    if (updated) setUser(updated);
    toast.success(t.auth.phoneUpdated, { duration: 2500 });
    setView('view');
  };

  const handleLogout = () => {
    logout();
    toast.success(t.auth.logoutSuccess, { duration: 2000 });
    onClose();
  };

  const initials = `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase();
  const formattedMemberSince = new Date(user.createdAt).toLocaleDateString();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border/60 bg-secondary/30">
            <div className="flex items-center gap-2">
              {view !== 'view' && (
                <button
                  onClick={() => {
                    setView(view === 'otp' ? 'changePhone' : 'view');
                    resetErrors();
                  }}
                  className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {view === 'view' && t.auth.profileTitle}
                {view === 'changePhone' && t.auth.changePhone}
                {view === 'otp' && t.auth.otpTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}

            {/* PROFILE VIEW */}
            {view === 'view' && (
              <>
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-2xl shadow-lg">
                    {initials || <ShieldCheck className="w-8 h-8" />}
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-black text-foreground">
                      {user.firstName} {user.lastName}
                    </h4>
                    <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <span className="text-base">{isoToFlagEmoji(user.countryIso2)}</span>
                      <span>{getCountryName(user.countryIso2, lang)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/40 border border-border/60 p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">+{user.phoneE164.replace('+', '')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      {t.auth.memberSince}: <span className="text-foreground font-semibold">{formattedMemberSince}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPhoneRaw(user.phoneE164.replace('+', ''));
                    setCountryIso2(user.countryIso2);
                    setView('changePhone');
                    resetErrors();
                  }}
                  className="w-full py-3 rounded-xl border border-border/80 hover:bg-secondary text-foreground text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  {t.auth.changePhone}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t.auth.logout}
                </button>
              </>
            )}

            {/* CHANGE PHONE VIEW */}
            {view === 'changePhone' && (
              <form onSubmit={handleSendChangeCode} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t.auth.newPhoneNumber}
                  </label>
                  <PhoneInputField
                    lang={lang}
                    value={phoneRaw}
                    countryIso2={countryIso2}
                    onChange={handlePhoneChange}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {t.auth.sendCode}
                </button>
              </form>
            )}

            {/* OTP VIEW */}
            {view === 'otp' && (
              <form onSubmit={handleVerifyChangeOtp} className="space-y-5">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>

                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    {t.auth.otpSubtitle}
                  </p>

                  <InputOTP maxLength={6} value={otpCode} onChange={(val) => { setOtpCode(val); resetErrors(); }}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="w-11 h-12 sm:w-12 sm:h-14 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  <p className="text-[11px] text-muted-foreground text-center max-w-xs">
                    {t.auth.otpDemoNote}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? '...' : t.auth.verify}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs">
                  {countdown > 0 ? (
                    <span className="text-muted-foreground font-mono tabular-nums">
                      00:{String(countdown).padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-primary font-bold hover:underline flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      {t.auth.resendCode}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
