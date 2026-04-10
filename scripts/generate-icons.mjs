import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
// Brand mark for favicon + PWA PNGs (source SVG).
const SRC_SVG = path.join(PUBLIC_DIR, 'malts.svg');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensurePublic() {
  const ok = await exists(PUBLIC_DIR);
  if (!ok) throw new Error(`public/ not found at ${PUBLIC_DIR}`);
  const hasSvg = await exists(SRC_SVG);
  if (!hasSvg) throw new Error(`Source SVG not found: ${SRC_SVG}`);
}

async function writePng({ size, outFile }) {
  const outPath = path.join(PUBLIC_DIR, outFile);
  const buf = await sharp(SRC_SVG, { density: 512 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await fs.writeFile(outPath, buf);
  return outPath;
}

async function main() {
  await ensurePublic();

  const outputs = [
    { size: 16, outFile: 'favicon-16x16.png' },
    { size: 32, outFile: 'favicon-32x32.png' },
    { size: 180, outFile: 'apple-touch-icon.png' },
    { size: 192, outFile: 'malts-icon-192.png' },
    { size: 512, outFile: 'malts-icon-512.png' },
    { size: 512, outFile: 'malts-icon-512-maskable.png' },
  ];

  const written = [];
  for (const o of outputs) {
    // eslint-disable-next-line no-await-in-loop
    written.push(await writePng(o));
  }

  // Keep output small & deterministic.
  // eslint-disable-next-line no-console
  console.log(`Generated ${written.length} icons in public/`);
}

await main();

