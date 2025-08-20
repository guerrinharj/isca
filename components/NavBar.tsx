'use client'

import Link from 'next/link'
import LocaleSwitcher from './locale-switcher'
import { type Locale } from '@/lib/i18n/locales'

type Messages = Readonly<{
    nav: {
        menu: string
        reservas: string
        sobre: string
    }
}>

type NavBarProps = {
    t: Messages
    locale: Locale
}

export default function NavBar({ t, locale }: NavBarProps) {
    return (
        <nav
            className="
                font-cirrus text-isca-creme
                fixed right-0 top-0 z-50
                h-screen w-auto
                flex flex-col items-end justify-center gap-6
                p-6
                transform rotate-2
            "
        >
            <Link
                href={`/${locale}/cardapio`}
                className="
                    hover:text-isca-laranja transition-colors block
                    text-2xl sm:text-3xl md:text-4xl lg:text-5xl
                    -rotate-12 origin-right
                "
            >
                {t.nav.menu}
            </Link>

            <Link
                href={`/${locale}/reservas`}
                className="
                    hover:text-isca-laranja transition-colors block
                    text-2xl sm:text-3xl md:text-4xl lg:text-5xl
                    -rotate-12 origin-right
                "
            >
                {t.nav.reservas}
            </Link>

            <Link
                href={`/${locale}/sobre`}
                className="
                    hover:text-isca-laranja transition-colors block
                    text-2xl sm:text-3xl md:text-4xl lg:text-5xl
                    -rotate-12 origin-right
                "
            >
                {t.nav.sobre}
            </Link>

            <div
                className="
                    poppins-regular
                    text-sm sm:text-base md:text-lg
                    -rotate-6
                "
            >
                <LocaleSwitcher current={locale} />
            </div>
        </nav>
    )
}
