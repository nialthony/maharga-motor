import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const securityHeadersPlugin = () => ({
  name: 'security-headers-and-404-guard',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // 404 Sungguhan untuk dotfiles dan file sensitif
      if (req.url && /(\/\.[a-zA-Z0-9_\-]+|\.(env|git|sql|json|yml|yaml|toml|bak|config|lock|md|sh|ps1))$/i.test(req.url.split('?')[0])) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('404 Not Found');
      }

      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://ouuxgwskivkugrndgsiv.supabase.co; media-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
      
      if (req.url === '/' || req.url === '/index.html' || !req.url.includes('.')) {
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      // 404 Sungguhan untuk dotfiles dan file sensitif pada Preview
      if (req.url && /(\/\.[a-zA-Z0-9_\-]+|\.(env|git|sql|json|yml|yaml|toml|bak|config|lock|md|sh|ps1))$/i.test(req.url.split('?')[0])) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('404 Not Found');
      }

      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://ouuxgwskivkugrndgsiv.supabase.co; media-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
      
      if (req.url === '/' || req.url === '/index.html' || !req.url.includes('.')) {
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    securityHeadersPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    allowedHosts: true,
  }
});
