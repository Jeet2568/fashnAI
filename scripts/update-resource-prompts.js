const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_PROMPTS = {
    "Front Pose (Full Body)": "Professional studio photograph of a real Indian woman standing confidently facing the camera with natural posture and relaxed expression. Full body clearly visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Backside Pose (Full Body)": "Professional studio photograph of a real Indian woman standing confidently with her back facing the camera and natural posture. Full body clearly visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Closeup (Half Body)": "Professional studio photograph of a real Indian woman facing the camera with confident posture and natural expression. Framed from head to waist. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Detailed (Mid-Section)": "Professional studio photograph focusing on the mid-section of a real Indian woman standing naturally. Framed from lower chest to mid-thigh. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Sitting Pose": "Professional studio photograph of a real Indian woman sitting upright with confident and natural posture. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Front with Props (Full Body)": "Professional studio photograph of a real Indian woman standing confidently facing the camera, wearing simple earrings, necklace, and bracelets. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Closeup with Props (Half Body)": "Professional studio photograph of a real Indian woman wearing simple earrings and necklace, facing the camera with confident expression. Framed from head to waist. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Only Pant (Lower Body)": "Professional studio photograph focusing on the lower body of a real Indian woman standing confidently. Framed from waist to ankles. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Sleep Pose (Front Camera)": "Professional studio photograph of a real Indian woman lying naturally, captured from the front with confident and relaxed presence. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Back Pose (Side-Look)": "Professional studio photograph of a real Indian woman standing with her back facing the camera and turning slightly with confident posture. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Walking Pose": "Professional studio photograph of a real Indian woman captured mid-step with confident natural movement. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Laughing Pose (Natural)": "Professional studio photograph of a real Indian woman captured with a natural confident smile. Framed from waist up. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Cross Back (Profile Look)": "Professional studio photograph of a real Indian woman standing sideways with confident posture and natural expression. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Angle Pose (45°)": "Professional studio photograph of a real Indian woman standing at a 45-degree angle with confident posture. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Angle Pose (High-Side)": "Professional studio photograph of a real Indian woman standing naturally, captured from a slightly elevated angle with confident presence. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided.",
    "Angle Pose (90° Profile)": "Professional studio photograph of a real Indian woman standing fully sideways with confident posture. Full body visible. Do not modify or redesign the garment. Keep the original design exactly as provided."
};

async function update() {
    console.log("Updating resource prompts...");
    for (const [name, prompt] of Object.entries(NEW_PROMPTS)) {
        try {
            // Note: Some names might slightly differ if there were typos (like Sleep Pose Bird's Eye vs Top Angle)
            // I'll try exact match first, then partial match if needed.
            const result = await prisma.resource.updateMany({
                where: { name: { contains: name.split('(')[0].trim() } },
                data: { prompt }
            });
            if (result.count > 0) {
                console.log(`  ✅ Updated: ${name}`);
            } else {
                console.log(`  ⚠️ Not found: ${name}`);
            }
        } catch (e) {
            console.log(`  ❌ Error updating ${name}: ${e.message}`);
        }
    }
    console.log("\nDone!");
}

update().finally(() => prisma.$disconnect());
