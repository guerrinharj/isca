'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LocaleSwitcher from './locale-switcher'
import { type Locale } from '@/lib/i18n/locales'

type Messages = Readonly<{
    nav: { menu: string; reservas: string; sobre: string }
}>

type NavBarProps = {
    t: Messages
    locale: Locale
}

export default function NavBar({ t, locale }: NavBarProps) {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <nav
            className={`
                font-cirrus fixed top-0 left-0 right-0 z-50
                h-20 w-full
                pt-[env(safe-area-inset-top)]
                border-b-2 border-isca-laranja
                transition-colors duration-300
                ${scrolled ? 'bg-isca-creme text-black' : 'text-isca-creme bg-transparent'}
                md:right-0 md:left-auto md:w-auto md:h-screen md:pt-0 md:bg-transparent md:text-isca-creme md:border-0
            `}
            aria-label="Site navigation"
        >
            {/* MOBILE: diagonal horizontal bar */}
            <div className="block md:hidden relative h-full">
                <div className="absolute inset-0 rotate-3 origin-top-left overflow-visible transform-gpu">
                    <div
                        className="
                            -rotate-3 origin-top-left h-full
                            px-4 flex items-center gap-4
                            overflow-x-auto no-scrollbar
                            pointer-events-auto will-change-transform
                        "
                    >
                        <Link
                            href={`/${locale}/cardapio`}
                            className="
                                shrink-0 hover:text-isca-laranja transition-colors
                                text-xl
                                -rotate-12 origin-bottom py-1
                            "
                        >
                            {t.nav.menu}
                        </Link>

                        <Link
                            href={`/${locale}/reservas`}
                            className="
                                shrink-0 hover:text-isca-laranja transition-colors
                                text-xl
                                -rotate-12 origin-bottom py-1
                            "
                        >
                            {t.nav.reservas}
                        </Link>

                        <Link
                            href={`/${locale}/sobre`}
                            className="
                                shrink-0 hover:text-isca-laranja transition-colors
                                text-xl
                                -rotate-12 origin-bottom py-1
                            "
                        >
                            {t.nav.sobre}
                        </Link>

                        <div className="shrink-0 poppins-regular text-base">
                            <LocaleSwitcher current={locale} />
                        </div>
                    </div>
                </div>
            </div>

            {/* DESKTOP: funky vertical menu */}
            <div
                className="
                    hidden md:flex md:flex-col md:items-end md:justify-center md:gap-6
                    md:fixed md:right-0 md:top-0 md:z-50
                    md:h-screen md:w-auto md:p-6
                    md:transform md:rotate-2
                "
            >
                <Link
                    href={`/${locale}/cardapio`}
                    className="
                        hover:text-isca-laranja transition-colors block
                        text-4xl lg:text-5xl
                        -rotate-12 origin-right
                    "
                >
                    {t.nav.menu}
                </Link>
                <Link
                    href={`/${locale}/reservas`}
                    className="
                        hover:text-isca-laranja transition-colors block
                        text-4xl lg:text-5xl
                        -rotate-12 origin-right
                    "
                >
                    {t.nav.reservas}
                </Link>
                <Link
                    href={`/${locale}/sobre`}
                    className="
                        hover:text-isca-laranja transition-colors block
                        text-4xl lg:text-5xl
                        -rotate-12 origin-right
                    "
                >
                    {t.nav.sobre}
                </Link>
                <div className="poppins-regular text-lg">
                    <LocaleSwitcher current={locale} />
                </div>
            </div>
        </nav>
    )
}
