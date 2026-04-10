/**
 * Builds a small WebP from public/nasheto-menu.svg for use in UI.
 * The source SVG can be very large (embedded graphics); the output is typically tens of KB.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'public', 'nasheto-menu.svg');
const OUT = path.join(ROOT, 'public', 'nasheto-menu.webp');

async function main() {
  await fs.access(SRC);
  await sharp(SRC, { density: 300 })
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(OUT);
  const st = await fs.stat(OUT);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.basename(OUT)} (${Math.round(st.size / 1024)} KB)`);
}

await main();
