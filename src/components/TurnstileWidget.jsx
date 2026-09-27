import React, { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile Captcha Widget Component
 * Digunakan untuk Cloudflare Turnstile bot protection di Supabase Auth.
 * Membaca Site Key dari VITE_TURNSTILE_SITE_KEY.
 */
export default function TurnstileWidget({ onVerify, onExpire, onError, resetKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

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
            // ignore
          }
          widgetIdRef.current = null;
        }

        const isLight = document.documentElement.classList.contains('light');
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted) callbacksRef.current.onVerify?.(token);
          },
          'expired-callback': () => {
            if (isMounted) callbacksRef.current.onExpire?.();
          },
          'error-callback': (err) => {
            if (isMounted) callbacksRef.current.onError?.(err);
          },
          theme: isLight ? 'light' : 'dark',
          size: 'flexible'
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn('Turnstile render warning:', err);
      }
    };

    loadScript()
      .then(() => {
        if (window.turnstile) {
          renderWidget();
        } else {
          const checkInterval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkInterval);
              renderWidget();
            }
          }, 100);
          setTimeout(() => clearInterval(checkInterval), 5000);
        }
      })
      .catch((err) => {
        console.error('Failed to load Turnstile script:', err);
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
        console.warn('Turnstile reset error:', err);
      }
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <div className="flex justify-center my-2 overflow-hidden rounded-xl">
      <div ref={containerRef} className="cf-turnstile w-full max-w-[300px]" />
    </div>
  );
}
