'use client'

import { useEffect, useState } from 'react'

type ThemeKey = 'default' | 'verde' | 'azul' | 'laranja'
const STORAGE_KEY = 'isca:theme'

const THEMES: Record<ThemeKey, { label: string; bg: string }> = {
    default: { label: 'Clássico', bg: '#ffeecf' },
    verde:   { label: 'Verde',    bg: '#104730' },
    azul:    { label: 'Azul',     bg: '#3b429f' },
    laranja: { label: 'Laranja',  bg: '#ff7e45' },
}

export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<ThemeKey>('default')

    useEffect(() => {
        const saved = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as ThemeKey | null
        const initial: ThemeKey = saved && ['default', 'verde', 'azul'].includes(saved) ? saved : 'default'
        setTheme(initial)
        document.documentElement.setAttribute('data-theme', initial)
    }, [])

    const apply = (t: ThemeKey) => {
        setTheme(t)
        document.documentElement.setAttribute('data-theme', t)
        try {
            localStorage.setItem(STORAGE_KEY, t)
        } catch {}
    }

    return (
        <div
            className="inline-flex items-center gap-1"
            aria-label="Selecionar tema de cores"
        >
            {(['verde', 'azul', 'laranja', 'default'] as ThemeKey[]).map((key) => {
                const active = theme === key
                const { label, bg } = THEMES[key]

                return (
                    <button
                        key={key}
                        onClick={() => apply(key)}
                        aria-pressed={active}
                        aria-label={label}
                        title={label}
                        className={[
                            "relative h-4 w-4 border transition",
                            active
                                ? "border-black/50 ring-1 ring-black/40"
                                : "border-black/20 hover:border-black/40"
                        ].join(' ')}
                        style={{ background: bg }}
                    />
                )
            })}
        </div>
    )
}
