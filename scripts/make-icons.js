const { Jimp } = require("jimp");
const path = require("path");

async function makeIcon(size, outputPath) {
  const src = await Jimp.read(path.join(__dirname, "../screens/Screenshot_37.png"));
  const W = src.bitmap.width;
  const H = src.bitmap.height;

  // Crop only the bird (no text) — starts at ~73% width
  const cropX = Math.floor(W * 0.73);
  const bird = src.clone().crop({ x: cropX, y: 0, w: W - cropX, h: H });

  // Remove white background
  const bW = bird.bitmap.width;
  const bH = bird.bitmap.height;
  for (let y = 0; y < bH; y++) {
    for (let x = 0; x < bW; x++) {
      const idx = (y * bW + x) * 4;
      const r = bird.bitmap.data[idx];
      const g = bird.bitmap.data[idx + 1];
      const b = bird.bitmap.data[idx + 2];
      if (r > 230 && g > 230 && b > 230) bird.bitmap.data[idx + 3] = 0;
    }
  }

  // White background
  const bg = new Jimp({ width: size, height: size, color: 0xFFFFFFFF });

  // Scale bird to 80% of icon size, keep aspect ratio
  const birdW = bird.bitmap.width;
  const birdH = bird.bitmap.height;
  const scale = (size * 1.20) / Math.max(birdW, birdH);
  const newW = Math.round(birdW * scale);
  const newH = Math.round(birdH * scale);
  bird.resize({ w: newW, h: newH });

  // Center horizontally, shift down a bit
  const x = Math.floor((size - newW) / 2);
  const y = Math.floor((size - newH) / 2) + Math.floor(size * 0.06);
  bg.composite(bird, x, y);

  await bg.write(outputPath);
  console.log(`Saved ${outputPath}`);
}

async function main() {
  await makeIcon(192, path.join(__dirname, "../public/icons/icon-192.png"));
  await makeIcon(512, path.join(__dirname, "../public/icons/icon-512.png"));
}

main().catch(console.error);
