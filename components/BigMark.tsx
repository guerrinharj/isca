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
        'font-burns-ultra leading-none !text-isca-verde hover:!text-isca-verde'

    return (
        <Link href={`/${locale}`} className={`${baseClasses} ${className}`}>
            isca
        </Link>
    )
}
