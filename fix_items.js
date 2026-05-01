const fs = require('fs');
const path = 'c:\\Lekhaly\\apps\\web\\src\\app\\(app)\\items\\page.tsx';

let c = fs.readFileSync(path, 'utf8');

// Find all occurrences of 'closingQty: {'
let idx = 0;
const positions = [];
while (true) {
  idx = c.indexOf('closingQty: {', idx);
  if (idx === -1) break;
  positions.push(idx);
  idx++;
}

console.log('Found closingQty occurrences:', positions.length);

if (positions.length >= 2) {
  // Go back from first occurrence to find line start
  let lineStart = positions[0];
  while (lineStart > 0 && c[lineStart - 1] !== '\n') lineStart--;

  // Remove from first closingQty line start to second closingQty line start  
  let secondLineStart = positions[1];
  while (secondLineStart > 0 && c[secondLineStart - 1] !== '\n') secondLineStart--;

  const removed = c.substring(lineStart, secondLineStart);
  console.log('Removing', removed.length, 'chars');
  console.log('Preview of removed block (first 100):', JSON.stringify(removed.substring(0, 100)));

  c = c.substring(0, lineStart) + c.substring(secondLineStart);
  fs.writeFileSync(path, c, 'utf8');
  console.log('DONE - duplicate block removed');
} else {
  console.log('No duplicate found, nothing to fix');
}
