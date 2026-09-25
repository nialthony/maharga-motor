#!/usr/bin/env node
/**
 * MAHARGA MOTOR - SCRIPT MIGRASI GAMBAR BASE64 KE SUPABASE STORAGE
 * 
 * Membaca data base64 (data:image/...) dari tabel units di database Supabase,
 * mengonversinya menjadi binary buffer, mengunggah ke bucket private 'showroom-assets',
 * lalu memperbarui kolom units.images dengan array path storage.
 * 
 * Penggunaan:
 *   node scripts/migrate-images-to-storage.js <SUPABASE_SERVICE_ROLE_KEY>
 * 
 * Contoh:
 *   node scripts/migrate-images-to-storage.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ouuxgwskivkugrndgsiv.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'showroom-assets';

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ ERROR: Supabase Service Role Key diperlukan untuk menjalankan migrasi data lama.');
  console.error('Jalankan dengan:');
  console.error('  node scripts/migrate-images-to-storage.js <SERVICE_ROLE_KEY>\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function migrateImages() {
  console.log(`\n🚀 Memulai migrasi gambar base64 ke bucket '${BUCKET_NAME}' di ${SUPABASE_URL}...\n`);

  // 1. Pastikan bucket showroom-assets ada
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.error('❌ Gagal memeriksa bucket:', bucketErr.message);
    process.exit(1);
  }

  const hasBucket = buckets.some(b => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
  if (!hasBucket) {
    console.log(`Creating private bucket '${BUCKET_NAME}'...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 5242880
    });
    if (createErr) {
      console.error('❌ Gagal membuat bucket:', createErr.message);
      process.exit(1);
    }
  }

  // 2. Ambil seluruh data units
  const { data: units, error: unitsErr } = await supabase
    .from('units')
    .select('id, brand, model, plate, images');

  if (unitsErr) {
    console.error('❌ Gagal membaca tabel units:', unitsErr.message);
    process.exit(1);
  }

  console.log(`📦 Ditemukan ${units.length} unit motor. Memeriksa gambar base64...\n`);

  let totalMigratedUnits = 0;
  let totalUploadedImages = 0;

  for (const unit of units) {
    const images = Array.isArray(unit.images) ? unit.images : [];
    let hasBase64 = false;
    const newImagePaths = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        hasBase64 = true;
        try {
          // Parse data URL format: data:image/jpeg;base64,...
          const matches = img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!matches) {
            newImagePaths.push(img);
            continue;
          }

          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const storagePath = `units/${unit.id}_img_${i + 1}_${Date.now()}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, buffer, {
              contentType: `image/${matches[1]}`,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadErr) {
            console.warn(`  ⚠️ Gagal upload foto unit #${unit.id}:`, uploadErr.message);
            newImagePaths.push(img);
          } else {
            newImagePaths.push(storagePath);
            totalUploadedImages++;
            console.log(`  ✅ Unit #${unit.id} (${unit.plate}): Foto ${i + 1} diunggah -> ${storagePath}`);
          }
        } catch (err) {
          console.error(`  ❌ Error memproses foto unit #${unit.id}:`, err.message);
          newImagePaths.push(img);
        }
      } else {
        // Bukan base64 (URL web biasa atau path yang sudah dimigrasi)
        newImagePaths.push(img);
      }
    }

    if (hasBase64) {
      const { error: updateErr } = await supabase
        .from('units')
        .update({ images: newImagePaths })
        .eq('id', unit.id);

      if (updateErr) {
        console.error(`  ❌ Gagal update kolom images unit #${unit.id}:`, updateErr.message);
      } else {
        totalMigratedUnits++;
        console.log(`  💾 Unit #${unit.id} berhasil diperbarui di database!\n`);
      }
    }
  }

  console.log('----------------------------------------------------');
  console.log(`🎉 MIGRASI SELESAI:`);
  console.log(`   - Total unit diperbarui: ${totalMigratedUnits}`);
  console.log(`   - Total gambar diunggah ke storage: ${totalUploadedImages}`);
  console.log('----------------------------------------------------\n');
}

migrateImages().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
