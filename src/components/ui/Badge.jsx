import React from 'react';
import { BADGE_VARIANTS, BADGE_SIZES, BADGE_SHAPES } from './badgeStyles';

// ==============================================================================
// BADGE — KOMPONEN BERSAMA (Maharga Motor)
// ==============================================================================
// Alasan keberadaan komponen ini:
//   Badge sebelumnya ditulis ad-hoc sebagai <span> dengan `border` + `rounded`.
//   Karena <span> ber-display `inline`, saat teksnya terpaksa turun baris di kolom
//   tabel yang sempit (layar HP), CSS memecah kotak itu menjadi beberapa "serpihan
//   baris" dan menggambar border + background + radius BARU di tiap serpihan —
//   terlihat seperti dua pill bertumpuk dengan border terputus.
//
//   Komponen ini memakai `inline-flex` + `whitespace-nowrap` sebagai default,
//   sehingga setiap badge selalu satu kotak utuh di semua ukuran layar.
//
// Pemakaian:
//   <Badge variant="yellow">Workshop Bengkel</Badge>
//   <Badge variant="emerald" size="sm" mono>Aktif</Badge>
//   <Badge variant="zinc">v1.2.0</Badge>
//   <Badge variant="amber" icon={<Wrench className="w-3 h-3" />}>Perbaikan</Badge>
//
// Jika teksnya panjang DAN harus boleh turun baris, set `wrap` (kotak tetap utuh):
//   <Badge variant="zinc" wrap>Catatan servis yang sangat panjang…</Badge>
// ==============================================================================

export default function Badge({
  children,
  variant = 'zinc',
  size = 'sm',
  shape = 'rounded',
  mono = false,
  wrap = false,
  icon = null,
  className = '',
  as: Tag = 'span',
  ...rest
}) {
  const classes = [
    // Inti perbaikan: satu kotak utuh, tidak pernah terpecah antar baris.
    // `gap-1` hanya berpengaruh bila badge punya lebih dari satu anak (mis. ikon + teks),
    // sehingga badge teks biasa tidak berubah sama sekali.
    wrap ? 'inline-block whitespace-normal' : 'inline-flex items-center gap-1 whitespace-nowrap',
    BADGE_SHAPES[shape] || BADGE_SHAPES.rounded,
    BADGE_SIZES[size] || BADGE_SIZES.sm,
    BADGE_VARIANTS[variant] || BADGE_VARIANTS.zinc,
    'border',
    mono ? 'font-mono' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} {...rest}>
      {icon ? <span className="inline-flex items-center shrink-0">{icon}</span> : null}
      {children}
    </Tag>
  );
}
