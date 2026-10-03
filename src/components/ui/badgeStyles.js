// ==============================================================================
// PALET & UKURAN BADGE (Maharga Motor)
// ==============================================================================
// Dipisah dari Badge.jsx agar file komponen hanya mengekspor komponen
// (menjaga Fast Refresh React tetap bekerja).
//
// Warna di sini disamakan 1:1 dengan kelas Tailwind yang dipakai badge lama,
// supaya penggantian ke komponen <Badge> tidak mengubah tampilan sama sekali.
// ==============================================================================

export const BADGE_VARIANTS = {
  zinc: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  zincLight: 'bg-zinc-800 text-zinc-200 border-zinc-700',
  zincAmber: 'bg-zinc-800 text-amber-400 border-zinc-700',
  zincDark: 'bg-zinc-950/90 text-amber-400 border-zinc-800',
  zincSolid: 'bg-zinc-950 text-amber-400 border-zinc-800',
  zincPlain: 'bg-zinc-950 border-zinc-800',
  emerald: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  emeraldSoft: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  emeraldDual: 'bg-emerald-500/10 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-800',
  amber: 'bg-amber-950 text-amber-400 border-amber-800',
  amberSoft: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  amberSoftDual: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30',
  amberStrong: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  yellow: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
  light: 'bg-zinc-100 text-zinc-800 border-zinc-300'
};

export const BADGE_SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px] font-bold',
  xsMd: 'px-1.5 py-0.5 text-xs font-bold',
  sm: 'px-2 py-0.5 text-[10px] font-bold',
  smWide: 'px-2.5 py-0.5 text-[10px] font-bold',
  md: 'px-2 py-0.5 text-xs font-bold',
  base: 'px-2 py-0.5',
  lg: 'px-2.5 py-1 text-xs font-bold',
  xlg: 'px-3 py-1.5 text-xs font-bold'
};

export const BADGE_SHAPES = {
  rounded: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  pill: 'rounded-full'
};
