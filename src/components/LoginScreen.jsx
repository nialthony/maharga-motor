import React, { useState } from 'react';
import { 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Users
} from 'lucide-react';

export default function LoginScreen({ employees = [], onLoginSuccess }) {
  const [selectedUsername, setSelectedUsername] = useState(() => {
    return employees.length > 0 ? employees[0].username : 'owner';
  });
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedEmployee = employees.find(
    e => e.username.toLowerCase() === selectedUsername.toLowerCase()
  ) || employees[0];

  const handleSelectAccount = (username) => {
    setSelectedUsername(username);
    setPin(''); // Hapus input PIN saat ganti akun
    setErrorMsg('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pin.trim()) {
      setErrorMsg('Silakan masukkan PIN keamanan Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const found = employees.find(
        emp => emp.username.toLowerCase() === selectedUsername.toLowerCase()
      );

      if (!found) {
        setErrorMsg('Akun staf tidak ditemukan.');
        setIsLoading(false);
        return;
      }

      if (found.status === 'suspended' || found.status === 'inactive') {
        setErrorMsg('Akun ini sedang dinonaktifkan. Hubungi Owner showroom.');
        setIsLoading(false);
        return;
      }

      if (String(found.pin).trim() === pin.trim()) {
        onLoginSuccess(found);
      } else {
        setErrorMsg('PIN yang Anda masukkan salah. Silakan coba kembali.');
        setIsLoading(false);
      }
    }, 250);
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

        {/* Login Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Autentikasi Staf
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pilih akun staf Anda dan masukkan PIN untuk masuk ke sistem.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Account Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
                <span>Pilih Akun:</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {employees.length} Akun
                </span>
              </label>

              <div className="relative">
                <select
                  value={selectedUsername}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.username} className="bg-zinc-950 text-zinc-100 py-2">
                      {emp.name} — ({emp.role.toUpperCase()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              {/* Selected Profile Preview Pill */}
              {selectedEmployee && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400 font-mono">
                      {selectedEmployee.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200 leading-tight">
                        {selectedEmployee.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        @{selectedEmployee.username}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRoleBadgeStyle(selectedEmployee.role)}`}>
                    {selectedEmployee.role.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* PIN Input (No Hint) */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
                <span>PIN Keamanan:</span>
                <span className="text-[10px] text-zinc-500 font-mono">4-6 Digit</span>
              </label>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  autoFocus
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="Ketik PIN Anda..."
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Hanya angka
                    setPin(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold tracking-widest text-center text-lg focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !pin.trim()}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 min-h-[48px] mt-2 active:scale-[0.99]"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
