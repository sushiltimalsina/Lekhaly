"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=find_company.js.map