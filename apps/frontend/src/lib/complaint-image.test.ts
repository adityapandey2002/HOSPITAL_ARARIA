import {
  ACCEPTED_IMAGE_TYPES,
  MAX_SOURCE_IMAGE_BYTES,
  compressImageToDataUrl,
  isDisplayableImageUrl,
  validateImageFile,
} from './complaint-image';

describe('validateImageFile', () => {
  it.each(ACCEPTED_IMAGE_TYPES)('accepts a normal %s photo', (type) => {
    expect(validateImageFile({ type, size: 2 * 1024 * 1024 })).toBeNull();
  });

  it('accepts a file exactly at the 5 MB limit', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: MAX_SOURCE_IMAGE_BYTES })).toBeNull();
  });

  it('rejects formats the browser cannot decode', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 1000 })).toMatch(/JPEG, PNG or WebP/);
    expect(validateImageFile({ type: 'image/gif', size: 1000 })).toMatch(/JPEG, PNG or WebP/);
  });

  it('rejects files over the size limit', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: MAX_SOURCE_IMAGE_BYTES + 1 })).toMatch(
      /5 MB/
    );
  });

  it('rejects an empty file', () => {
    expect(validateImageFile({ type: 'image/png', size: 0 })).toMatch(/empty/i);
  });
});

describe('isDisplayableImageUrl', () => {
  it('accepts stored data URLs and remote URLs', () => {
    expect(isDisplayableImageUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
    expect(isDisplayableImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isDisplayableImageUrl('DATA:IMAGE/WEBP;BASE64,AAAA')).toBe(true);
    expect(isDisplayableImageUrl('https://cdn.example.gov.in/photo.jpg')).toBe(true);
    expect(isDisplayableImageUrl('http://localhost:3001/uploads/photo.png')).toBe(true);
  });

  it('rejects the dead blob URLs written by the old form', () => {
    expect(
      isDisplayableImageUrl('blob:http://localhost:3000/4c2da3ca-ad2d-4ac6-8356-1ce73c12eb28')
    ).toBe(false);
  });

  it('rejects values that are not image URLs', () => {
    expect(isDisplayableImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    expect(isDisplayableImageUrl('javascript:alert(1)')).toBe(false);
    expect(isDisplayableImageUrl('/uploads/photo.jpg')).toBe(false);
    expect(isDisplayableImageUrl('')).toBe(false);
    expect(isDisplayableImageUrl(null)).toBe(false);
    expect(isDisplayableImageUrl(undefined)).toBe(false);
  });
});

describe('compressImageToDataUrl', () => {
  const originalCreateElement = document.createElement.bind(document);
  const bitmap = { width: 4000, height: 3000, close: jest.fn() };
  let canvases: { width: number; height: number; toDataURL: jest.Mock }[];

  /** jsdom has no canvas implementation, so only the drawing API is stubbed. */
  function stubCanvas(toDataURL: (quality?: number) => string) {
    canvases = [];

    jest.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName !== 'canvas') return originalCreateElement(tagName);

      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ fillRect: jest.fn(), drawImage: jest.fn(), fillStyle: '' }),
        toDataURL: jest.fn((_type?: string, quality?: number) => toDataURL(quality)),
      };
      canvases.push(canvas);
      return canvas;
    }) as unknown as typeof document.createElement);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = jest
      .fn()
      .mockResolvedValue(bitmap);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as unknown as { createImageBitmap?: unknown }).createImageBitmap;
  });

  const photo = new File([new Uint8Array(16)], 'photo.jpg', { type: 'image/jpeg' });

  it('scales the long edge to 1280px and returns the encoded JPEG', async () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    stubCanvas(() => dataUrl);

    await expect(compressImageToDataUrl(photo)).resolves.toBe(dataUrl);

    expect(canvases[0]).toMatchObject({ width: 1280, height: 960 });
    expect(canvases[0].toDataURL).toHaveBeenCalledWith('image/jpeg', 0.72);
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('retries at a lower quality when the encoded image is too large', async () => {
    const oversized = `data:image/jpeg;base64,${'A'.repeat(1_900_000)}`;
    const fitting = 'data:image/jpeg;base64,SMALL';
    stubCanvas((() => {
      let call = 0;
      return () => {
        call += 1;
        return call === 1 ? oversized : fitting;
      };
    })());

    await expect(compressImageToDataUrl(photo)).resolves.toBe(fitting);

    expect(canvases.length).toBeGreaterThan(1);
    const qualities = canvases.map((canvas) => canvas.toDataURL.mock.calls[0][1]);
    expect(qualities[0]).toBe(0.72);
    expect(qualities[1]).toBeLessThan(0.72);
  });

  it('rejects when the browser cannot decode the file', async () => {
    (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = jest
      .fn()
      .mockRejectedValue(new Error('nope'));

    await expect(compressImageToDataUrl(photo)).rejects.toThrow();
  });
});
