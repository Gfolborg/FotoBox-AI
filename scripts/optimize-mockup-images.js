const sharp = require('sharp');
const { encode } = require('blurhash');
const fs = require('fs');
const path = require('path');

const MOCKUPS_DIR = path.join(__dirname, '../assets/images/mockups');
const OUTPUT_SIZE = 300; // 300x300 is sufficient for ~100px display at 3x

async function getImagePixels(imagePath) {
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'cover' }) // Small size for blurhash
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
}

async function generateBlurhash(imagePath) {
  const { data, width, height } = await getImagePixels(imagePath);
  // Blurhash with 4x4 components for good quality
  return encode(new Uint8ClampedArray(data), width, height, 4, 4);
}

async function processImage(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(outputPath);
}

async function main() {
  const files = fs.readdirSync(MOCKUPS_DIR).filter(f => f.endsWith('.png'));
  const blurhashMap = {};

  console.log(`Processing ${files.length} images...`);

  for (const file of files) {
    const inputPath = path.join(MOCKUPS_DIR, file);
    const outputName = file.replace('.png', '.webp');
    const outputPath = path.join(MOCKUPS_DIR, outputName);

    try {
      // Generate blurhash from original image
      const blurhash = await generateBlurhash(inputPath);
      const baseName = file.replace('.png', '');
      blurhashMap[baseName] = blurhash;

      // Resize and convert to WebP
      await processImage(inputPath, outputPath);

      const inputStats = fs.statSync(inputPath);
      const outputStats = fs.statSync(outputPath);
      const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

      console.log(`✓ ${file} → ${outputName} (${savings}% smaller)`);
      console.log(`  Blurhash: ${blurhash}`);
    } catch (error) {
      console.error(`✗ Failed to process ${file}:`, error.message);
    }
  }

  // Output blurhash map for copy-pasting into code
  console.log('\n--- Blurhash Map (copy to mockup-presets.ts) ---\n');
  console.log('const BLURHASH_MAP: Record<string, string> = {');
  for (const [name, hash] of Object.entries(blurhashMap)) {
    console.log(`  "${name}": "${hash}",`);
  }
  console.log('};');

  // Calculate total savings
  const pngFiles = files.map(f => path.join(MOCKUPS_DIR, f));
  const webpFiles = files.map(f => path.join(MOCKUPS_DIR, f.replace('.png', '.webp')));

  const totalPngSize = pngFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  const totalWebpSize = webpFiles.reduce((sum, f) => {
    try { return sum + fs.statSync(f).size; }
    catch { return sum; }
  }, 0);

  console.log(`\n--- Summary ---`);
  console.log(`Original total: ${(totalPngSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized total: ${(totalWebpSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings: ${((1 - totalWebpSize / totalPngSize) * 100).toFixed(1)}%`);
}

main().catch(console.error);
