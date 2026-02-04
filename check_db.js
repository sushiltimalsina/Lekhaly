const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@localhost:5432/lekhaly_accounting?schema=public"
    });

    try {
        await client.connect();

        console.log("Columns in 'Voucher':");
        const resVoucher = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Voucher'");
        resVoucher.rows.forEach(row => console.log(`- ${row.column_name}`));

        console.log("\nColumns in 'Invoice':");
        const resInvoice = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Invoice'");
        resInvoice.rows.forEach(row => console.log(`- ${row.column_name}`));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
