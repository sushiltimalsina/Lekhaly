
const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:3000/api/accounts', {
            headers: {
                'Authorization': 'Bearer ' + 'TOKEN_HERE' // I need a token
            }
        });
        console.log(res.data);
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}
// test();
