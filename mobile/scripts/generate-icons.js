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

  console.log('Generating 1024x1024 icon ->', outIcon);
  await sharp(sourceSvg).resize(1024, 1024).png().toFile(outIcon);

  console.log('Generating Android adaptive foreground 432x432 ->', outAndroidFg);
  await sharp(sourceSvg).resize(432, 432).png().toFile(outAndroidFg);

  console.log('Done. Check the generated files in', imagesDir);
}

generate().catch(err => {
  console.error('generate-icons failed', err);
  process.exit(1);
});
