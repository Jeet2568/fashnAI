import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const createUserSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "USER"]).default("USER"),
    credits: z.number().default(0),
});

// Schema for updating user
const updateUserSchema = z.object({
    id: z.string(),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["ADMIN", "USER", "SUPER_ADMIN"]).optional(), // Allow SUPER_ADMIN conceptually but we might restrict setting it
});

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    not: "SUPER_ADMIN"
                }
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                username: true,
                role: true,
                credits: true,
                createdAt: true,
            },
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password, role, credits } = createUserSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
                credits,
            },
            select: {
                id: true,
                username: true,
                role: true,
                credits: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.error("[User POST] Zod Error:", JSON.stringify((error as any).errors));
            return NextResponse.json({ error: (error as any).errors[0].message || "Validation failed" }, { status: 400 });
        }

        console.error("[User POST] Server Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create user" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, username, password, role } = updateUserSchema.parse(body);

        // Check availability if username changes
        if (username) {
            const existing = await prisma.user.findFirst({
                where: {
                    username,
                    id: { not: id }
                }
            });
            if (existing) {
                return NextResponse.json({ error: "Username taken" }, { status: 400 });
            }
        }

        const data: any = {};
        if (username) data.username = username;
        if (role) data.role = role;
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                role: true,
                credits: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
