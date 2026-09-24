/**
 * Cloudflare Worker Entry Point for Maharga Motor Showroom System
 * Serves Vite SPA static assets with fallback routing.
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
