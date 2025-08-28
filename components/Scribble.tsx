'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/** Routes where drawing/palette must NOT appear */
const BLOCKED = ['/reserva', '/cardapio', '/sobre']

/** Only show on home ("/pt" or "/en") */
function useIsHome() {
    const pathname = usePathname() || ''
    const isBlocked = BLOCKED.some(p => pathname.startsWith(p) || pathname.includes(p))
    const isHome = /^\/(pt|en)$/.test(pathname)
    return isHome && !isBlocked
}

/** CSS variable-based brand colors (no creme) */
const COLOR_VARS = [
    'var(--color-isca-verde)',
    'var(--color-isca-laranja)',
    'var(--color-isca-azul)',
    'var(--color-isca-verde-claro)',
    'var(--color-isca-preto)',
] as const

/* -------------------------------------------------------------------------- */
/*                               ScribbleCanvas                               */
/* -------------------------------------------------------------------------- */
export function ScribbleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawingRef = useRef(false)
    const lastPosRef = useRef<{ x: number; y: number } | null>(null)

    // start with plain black; will be updated if palette emits a color
    const [color, setColor] = useState<string>('#000000')
    const isHome = useIsHome()

    // On mount, resolve your black CSS var to be consistent with theme
    useEffect(() => {
        if (typeof window === 'undefined') return
        const root = getComputedStyle(document.documentElement)
        const resolvedBlack = root.getPropertyValue('--color-isca-preto').trim() || '#000000'
        setColor(resolvedBlack)
    }, [])

    // Listen for palette events + clear + save
    useEffect(() => {
        function onColor(e: Event) {
            const detail = (e as CustomEvent).detail as { color: string }
            if (detail?.color) setColor(detail.color)
        }
        function onClear() {
            const c = canvasRef.current
            if (!c) return
            const ctx = c.getContext('2d')
            if (!ctx) return
            ctx.clearRect(0, 0, c.width, c.height)
        }
        async function onSave() {
            const c = canvasRef.current
            if (!c) return
            // Prefer toBlob (async, memory-friendly)
            const blob: Blob | null = await new Promise(res => c.toBlob(res, 'image/png'))
            if (!blob) return
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const ts = new Date()
                .toISOString()
                .replaceAll(':', '')
                .replaceAll('.', '')
                .replace('T', '-')
                .slice(0, 15)
            a.href = url
            a.download = `isca-scribble-${ts}.png`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        }

        window.addEventListener('isca:setColor', onColor as EventListener)
        window.addEventListener('isca:clear', onClear)
        window.addEventListener('isca:save', onSave)
        return () => {
            window.removeEventListener('isca:setColor', onColor as EventListener)
            window.removeEventListener('isca:clear', onClear)
            window.removeEventListener('isca:save', onSave)
        }
    }, [])

    // DPR-aware resize (keeps previous content)
    const resize = useMemo(
        () => () => {
            const c = canvasRef.current
            if (!c) return
            const dpr = Math.max(1, window.devicePixelRatio || 1)
            const { innerWidth: w, innerHeight: h } = window

            const prev = document.createElement('canvas')
            prev.width = c.width
            prev.height = c.height
            const pctx = prev.getContext('2d')
            const ctx = c.getContext('2d')
            if (!ctx || !pctx) return
            pctx.drawImage(c, 0, 0)

            c.width = Math.floor(w * dpr)
            c.height = Math.floor(h * dpr)
            c.style.width = `${w}px`
            c.style.height = `${h}px`

            // scale to CSS pixels
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            // restore image roughly in CSS pixel space
            ctx.drawImage(prev, 0, 0, prev.width / dpr, prev.height / dpr)

            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.lineWidth = 1 // very thin line
        },
        []
    )

    useEffect(() => {
        if (!isHome) return
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [isHome, resize])

    // Drawing handlers
    useEffect(() => {
        if (!isHome) return
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return

        const getXY = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY })

        const down = (e: PointerEvent) => {
            drawingRef.current = true
            lastPosRef.current = getXY(e)
            c.setPointerCapture(e.pointerId)
        }
        const move = (e: PointerEvent) => {
            if (!drawingRef.current) return
            const pos = getXY(e)
            const last = lastPosRef.current
            if (!last) {
                lastPosRef.current = pos
                return
            }
            ctx.strokeStyle = color
            ctx.beginPath()
            ctx.moveTo(last.x, last.y)
            ctx.lineTo(pos.x, pos.y)
            ctx.stroke()
            lastPosRef.current = pos
        }
        const up = (e: PointerEvent) => {
            drawingRef.current = false
            lastPosRef.current = null
            try {
                c.releasePointerCapture(e.pointerId)
            } catch {}
        }

        c.addEventListener('pointerdown', down)
        c.addEventListener('pointermove', move)
        c.addEventListener('pointerup', up)
        c.addEventListener('pointercancel', up)

        // Keyboard shortcut: Shift+S to save
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === 'S' || e.key === 's') && e.shiftKey) {
                e.preventDefault()
                window.dispatchEvent(new Event('isca:save'))
            }
        }
        window.addEventListener('keydown', onKey)

        return () => {
            c.removeEventListener('pointerdown', down)
            c.removeEventListener('pointermove', move)
            c.removeEventListener('pointerup', up)
            c.removeEventListener('pointercancel', up)
            window.removeEventListener('keydown', onKey)
        }
    }, [isHome, color])

    if (!isHome) return null

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[15] touch-none cursor-crosshair"
            aria-hidden
        />
    )
}

/* -------------------------------------------------------------------------- */
/*                              ScribblePalette                               */
/* -------------------------------------------------------------------------- */
export function ScribblePalette() {
    const isHome = useIsHome()
    const [colors, setColors] = useState<string[]>([]) // resolved once on mount

    useEffect(() => {
        if (!isHome) return
        if (typeof window === 'undefined') return
        const root = getComputedStyle(document.documentElement)
        const resolved = COLOR_VARS.map(c =>
            c.startsWith('var(')
                ? root.getPropertyValue(c.slice(4, -1).trim()).trim() || c
                : c
        )
        setColors(resolved)
    }, [isHome])

    if (!isHome) return null

    const pick = (color: string) => {
        window.dispatchEvent(new CustomEvent('isca:setColor', { detail: { color } }))
    }
    const clear = () => window.dispatchEvent(new Event('isca:clear'))
    const save = () => window.dispatchEvent(new Event('isca:save'))

    return (
        <div className="flex items-center gap-2 mx-2" aria-label="Scribble palette">
            {colors.map((c, i) => (
                <button
                    key={i}
                    onClick={() => pick(c)}
                    title="Selecionar cor"
                    className="
                        h-3 w-3          /* tiny on mobile */
                        md:h-5 md:w-5    /* medium on tablet */
                        lg:h-6 lg:w-6    /* larger on desktop */
                        rounded-full border border-black/10 shadow-sm
                        outline-none focus:ring-2 focus:ring-black/20
                    "
                    style={{ background: c }}
                />
            ))}

            {/* Clear (X) */}
            <button
                onClick={clear}
                title="Limpar"
                className="
                    h-3 w-3 md:h-5 md:w-5 lg:h-6 lg:w-6
                    flex items-center justify-center
                    text-[0.5rem] md:text-xs lg:text-sm
                    text-black
                "
            >
                ✕
            </button>

            {/* Save (↓) */}
            <button
                onClick={save}
                title="Salvar (Shift+S)"
                className="
                    h-3 w-3 md:h-5 md:w-5 lg:h-6 lg:w-6
                    flex items-center justify-center
                    text-[0.5rem] md:text-xs lg:text-sm
                    text-black
                "
                aria-keyshortcuts="Shift+S"
            >
                ↓
            </button>
        </div>
    )
}
