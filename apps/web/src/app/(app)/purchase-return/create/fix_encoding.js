const fs = require('fs');
const path = 'c:/Lekhaly/apps/web/src/app/(app)/purchase-return/create/page.tsx';
const content = fs.readFileSync(path);
// Detect UTF-16 BOM (FF FE or FE FF)
if (content[0] === 0xFF && content[1] === 0xFE) {
    const utf8 = content.slice(2).toString('utf16le');
    fs.writeFileSync(path, utf8, 'utf8');
    console.log('Converted UTF-16LE to UTF-8');
} else if (content[0] === 0xFE && content[1] === 0xFF) {
    const utf8 = content.slice(2).toString('utf16be');
    fs.writeFileSync(path, utf8, 'utf8');
    console.log('Converted UTF-16BE to UTF-8');
} else {
    console.log('Not UTF-16 with BOM, or already UTF-8');
}
