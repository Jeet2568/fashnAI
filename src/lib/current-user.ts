import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) return user;
    }

    return null;
}

/**
 * Call at the top of any admin-only API route.
 * Returns the user if authorized, or a 401/403 NextResponse if not.
 */
export async function requireAdmin(): Promise<{ user: any } | { error: NextResponse }> {
    const user = await getCurrentUser();
    if (!user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return { error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }) };
    }
    return { user };
}

/**
 * Call at the top of any user-authenticated API route.
 */
export async function requireUser(): Promise<{ user: any } | { error: NextResponse }> {
    const user = await getCurrentUser();
    if (!user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { user };
}
