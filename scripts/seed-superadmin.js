
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const username = "superadmin"; // Or whatever checking logic uses

    // Upsert Super Admin
    const user = await prisma.user.upsert({
        where: { username },
        update: { role: 'SUPER_ADMIN' },
        create: {
            username,
            password: "supersecretpassword",
            role: 'SUPER_ADMIN',
            credits: 999999
        }
    });

    console.log("Super Admin Created/Updated:", user);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
