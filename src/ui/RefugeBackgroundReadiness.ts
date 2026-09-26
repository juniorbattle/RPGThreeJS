export interface RefugeBackgroundReadiness {
  backgroundUrl: string;
  backgroundReady: boolean;
  naturalWidth: number;
  naturalHeight: number;
  error?: string;
}

/** Decode the environment plate before its CSS background is revealed. */
export function preloadRefugeBackground(backgroundUrl: string): Promise<RefugeBackgroundReadiness> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      resolve({
        backgroundUrl,
        backgroundReady: !error && naturalWidth > 0 && naturalHeight > 0,
        naturalWidth,
        naturalHeight,
        ...((error || naturalWidth <= 0 || naturalHeight <= 0)
          ? { error: error ?? 'The refuge background has no decoded dimensions.' }
          : {}),
      });
    };
    // A stalled request must not keep player agency behind the previous surface forever.
    const timeout = setTimeout(() => finish('The refuge background did not load in time.'), 10000);
    image.onload = () => {
      if (typeof image.decode === 'function') {
        void image.decode().then(() => finish(), () => finish('The refuge background could not be decoded.'));
      } else {
        finish();
      }
    };
    image.onerror = () => finish('The refuge background could not be loaded.');
    image.src = backgroundUrl;
  });
}
