import React, { useEffect } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import RoleBadge from './RoleBadge';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm, currentUser }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div 
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Batal keluar"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header & Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
            <LogOut className="w-7 h-7" />
          </div>

          <h3 id="logout-confirm-title" className="text-base font-bold text-zinc-100 font-mono">
            Konfirmasi Keluar Sistem
          </h3>

          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Apakah Anda yakin ingin keluar dari akun <strong className="text-zinc-200">{currentUser?.name || 'Showroom'}</strong>? Sesi login Anda di perangkat ini akan diakhiri.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-400 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Role Aktif:</span>
            <RoleBadge role={currentUser?.role} className="h-5 w-auto" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700/60 hover:border-zinc-600"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
