'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API_KEY = process.env.NEXT_PUBLIC_API_SECRET as string

/* ===== auth helper (client, tolerant to payload shape) ===== */
type AuthResponse =
    | { loggedIn: boolean }
    | {
            user?: unknown
            session?: unknown
            id?: unknown
            email?: string
            isAdmin?: boolean
            authenticated?: boolean
    }

function useLoggedIn() {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

    useEffect(() => {
        let ignore = false
        fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
            .then(async (r) => {
                if (!r.ok) throw new Error(String(r.status))
                let d: AuthResponse | undefined
                try {
                    d = await r.json()
                } catch {
                    d = undefined
                }
                const inferred =
                    (d as { loggedIn?: boolean })?.loggedIn ??
                    Boolean(
                        (d as { user?: unknown })?.user ??
                            (d as { session?: unknown })?.session ??
                            (d as { id?: unknown })?.id ??
                            (d as { email?: string })?.email ??
                            (d as { isAdmin?: boolean })?.isAdmin ??
                            (d as { authenticated?: boolean })?.authenticated
                    )
                if (!ignore) setLoggedIn(Boolean(inferred))
            })
            .catch(() => {
                if (!ignore) setLoggedIn(false)
            })
        return () => {
            ignore = true
        }
    }, [])

    return loggedIn
}

/* ===== shared banner ===== */
type BannerKind = 'success' | 'error'
type BannerState = { kind: BannerKind; text: string } | null

function Banner({ banner, onClose }: { banner: BannerState; onClose: () => void }) {
    if (!banner) return null
    const isSuccess = banner.kind === 'success'
    const base =
        'pointer-events-auto px-3 py-2 text-sm rounded border shadow-sm ' +
        'backdrop-blur-md will-change-[opacity,transform]'
    const tone = isSuccess
        ? 'bg-green-900 text-green-300 border-green-500/40'
        : 'bg-red-900 text-red-300 border-red-500/20'
    return (
        <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] ${base} ${tone}`}
            style={{ animation: 'fadeInUpMini 180ms ease-out both' }}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <span className="opacity-90">{banner.text}</span>
                <button
                    onClick={onClose}
                    className="opacity-70 hover:opacity-100 transition text-xs underline underline-offset-4"
                    aria-label="Fechar"
                >
                    fechar
                </button>
            </div>
        </div>
    )
}

function useBannerAutoHide(timeoutMs = 4600) {
    const [banner, setBanner] = useState<BannerState>(null)
    const timerRef = useRef<number | null>(null)

    const close = () => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setBanner(null)
    }

    const show = (kind: BannerKind, text: string) => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setBanner({ kind, text })
        timerRef.current = window.setTimeout(() => {
            setBanner(null)
            timerRef.current = null
        }, timeoutMs)
    }

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current)
            }
        }
    }, [])

    return { banner, show, close }
}

/* ===== types ===== */
type Reserva = {
    id: string
    nome: string
    email: string
    telefone: string
    quantity: number
    message?: string | null
    data: string // ISO
    is_confirmed: boolean
}

/* ===== utilities ===== */
function formatWhen(iso: string, locale: string) {
    try {
        const d = new Date(iso)
        return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(d)
    } catch {
        return iso
    }
}

function extractErrorMessage(u: unknown): string | null {
    if (u && typeof u === 'object' && 'error' in u) {
        const val = (u as { error?: unknown }).error
        if (typeof val === 'string') return val
    }
    return null
}

function safeJson(text: string): unknown {
    try {
        return JSON.parse(text)
    } catch {
        return null
    }
}

/* ===== time/window utils ===== */
function pad2(n: number) {
    return String(n).padStart(2, '0')
}

// Janela por dia da semana (local):
// 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sab
function getDailyWindow(d: Date): { start: string; end: string } | null {
    const wd = d.getDay()
    if (wd === 0) return { start: '12:00', end: '17:00' } // Domingo
    if (wd >= 3 && wd <= 6) return { start: '17:30', end: '19:30' } // Quarta–Sábado
    return null // Segunda/Terça: sem janela
}

function boundsForDate(d: Date): { min: string | null; max: string | null } {
    const win = getDailyWindow(d)
    if (!win) return { min: null, max: null }
    const y = d.getFullYear()
    const m = pad2(d.getMonth() + 1)
    const day = pad2(d.getDate())
    return {
        min: `${y}-${m}-${day}T${win.start}`,
        max: `${y}-${m}-${day}T${win.end}`,
    }
}

function isWithinWindow(d: Date): boolean {
    const win = getDailyWindow(d)
    if (!win) return false
    const minutes = d.getHours() * 60 + d.getMinutes()
    const [sH, sM] = win.start.split(':').map(Number)
    const [eH, eM] = win.end.split(':').map(Number)
    const minMin = sH * 60 + sM
    const maxMin = eH * 60 + eM
    return minutes >= minMin && minutes <= maxMin
}

function friendlyWindowFor(date: Date, locale: 'pt' | 'en' = 'pt') {
    const win = getDailyWindow(date)

    if (!win) {
        return locale === 'pt'
            ? 'Reservas apenas de Quarta a Sábado (17:30–19:30) e Domingo (12:00–17:00).'
            : 'Reservations are only available from Wednesday to Saturday (5:30 PM–7:30 PM) and Sunday (12:00 PM–5:00 PM).'
    }

    return locale === 'pt'
        ? `Para este dia, o horário permitido é entre ${win.start} e ${win.end}.`
        : `For this day, reservations are allowed between ${win.start} and ${win.end}.`
}

/* ===== admin index (client) ===== */
function ReservasIndex({ locale }: { locale: string }) {
    const [reservas, setReservas] = useState<Reserva[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [canViewAdmin, setCanViewAdmin] = useState(false)
    const { banner, show, close } = useBannerAutoHide()
    const loggedIn = useLoggedIn()
    const router = useRouter()

    const fetchAll = async () => {
        setError(null)
        try {
            const res = await fetch('/api/reservas', {
                headers: { 'x-api-key': API_KEY },
                credentials: 'include',
                cache: 'no-store',
            })
            if (!res.ok) throw new Error(await res.text())
            const d: { reservas?: Reserva[] } = await res.json()
            setReservas(Array.isArray(d?.reservas) ? d.reservas : [])
            setCanViewAdmin(true)
        } catch (e: unknown) {
            console.error(e)
            setReservas([])
            setError(locale === 'pt' ? 'Não foi possível carregar as reservas.' : 'Could not load reservations.')
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

    const ordered = useMemo<Reserva[]>(() => {
        if (!reservas) return []
        return [...reservas].sort((a, b) => +new Date(b.data) - +new Date(a.data))
    }, [reservas])

    const showIndex = loggedIn === true || canViewAdmin

    if (!showIndex) {
        return <div className="hidden md:block" />
    }

    const onDelete = async (id: string) => {
        if (!confirm(locale === 'pt' ? 'Deseja deletar esta reserva?' : 'Delete this reservation?')) return
        try {
            const res = await fetch(`/api/reservas/${id}`, {
                method: 'DELETE',
                headers: { 'x-api-key': API_KEY },
                credentials: 'include',
            })
            const raw = await res.text()
            if (!res.ok) {
                const maybe = extractErrorMessage(safeJson(raw))
                const msg = maybe ?? (raw || `HTTP ${res.status}`)
                throw new Error(msg)
            }
            show('success', locale === 'pt' ? 'Reserva deletada com sucesso!' : 'Reservation deleted!')
            await fetchAll()
            router.refresh()
        } catch (e: unknown) {
            console.error(e)
            show('error', locale === 'pt' ? 'Erro ao deletar reserva.' : 'Error deleting reservation.')
        }
    }

    return (
        <div
            className="hidden md:block mt-12 border-t pt-6 will-change-[opacity,transform]"
            style={{ animation: 'fadeInUpMini 220ms ease-out both' }}
        >
            <Banner banner={banner} onClose={close} />

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Reservas</h2>
                <button
                    onClick={fetchAll}
                    className="text-sm underline underline-offset-4 hover:opacity-80"
                >
                    {locale === 'pt' ? 'Atualizar' : 'Refresh'}
                </button>
            </div>

            {reservas === null ? (
                <p className="opacity-70">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
            ) : error ? (
                <p className="text-red-600">{error}</p>
            ) : ordered.length === 0 ? (
                <p className="opacity-70">{locale === 'pt' ? 'Nenhuma reserva.' : 'No reservations.'}</p>
            ) : (
                <ul className="space-y-3 pb-10">
                    {ordered.map((r) => (
                        <li
                            key={r.id}
                            className="flex items-start justify-between border p-3 rounded"
                        >
                            <div className="text-sm">
                                <div className="font-medium flex items-center gap-2 flex-wrap">
                                    <span className="font-burns-ultra">
                                        {r.nome}{' '}
                                        <span className="poppins-regular">
                                            - {r.quantity} {locale === 'pt' ? 'pessoa(s)' : 'guest(s)'}
                                        </span>
                                    </span>
                                    <span className="opacity-60">•</span>
                                    <span className="opacity-80">{formatWhen(r.data, locale)}</span>
                                </div>
                                <div className="opacity-80">
                                    {r.email} · {r.telefone}
                                </div>
                                {r.message ? <div className="mt-1 italic opacity-90">{r.message}</div> : null}
                            </div>
                            <div className="ml-4 shrink-0 flex items-center gap-3 text-sm">
                                <button
                                    onClick={() => onDelete(r.id)}
                                    className="text-red-600 underline underline-offset-4 hover:opacity-80"
                                >
                                    delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

/* ===== page (client) ===== */
export default function Page() {
    const { locale } = useParams<{ locale: 'pt' | 'en' }>()
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const { banner, show, close } = useBannerAutoHide()
    const [form, setForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        data: '',
        quantity: 2,
        mensagem: '',
    })
    const [bounds, setBounds] = useState<{ min: string | null; max: string | null }>({ min: null, max: null })

    const t = {
        title: locale === 'pt' ? 'Reservas' : 'Reservations',
        name: locale === 'pt' ? 'Nome' : 'Name',
        email: 'Email',
        phone: locale === 'pt' ? 'Telefone' : 'Phone',
        datetime: locale === 'pt' ? 'Data e hora' : 'Date & time',
        qty: locale === 'pt' ? 'Quantidade de pessoas' : 'Party size',
        mensagem: locale === 'pt' ? 'Mensagem' : 'Message',
        submit: locale === 'pt' ? 'Fazer reserva' : 'Create reservation',
        sending: locale === 'pt' ? 'Enviando…' : 'Sending…',
        success: locale === 'pt' ? 'Reserva enviada com sucesso!' : 'Reservation submitted!',
        fail:
            locale === 'pt'
                ? 'Não foi possível enviar sua reserva. Tente novamente.'
                : 'Could not submit your reservation. Please try again.',
        required: locale === 'pt' ? 'Preencha todos os campos obrigatórios.' : 'Fill all required fields.',
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        // Campos não relacionados a data mantêm o comportamento atual
        if (name !== 'data') {
            setForm((f) => ({
                ...f,
                [name]: name === 'quantity' ? Number(value) : value,
            }))
            return
        }

        // name === 'data'
        const d = new Date(value)

        // Valor parcialmente digitado/ inválido -> apenas mantém texto e limpa bounds
        if (isNaN(d.getTime())) {
            setForm((f) => ({ ...f, data: value }))
            setBounds({ min: null, max: null })
            return
        }

        // Define min/max para o dia selecionado
        const b = boundsForDate(d)
        setBounds(b)

        // Sem janela (Seg/Ter)
        if (!getDailyWindow(d)) {
            show('error', 'Neste dia não aceitamos reservas. ' + friendlyWindowFor(d))
            return
        }

        // Fora da janela
        if (!isWithinWindow(d)) {
            show('error', friendlyWindowFor(d, locale))
            return
        }

        // OK
        setForm((f) => ({ ...f, data: value }))
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        try {
            if (!form.nome || !form.email || !form.telefone || !form.data || !form.quantity) {
                show('error', t.required)
                return
            }

            // datetime-local -> ISO (UTC)
            const iso = new Date(form.data).toISOString()

            const payload = {
                nome: form.nome.trim(),
                email: form.email.trim().toLowerCase(),
                telefone: form.telefone.trim(),
                quantity: Number(form.quantity),
                data: iso,
                message: form.mensagem?.trim() || undefined,
            }

            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
                cache: 'no-store',
            })

            const text = await res.text()
            const json = safeJson(text)

            if (!res.ok) {
                console.error('[Reserva] POST fail:', res.status, text)
                const apiMsg = extractErrorMessage(json)
                const msg = apiMsg ?? (text || `HTTP ${res.status}`)
                show('error', `${t.fail} ${msg}`)
                return
            }

            show('success', t.success)
            setForm({ nome: '', email: '', telefone: '', data: '', quantity: 2, mensagem: '' })
            setBounds({ min: null, max: null })
            router.refresh()
        } catch (err: unknown) {
            console.error('[Reserva] exception:', err)
            show('error', t.fail)
        } finally {
            setSubmitting(false)
        }
    }

    const inputClasses =
        'bg-transparent border-b border-theme outline-none ring-0 shadow-none py-2 w-full ' +
        'font-sans placeholder:opacity-40 text-theme ' +
        'focus:border-accent focus:outline-none focus:ring-0'

    const labelClasses =
        'block text-xs md:text-lg lg:text-xs font-medium mb-1 text-accent Poppins text-left'

    return (
        <>
            {/* global to this file; used by outer section and admin list */}
            <style>{`
                @keyframes fadeInUpMini {
                    from { opacity: 0; transform: translateY(2px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                /* ===== Reserva button border animation (square) ===== */
                .btn-reserva {
                    position: relative;
                    transition: border-color 180ms ease, transform 120ms ease, box-shadow 220ms ease;
                }
                .btn-reserva:hover { transform: translateY(-1px); }
                .btn-reserva:active { transform: translateY(0); }
                .btn-reserva::after {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    border: 1px solid currentColor;
                    opacity: 0;
                    transform: scale(0.98);
                    transition: opacity 220ms ease, transform 220ms ease;
                    pointer-events: none;
                }
                .btn-reserva:hover::after,
                .btn-reserva:focus-visible::after {
                    opacity: 0.9;
                    transform: scale(1);
                }
            `}</style>

            <section
                className="pb-20 md:pb-5 md:py-5 lg:mb-20 font-sans relative will-change-[opacity,transform]"
                style={{ animation: 'fadeInUpMini 220ms ease-out both' }}
            >
                {/* banner do formulário */}
                <Banner banner={banner} onClose={close} />

                {/* WIDTH MATCHES cardapio: container + max-w-3xl */}
                <div className="container mx-auto max-w-3xl relative px-4 md:px-0">
                    <h1 className="absolute right-0 font-cirrus -rotate-12 text-4xl lg:text-5xl font-display tracking-tightest">
                        {t.title}
                    </h1>

                    {/* 2-col layout on md+, with full-width items using col-span-2 */}
                    <form
                        onSubmit={onSubmit}
                        className="grid w-full gap-6 mt-24 md:grid-cols-2"
                    >
                        {/* Nome (full width) */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>{t.name}</label>
                            <input
                                name="nome"
                                value={form.nome}
                                onChange={onChange}
                                placeholder="Donizete Pantera"
                                required
                                className={inputClasses}
                            />
                        </div>

                        {/* Email (1/2) */}
                        <div>
                            <label className={labelClasses}>{t.email}</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onChange}
                                placeholder="donizetepantera@gmail.com"
                                required
                                className={inputClasses}
                            />
                        </div>

                        {/* Telefone (1/2) */}
                        <div>
                            <label className={labelClasses}>{t.phone}</label>
                            <input
                                name="telefone"
                                value={form.telefone}
                                onChange={onChange}
                                placeholder="+55 21 2569 6969"
                                required
                                className={inputClasses}
                            />
                        </div>

                        {/* Data e hora (1/2) */}
                        <div>
                            <label className={labelClasses}>{t.datetime}</label>
                            <input
                                name="data"
                                type="datetime-local"
                                value={form.data}
                                onChange={onChange}
                                required
                                className={inputClasses}
                                min={bounds.min ?? undefined}
                                max={bounds.max ?? undefined}
                            />
                        </div>

                        {/* Quantidade (1/2) */}
                        <div>
                            <label className={labelClasses}>{t.qty}</label>
                            <input
                                name="quantity"
                                type="number"
                                min={1}
                                max={30}
                                value={form.quantity}
                                onChange={onChange}
                                placeholder={t.qty}
                                required
                                className={inputClasses}
                            />
                        </div>

                        {/* Mensagem (full width) */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>{t.mensagem}</label>
                            <input
                                name="mensagem"
                                value={form.mensagem}
                                onChange={onChange}
                                placeholder="Quero uma mesa que nem a do Maradona"
                                className={inputClasses}
                            />
                        </div>

                        {/* Botão (full width, centered) */}
                        <div className="md:col-span-2 flex justify-center">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="
                                    btn-reserva mt-4 inline-flex items-center justify-center
                                    px-4 py-2 font-medium text-sm transition
                                    bg-accent text-theme border-2 border-theme hover:border-accent
                                    focus-visible:outline-none focus-visible:ring-0
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    rounded-none
                                "
                            >
                                {submitting ? t.sending : t.submit}
                            </button>
                        </div>
                    </form>

                    {/* índice de reservas (admin only) */}
                    <ReservasIndex locale={locale} />
                </div>
            </section>
        </>
    )
}
