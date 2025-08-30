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

type MeResponse =
    | { user: null }
    | {
            user: {
                id: string
                name: string
                email: string
                role: 'ADMIN' | 'USER'
            }
        }

export default function NavBar({ t, locale }: NavBarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [isLogged, setIsLogged] = useState<boolean>(false)
    const [loadingLogout, setLoadingLogout] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        let alive = true
        ;(async () => {
            try {
                const r = await fetch('/api/auth/me', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'cache-control': 'no-store' },
                })
                const data: MeResponse = await r.json()
                if (!alive) return
                setIsLogged(Boolean(data.user))
            } catch {
                if (!alive) return
                setIsLogged(false)
            }
        })()
        return () => {
            alive = false
        }
    }, [])

    async function onLogout() {
        try {
            setLoadingLogout(true)
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'cache-control': 'no-store' },
            })
        } finally {
            // Refresh UI state after logout
            setLoadingLogout(false)
            setIsLogged(false)
            // Optionally redirect:
            // window.location.href = `/${locale}`
            // Or just reload:
            window.location.reload()
        }
    }

    return (
        <nav
            className={`
                font-cirrus fixed top-0 left-0 right-0 z-50
                h-20 w-full
                pt-[env(safe-area-inset-top)]
                border-b-1 border-isca-verde
                transition-colors duration-300
                ${scrolled ? 'bg-isca-creme text-black' : 'text-isca-creme bg-isca-creme'}
                md:right-0 md:left-auto md:w-auto md:h-screen md:pt-0 md:bg-transparent md:text-isca-creme md:border-0
            `}
            aria-label="Site navigation"
        >
            <div className="container mx-auto px-3 h-full flex items-center justify-between">
                {/* MOBILE BAR (no logout here) */}
                <div className="block md:hidden relative h-full w-full">
                    <div className="absolute inset-0 origin-top-left overflow-visible transform-gpu">
                        <div
                            className="
                                origin-top-left h-full
                                flex items-center gap-4
                                overflow-x-auto no-scrollbar
                                pointer-events-auto will-change-transform
                            "
                        >
                            <Link
                                href={`/${locale}/cardapio`}
                                className="shrink-0 text-xl font-burns-ultra py-1 !text-isca-verde"
                            >
                                {t.nav.menu}
                            </Link>
                            <Link
                                href={`/${locale}/reservas`}
                                className="shrink-0 text-xl font-burns-ultra py-1 !text-isca-verde"
                            >
                                {t.nav.reservas}
                            </Link>
                            <Link
                                href={`/${locale}/sobre`}
                                className="shrink-0 text-xl font-burns-ultra py-1 !text-isca-verde"
                            >
                                {t.nav.sobre}
                            </Link>
                            <div className="shrink-0 poppins-regular text-base">
                                <LocaleSwitcher current={locale} />
                            </div>
                        </div>
                    </div>
                </div>


                {/* DESKTOP MENU (logout only on desktop) */}
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
                        className="hover:text-isca-laranja block text-4xl lg:text-5xl -rotate-12 origin-right"
                    >
                        {t.nav.menu}
                    </Link>
                    <Link
                        href={`/${locale}/reservas`}
                        className="hover:text-isca-laranja block text-4xl lg:text-5xl -rotate-12 origin-right"
                    >
                        {t.nav.reservas}
                    </Link>
                    <Link
                        href={`/${locale}/sobre`}
                        className="hover:text-isca-laranja block text-4xl lg:text-5xl -rotate-12 origin-right"
                    >
                        {t.nav.sobre}
                    </Link>

                    {/* Locale switcher */}
                    <div className="poppins-regular text-lg text-isca-verde">
                        <LocaleSwitcher current={locale} />
                    </div>

                    {/* LOGOUT shown only when logged (desktop only) */}
                    {isLogged && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="
                                mt-1
                                text-base poppins-regular
                                text-red-600                 
                                hover:text-red-800       
                                disabled:opacity-60
                            "
                            disabled={loadingLogout}
                            aria-label="Logout"
                        >
                            {loadingLogout ? '…' : 'LOGOUT'}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}
