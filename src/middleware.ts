import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const userId = request.cookies.get('userId');
    const userRole = request.cookies.get('userRole')?.value;
    const { pathname } = request.nextUrl;

    // 1. Protect all high-level routes from non-logged users
    const protectedRoutes = ['/admin', '/studio', '/super-admin'];
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtected && !userId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Role-based Protection
    // Admin only routes
    if (pathname.startsWith('/admin')) {
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/studio', request.url));
        }
    }

    // Super Admin only routes
    if (pathname.startsWith('/super-admin')) {
        if (userRole !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/studio/:path*',
        '/super-admin/:path*',
    ],
};
