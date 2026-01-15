const argon2 = require('argon2');
console.log('Argon2 loaded');
argon2.hash('test').then(h => {
    console.log('Hash:', h);
    return argon2.verify(h, 'test');
}).then(v => {
    console.log('Verify:', v);
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
