import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../public/favicon.svg');
const pngPath = path.join(__dirname, '../public/icon.png');
const icoPath = path.join(__dirname, '../public/favicon.ico');

(async () => {
  try {
    console.log('Converting SVG to PNG...');
    await sharp(svgPath)
      .resize(256, 256)
      .png()
      .toFile(pngPath);
    
    console.log('Converting PNG to ICO...');
    const buf = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buf);
    
    console.log('Icon successfully generated at public/favicon.ico');
  } catch (err) {
    console.error('Error generating icon:', err);
    process.exit(1);
  }
})();
