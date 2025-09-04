'use client'

import { useEffect, useMemo, useState } from 'react'
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

/* ===== admin index (client) ===== */
function ReservasIndex({ locale }: { locale: string }) {
    const [reservas, setReservas] = useState<Reserva[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [canViewAdmin, setCanViewAdmin] = useState(false) // allow if reservas fetch works
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
        } catch (e) {
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

    // Desktop-only gate + auth/permission gate
    const show = loggedIn === true || canViewAdmin

    if (!show) {
        // keep layout flow on desktop without flashing content on mobile
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
            if (!res.ok) throw new Error(await res.text())
            alert(locale === 'pt' ? 'Reserva deletada com sucesso!' : 'Reservation deleted!')
            await fetchAll()
            router.refresh()
        } catch (e) {
            console.error(e)
            alert(locale === 'pt' ? 'Erro ao deletar reserva.' : 'Error deleting reservation.')
        }
    }

    return (
        <div
            className="hidden md:block mt-12 border-t pt-6 will-change-[opacity,transform]"
            style={{ animation: 'fadeInUpMini 220ms ease-out both' }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Reservas (admin)</h2>
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
                                    {r.is_confirmed ? (
                                        <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full border border-green-600/40">
                                            {locale === 'pt' ? 'Confirmada' : 'Confirmed'}
                                        </span>
                                    ) : (
                                        <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full border border-yellow-700/40">
                                            {locale === 'pt' ? 'Pendente' : 'Pending'}
                                        </span>
                                    )}
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
    const [form, setForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        data: '',
        quantity: 2,
        mensagem: '',
    })

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
        fail: locale === 'pt' ? 'Não foi possível enviar sua reserva. Tente novamente.' : 'Could not submit your reservation. Please try again.',
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm((f) => ({
            ...f,
            [name]: name === 'quantity' ? Number(value) : value,
        }))
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        try {
            if (!form.nome || !form.email || !form.telefone || !form.data || !form.quantity) {
                alert(locale === 'pt' ? 'Preencha todos os campos obrigatórios.' : 'Fill all required fields.')
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
                headers: { 'Content-Type': 'application/json' }, // POST não precisa x-api-key
                credentials: 'include',
                body: JSON.stringify(payload),
                cache: 'no-store',
            })

            const text = await res.text()
            let json: any = null
            try { json = JSON.parse(text) } catch {}

            if (!res.ok) {
                console.error('[Reserva] POST fail:', res.status, text)
                const msg = json?.error || text || `HTTP ${res.status}`
                alert(`${t.fail}\n${msg}`)
                return
            }

            alert(t.success)
            setForm({ nome: '', email: '', telefone: '', data: '', quantity: 2, mensagem: '' })
            router.refresh()
        } catch (err: any) {
            console.error('[Reserva] exception:', err)
            alert(t.fail)
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
            `}</style>

            <section
                className="pb-20 md:pb-5 md:py-5 lg:mb-20 font-sans relative will-change-[opacity,transform]"
                style={{ animation: 'fadeInUpMini 220ms ease-out both' }}
            >
                <div className="relative max-w-md mx-auto">
                    <h1
                        className="absolute right-0 font-cirrus -rotate-12 text-4xl lg:text-5xl font-display tracking-tightest"
                    >
                        {t.title}
                    </h1>

                    <form onSubmit={onSubmit} className="grid gap-6 w-full mt-24">
                        <div>
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

                        <div>
                            <label className={labelClasses}>{t.datetime}</label>
                            <input
                                name="data"
                                type="datetime-local"
                                value={form.data}
                                onChange={onChange}
                                required
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>{t.qty}</label>
                            <input
                                name="quantity"
                                type="number"
                                min={1}
                                value={form.quantity}
                                onChange={onChange}
                                placeholder={t.qty}
                                required
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>{t.mensagem}</label>
                            <input
                                name="mensagem"
                                value={form.mensagem}
                                onChange={onChange}
                                placeholder="Quero uma mesa que nem a do Maradona"
                                className={inputClasses}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="
                                mt-4 inline-flex items-center justify-center rounded-full
                                px-4 py-2 font-medium text-sm hover:opacity-90 active:opacity-80 transition mx-auto
                                bg-accent text-theme disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? t.sending : t.submit}
                        </button>
                    </form>

                    {/* índice de reservas (admin only) */}
                    <ReservasIndex locale={locale} />
                </div>
            </section>
        </>
    )
}
