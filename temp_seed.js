
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const fileUrl = '/uploads/1771828002450.jpg';
    let existing = await prisma.resource.findFirst({ where: { type: 'pose', name: 'Hands on Hips' } });
    if (existing) {
        await prisma.resource.update({ where: { id: existing.id }, data: { thumbnail: fileUrl } });
    } else {
        await prisma.resource.create({ data: { type: 'pose', name: 'Hands on Hips', prompt: 'Full body shot of an Indian fashion model with both hands resting confidently on her hips strong direct eye contact clean studio background elegant fashion', thumbnail: fileUrl } });
    }
}
run().then(() => process.exit(0)).catch(console.error);
