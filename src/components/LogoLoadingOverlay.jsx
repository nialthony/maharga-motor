import React, { useState, useEffect } from 'react';

/**
 * Animasi Loading Logo Maharga Motor:
 * Logo base grayscale diisi oleh logo versi full color
 * bergerak dari kiri ke kanan secara mulus selama 5 detik saat proses login.
 * Desain bersih tanpa efek glow dan tanpa garis kuning vertikal.
 */
export default function LogoLoadingOverlay({ user, onComplete, duration = 5000 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const startTime = performance.now();

    const updateAnimation = (currentTime) => {
      const elapsed = currentTime - startTime;
      const currentProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(currentProgress);

      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(updateAnimation);
      } else {
        setTimeout(() => {
          onComplete();
        }, 120);
      }
    };

    animationFrameId = requestAnimationFrame(updateAnimation);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [duration, onComplete]);

  // Status subtitle progression disesuaikan dengan durasi 5 detik
  const getStatusText = () => {
    if (progress < 25) return 'Memverifikasi hak akses & PIN keamanan...';
    if (progress < 50) return 'Menghubungkan ke Supabase Cloud Database...';
    if (progress < 75) return 'Sinkronisasi data stok & catatan transaksi...';
    if (progress < 95) return 'Menyiapkan workspace operasional showroom...';
    return `Selamat Datang, ${user?.name || 'Staf Maharga Motor'}!`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden font-sans">
      <div className="relative w-full max-w-md flex flex-col items-center space-y-6">
        
        {/* User Pill Badge */}
        {user && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm animate-fadeIn">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                (user.username || 'MM').slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="text-xs font-semibold text-zinc-200">{user.name}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800">
              {user.role}
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* DUAL-LAYER LOGO: GREYSCALE BASE -> COLORED REVEAL FROM LEFT TO RIGHT */}
        {/* Tanpa efek glow dan tanpa garis kuning vertikal */}
        {/* ============================================================== */}
        <div className="relative w-64 sm:w-80 h-28 sm:h-36 flex items-center justify-center my-2">
          
          {/* Layer 1: Grayscale Base Logo */}
          <img 
            src="/logo.png" 
            alt="Maharga Motor Grayscale Base" 
            className="w-full h-full object-contain filter grayscale opacity-30 brightness-90 select-none pointer-events-none" 
          />

          {/* Layer 2: Colored Logo Filled from Left to Right (Tanpa Glow / Drop Shadow) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{ 
              clipPath: `inset(0 ${100 - progress}% 0 0)`
            }}
          >
            <img 
              src="/logo.png" 
              alt="Maharga Motor Full Color" 
              className="w-full h-full object-contain select-none pointer-events-none" 
            />
          </div>
        </div>

        {/* Clean Progress Tracker & Status Text */}
        <div className="w-full max-w-xs space-y-2.5">
          {/* Progress Bar Track (Clean, Flat, Tanpa Glow Shadow) */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full rounded-full bg-amber-500 transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status Label & Percentage */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-zinc-400 font-medium truncate pr-2">
              {getStatusText()}
            </span>
            <span className="font-mono font-bold text-amber-400 text-xs shrink-0">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
