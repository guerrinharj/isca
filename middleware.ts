// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const method = request.method

    // ✅ Always allow CORS preflight
    if (method === 'OPTIONS') return NextResponse.next()

    // ✅ Public: GET /api/pratos (with or without trailing slash)
    const isPublicPratosList =
        method === 'GET' &&
        (pathname === '/api/pratos' || pathname === '/api/pratos/')

    // ✅ Public: POST /api/reservas (with or without trailing slash)
    const isPublicReservaCreate =
        method === 'POST' &&
        (pathname === '/api/reservas' || pathname === '/api/reservas/')

    if (isPublicPratosList || isPublicReservaCreate) {
        return NextResponse.next()
    }

    // 🔒 Everything else requires x-api-key
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
