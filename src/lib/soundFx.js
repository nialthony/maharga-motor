import loadingSfxUrl from '../sfx/loading_sfx.mp3';

let audioInstance = null;

/**
 * Preload dan unlock audio context pada user gesture awal
 * untuk mencegah restriction browser mobile (iOS Safari / Brave)
 */
export const prepareLoadingSfx = () => {
  try {
    if (typeof window === 'undefined') return;
    if (!audioInstance) {
      audioInstance = new Audio(loadingSfxUrl);
      audioInstance.preload = 'auto';
      audioInstance.load();
    }
  } catch (err) {
    console.debug('Preload soundfx failed:', err);
  }
};

/**
 * Mainkan soundfx loading login Maharga Motor
 */
export const playLoadingSfx = () => {
  try {
    if (typeof window === 'undefined') return;

    if (!audioInstance) {
      audioInstance = new Audio(loadingSfxUrl);
    }

    audioInstance.currentTime = 0;
    audioInstance.volume = 0.85;

    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay policy prevented playback until user gesture
        console.debug('Autoplay soundfx terhalang aturan browser:', err);
      });
    }
  } catch (err) {
    console.warn('Gagal memutar soundfx loading:', err);
  }
};

/**
 * Hentikan soundfx loading saat animasi selesai atau komponen unmount
 */
export const stopLoadingSfx = () => {
  try {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
  } catch (err) {
    console.debug('Gagal menghentikan soundfx:', err);
  }
};

/**
 * Fade out volume perlahan di akhir animasi loading (0.0 - 1.0)
 */
export const fadeLoadingSfx = (factor) => {
  try {
    if (audioInstance && !audioInstance.paused) {
      const clamped = Math.max(0, Math.min(1, factor));
      audioInstance.volume = 0.85 * clamped;
    }
  } catch {
    // ignore
  }
};
