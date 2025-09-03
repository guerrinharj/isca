'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminFAB({ locale }: { locale: string }) {
    const [loggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        fetch('/api/me', { credentials: 'include' })
            .then(r => r.json())
            .then(d => setLoggedIn(Boolean(d?.loggedIn)))
            .catch(() => setLoggedIn(false))
    }, [])

    if (!loggedIn) return null

    return (
        <Link
            href={`/${locale}/pratos/new`}
            className="
                hidden md:flex fixed bottom-6 left-6 z-40
                h-14 w-14 items-center justify-center
                rounded-full border border-black/20 text-white
                text-3xl leading-none shadow-lg hover:scale-105 transition
            "
            aria-label="Criar Prato"
            title="Criar Prato"
        >
            +
        </Link>
    )
}
