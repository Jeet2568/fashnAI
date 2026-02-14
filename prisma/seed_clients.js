
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const zara = await prisma.client.upsert({
        where: { serial: 101 },
        update: {},
        create: {
            serial: 101,
            name: 'Zara',
            slug: '101_Zara',
            rootFolder: 'C:/NAS_Storage_Mock/SpecialClients/Zara'
        },
    });
    console.log({ zara });

    const hnm = await prisma.client.upsert({
        where: { serial: 102 },
        update: {},
        create: {
            serial: 102,
            name: 'H&M',
            slug: '102_HM',
            rootFolder: 'C:/NAS_Storage_Mock/SpecialClients/HM'
        },
    });
    console.log({ hnm });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
