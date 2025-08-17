import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['pt', 'en'] as const
const defaultLocale = 'pt'

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.match(/\.(.*)$/)
    ) {
        return
    }

    const hasLocale = locales.some(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
    )

    if (!hasLocale) {
        const url = req.nextUrl.clone()
        url.pathname = `/${defaultLocale}${pathname}`
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next|api|.*\\..*).*)'],
}
