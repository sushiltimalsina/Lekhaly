import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Updating existing companies with new default prefixes...');
  
  const result = await prisma.company.updateMany({
    data: {
      invoicePrefix: 'SI',
      purchasePrefix: 'PURI',
      receiptPrefix: 'RV',
      paymentPrefix: 'PV',
      invoiceSuffix: '80/81',
      purchaseSuffix: '80/81',
      salesReturnSuffix: '80/81',
      purchaseReturnSuffix: '80/81',
      orderSuffix: '80/81',
      quotationSuffix: '80/81',
      purchaseOrderSuffix: '80/81',
      receiptSuffix: '80/81',
      paymentSuffix: '80/81',
      journalSuffix: '80/81',
    },
  });

  console.log(`Successfully updated ${result.count} companies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
