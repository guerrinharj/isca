// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname, origin } = request.nextUrl
    const method = request.method

    // Always allow CORS preflight
    if (method === 'OPTIONS') return NextResponse.next()

    // Same-origin check (Origin header first, fallback to Referer)
    const reqOrigin = request.headers.get('origin') || ''
    const referer = request.headers.get('referer') || ''
    const isSameOrigin =
        (reqOrigin && reqOrigin === origin) ||
        (referer && referer.startsWith(origin))

    // Public routes you already had
    const isPublicPratosList =
        method === 'GET' &&
        (pathname === '/api/pratos' || pathname === '/api/pratos/')
    const isPublicReservaCreate =
        method === 'POST' &&
        (pathname === '/api/reservas' || pathname === '/api/reservas/')
    if (isPublicPratosList || isPublicReservaCreate) {
        return NextResponse.next()
    }

    // Allow auth endpoints from same-origin without API key
    const isAuthLogin =
        method === 'POST' &&
        (pathname === '/api/auth/login' || pathname === '/api/auth/login/')
    const isAuthMe =
        method === 'GET' &&
        (pathname === '/api/auth/me' || pathname === '/api/auth/me/')
    const isAuthLogout =
        method === 'POST' &&
        (pathname === '/api/auth/logout' || pathname === '/api/auth/logout/')
    if ((isAuthLogin || isAuthMe || isAuthLogout) && isSameOrigin) {
        return NextResponse.next()
    }

    // Everything else requires x-api-key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.API_SECRET) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*'],
}
