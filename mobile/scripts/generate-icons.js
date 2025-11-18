/**
 * generate-icons.js
 * Simple script to generate PNG app icons from a source SVG or PNG using sharp.
 *
 * Usage:
 * 1. Install sharp in the mobile folder: npm install --save-dev sharp
 * 2. Run: npm run generate-icons
 *
 * Outputs:
 * - ./assets/images/icon.png         -> 1024x1024 (iOS/Expo canonical)
 * - ./assets/images/android-icon-foreground.png -> 432x432 (adaptive foreground)
 * - ./assets/images/android-icon-background.png -> untouched (keep existing or replace)
 */

const path = require('path');
const fs = require('fs');

const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'assets', 'images');
const sourceSvg = path.join(imagesDir, 'new_icon.svg');
const sourcePng = path.join(imagesDir, 'new_icon.png');

async function ensureSource() {
  if (!fs.existsSync(sourceSvg)) {
    console.error('Source SVG not found at', sourceSvg);
    process.exit(1);
  }
}

async function generate() {
  await ensureSource();
  const outIcon = path.join(imagesDir, 'icon.png');
  const outAndroidFg = path.join(imagesDir, 'android-icon-foreground.png');
  const outFavicon = path.join(imagesDir, 'favicon.png');

  const src = fs.existsSync(sourcePng) ? sourcePng : sourceSvg;

  console.log('Generating 1024x1024 icon ->', outIcon);
  await sharp(src).resize(1024, 1024, { fit: 'cover' }).png().toFile(outIcon);

  console.log('Generating Android adaptive foreground 432x432 ->', outAndroidFg);
  // For adaptive foreground, produce a PNG with transparent padding if original is square.
  await sharp(src).resize(432, 432, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outAndroidFg);

  // Generate a 192x192 favicon/web icon
  console.log('Generating web favicon 192x192 ->', outFavicon);
  await sharp(src).resize(192, 192, { fit: 'cover' }).png().toFile(outFavicon);

  // Optionally generate smaller Android launcher icons (mdpi/hdpi/xhdpi)
  const sizes = [512, 384, 192, 144, 96, 72, 48];
  for (const s of sizes) {
    const out = path.join(imagesDir, `icon-${s}.png`);
    console.log(`Generating ${s}x${s} ->`, out);
    await sharp(src).resize(s, s, { fit: 'cover' }).png().toFile(out);
  }

  console.log('Done. Check the generated files in', imagesDir);
}

generate().catch(err => {
  console.error('generate-icons failed', err);
  process.exit(1);
});
