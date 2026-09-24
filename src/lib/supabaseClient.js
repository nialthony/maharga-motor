import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from Vite ENV or Admin Panel LocalStorage setting
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  
  try {
    const customUrl = localStorage.getItem('maharga_supabase_url');
    const customKey = localStorage.getItem('maharga_supabase_anon_key');
    if (customUrl && customKey) {
      return { url: customUrl, anonKey: customKey, source: 'admin_panel' };
    }
  } catch {
    // ignore
  }

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  return { url: '', anonKey: '', source: 'none' };
};

export const isSupabaseConfigured = () => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
};

export const saveSupabaseConfig = (url, anonKey) => {
  try {
    if (!url || !anonKey) {
      localStorage.removeItem('maharga_supabase_url');
      localStorage.removeItem('maharga_supabase_anon_key');
    } else {
      localStorage.setItem('maharga_supabase_url', url.trim());
      localStorage.setItem('maharga_supabase_anon_key', anonKey.trim());
    }
    return true;
  } catch (e) {
    console.error('Failed to save Supabase config', e);
    return false;
  }
};

// Initialize Supabase Client (safe fallback if credentials not provided)
const config = getSupabaseConfig();
export const supabase = isSupabaseConfigured()
  ? createClient(config.url, config.anonKey)
  : null;

// ==========================================
// Cloud PostgreSQL Sync Helpers
// ==========================================

export const testSupabaseConnection = async (url, key) => {
  try {
    const testClient = createClient(url, key);
    const { data, error } = await testClient.from('employees').select('id, name').limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
