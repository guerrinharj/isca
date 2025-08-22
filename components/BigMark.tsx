'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BigMark({ locale }: { locale: string }) {
    const pathname = usePathname()

    const hideBigMark =
        pathname?.startsWith(`/${locale}/cardapio`) ||
        pathname?.startsWith(`/${locale}/reserva`)

    if (hideBigMark) return null

    return (
        <Link
            href={`/${locale}`}
            className="
                fixed bottom-4 left-4
                font-burns-ultra leading-none
                text-isca-verde
                text-[20vw] md:text-[15vw] 
                w-[95%] md:w-[60%]
                !text-isca-verde hover:!text-isca-verde
                z-40
            "
        >
            isca
        </Link>
    )
}
