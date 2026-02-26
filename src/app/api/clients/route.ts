
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";

export async function GET() {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;

    try {
        const clients = await prisma.client.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                rootFolder: true
            }
        });

        return NextResponse.json({ clients });
    } catch (error) {
        console.error("Error listing clients:", error);
        return NextResponse.json({ error: "Failed to list clients" }, { status: 500 });
    }
}
