'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BigMark({
    locale,
    inline = false,
}: {
    locale: string
    inline?: boolean
}) {
    const pathname = usePathname()

    const isAbout = pathname === `/${locale}/sobre`

    // Hide only on mobile for these routes when NOT inline (i.e., the fixed layout one)
    const hideOnMobileFixed =
        !inline &&
        (
            pathname?.startsWith(`/${locale}/cardapio`) ||
            pathname?.startsWith(`/${locale}/reserva`) ||
            // if you also use plural:
            // pathname?.startsWith(`/${locale}/reservas`) ||
            isAbout // hide the fixed one on /about mobile; we’ll show the inline version in the stack
        )

    const baseClasses = [
        'font-burns-ultra leading-none !text-isca-verde hover:!text-isca-verde',
        'text-[20vw] md:text-[10vw] w-[95%] md:w-[60%]',
    ].join(' ')

    if (inline) {
        // unpositioned, to be used inside the stack
        return (
            <Link href={`/${locale}`} className={baseClasses}>
                isca
            </Link>
        )
    }

    // default: fixed instance controlled by layout
    return (
        <Link
            href={`/${locale}`}
            className={[
                'fixed bottom-4 left-4 z-40',
                baseClasses,
                hideOnMobileFixed ? 'hidden md:block' : 'block'
            ].join(' ')}
        >
            isca
        </Link>
    )
}
