import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, Lock, User as UserIcon, ArrowLeft, Eye, EyeOff, KeyRound
} from 'lucide-react';
import { CountryData } from 'react-phone-input-2';
import { Language, useTranslation } from '@/lib/i18n';
import { PhoneInputField } from '@/components/PhoneInputField';
import {
  normalizePhone, isPhoneTaken, findUserByPhone, registerUser, loginUser, resetPassword
} from '@/lib/auth';

interface AuthModalProps {
  lang: Language;
  onClose: () => void;
  initialView?: 'login' | 'register';
  onAuthenticated?: () => void;
}

type View = 'login' | 'register' | 'forgotPassword';
type ForgotStep = 'phone' | 'newPassword';

const defaultCountryForLang = (lang: Language) => (lang === 'ru' ? 'ru' : lang === 'uz' ? 'uz' : 'us');

export const AuthModal = ({ lang, onClose, initialView = 'login', onAuthenticated }: AuthModalProps) => {
  const t = useTranslation(lang);
  const [view, setView] = useState<View>(initialView);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared phone state
  const [phoneRaw, setPhoneRaw] = useState('');
  const [countryIso2, setCountryIso2] = useState(defaultCountryForLang(lang));

  // Login fields
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password flow - phone number, then straight to a new password.
  // No SMS/OTP step is used anywhere in this app.
  const [forgotStep, setForgotStep] = useState<ForgotStep>('phone');
  const [resetPhoneE164, setResetPhoneE164] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const resetErrors = () => setError('');

  const handlePhoneChange = (value: string, country: CountryData) => {
    setPhoneRaw(value);
    setCountryIso2(country.countryCode);
    resetErrors();
  };

  const goToForgotPassword = () => {
    setForgotStep('phone');
    setResetPhoneE164('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setView('forgotPassword');
    resetErrors();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const e164 = normalizePhone(phoneRaw, countryIso2);
    if (!e164) {
      setError(t.auth.invalidPhone);
      return;
    }
    if (!loginPassword) {
      setError(t.auth.requiredField);
      return;
    }

    setSubmitting(true);
    const user = await loginUser(e164, loginPassword);
    setSubmitting(false);

    if (!user) {
      setError(t.auth.invalidCredentials);
      return;
    }

    toast.success(t.auth.loginSuccess, { duration: 2500 });
    onAuthenticated?.();
    onClose();
  };

  // Registration creates the account directly - no SMS/OTP verification step.
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (!firstName.trim() || !lastName.trim()) {
      setError(t.auth.requiredField);
      return;
    }

    const e164 = normalizePhone(phoneRaw, countryIso2);
    if (!e164) {
      setError(t.auth.invalidPhone);
      return;
    }
    if (isPhoneTaken(e164)) {
      setError(t.auth.phoneTaken);
      return;
    }
    if (regPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setSubmitting(true);
    await registerUser({
      firstName,
      lastName,
      phoneE164: e164,
      countryIso2,
      password: regPassword
    });
    setSubmitting(false);

    toast.success(t.auth.registerSuccess, { duration: 2500 });
    onAuthenticated?.();
    onClose();
  };

  // Step 1 of "forgot password": confirm the phone number belongs to an account.
  const handleForgotPhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const e164 = normalizePhone(phoneRaw, countryIso2);
    if (!e164) {
      setError(t.auth.invalidPhone);
      return;
    }
    if (!findUserByPhone(e164)) {
      setError(t.auth.phoneNotFound);
      return;
    }

    setResetPhoneE164(e164);
    setForgotStep('newPassword');
  };

  // Step 2 of "forgot password": set the new password directly, no OTP.
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (newPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setSubmitting(true);
    const updated = await resetPassword(resetPhoneE164, newPassword);
    setSubmitting(false);

    if (!updated) {
      setError(t.auth.phoneNotFound);
      return;
    }

    toast.success(t.auth.passwordResetSuccess, { duration: 3000 });
    setLoginPassword('');
    setView('login');
    resetErrors();
  };

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
              {view === 'forgotPassword' && (
                <button
                  onClick={() => {
                    if (forgotStep === 'newPassword') {
                      setForgotStep('phone');
                      resetErrors();
                    } else {
                      setView('login');
                      resetErrors();
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-foreground">
                  {view === 'login' && t.auth.loginTitle}
                  {view === 'register' && t.auth.registerTitle}
                  {view === 'forgotPassword' && t.auth.forgotPassword}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {view === 'login' && t.auth.loginSubtitle}
                  {view === 'register' && t.auth.registerSubtitle}
                  {view === 'forgotPassword' && t.auth.resetPasswordSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}

            {/* LOGIN VIEW */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t.auth.phoneNumber}
                  </label>
                  <PhoneInputField
                    lang={lang}
                    value={phoneRaw}
                    countryIso2={countryIso2}
                    onChange={handlePhoneChange}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.auth.password}
                    </label>
                    <button
                      type="button"
                      onClick={goToForgotPassword}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        resetErrors();
                      }}
                      className="w-full bg-secondary/50 border border-border/70 rounded-xl pl-10 pr-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all disabled:opacity-60"
                >
                  {submitting ? '...' : t.auth.login}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  {t.auth.noAccount}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      resetErrors();
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    {t.auth.switchToRegister}
                  </button>
                </p>
              </form>
            )}

            {/* REGISTER VIEW - creates the account directly, no SMS/OTP step */}
            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      {t.auth.firstName}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          resetErrors();
                        }}
                        className="w-full bg-secondary/50 border border-border/70 rounded-xl pl-10 pr-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      {t.auth.lastName}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        resetErrors();
                      }}
                      className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t.auth.phoneNumber}
                  </label>
                  <PhoneInputField
                    lang={lang}
                    value={phoneRaw}
                    countryIso2={countryIso2}
                    onChange={handlePhoneChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      {t.auth.password}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          resetErrors();
                        }}
                        className="w-full bg-secondary/50 border border-border/70 rounded-xl pl-10 pr-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      {t.auth.confirmPassword}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          resetErrors();
                        }}
                        className="w-full bg-secondary/50 border border-border/70 rounded-xl pl-10 pr-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all disabled:opacity-60"
                >
                  {submitting ? '...' : t.auth.register}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  {t.auth.haveAccount}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      resetErrors();
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    {t.auth.switchToLogin}
                  </button>
                </p>
              </form>
            )}

            {/* FORGOT PASSWORD VIEW - phone number, then a new password. No OTP. */}
            {view === 'forgotPassword' && forgotStep === 'phone' && (
              <form onSubmit={handleForgotPhoneSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t.auth.phoneNumber}
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all"
                >
                  {t.auth.continueBtn}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      resetErrors();
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    {t.auth.backToLogin}
                  </button>
                </p>
              </form>
            )}

            {view === 'forgotPassword' && forgotStep === 'newPassword' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">+{resetPhoneE164.replace('+', '')}</span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t.auth.newPassword}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        resetErrors();
                      }}
                      className="w-full bg-secondary/50 border border-border/70 rounded-xl pl-10 pr-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t.auth.confirmNewPassword}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPasswordConfirm}
                      onChange={(e) => {
                        setNewPasswordConfirm(e.target.value);
                        resetErrors();
                      }}
                      className="w-full bg-secondary/50 border border-border/70 rounded-xl pl-10 pr-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm shadow-md transition-all disabled:opacity-60"
                >
                  {submitting ? '...' : t.auth.resetPasswordButton}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
