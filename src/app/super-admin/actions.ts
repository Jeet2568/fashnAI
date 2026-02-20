"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAdmin() {
    // Generate random admin
    const id = Math.random().toString(36).substring(7);
    await prisma.user.create({
        data: {
            username: `admin_${id}`,
            password: "password",
            role: "ADMIN",
            credits: 1000
        }
    });
    revalidatePath("/super-admin");
}

export async function deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/super-admin");
}
