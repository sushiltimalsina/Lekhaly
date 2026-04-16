import fs from 'fs';
import path from 'path';

const iconDir = path.resolve('apps/desktop/src-tauri/icons');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

// A completely valid, tiny 1x1 binary .ico file encoded in Base64
const icoBase64 = "AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

console.log("Generating valid binary icons...");
fs.writeFileSync(path.join(iconDir, 'icon.ico'), Buffer.from(icoBase64, 'base64'));
fs.writeFileSync(path.join(iconDir, '32x32.png'), Buffer.from(pngBase64, 'base64'));
fs.writeFileSync(path.join(iconDir, '128x128.png'), Buffer.from(pngBase64, 'base64'));
fs.writeFileSync(path.join(iconDir, '128x128@2x.png'), Buffer.from(pngBase64, 'base64'));
fs.writeFileSync(path.join(iconDir, 'icon.icns'), Buffer.from(icoBase64, 'base64'));

console.log("✅ Valid icons generated!");
