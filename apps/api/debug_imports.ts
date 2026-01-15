
import * as fs from 'fs';
import argon2 from 'argon2';
import crypto from 'crypto';

const output = [];
try {
    output.push(`argon2: ${typeof argon2}`);
    if (argon2) {
        output.push(`argon2.verify: ${typeof argon2.verify}`);
        output.push(`argon2 keys: ${Object.keys(argon2).join(',')}`);
    }
} catch (e: any) { output.push('argon2 error: ' + e.toString()); }

try {
    output.push(`crypto: ${typeof crypto}`);
    if (crypto) output.push(`crypto.createHash: ${typeof crypto.createHash}`);
} catch (e: any) { output.push('crypto error: ' + e.toString()); }

fs.writeFileSync('c:/Lekhaly/apps/api/debug_output.txt', output.join('\n'));
console.log('Done');
