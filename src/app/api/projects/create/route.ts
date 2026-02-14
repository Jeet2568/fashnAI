import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

const createProjectSchema = z.object({
    clientName: z.string().min(1),
    productName: z.string().min(1),
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
    try {
        const body = await req.json();
        const { clientName, productName, clientId } = z.object({
            clientName: z.string().optional(),
            productName: z.string().min(1),
            clientId: z.string().optional(),
            date: z.string().optional(),
        }).parse(body);

        // 1. Get Base Path (Default)
        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");
        if (!nasRoot) return NextResponse.json({ error: "NAS Root Not Configured" }, { status: 400 });

        const now = new Date();
        let client;
        let clientRootPath = "";

        // 2. Resolve Client & Path
        if (clientId) {
            // Existing Client
            client = await prisma.client.findUnique({ where: { id: clientId } });
            if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

            // If client has a strict root folder, use it. Otherwise, use standard structure?
            // User said: "once admin will assign the specific folder... user will select... in that there will be option..."
            // This implies: ClientRoot/Product
            if (client.rootFolder) {
                clientRootPath = client.rootFolder;
            } else {
                // Fallback for existing clients without root (Standard Structure)
                clientRootPath = path.join(nasRoot, "CodeVeda AI", formatMonthMMYYYY(now), formatDateDDMMYYYY(now), client.slug);
            }
        } else if (clientName) {
            // Create New Client
            const lastClient = await prisma.client.findFirst({ orderBy: { serial: 'desc' } });
            const nextSerial = (lastClient?.serial || 0) + 1;
            const slug = `${String(nextSerial).padStart(2, '0')}_${clientName}`;

            client = await prisma.client.create({
                data: { name: clientName, serial: nextSerial, slug: slug }
            });

            // Standard Path for new clients
            clientRootPath = path.join(nasRoot, "CodeVeda AI", formatMonthMMYYYY(now), formatDateDDMMYYYY(now), slug);
        } else {
            return NextResponse.json({ error: "Client Name or ID required" }, { status: 400 });
        }

        // 3. Create Product
        const lastProduct = await prisma.product.findFirst({
            where: { clientId: client.id },
            orderBy: { serial: 'desc' }
        });
        const nextProdSerial = (lastProduct?.serial || 0) + 1;
        const prodSlug = `${String(nextProdSerial).padStart(2, '0')}_${productName}`;

        // 4. Final Full Path
        // If clientRootPath is absolute (Admin assigned), user it directly.
        // If it was constructed relative (above), ensure it is joined with root if needed.
        // In the logic above, constructed paths are absolute if nasRoot is absolute.
        // Let's assume client.rootFolder is ABSOLUTE from Admin.

        const fullPath = path.join(clientRootPath, prodSlug);

        // 5. Create Folders
        await fs.mkdir(path.join(fullPath, "RAW"), { recursive: true });
        await fs.mkdir(path.join(fullPath, "Results"), { recursive: true });
        await fs.mkdir(path.join(fullPath, "Reject"), { recursive: true });

        // 6. Save Product to DB
        const product = await prisma.product.create({
            data: {
                name: productName,
                serial: nextProdSerial,
                slug: prodSlug,
                clientId: client.id,
                path: fullPath,
                shotDate: now
            }
        });

        return NextResponse.json({
            success: true,
            path: fullPath, // Use fullPath as path
            fullPath: fullPath,
            product
        });

    } catch (error) {
        console.error("Project Creation Error:", error);
        return NextResponse.json(
            { error: "Failed to create project structure" },
            { status: 500 }
        );
    }
}
