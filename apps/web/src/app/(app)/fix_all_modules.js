const fs = require('fs');

const files = [
    'c:/Lekhaly/apps/web/src/app/(app)/purchase-orders/create/page.tsx',
    'c:/Lekhaly/apps/web/src/app/(app)/sales-orders/create/page.tsx',
    'c:/Lekhaly/apps/web/src/app/(app)/quotations/create/page.tsx',
    'c:/Lekhaly/apps/web/src/app/(app)/purchase-return/create/page.tsx'
];

function fixFile(path) {
    let content = fs.readFileSync(path);
    let text = '';
    
    // Detect and convert UTF-16
    if (content[0] === 0xFF && content[1] === 0xFE) {
        text = content.slice(2).toString('utf16le');
    } else if (content[0] === 0xFE && content[1] === 0xFF) {
        text = content.slice(2).toString('utf16be');
    } else {
        text = content.toString('utf8');
    }

    // 1. Update getLabel (handles it, i, itm, etc.)
    text = text.replace(/getLabel=\{([a-zA-Z0-9]+)\s*=>\s*\1\.name\}/g, (match, p1) => {
        return `getLabel={${p1} => \`\${${p1}.name}\${${p1}.sku ? \` [\${${p1}.sku}]\` : ""}\`}`;
    });

    // 2. Update description assignment in onChange
    // Look for: description: opt?.name, or description: item?.name, etc.
    text = text.replace(/description:\s*([a-zA-Z0-9]+)\?\.(name|description)/g, (match, p1) => {
        return `description: ${p1} ? \`\${${p1}.name}\${${p1}.sku ? \` [\${${p1}.sku}]\` : ""}\` : ""`;
    });
    
    // 3. Update mapRow in handlePaste if present
    text = text.replace(/description:\s*item\.name/g, 'description: `${item.name}${item.sku ? ` [${item.sku}]` : ""}`');

    fs.writeFileSync(path, text, 'utf8');
    console.log(`Fixed ${path}`);
}

files.forEach(f => {
    try { fixFile(f); } catch(e) { console.error(`Error fixing ${f}:`, e); }
});
