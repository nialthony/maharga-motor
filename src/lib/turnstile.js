/**
 * Cloudflare Turnstile Configuration
 * Membaca VITE_TURNSTILE_SITE_KEY dari environment variable dengan fallback default site key.
 */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAFDHeft5-__nUpNG';
