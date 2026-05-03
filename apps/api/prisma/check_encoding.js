const fs = require('fs');
const buf = fs.readFileSync('c:/Lekhaly/apps/api/prisma/schema.prisma');
console.log('Size:', buf.length);
console.log('First 20 bytes:', buf.slice(0, 20).toString('hex'));
console.log('First 100 chars:', buf.toString('utf8').slice(0, 100));
