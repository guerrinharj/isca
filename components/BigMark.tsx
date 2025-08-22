'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BigMark({ locale }: { locale: string }) {
    const pathname = usePathname()

    // Hide only on mobile for these routes
    const hideOnMobile =
        pathname?.startsWith(`/${locale}/cardapio`) ||
        pathname?.startsWith(`/${locale}/reserva`)
        // || pathname?.startsWith(`/${locale}/reservas`)

    // Special case: apply lift on mobile about
    const isAbout = pathname === `/${locale}/sobre`

    return (
        <Link
            href={`/${locale}`}
            className={[
                'fixed bottom-4 left-4 z-40',
                'font-burns-ultra leading-none text-isca-verde',
                'text-[20vw] md:text-[10vw] w-[95%] md:w-[60%]',
                '!text-isca-verde hover:!text-isca-verde',
                hideOnMobile ? 'hidden md:block' : 'block',
                isAbout ? 'translate-y-[-4rem] translate-x-[-0.5rem] md:translate-x-0 md:translate-y-0' : ''
            ].join(' ')}
        >
            isca
        </Link>
    )
}
