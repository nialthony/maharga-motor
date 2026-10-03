import React, { useEffect, useState } from 'react';
import { isStoragePath, resolveImageUrl } from '../../lib/imageStorage';

// Gambar transparan 1x1 — dipakai sebagai placeholder agar <img> tetap ada
// (layout tidak bergeser) selama Signed URL belum selesai dibuat.
const TRANSPARENT_PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * <UnitImage> — menampilkan foto unit dari Supabase private storage.
 *
 * Kenapa komponen, bukan langsung <img src={unit.images[0]}>:
 *   Kolom units.images kini berisi PATH storage (mis. "units/1727_foto.jpg"),
 *   bukan base64. Path itu tidak bisa dipakai langsung; harus ditukar menjadi
 *   Signed URL lewat API Supabase (async, berlaku 1 jam, di-cache di memori).
 *
 * Pemakaian:
 *   <UnitImage path={unit.images?.[0]} alt={unit.model} className="w-full h-full object-cover" />
 *
 * Nilai yang sudah berupa URL web / base64 lama akan dilewatkan apa adanya,
 * sehingga data lama tetap tampil tanpa migrasi.
 */
export default function UnitImage({ path, alt = '', className = '', ...rest }) {
  const value = typeof path === 'string' ? path.trim() : '';
  const needsResolve = isStoragePath(value);

  // Hasil resolusi disimpan bersama path-nya. Kalau `path` berubah, hasil lama
  // otomatis dianggap basi (tidak perlu setState sinkron di dalam effect) —
  // ini juga mencegah foto lama sempat tampil untuk unit yang berbeda.
  const [resolved, setResolved] = useState({ path: null, url: null });

  useEffect(() => {
    if (!needsResolve) return undefined;

    let active = true;
    resolveImageUrl(value).then((url) => {
      if (active) setResolved({ path: value, url: url || null });
    });

    return () => { active = false; };
  }, [value, needsResolve]);

  // Path storage yang belum teresolusi -> placeholder transparan (layout tetap).
  const src = needsResolve
    ? (resolved.path === value ? (resolved.url || '') : '')
    : value;

  return (
    <img
      src={src || TRANSPARENT_PX}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      {...rest}
    />
  );
}
