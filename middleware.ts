import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authHeader = request.headers.get("x-api-key");

    if (authHeader !== process.env.API_SECRET) {
        return new NextResponse(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"],
};
