/**
 * Photo handling for the public complaint form.
 *
 * The portal has no object storage (see docs/adr/0004-complaint-image-storage.md),
 * so a photo is stored as a base64 data URL in `grievances.imageUrl`. That means
 * two rules hold here:
 *
 * 1. Never send a `blob:` URL. Those only resolve inside the tab that created
 *    them, so the admin panel would show a broken image forever.
 * 2. Compress before encoding. An untouched phone photo is several megabytes,
 *    which no JSON body limit or rural connection will tolerate.
 */

/** Largest original file we will accept, before compression. */
export const MAX_SOURCE_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Longest edge of the stored image by default. Enough to read a prescription or a bill. */
const MAX_EDGE = 1280;

/**
 * Ceiling for the encoded string. Kept below the backend's 2,000,000-character
 * DTO limit and well below the serverless 4MB request body cap.
 */
const MAX_DATA_URL_LENGTH = 1_800_000;

export interface CompressImageOptions {
  /**
   * Ceiling for the encoded string. Forms that send more than one image pass a
   * smaller value so the whole JSON body still fits the route's limit.
   */
  maxLength?: number;
  /** Maximum width or height in pixels after resizing. Defaults to 1280. */
  maxEdge?: number;
  /** Starting JPEG quality (0–1). Defaults to 0.72. */
  initialQuality?: number;
  /** Lowest JPEG quality before stepping down dimensions. Defaults to 0.4. */
  minQuality?: number;
}

export type CompressionMode = 'balanced' | 'compact';

export interface CompressionPreset extends Required<CompressImageOptions> {
  label: string;
  description: string;
}

/**
 * Fast-upload compression profiles for complaint filing and admin resolution.
 * Smaller base64 payloads upload faster on mobile networks and keep the admin
 * complaints dashboard light when rendering multiple cards at once.
 */
export const COMPLAINT_PHOTO_PRESETS: Record<CompressionMode, CompressionPreset> = {
  balanced: {
    label: 'Standard (~200 KB)',
    description: 'Clear text for prescriptions & bills',
    maxEdge: 1024,
    maxLength: 320_000,
    initialQuality: 0.68,
    minQuality: 0.36,
  },
  compact: {
    label: 'Compact (~100 KB)',
    description: 'Fastest upload & lightest dashboard load',
    maxEdge: 800,
    maxLength: 160_000,
    initialQuality: 0.56,
    minQuality: 0.32,
  },
};

/** Admin complaints panel pagination options and safe ceiling to prevent heavy page loads. */
export const ADMIN_COMPLAINTS_PAGE_LIMITS = [6, 10, 15, 20] as const;
export const DEFAULT_ADMIN_COMPLAINTS_LIMIT = 6;
export const MAX_ADMIN_COMPLAINTS_LIMIT = 20;

export function clampComplaintPageLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) {
    return DEFAULT_ADMIN_COMPLAINTS_LIMIT;
  }
  return Math.min(MAX_ADMIN_COMPLAINTS_LIMIT, Math.floor(limit));
}

const DEFAULT_INITIAL_QUALITY = 0.72;
const MIN_QUALITY = 0.4;

/** Only these can be rendered later, by this tab or any other device. */
const DISPLAYABLE_IMAGE_PATTERN = /^(?:https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i;

/**
 * True when a stored `imageUrl` can actually be shown.
 *
 * Legacy rows written by the old form contain `blob:http://…` values. Those are
 * permanently dead, so treat them (and anything else unrecognised) as "no photo"
 * rather than rendering a broken image.
 */
export function isDisplayableImageUrl(value?: string | null): value is string {
  return typeof value === 'string' && DISPLAYABLE_IMAGE_PATTERN.test(value);
}

/**
 * Estimates the binary byte size of a base64 data URL (or raw string length if
 * not a base64 data URL). Used to display compression savings to users.
 */
export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return dataUrl.length;
  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  if (!/;base64$/i.test(header)) return payload.length;
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatCompressionSummary(originalBytes: number, dataUrl: string): string {
  const compressedBytes = estimateDataUrlBytes(dataUrl);
  const compressedLabel = formatBytes(compressedBytes);
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) {
    return `Optimised to ${compressedLabel}`;
  }
  const originalLabel = formatBytes(originalBytes);
  if (compressedBytes >= originalBytes) {
    return `Optimised (${compressedLabel})`;
  }
  const savedPercent = Math.max(1, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100));
  return `${originalLabel} → ${compressedLabel} (${savedPercent}% smaller)`;
}

/**
 * Returns a human-readable problem with the chosen file, or null when it is
 * acceptable. Pure so the form can reject early and tests can cover the rules.
 */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Please upload a JPEG, PNG or WebP image.';
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return 'Image must be smaller than 5 MB.';
  }
  if (file.size === 0) {
    return 'That image looks empty. Please choose another photo.';
  }
  return null;
}

async function loadDrawable(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // `from-image` honours the EXIF orientation, so portrait photos are not
      // stored sideways.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Older Safari — fall through to the <img> path.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not read that image.'));
      image.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Downscales and re-encodes a photo as a JPEG data URL small enough to store.
 *
 * Steps the quality down, then the dimensions, until the encoded string fits
 * under the caller's limit (1.8M characters by default). Throws when the browser
 * cannot decode the file or no attempt fits, so the form can surface a clear error.
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const maxLength = options.maxLength ?? MAX_DATA_URL_LENGTH;
  const maxEdge = options.maxEdge ?? MAX_EDGE;
  const minQuality = options.minQuality ?? MIN_QUALITY;
  const drawable = await loadDrawable(file);
  const sourceWidth = drawable.width;
  const sourceHeight = drawable.height;

  if (!sourceWidth || !sourceHeight) {
    (drawable as ImageBitmap).close?.();
    throw new Error('Could not read that image.');
  }

  let scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  let quality = options.initialQuality ?? DEFAULT_INITIAL_QUALITY;

  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare that image.');

      // Flatten transparency to white; JPEG has no alpha channel and would
      // otherwise render PNGs on a black background.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(drawable, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maxLength) {
        return dataUrl;
      }

      if (quality > minQuality) {
        quality = Math.max(minQuality, Number((quality - 0.12).toFixed(2)));
      } else {
        scale *= 0.75;
      }
    }
  } finally {
    (drawable as ImageBitmap).close?.();
  }

  throw new Error('That image is too large. Please choose a smaller photo.');
}
