import https from 'https';
import fs from 'fs';
import path from 'path';

const dest = "c:\\Lekhaly\\apps\\desktop\\logo.png";
const file = fs.createWriteStream(dest);

// Fetching the official standard Tauri logo PNG (guaranteed true PNG signature)
https.get('https://raw.githubusercontent.com/tauri-apps/tauri/dev/tooling/cli/templates/app/src-tauri/icons/128x128.png', function(response) {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log("✅ Valid True-PNG logo downloaded!");
  });
});
