import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";
import { requireUser } from "@/lib/current-user";

const createProjectSchema = z.object({
    clientName: z.string().optional(),
    productName: z.string().min(1),
    clientId: z.string().optional(),
    date: z.string().optional(), // YYYY-MM-DD
});

// Helper to format date as DD-MM-YYYY
function formatDateDDMMYYYY(date: Date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

// Helper to format month as MM-YYYY
function formatMonthMMYYYY(date: Date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}-${y}`;
}

export async function POST(req: Request) {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;

    try {
        const body = await req.json();
        const { clientName, productName, clientId, date } = createProjectSchema.parse(body);

        // 1. Get Base Path (Default)
        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");
        if (!nasRoot) return NextResponse.json({ error: "NAS Root Not Configured" }, { status: 400 });

        const now = new Date();
        let client;

        // 2. Resolve Client
        if (clientId) {
            // Existing Client
            client = await prisma.client.findUnique({ where: { id: clientId } });
            if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
        } else if (clientName) {
            // Create New Client
            const lastClient = await prisma.client.findFirst({ orderBy: { serial: 'desc' } });
            const nextSerial = (lastClient?.serial || 0) + 1;
            const serialStr = String(nextSerial).padStart(2, '0');
            const clientSlug = `${serialStr}_${clientName}`;

            client = await prisma.client.create({
                data: {
                    name: clientName,
                    slug: clientSlug,
                    serial: nextSerial
                }
            });
        } else {
            return NextResponse.json({ error: "Missing Client Info" }, { status: 400 });
        }

        // 3. Resolve Product Serial & Date
        const sessionDate = date ? new Date(date) : now;
        const startOfDay = new Date(sessionDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(sessionDate); endOfDay.setHours(23, 59, 59, 999);

        const dailyProductCount = await prisma.product.count({
            where: {
                clientId: client.id,
                shotDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const productSerial = dailyProductCount + 1;
        const productSerialStr = String(productSerial).padStart(2, '0');
        const productSlug = `${productSerialStr}_${productName}`;

        // 4. Construct Path: Studio AI / MM-YYYY / DD-MM-YYYY / ClientSlug / ProductSlug
        const monthDir = formatMonthMMYYYY(sessionDate);
        const dateDir = formatDateDDMMYYYY(sessionDate);

        // Strict Hierarchy Enforced
        const projectPath = path.join(nasRoot, "CodeVeda AI", monthDir, dateDir, client.slug, productSlug);

        // 5. Create Folders
        await fs.mkdir(path.join(projectPath, "RAW"), { recursive: true });
        await fs.mkdir(path.join(projectPath, "Results"), { recursive: true });
        await fs.mkdir(path.join(projectPath, "Reject"), { recursive: true });

        // 6. DB Record
        const product = await prisma.product.create({
            data: {
                name: productName,
                slug: productSlug,
                serial: productSerial,
                clientId: client.id,
                path: projectPath,
                shotDate: sessionDate
            }
        });

        return NextResponse.json({
            success: true,
            path: projectPath,
            product,
            client
        });

    } catch (error) {
        console.error("Project Creation Failed:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
