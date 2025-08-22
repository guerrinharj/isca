'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { locales, type Locale } from '@/lib/i18n/locales'

function swapLocale(path: string, nextLocale: Locale) {
    const segments = path.split('/')
    // ['', 'pt', ...] ou ['', 'en', ...]
    if (locales.includes(segments[1] as Locale)) {
        segments[1] = nextLocale
        return segments.join('/') || '/'
    }
    return `/${nextLocale}${path}`
}

export default function LocaleSwitcher({ current }: { current: Locale }) {
    const pathname = usePathname()

    return (
        <div className="flex items-center gap-1 text-sm">
            <Link
                href={swapLocale(pathname || '/', 'pt')}
                className={current === 'pt' ? 'underline' : 'opacity-80 hover:opacity-100'}
            >
                PT
            </Link>
            <span className="opacity-50">/</span>
            <Link
                href={swapLocale(pathname || '/', 'en')}
                className={current === 'en' ? 'underline' : 'opacity-80 hover:opacity-100'}
            >
                EN
            </Link>
        </div>
    )
}
