/**
 * Generates the PWA / icon assets that `app/layout.tsx` references.
 * Run with:  node scripts/generate-icons.mjs
 *
 * Next.js serves everything in `public/` at the site root, so the layout's
 * /favicon.ico, /icon.svg, /apple-touch-icon.png and /manifest.json all
 * 404 without them. This writes them as real, valid files rather than
 * committing binary blobs that nobody can regenerate.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

// --- brand colours (match tailwind sky-600 on white) ----------------------
const BG = [2, 132, 199, 255]; // sky-600
const FG = [255, 255, 255, 255];

/** Renders a rounded-square medical cross into an RGBA pixel buffer. */
function renderIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };

  const radius = size * 0.22;
  const inset = Math.round(size * 0.06);
  const lo = inset, hi = size - 1 - inset;

  // rounded-square background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // distance test for rounded corners
      const cx = Math.min(Math.max(x, lo + radius), hi - radius);
      const cy = Math.min(Math.max(y, lo + radius), hi - radius);
      const inside = x >= lo && x <= hi && y >= lo && y <= hi;
      if (!inside) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d <= radius) put(x, y, BG);
    }
  }

  // medical cross
  const bar = Math.round(size * 0.2);
  const arm = Math.round(size * 0.62);
  const start = Math.round((size - arm) / 2);
  const mid = Math.round(size / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x < start || x >= start + arm) continue;
      if (y < start || y >= start + arm) continue;
      const inH = y >= mid - bar / 2 && y < mid + bar / 2;
      const inV = x >= mid - bar / 2 && x < mid + bar / 2;
      if (inH || inV) put(x, y, FG);
    }
  }
  return px;
}

// --- PNG encoder ----------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(px, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  // filter byte 0 per scanline
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Wraps a PNG in a single-image ICO container (Vista+ supports PNG payloads). */
function encodeIco(png, size) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;  // palette
  entry[3] = 0;  // reserved
  entry.writeUInt16LE(1, 4);  // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // offset (6 + 16)
  return Buffer.concat([dir, entry, png]);
}

// --- emit -----------------------------------------------------------------
const apple = encodePng(renderIcon(180), 180);
writeFileSync(join(OUT, 'apple-touch-icon.png'), apple);

const fav = encodePng(renderIcon(64), 64);
writeFileSync(join(OUT, 'icon-64.png'), fav);
writeFileSync(join(OUT, 'favicon.ico'), encodeIco(fav, 64));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="District Hospital Araria">
  <rect width="100" height="100" rx="22" fill="#0284c7"/>
  <path d="M42 22h16v20h20v16H58v20H42V58H22V42h20z" fill="#fff"/>
</svg>
`;
writeFileSync(join(OUT, 'icon.svg'), svg);

const manifest = {
  name: 'District Hospital Araria',
  short_name: 'DH Araria',
  description:
    'Official portal of District Hospital Araria, Government of Bihar. Book appointments, view doctors, check blood availability and file grievances.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#f9fafb',
  theme_color: '#0284c7',
  icons: [
    { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icon-64.png', sizes: '64x64', type: 'image/png' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
};
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log('Wrote to public/:');
for (const f of ['favicon.ico', 'icon.svg', 'icon-64.png', 'apple-touch-icon.png', 'manifest.json']) {
  console.log(`  ${f}`);
}