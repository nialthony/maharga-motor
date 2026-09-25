import { createClient } from '@supabase/supabase-js';

// Kredensial Resmi Supabase dari Build Environment
const DEFAULT_SUPABASE_URL = 'https://ouuxgwskivkugrndgsiv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_63sqg2cApl4sPTHttI299g_mdkynvk8';

// Pastikan penyimpanan lokal lama dihapus bersih dari browser
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(['maharga', 'supabase', 'url'].join('_'));
    localStorage.removeItem(['maharga', 'supabase', 'anon', 'key'].join('_'));
  }
} catch {
  // ignore
}

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                 import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 
                 import.meta.env?.SUPABASE_PUBLISHABLE_KEY;
  
  return { 
    url: envUrl || DEFAULT_SUPABASE_URL, 
    anonKey: envKey || DEFAULT_SUPABASE_ANON_KEY, 
    source: envUrl && envKey ? 'env' : 'cloud_default' 
  };
};

export const isSupabaseConfigured = () => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
};

const config = getSupabaseConfig();

// Inisialisasi Supabase Client dengan Native Session Storage
export const supabase = isSupabaseConfigured()
  ? createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

// ==========================================
// Penanganan Error Otorisasi Global (401 / 403)
// ==========================================
export const handleAuthError = async (error) => {
  if (!error) return;
  const msg = String(error.message || '');
  const status = error.status || error.code;

  if (
    status === 401 || 
    status === 403 || 
    status === '401' || 
    status === '403' || 
    status === 'PGRST301' ||
    msg.toLowerCase().includes('jwt') ||
    msg.toLowerCase().includes('token') ||
    msg.toLowerCase().includes('unauthorized') ||
    msg.toLowerCase().includes('forbidden')
  ) {
    console.warn('Sesi terputus atau hak akses ditolak (401/403). Mengeluarkan sesi login...');
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('maharga_auth_user');
      }
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
  }
};

// ==========================================
// Helper Supabase Private Storage (Signed URLs)
// ==========================================
const STORAGE_BUCKET = 'showroom-assets';

/**
 * Dapatkan Signed URL (berlaku 1 jam) untuk foto di bucket private showroom-assets
 */
export const getStorageImageUrl = async (pathOrUrl) => {
  if (!pathOrUrl) return '';
  // Jika sudah berupa URL publik atau data URL base64 lama
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  if (!supabase) return pathOrUrl;

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(pathOrUrl, 3600); // 1 jam masa berlaku signed URL

    if (error || !data?.signedUrl) {
      return pathOrUrl;
    }
    return data.signedUrl;
  } catch (err) {
    console.warn('Gagal membuat signed URL storage:', err);
    return pathOrUrl;
  }
};

/**
 * Upload gambar baru (Blob / File) ke bucket private showroom-assets
 * Mengembalikan path file storage (bukan base64!)
 */
export const uploadImageToStorage = async (fileOrBlob, subfolder = 'units') => {
  if (!supabase) throw new Error('Supabase client tidak tersedia');

  const fileExt = fileOrBlob.name ? fileOrBlob.name.split('.').pop() : 'jpg';
  const cleanExt = (fileExt || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filePath = `${subfolder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileOrBlob, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    await handleAuthError(error);
    throw error;
  }

  return data.path;
};

export const testSupabaseConnection = async (url, key) => {
  try {
    const testClient = createClient(url, key);
    const { data, error } = await testClient.from('units').select('id').limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
