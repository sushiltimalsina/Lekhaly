
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting debug script...');
    const companyId = "1d387d26-0078-4ba3-83a9-a9e27d71e16e";
    const email = "admin@lekhaly.local";
    const password = "Admin@12345";
    const deviceLabel = "Windows Dev Machine";

    try {
        console.log('Finding user...');
        const user = await prisma.user.findUnique({
            where: { companyId_email: { companyId, email } },
            include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
        });

        if (!user) {
            console.log('User not found!');
            return;
        }
        console.log('User found:', user.id, user.email, user.status);
        console.log('Hash:', user.passwordHash);

        console.log('Verifying password...');
        const ok = await argon2.verify(user.passwordHash, password);
        console.log('Password verify result:', ok);

        if (ok) {
            console.log('Password Correct. Proceeding to device creation...');
            try {
                // Check if we can create a device (simulate what auth service does)
                // We won't actually commit if we want to be safe, but creating a device is harmless enough for debug
                /*
               const device = await prisma.device.create({
                   data: {
                     companyId: user.companyId,
                     label: deviceLabel + " DEBUG",
                     platform: "web",
                     trusted: true
                   }
                 });
                 console.log('Device created:', device.id);
                 */
                console.log('Skipping actual DB writes to avoid side effects, but logic up to here seems fine if no crash.');
            } catch (err) {
                console.error('Error during device creation simulation:', err);
            }
        }

    } catch (e) {
        console.error('CRASHED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
