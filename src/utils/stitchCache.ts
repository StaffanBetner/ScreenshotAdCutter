import { CutZone, StitchOptions } from '../types';
import { stitchImage, normalizeCutZones } from './stitcher';

export interface CachedStitchResult {
  cacheKey: string;
  canvas: HTMLCanvasElement;
  blobUrl: string;
  totalKeptHeight: number;
  totalCutHeight: number;
  cutCount: number;
}

// In-memory cache storage (keeps up to 6 results to easily retain comparison / preview / toggle states)
const MAX_CACHE_SIZE = 6;
const cache = new Map<string, CachedStitchResult>();
const pendingPromises = new Map<string, Promise<CachedStitchResult>>();

/**
 * Generates a deterministic cache key from image details, cut zones, and options.
 */
export function getStitchCacheKey(
  img: HTMLImageElement,
  cutZones: CutZone[],
  options: StitchOptions = {}
): string {
  const activeNormalized = normalizeCutZones(cutZones, img.naturalHeight);
  const cutsSignature = activeNormalized
    .map((c) => `${c.startY}-${c.endY}`)
    .join('|');
  const seamSig = options.showSeamMarkers
    ? `seam:${options.seamColor || 'default'}`
    : 'clean';

  // Use image dimensions and safe source fingerprint
  const srcFingerprint =
    img.src.length > 80
      ? `${img.src.substring(0, 30)}_${img.src.length}_${img.src.substring(img.src.length - 30)}`
      : img.src;

  return `${img.naturalWidth}x${img.naturalHeight}_${srcFingerprint}::${cutsSignature}::${seamSig}`;
}

/**
 * Returns cached stitch result synchronously if present, or null.
 */
export function getCachedStitch(
  img: HTMLImageElement,
  cutZones: CutZone[],
  options: StitchOptions = {}
): CachedStitchResult | null {
  const key = getStitchCacheKey(img, cutZones, options);
  return cache.get(key) || null;
}

/**
 * Retrieves a cached result or generates, caches, and returns it.
 * Multiple simultaneous calls for the same key reuse the same Promise.
 */
export async function getOrGenerateStitchedImage(
  img: HTMLImageElement,
  cutZones: CutZone[],
  options: StitchOptions = {}
): Promise<CachedStitchResult> {
  const key = getStitchCacheKey(img, cutZones, options);

  const existing = cache.get(key);
  if (existing) {
    return existing;
  }

  // If already generating this exact key, reuse the ongoing promise
  const pending = pendingPromises.get(key);
  if (pending) {
    return pending;
  }

  const promise = new Promise<CachedStitchResult>((resolve) => {
    const stitchResult = stitchImage(img, cutZones, options);
    const canvas = stitchResult.canvas;

    canvas.toBlob(
      (blob) => {
        let blobUrl = '';
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
        } else {
          blobUrl = canvas.toDataURL('image/png');
        }

        const cachedItem: CachedStitchResult = {
          cacheKey: key,
          canvas,
          blobUrl,
          totalKeptHeight: stitchResult.totalKeptHeight,
          totalCutHeight: stitchResult.totalCutHeight,
          cutCount: cutZones.filter((z) => z.enabled).length,
        };

        // Enforce max cache size by revoking and deleting oldest entry
        if (cache.size >= MAX_CACHE_SIZE) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey) {
            const oldestItem = cache.get(oldestKey);
            if (oldestItem && oldestItem.blobUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldestItem.blobUrl);
            }
            cache.delete(oldestKey);
          }
        }

        cache.set(key, cachedItem);
        pendingPromises.delete(key);
        resolve(cachedItem);
      },
      'image/png'
    );
  });

  pendingPromises.set(key, promise);
  return promise;
}

/**
 * Clears all cached stitch entries and revokes created blob URLs.
 */
export function clearStitchCache() {
  cache.forEach((item) => {
    if (item.blobUrl && item.blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.blobUrl);
    }
  });
  cache.clear();
  pendingPromises.clear();
}
