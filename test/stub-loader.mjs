// Node ESM loader: mengarahkan import './supabaseClient' ke stub saat pengujian.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === './supabaseClient') {
    return {
      url: new URL('./supabase-stub.mjs', import.meta.url).href,
      shortCircuit: true
    };
  }
  return nextResolve(specifier, context);
}
