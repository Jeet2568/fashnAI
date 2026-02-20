import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma"; // NOTE: Prisma cannot be used in middleware on Edge Runtime usually.
// Next.js Middleware runs on Edge Runtime where Node APIs (and Prisma) are limited.
// However, we can check the cookie roughly, but proper role check usually happens in Layout or Page (as I did).
// BUT the user asked for Middleware protection.

// Since Prisma is not safe in Edge Middleware, we can skip DB check here OR use a workaround.
// For simplicity in this local setup, I will skip DB check in middleware and rely on Page check, 
// OR I can just check if cookie exists.

// Actually, the user asked for middleware protection.
// I will implement a basic middleware that checks for the "userId" cookie.

export function middleware(request: NextRequest) {
    // 1. Protect /super-admin
    if (request.nextUrl.pathname.startsWith('/super-admin')) {
        const userId = request.cookies.get('userId');
        if (!userId) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Cannot verify Role here without DB. 
        // Verification happens in Page.
    }
}

export const config = {
    matcher: '/super-admin/:path*',
};
