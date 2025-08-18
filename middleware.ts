import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;

    const isPratosPath =
        pathname === '/api/pratos' || pathname.startsWith('/api/pratos/');

    if (isPratosPath) {
        return NextResponse.next();
    }

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
