"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

export async function login(username: string, password: string) {
    if (!username || !password) {
        return { success: false, error: "Username and password are required" };
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
        return { success: false, error: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return { success: false, error: "Invalid credentials" };
    }

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id);
    cookieStore.set("userRole", user.role);

    return { success: true, role: user.role };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("userId");
    cookieStore.delete("userRole");
    return { success: true };
}
