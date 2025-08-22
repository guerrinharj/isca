'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BigMark({ locale }: { locale: string }) {
    const pathname = usePathname()

    // Hide only on mobile for these routes
    const hideOnMobile =
        pathname?.startsWith(`/${locale}/cardapios`) ||
        pathname?.startsWith(`/${locale}/reserva`)
        // If you also use /reservas, add:
        // || pathname?.startsWith(`/${locale}/reservas`)

    return (
        <Link
            href={`/${locale}`}
            className={[
                'fixed bottom-4 left-4 z-40',
                'font-burns-ultra leading-none text-isca-verde',
                'text-[20vw] md:text-[10vw] w-[95%] md:w-[60%]',
                '!text-isca-verde hover:!text-isca-verde',
                hideOnMobile ? 'hidden md:block' : 'block'
            ].join(' ')}
        >
            isca
        </Link>
    )
}
