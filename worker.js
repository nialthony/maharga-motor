/**
 * Cloudflare Worker Entry Point for Maharga Motor Showroom System (cekrego.net)
 * 
 * Mengimplementasikan:
 * 1. HTTP -> HTTPS (301 Permanent Redirect)
 * 2. 404 Sungguhan untuk Dotfiles (/.env, /.git) dan File Sensitif (*.sql, *.json, *.env)
 * 3. 6 Security Response Headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
 * 4. Cache-Control: private, no-store untuk dokumen HTML SPA
 */

const SECURITY_HEADERS = {
  // 1. HTTP Strict Transport Security (HSTS)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  
  // 2. Content Security Policy (CSP)
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://ouuxgwskivkugrndgsiv.supabase.co; media-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  
  // 3. Mencegah MIME-sniffing
  "X-Content-Type-Options": "nosniff",
  
  // 4. Mencegah Clickjacking (Frame Embedding)
  "X-Frame-Options": "DENY",
  
  // 5. Pembatasan Pengiriman Referrer
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // 6. Nonaktifkan Fitur Sensitif Browser yang Tidak Digunakan
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()"
};

// Regex untuk mendeteksi dotfiles atau ekstensi berkas non-SPA yang harus 404 jika tidak ada
const BLOCKED_FILE_REGEX = /(\/\.[a-zA-Z0-9_\-]+|\.(env|git|sql|json|yml|yaml|toml|bak|config|lock|md|sh|ps1))$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Force HTTPS Redirect (301)
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    if (proto === "http") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    // 2. Cegah SPA Fallback untuk Dotfiles dan Berkas Konfigurasi Sensitif (404 Sungguhan)
    if (BLOCKED_FILE_REGEX.test(url.pathname)) {
      return new Response("404 Not Found", {
        status: 404,
        statusText: "Not Found",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          ...SECURITY_HEADERS,
          "Cache-Control": "no-store, max-age=0"
        }
      });
    }

    // 3. Ambil berkas statis dari Cloudflare Assets
    let response;
    try {
      response = await env.ASSETS.fetch(request);
    } catch {
      return new Response("Internal Server Error", { status: 500 });
    }

    // 4. Bungkus response untuk menginjeksi Security Headers
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newHeaders.set(key, value);
    }

    // 5. Atur Cache-Control: Dokumen HTML SPA wajib private, no-store
    const contentType = newHeaders.get("content-type") || "";
    if (contentType.includes("text/html") || url.pathname === "/" || url.pathname === "") {
      newHeaders.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
      newHeaders.set("Pragma", "no-cache");
      newHeaders.set("Expires", "0");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  },
};
