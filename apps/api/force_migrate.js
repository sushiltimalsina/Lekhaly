const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log("Connected to database. Starting force migration...");

        const queries = [
            // Voucher table
            'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "referenceNo" TEXT',
            'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "vendorInvoiceNo" TEXT',
            'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "vendorInvoiceDate" TIMESTAMP(3)',
            'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "additionalNote" TEXT',
            'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "voucherNumber" TEXT',

            // Invoice table
            'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "referenceNo" TEXT',
            'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "memo" TEXT',
            'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "additionalNote" TEXT',
            'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceNo" TEXT',
            'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "dateBs" TEXT',
            'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "dueDateBs" TEXT',

            // Enums and other types if missing (Prisma usually handles this, but let's be safe for columns)
            // Check if table Invoice exists first? The schema says it does.
        ];

        for (const sql of queries) {
            try {
                await client.query(sql);
                console.log(`Executed: ${sql}`);
            } catch (err) {
                console.warn(`Skipped/Error: ${sql} -> ${err.message}`);
            }
        }

        console.log("Force migration complete.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

main();
