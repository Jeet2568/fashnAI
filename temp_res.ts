import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const resources = await prisma.resource.findMany();
    console.log('Total Resources:', resources.length);
    if (resources.length > 0) {
        console.log('Sample:', resources[0]);
    }
}

main().finally(() => prisma.$disconnect());
