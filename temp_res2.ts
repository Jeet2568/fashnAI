import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const resources = await prisma.resource.findMany();
    console.log('Total Resources:', resources.length);
    resources.forEach(r => {
        console.log(`[${r.type}] name="${r.name}" promptLen=${r.prompt.length} hasThumb=${!!r.thumbnail}`);
    });
}

main().finally(() => prisma.$disconnect());
