
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany();
    console.log('Companies found:', companies.length);
    companies.forEach(c => {
        console.log(`ID: ${c.id}, Name: ${c.name}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
