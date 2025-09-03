'use client'

import { useEffect, useState } from 'react'

type ThemeKey = 'creme' | 'verde' | 'azul' | 'laranja'
const STORAGE_KEY = 'isca:theme'

const THEMES: Record<ThemeKey, { label: string; bg: string }> = {
    creme:   { label: 'Creme',   bg: '#ffeecf' },
    verde:   { label: 'Verde',   bg: '#104730' },
    azul:    { label: 'Azul',    bg: '#3b429f' },
    laranja: { label: 'Laranja', bg: '#ff7e45' },
}

export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<ThemeKey>('creme')

    useEffect(() => {
        const savedRaw = typeof window !== 'undefined'
            ? localStorage.getItem(STORAGE_KEY)
            : null

        let initial: ThemeKey = 'creme'

        if (savedRaw === 'default') {
            // migrate old "default" key to "creme"
            try { localStorage.setItem(STORAGE_KEY, 'creme') } catch {}
            initial = 'creme'
        } else if (savedRaw && ['creme', 'verde', 'azul', 'laranja'].includes(savedRaw)) {
            initial = savedRaw as ThemeKey
        }

        setTheme(initial)
        document.documentElement.setAttribute('data-theme', initial)
    }, [])

    const apply = (t: ThemeKey) => {
        setTheme(t)
        document.documentElement.setAttribute('data-theme', t)
        try { localStorage.setItem(STORAGE_KEY, t) } catch {}
    }

    return (
        <div className="inline-flex items-center gap-1" aria-label="Selecionar tema de cores">
            {(['verde', 'azul', 'laranja', 'creme'] as ThemeKey[]).map((key) => {
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
                            active ? "border-black/50 ring-1 ring-black/40"
                                    : "border-black/20 hover:border-black/40"
                        ].join(' ')}
                        style={{ background: bg }}
                    />
                )
            })}
        </div>
    )
}
