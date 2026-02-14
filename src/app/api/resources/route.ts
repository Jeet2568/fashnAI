import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        const where = type ? { type } : {};

        const resources = await prisma.resource.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(resources);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, name, prompt, thumbnail } = body;

        if (!type || !name || !prompt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const resource = await prisma.resource.create({
            data: {
                type,
                name,
                prompt,
                thumbnail,
            },
        });

        return NextResponse.json(resource);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Resource ID required" }, { status: 400 });
        }

        await prisma.resource.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
    }
}
