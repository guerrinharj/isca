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
    const [lineWidth, setLineWidth] = useState<number>(2)
    const isHome = useIsHome()

    // On mount, resolve your black CSS var to be consistent with theme
    useEffect(() => {
        if (typeof window === 'undefined') return
        const root = getComputedStyle(document.documentElement)
        const resolvedBlack = root.getPropertyValue('--color-isca-preto').trim() || '#000000'
        setColor(resolvedBlack)
    }, [])

    // Listen for palette events: color / clear / save / width
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
        function onWidth(e: Event) {
            const detail = (e as CustomEvent).detail as { width: number }
            if (typeof detail?.width === 'number' && detail.width > 0) {
                setLineWidth(detail.width)
                const c = canvasRef.current
                const ctx = c?.getContext('2d')
                if (ctx) ctx.lineWidth = detail.width
            }
        }

        window.addEventListener('isca:setColor', onColor as EventListener)
        window.addEventListener('isca:clear', onClear)
        window.addEventListener('isca:save', onSave)
        window.addEventListener('isca:setWidth', onWidth as EventListener)
        return () => {
            window.removeEventListener('isca:setColor', onColor as EventListener)
            window.removeEventListener('isca:clear', onClear)
            window.removeEventListener('isca:save', onSave)
            window.removeEventListener('isca:setWidth', onWidth as EventListener)
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
            ctx.lineWidth = lineWidth // keep current thickness on resize
        },
        [lineWidth]
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

        // Keyboard: Shift+S to save
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
    const [width, setWidth] = useState<number>(2)
    const [selectedColor, setSelectedColor] = useState<string>('#000000')

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
        // initialize selection to brand black
        const initial = root.getPropertyValue('--color-isca-preto').trim() || '#000000'
        setSelectedColor(initial)
        window.dispatchEvent(new CustomEvent('isca:setWidth', { detail: { width } }))

        // keep in sync if some other control fires a color event
        const onExternalColor = (e: Event) => {
            const detail = (e as CustomEvent).detail as { color: string }
            if (detail?.color) setSelectedColor(detail.color)
        }
        window.addEventListener('isca:setColor', onExternalColor as EventListener)
        return () => window.removeEventListener('isca:setColor', onExternalColor as EventListener)
    }, [isHome])

    if (!isHome) return null

    const pick = (color: string) => {
        setSelectedColor(color)
        window.dispatchEvent(new CustomEvent('isca:setColor', { detail: { color } }))
    }
    const clear = () => window.dispatchEvent(new Event('isca:clear'))
    const save = () => window.dispatchEvent(new Event('isca:save'))

    const onWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value)
        setWidth(val)
        window.dispatchEvent(new CustomEvent('isca:setWidth', { detail: { width: val } }))
    }

    // inline style for CSS var (typed for TS)
    type TrackStyle = React.CSSProperties & { ['--track-color']: string }
    const trackStyle: TrackStyle = { ['--track-color']: selectedColor }

    return (
        <div className="flex items-center gap-3 mx-2" aria-label="Scribble palette">
            {/* Color dots */}
            <div className="flex items-center gap-2">
                {colors.map((c, i) => {
                    const isActive = c === selectedColor
                    return (
                        <button
                            key={i}
                            onClick={() => pick(c)}
                            title="Selecionar cor"
                            className={`
                                h-3 w-3 md:h-5 md:w-5 lg:h-6 lg:w-6
                                rounded-full border shadow-sm outline-none
                                focus:ring-2 focus:ring-black/20
                                ${isActive ? 'ring-2 ring-black/40 border-black/20' : 'border-black/10'}
                            `}
                            style={{ background: c }}
                        />
                    )
                })}
            </div>

            {/* Width slider (track reflects selected color) */}
            <div className="flex items-center gap-2 min-w-[90px]">
                <span className="text-[10px] md:text-xs select-none">1px</span>
                <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={width}
                    onChange={onWidthChange}
                    title="Espessura do traço"
                    style={trackStyle} // trackStyle has { ['--track-color']: selectedColor }
                    className="
                        relative
                        w-24 md:w-28 lg:w-32
                        appearance-none
                        bg-[var(--track-color)]
                        rounded
                        h-1
                        outline-none
                        [--thumb-size:12px]

                        [&::-webkit-slider-runnable-track]:appearance-none
                        [&::-webkit-slider-runnable-track]:h-1
                        [&::-webkit-slider-runnable-track]:rounded
                        [&::-webkit-slider-runnable-track]:bg-[var(--track-color)]

                        [&::-moz-range-track]:h-1
                        [&::-moz-range-track]:rounded
                        [&::-moz-range-track]:bg-[var(--track-color)]

                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:h-[var(--thumb-size)]
                        [&::-webkit-slider-thumb]:w-[var(--thumb-size)]
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[var(--track-color)]
                        [&::-webkit-slider-thumb]:border
                        [&::-webkit-slider-thumb]:border-black/30
                        [&::-webkit-slider-thumb]:-mt-[calc(var(--thumb-size)/4)]

                        [&::-moz-range-thumb]:h-[var(--thumb-size)]
                        [&::-moz-range-thumb]:w-[var(--thumb-size)]
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[var(--track-color)]
                        [&::-moz-range-thumb]:border
                        [&::-moz-range-thumb]:border-black/30
                    "
                />

                <span className="text-[10px] md:text-xs select-none">24px</span>
                <span className="text-[10px] md:text-xs text-black/70 w-8 text-right tabular-nums">
                    {width}px
                </span>
            </div>

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
