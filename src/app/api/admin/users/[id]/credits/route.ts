import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateCreditSchema = z.object({
    amount: z.number().int(), // positive to add, negative to remove
    reason: z.string().min(3),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { amount, reason } = updateCreditSchema.parse(body);

        // Transaction: Update user credits and create log
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id } });
            if (!user) {
                throw new Error("User not found");
            }

            const newBalance = user.credits + amount;
            if (newBalance < 0) {
                throw new Error("Insufficient credits");
            }

            const updatedUser = await tx.user.update({
                where: { id },
                data: { credits: newBalance },
            });

            await tx.creditLog.create({
                data: {
                    userId: id,
                    amount,
                    reason,
                },
            });

            return updatedUser;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || "Failed to update credits" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const logs = await prisma.creditLog.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch credit logs" },
            { status: 500 }
        );
    }
}
