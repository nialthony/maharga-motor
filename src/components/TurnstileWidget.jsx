import React, { useEffect, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY } from '../lib/turnstile';

/**
 * Cloudflare Turnstile Captcha Widget Component
 * Digunakan untuk Cloudflare Turnstile bot protection di Supabase Auth.
 */
export default function TurnstileWidget({ onVerify, onExpire, onError, resetKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  const siteKey = TURNSTILE_SITE_KEY;

  // Simpan callbacks di ref agar perubahan fungsi parent tidak memicu re-render widget
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  });

  // Effect untuk inisialisasi & render widget sekali saat siteKey tersedia
  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let isMounted = true;

    const loadScript = () => {
      if (window.turnstile) {
        return Promise.resolve();
      }
      if (document.getElementById('cloudflare-turnstile-script')) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'cloudflare-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    };

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      try {
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore cleanup error
          }
          widgetIdRef.current = null;
        }

        const isLight = document.documentElement.classList.contains('light');
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted) {
              setLoadError(null);
              callbacksRef.current.onVerify?.(token);
            }
          },
          'expired-callback': () => {
            if (isMounted) callbacksRef.current.onExpire?.();
          },
          'error-callback': (errCode) => {
            console.error('[Cloudflare Turnstile] Error code:', errCode);
            if (isMounted) {
              setLoadError(
                errCode === '110200' 
                  ? 'Domain ini belum didaftarkan pada Cloudflare Turnstile dashboard.' 
                  : 'Gagal memverifikasi Turnstile (' + (errCode || 'error') + ').'
              );
              callbacksRef.current.onError?.(errCode);
            }
          },
          theme: isLight ? 'light' : 'dark',
          size: 'flexible'
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn('[Cloudflare Turnstile] Render warning:', err);
      }
    };

    loadScript()
      .then(() => {
        if (window.turnstile) {
          renderWidget();
        } else {
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            if (window.turnstile) {
              clearInterval(checkInterval);
              renderWidget();
            } else if (attempts > 50) {
              clearInterval(checkInterval);
              if (isMounted) setLoadError('Gagal memuat skrip Cloudflare Turnstile.');
            }
          }, 100);
        }
      })
      .catch((err) => {
        console.error('[Cloudflare Turnstile] Failed to load script:', err);
        if (isMounted) setLoadError('Koneksi ke challenges.cloudflare.com gagal.');
      });

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup error
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  // Effect untuk reset widget jika resetKey berubah (misal setelah login gagal)
  useEffect(() => {
    if (resetKey && widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (err) {
        console.warn('[Cloudflare Turnstile] Reset error:', err);
      }
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <div className="flex flex-col items-center my-2 overflow-hidden rounded-xl">
      <div ref={containerRef} className="cf-turnstile w-full max-w-[300px] min-h-[65px]" />
      {loadError && (
        <p className="text-[11px] text-rose-400 mt-1 text-center px-2">
          {loadError}
        </p>
      )}
    </div>
  );
}
