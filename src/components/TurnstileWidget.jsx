import React, { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile Captcha Widget Component
 * Digunakan jika Supabase Auth mengaktifkan Captcha Protection.
 * Membaca Site Key dari VITE_TURNSTILE_SITE_KEY.
 */
export default function TurnstileWidget({ onVerify, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let isMounted = true;

    // Load Cloudflare Turnstile script dynamically if not present
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
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const isLight = document.documentElement.classList.contains('light');
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted) onVerify?.(token);
          },
          'expired-callback': () => {
            if (isMounted) onExpire?.();
          },
          'error-callback': (err) => {
            if (isMounted) onError?.(err);
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
  }, [siteKey, onVerify, onExpire, onError]);

  if (!siteKey) return null;

  return (
    <div className="flex justify-center my-2 overflow-hidden rounded-xl">
      <div ref={containerRef} className="cf-turnstile w-full max-w-[300px]" />
    </div>
  );
}
