// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname, origin } = request.nextUrl
    const method = request.method

    // 🔀 Redirect /login -> /pt/login (antes de qualquer outra lógica)
    if (pathname === '/login' || pathname === '/login/') {
        const url = request.nextUrl.clone()
        url.pathname = '/pt/login'
        return NextResponse.redirect(url)
    }

    if (method === 'OPTIONS') return NextResponse.next()

    const reqOrigin = request.headers.get('origin') || ''
    const referer = request.headers.get('referer') || ''
    const isSameOrigin =
        (reqOrigin && reqOrigin === origin) ||
        (referer && referer.startsWith(origin))

    // PÚBLICAS
    const isPublicPratosList =
        method === 'GET' && (pathname === '/api/pratos' || pathname === '/api/pratos/')

    const isPublicVinhos =
        method === 'GET' && /^\/api\/vinhos(\/[^/]+)?\/?$/.test(pathname)

    const isPublicReservaCreate =
        method === 'POST' && (pathname === '/api/reservas' || pathname === '/api/reservas/')

    if (isPublicPratosList || isPublicVinhos || isPublicReservaCreate) {
        return NextResponse.next()
    }

    // Auth endpoints (same-origin)
    const isAuth =
        (method === 'POST' && (pathname === '/api/auth/login' || pathname === '/api/auth/logout' || pathname === '/api/auth/logout/')) ||
        (method === 'GET' && (pathname === '/api/auth/me' || pathname === '/api/auth/me/'))
    if (isAuth && isSameOrigin) return NextResponse.next()

    // ✅ Allow same-origin calls that have a session cookie (logged-in admin UI)
    if (isSameOrigin) {
        const session = request.cookies.get('isca_session')?.value
        if (session) return NextResponse.next()
    }

    // Fallback: exige API key
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
    // 👇 Inclui /api/* e também /login (com e sem /)
    matcher: ['/api/:path*', '/login', '/login/'],
}
