// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // ✅ Públicos: todo /api/pratos* e /api/reservas*
    const isPublicPath =
        pathname.startsWith('/api/pratos') ||
        pathname.startsWith('/api/reservas');

    if (isPublicPath) {
        return NextResponse.next();
    }

    // ✅ Libera preflight CORS
    if (method === 'OPTIONS') {
        return NextResponse.next();
    }

    // 🔒 Demais rotas/métodos exigem x-api-key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.API_SECRET) {
        return new NextResponse(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
