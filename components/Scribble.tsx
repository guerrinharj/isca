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

/** Resolve 'var(--token)' to actual color (e.g. '#104730') */
function resolveCssColor(value: string) {
    if (value.startsWith('var(')) {
        const token = value.slice(4, -1).trim() // --color-...
        const resolved = getComputedStyle(document.documentElement)
            .getPropertyValue(token)
            .trim()
        return resolved || value
    }
    return value
}

const COLORS = [
    'var(--color-isca-verde)',
    'var(--color-isca-laranja)',
    'var(--color-isca-azul)',
    'var(--color-isca-verde-claro)',
    'var(--color-isca-preto)',
] as const

/* ---------------------------- Canvas Overlay ---------------------------- */
export function ScribbleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawingRef = useRef(false)
    const lastPosRef = useRef<{ x: number; y: number } | null>(null)

    // initialize with resolved black
    const [color, setColor] = useState<string>('#000000')
    const isHome = useIsHome()

    // Ensure initial color follows your CSS var for black
    useEffect(() => {
        setColor(resolveCssColor('var(--color-isca-preto)'))
    }, [])

    // Palette -> Canvas channel
    useEffect(() => {
        function onColor(e: Event) {
            const detail = (e as CustomEvent).detail as { color: string }
            if (detail?.color) setColor(resolveCssColor(detail.color))
        }
        function onClear() {
            const c = canvasRef.current
            if (!c) return
            const ctx = c.getContext('2d')
            if (!ctx) return
            ctx.clearRect(0, 0, c.width, c.height)
        }
        window.addEventListener('isca:setColor', onColor as EventListener)
        window.addEventListener('isca:clear', onClear)
        return () => {
            window.removeEventListener('isca:setColor', onColor as EventListener)
            window.removeEventListener('isca:clear', onClear)
        }
    }, [])

    // Pixel ratio aware resize
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
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.drawImage(prev, 0, 0, prev.width / dpr, prev.height / dpr)
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.lineWidth = 1
        },
        []
    )

    useEffect(() => {
        if (!isHome) return
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [isHome, resize])

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
            ctx.strokeStyle = color // uses the latest resolved color
            ctx.beginPath()
            ctx.moveTo(last.x, last.y)
            ctx.lineTo(pos.x, pos.y)
            ctx.stroke()
            lastPosRef.current = pos
        }
        const up = (e: PointerEvent) => {
            drawingRef.current = false
            lastPosRef.current = null
            try { c.releasePointerCapture(e.pointerId) } catch {}
        }

        c.addEventListener('pointerdown', down)
        c.addEventListener('pointermove', move)
        c.addEventListener('pointerup', up)
        c.addEventListener('pointercancel', up)
        return () => {
            c.removeEventListener('pointerdown', down)
            c.removeEventListener('pointermove', move)
            c.removeEventListener('pointerup', up)
            c.removeEventListener('pointercancel', up)
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

/* ------------------------------ Palette UI ------------------------------ */
export function ScribblePalette() {
    const isHome = useIsHome()
    if (!isHome) return null

    const pick = (c: string) => {
        const resolved = resolveCssColor(c)
        window.dispatchEvent(new CustomEvent('isca:setColor', { detail: { color: resolved } }))
    }
    const clear = () => window.dispatchEvent(new Event('isca:clear'))

    return (
        <div className="flex items-center gap-2 mx-2" aria-label="Scribble palette">
            {COLORS.map((c, i) => (
                <button
                    key={i}
                    onClick={() => pick(c)}
                    title="Selecionar cor"
                    className="
                        h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8
                        rounded-full border border-black/10
                        shadow-sm
                        outline-none focus:ring-2 focus:ring-black/20
                    "
                    style={{ background: resolveCssColor(c) }}
                />
            ))}

            {/* Clear (X) */}
            <button
                onClick={clear}
                title="Limpar desenho"
                className="
                    h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8
                    flex items-center justify-center
                    text-sm md:text-base
                    text-black
                "
            >
                ✕
            </button>
        </div>
    )
}
