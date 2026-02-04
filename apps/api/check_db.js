const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        const tables = ['Voucher', 'Invoice'];
        for (const table of tables) {
            console.log(`\nChecking table: ${table}`);
            const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY column_name
      `);
            if (res.rows.length === 0) {
                console.log(`- Table '${table}' not found!`);
            } else {
                res.rows.forEach(row => {
                    console.log(`- ${row.column_name} (${row.data_type})`);
                });
            }
        }

    } catch (err) {
        console.error("Connection error:", err.message);
    } finally {
        await client.end();
    }
}

main();
