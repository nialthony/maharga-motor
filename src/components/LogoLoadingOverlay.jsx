import React, { useState, useEffect } from 'react';

/**
 * Animasi Loading Logo Maharga Motor:
 * Logo base grayscale diisi secara mulus oleh logo versi full color
 * bergerak dari kiri ke kanan (wipe effect) selama tepat 3 detik saat proses login.
 */
export default function LogoLoadingOverlay({ user, onComplete, duration = 3000 }) {
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
        }, 150);
      }
    };

    animationFrameId = requestAnimationFrame(updateAnimation);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [duration, onComplete]);

  // Status subtitle progression
  const getStatusText = () => {
    if (progress < 30) return 'Memverifikasi hak akses & PIN keamanan...';
    if (progress < 65) return 'Sinkronisasi katalog & database Supabase Cloud...';
    if (progress < 90) return 'Menyiapkan workspace operasional showroom...';
    return `Selamat Datang, ${user?.name || 'Staf Maharga Motor'}!`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden font-sans">
      {/* Dynamic Ambient Background Lights */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/12 rounded-full blur-3xl pointer-events-none transition-all duration-700" 
        style={{ transform: `translate(-50%, -50%) scale(${0.8 + (progress / 100) * 0.4})` }}
      />
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md flex flex-col items-center space-y-6">
        
        {/* User Pill Badge */}
        {user && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-lg animate-fadeIn">
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
        {/* ============================================================== */}
        <div className="relative w-64 sm:w-80 h-28 sm:h-36 flex items-center justify-center my-2">
          
          {/* Layer 1: Grayscale Base Logo */}
          <img 
            src="/logo.png" 
            alt="Maharga Motor Grayscale Base" 
            className="w-full h-full object-contain filter grayscale opacity-25 brightness-75 select-none pointer-events-none" 
          />

          {/* Layer 2: Colored Logo Filled from Left to Right */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-none"
            style={{ 
              clipPath: `inset(0 ${100 - progress}% 0 0)`
            }}
          >
            <img 
              src="/logo.png" 
              alt="Maharga Motor Full Color" 
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.45)] select-none pointer-events-none" 
            />
          </div>

          {/* Vertical Laser Light Beam on Leading Edge */}
          {progress > 1 && progress < 99 && (
            <div 
              className="absolute top-1 bottom-1 w-[2.5px] bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_12px_#f59e0b,0_0_24px_#f59e0b] pointer-events-none rounded-full"
              style={{ 
                left: `${progress}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>

        {/* Progress Tracker & Status Text */}
        <div className="w-full max-w-xs space-y-2.5">
          {/* Progress Bar Track */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-0.5 relative shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all ease-linear"
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
