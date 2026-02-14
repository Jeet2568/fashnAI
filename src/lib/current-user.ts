import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
    // For now, in single-user local mode, we always use a default "admin" user.
    // In production, this would use NextAuth session.

    const username = "admin";

    let user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                username,
                password: "hashed_password_placeholder", // Not used locally
                role: "ADMIN",
                credits: 9999
            }
        });
    }

    return user;
}
