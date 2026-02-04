const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@localhost:5432/lekhaly_accounting?schema=public"
    });

    try {
        await client.connect();

        console.log("Adding missing columns...");

        // Voucher table
        try {
            await client.query('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "referenceNo" TEXT');
            await client.query('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "vendorInvoiceNo" TEXT');
            await client.query('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "vendorInvoiceDate" TIMESTAMP(3)');
            await client.query('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "additionalNote" TEXT');
            console.log("- Voucher table updated.");
        } catch (e) {
            console.error("Error updating Voucher:", e.message);
        }

        // Invoice table
        try {
            await client.query('ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "referenceNo" TEXT');
            await client.query('ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "memo" TEXT');
            await client.query('ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "additionalNote" TEXT');
            console.log("- Invoice table updated.");
        } catch (e) {
            console.error("Error updating Invoice:", e.message);
        }

        console.log("Migration complete.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
