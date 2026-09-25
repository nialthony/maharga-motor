import React, { useState } from 'react';
import { 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Mail,
  KeyRound,
  ShieldCheck,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LogoLoadingOverlay from './LogoLoadingOverlay';
import { prepareLoadingSfx } from '../lib/soundFx';

export default function LoginScreen({ onLoginSuccess }) {
  // Step 1: Supabase Auth (Email + Password >= 12 chars)
  // Step 2: 2nd Factor Showroom PIN (Server-side hashed bcrypt + lockout)
  const [authStep, setAuthStep] = useState('credentials'); // 'credentials' | 'pin_factor'

  // Step 1 State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 State
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  // General State
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);

  // --- HANDLER STEP 1: Supabase Auth Login ---
  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Silakan masukkan alamat email akun Anda.');
      return;
    }

    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi akun Anda.');
      return;
    }

    if (password.length < 12) {
      setErrorMsg('Kata sandi harus minimal 12 karakter sesuai standar keamanan.');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Koneksi Supabase belum terkonfigurasi dengan benar.');
      }

      // 1. Otentikasi Resmi via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Email atau kata sandi tidak valid. Akses ditolak.');
      }

      // 2. Ambil data profil karyawan yang terhubung
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
        role: authData.user.app_metadata?.role || authData.user.user_metadata?.role || 'sales',
        email: cleanEmail,
        phone: '',
        avatar: '',
        status: 'active'
      };

      if (profile.status === 'suspended' || profile.status === 'inactive') {
        await supabase.auth.signOut();
        throw new Error('Akun ini sedang dinonaktifkan. Hubungi Owner showroom.');
      }

      setEmployeeProfile(profile);

      // Lanjut ke Step 2: Verifikasi PIN Showroom
      setAuthStep('pin_factor');
      setPin('');
      setErrorMsg('');
    } catch (err) {
      console.error('Login gagal:', err);
      setErrorMsg(err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLER STEP 2: Verifikasi Faktor Kedua PIN ---
  const handlePinSubmit = async (pinToVerify = pin) => {
    if (!pinToVerify || pinToVerify.length < 4) {
      setErrorMsg('Masukkan 4 digit PIN keamanan Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    prepareLoadingSfx();

    try {
      if (!supabase) throw new Error('Koneksi database tidak tersedia.');

      // Panggil Supabase Edge Function untuk verifikasi bcrypt di server
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: { action: 'verify', factor_code: pinToVerify }
      });

      if (error) {
        let msg = 'Gagal memverifikasi PIN. Silakan coba lagi.';
        try {
          if (error.context) {
            const errBody = await error.context.json();
            if (errBody?.error) msg = errBody.error;
          }
        } catch {
          msg = error.message || msg;
        }
        console.error('Edge Function verify-pin error:', msg, error);
        setErrorMsg(msg);
        setPin('');
        return;
      }

      if (data?.isLocked) {
        setErrorMsg(data.error || 'Akun terkunci karena 5 kali percobaan gagal. Coba lagi dalam 15 menit.');
        setPin('');
        return;
      }

      if (!data || !data.verified) {
        setRemainingAttempts(data?.remainingAttempts ?? null);
        setErrorMsg(data?.error || 'PIN salah. Silakan coba kembali.');
        setPin('');
        return;
      }

      // PIN Benar -> Tampilkan Animasi Logo 5 Detik
      setIsLogoLoading(true);
    } catch (err) {
      console.error('Error saat verifikasi PIN:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat memverifikasi PIN.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (val) => {
    if (isLoading) return;
    setErrorMsg('');
    if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Otomatis verifikasi begitu 4 digit terisi
        setTimeout(() => handlePinSubmit(nextPin), 150);
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (isLoading) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleCancelPinStep = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setAuthStep('credentials');
    setAuthenticatedSessionUser(null);
    setEmployeeProfile(null);
    setPin('');
    setPassword('');
    setErrorMsg('');
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'admin':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'sales':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'mechanic':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  // Tampilkan Animasi Logo 5 Detik saat login sukses diverifikasi
  if (isLogoLoading && employeeProfile) {
    return (
      <LogoLoadingOverlay
        user={employeeProfile}
        duration={5000}
        onComplete={() => onLoginSuccess(employeeProfile)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center pb-2">
          <img 
            src="/logo.png" 
            alt="Maharga Motor Logo" 
            className="h-16 sm:h-20 w-auto object-contain mx-auto transition-transform hover:scale-105 drop-shadow-md" 
          />
        </div>

        {/* Card Autentikasi */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: FORM SUPABASE AUTH (EMAIL + PASSWORD >= 12 KARAKTER)   */}
          {/* ============================================================== */}
          {authStep === 'credentials' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Masuk Akun Staf Showroom
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Masukkan email terdaftar dan kata sandi minimal 12 karakter.
                </p>
              </div>

              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Alamat Email Staf:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="nama@mahargamotor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors placeholder:text-zinc-600"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Kata Sandi:
                    </label>
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
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors placeholder:text-zinc-600 font-mono"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || password.length < 12}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.99] mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memvalidasi Kredensial...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjut Verifikasi PIN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: VERIFIKASI FAKTOR KEDUA PIN SHOWROOM (SERVER-SIDE)    */}
          {/* ============================================================== */}
          {authStep === 'pin_factor' && employeeProfile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  type="button"
                  onClick={handleCancelPinStep}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Ganti Akun</span>
                </button>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRoleBadgeStyle(employeeProfile.role)}`}>
                  {employeeProfile.role.toUpperCase()}
                </span>
              </div>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Verifikasi PIN Showroom: {employeeProfile.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Masukkan 4 digit PIN faktor kedua untuk membuka sesi operasional.
                </p>
                {remainingAttempts !== null && (
                  <p className="text-[11px] text-amber-400 font-medium">
                    Sisa kesempatan: {remainingAttempts} kali
                  </p>
                )}
              </div>

              {/* PIN Visual Dots */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      pin.length > idx
                        ? 'bg-amber-400 scale-110 shadow-lg shadow-amber-400/50'
                        : 'border-2 border-zinc-700 bg-zinc-950'
                    }`}
                  />
                ))}
              </div>

              {/* Numeric Keypad UX */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(String(num))}
                    disabled={isLoading}
                    className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-lg font-bold font-mono transition-all active:scale-95 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  disabled={isLoading || pin.length === 0}
                  className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-lg font-bold font-mono transition-all active:scale-95 disabled:opacity-50"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={isLoading || pin.length === 0}
                  className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center"
                >
                  Hapus
                </button>
              </div>

              {/* Submit PIN Button */}
              <button
                type="button"
                onClick={() => handlePinSubmit(pin)}
                disabled={isLoading || pin.length < 4}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi PIN Server...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Sistem Showroom</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
