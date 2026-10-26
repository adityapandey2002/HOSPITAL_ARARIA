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

/** Longest edge of the stored image. Enough to read a prescription or a bill. */
const MAX_EDGE = 1280;

/**
 * Ceiling for the encoded string. Kept below the backend's 2,000,000-character
 * DTO limit and well below the serverless 4MB request body cap.
 */
const MAX_DATA_URL_LENGTH = 1_800_000;

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
 * under {@link MAX_DATA_URL_LENGTH}. Throws when the browser cannot decode the
 * file or no attempt fits, so the form can surface a clear error.
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  const drawable = await loadDrawable(file);
  const sourceWidth = drawable.width;
  const sourceHeight = drawable.height;

  if (!sourceWidth || !sourceHeight) {
    (drawable as ImageBitmap).close?.();
    throw new Error('Could not read that image.');
  }

  let scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  let quality = 0.72;

  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
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
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
        return dataUrl;
      }

      if (quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.12);
      } else {
        scale *= 0.75;
      }
    }
  } finally {
    (drawable as ImageBitmap).close?.();
  }

  throw new Error('That image is too large. Please choose a smaller photo.');
}
