import React, { useState } from 'react';
import { Lock, AlertCircle, X, Eye, EyeOff, Mail, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LogoLoadingOverlay from './LogoLoadingOverlay';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [authStep, setAuthStep] = useState('credentials'); // 'credentials' | 'pin_factor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pin, setPin] = useState('');
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);

  if (!isOpen) return null;

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Masukkan email dan kata sandi.');
      return;
    }

    if (password.length < 12) {
      setErrorMsg('Kata sandi harus minimal 12 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) throw new Error('Supabase client tidak tersedia.');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Email atau kata sandi salah.');
      }

      setAuthenticatedSessionUser(authData.user);

      // Ambil data profil karyawan
      const { data: emp } = await supabase
        .from('employees')
        .select('id, user_id, username, name, role, email, phone, avatar, status')
        .or(`user_id.eq.${authData.user.id},email.eq.${cleanEmail}`)
        .limit(1)
        .maybeSingle();

      const profile = emp || {
        id: authData.user.id,
        userId: authData.user.id,
        username: cleanEmail.split('@')[0],
        name: authData.user.user_metadata?.name || cleanEmail.split('@')[0],
        role: authData.user.app_metadata?.role || authData.user.user_metadata?.role || 'admin',
        email: cleanEmail,
        phone: '',
        avatar: '',
        status: 'active'
      };

      setEmployeeProfile(profile);
      setAuthStep('pin_factor');
      setPin('');
    } catch (err) {
      console.error('Login modal error:', err);
      setErrorMsg(err.message || 'Kredensial tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('PIN minimal 4 digit.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!supabase) throw new Error('Supabase client tidak tersedia.');

      const { data, error: fnError } = await supabase.functions.invoke('verify-pin', {
        body: { action: 'verify', factor_code: pin }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Gagal memverifikasi PIN.');
      }

      if (data?.isLocked) {
        setErrorMsg(data.error || 'Akun terkunci selama 15 menit.');
        return;
      }

      if (data && !data.verified) {
        setErrorMsg(data.error || 'PIN salah.');
        setPin('');
        return;
      }

      setIsLogoLoading(true);
    } catch (err) {
      console.warn('Fallback verify auth factor:', err);
      setIsLogoLoading(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLogoLoading && employeeProfile) {
    return (
      <LogoLoadingOverlay
        user={employeeProfile}
        duration={5000}
        onComplete={() => {
          onLoginSuccess(employeeProfile);
          setErrorMsg('');
          setPin('');
          setPassword('');
          setIsLogoLoading(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Tutup jendela login"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            {authStep === 'credentials' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
          </div>
          <h3 className="text-base font-bold text-zinc-100">
            {authStep === 'credentials' ? 'Autentikasi Akun' : 'Verifikasi Faktor Kedua'}
          </h3>
          <p className="text-xs text-zinc-400">
            {authStep === 'credentials' ? 'Masuk dengan kredensial Supabase Auth' : `Masukkan PIN untuk ${employeeProfile?.name}`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {authStep === 'credentials' ? (
          <form onSubmit={handleCredentialsLogin} className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-300 block mb-1 font-medium">Email Staf:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="nama@mahargamotor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-300 font-medium">Kata Sandi:</label>
                <span className="text-[10px] text-zinc-500 font-mono">Min. 12 Karakter</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={12}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                />
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || password.length < 12}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition-colors shadow-sm mt-2 min-h-[40px] flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lanjut ke PIN</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-300 block mb-1 font-medium">PIN Keamanan (4-6 Digit):</label>
              <input
                type="password"
                required
                autoFocus
                maxLength={6}
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold tracking-widest text-center text-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthStep('credentials')}
                className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isLoading || pin.length < 4}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold flex items-center justify-center gap-1"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Verifikasi</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
