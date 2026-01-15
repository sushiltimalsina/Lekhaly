
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const connectionString = process.env.DATABASE_URL;

    try {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected!');

        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

        await prisma.$disconnect();
        await pool.end();
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

main();
