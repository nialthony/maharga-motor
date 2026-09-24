import React, { useState } from 'react';
import { Lock, AlertCircle, X } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, employees }) {
  const [username, setUsername] = useState('owner');
  const [pin, setPin] = useState('8888');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    const found = employees.find(
      emp => emp.username.toLowerCase() === username.toLowerCase() && emp.pin === pin
    );

    if (found) {
      if (found.status === 'suspended') {
        setErrorMsg('Akun ini sedang dinonaktifkan (suspended). Hubungi Owner.');
        return;
      }
      onLoginSuccess(found);
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('Username atau PIN salah! Silakan periksa kembali.');
    }
  };

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
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Autentikasi Staf & Admin</h3>
          <p className="text-xs text-zinc-400">Masuk untuk mengelola sistem Maharga Motor</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 text-xs">
          <div>
            <label className="text-zinc-300 block mb-1 font-medium">Pilih Akun / Username:</label>
            <select
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                const emp = employees.find(u => u.username === e.target.value);
                if (emp) setPin(emp.pin);
              }}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold focus:outline-none focus:border-amber-400"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.username}>
                  {emp.name} ({emp.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-300 block mb-1 font-medium">PIN Keamanan (4-6 Digit):</label>
            <div className="relative">
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold tracking-widest text-center text-base focus:outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block text-center">
              Default Owner PIN: <code className="text-amber-400 font-mono">8888</code> | Admin: <code className="text-amber-400 font-mono">1234</code>
            </span>
          </div>

          <button
            type="submit"
            aria-label="Masuk ke sistem"
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm mt-2 min-h-[44px]"
          >
            Masuk ke Sistem
          </button>
        </form>
      </div>
    </div>
  );
}
