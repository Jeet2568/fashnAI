import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) return user;
    }

    // Fallback: Ensure default admin exists
    const username = "admin";
    let user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                username,
                password: "hashed_password_placeholder",
                role: "ADMIN",
                credits: 9999
            }
        });
    }

    return user;
}
