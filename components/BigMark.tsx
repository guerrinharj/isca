'use client'

import Link from 'next/link'

export default function BigMark({
    locale,
    className = '',
}: {
    locale: string
    className?: string
}) {
    const baseClasses =
        'font-burns-ultra leading-none !text-isca-verde hover:!text-isca-verde text-[20vw] md:text-[10vw] w-[95%] md:w-[60%]'

    return (
        <Link href={`/${locale}`} className={`${baseClasses} ${className}`}>
            isca
        </Link>
    )
}
