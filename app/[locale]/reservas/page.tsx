'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_KEY = process.env.NEXT_PUBLIC_API_SECRET as string

/* ===== auth helper (client) ===== */
function useLoggedIn() {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
    useEffect(() => {
        let ignore = false
        fetch('/api/me', { credentials: 'include', cache: 'no-store' })
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => { if (!ignore) setLoggedIn(Boolean(d?.loggedIn)) })
            .catch(() => { if (!ignore) setLoggedIn(false) })
        return () => { ignore = true }
    }, [])
    return loggedIn
}

function IfLoggedDesktop({ children }: { children: React.ReactNode }) {
    const loggedIn = useLoggedIn()
    if (loggedIn !== true) return null
    return <div className="hidden md:block">{children}</div>
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
        return new Intl.DateTimeFormat(
            locale === 'pt' ? 'pt-BR' : 'en-US',
            { dateStyle: 'medium', timeStyle: 'short' }
        ).format(d)
    } catch { return iso }
}

/* ===== admin index (client) ===== */
function ReservasIndex({ locale }: { locale: string }) {
    const [reservas, setReservas] = useState<Reserva[] | null>(null)
    const [error, setError] = useState<string | null>(null)
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
            const d = await res.json()
            setReservas(Array.isArray(d?.reservas) ? d.reservas : [])
        } catch (e) {
            console.error(e)
            setReservas([])
            setError(locale === 'pt' ? 'Não foi possível carregar as reservas.' : 'Could not load reservations.')
        }
    }

    useEffect(() => { fetchAll() }, [])

    const ordered = useMemo(() => {
        if (!reservas) return null
        return [...reservas].sort((a, b) => +new Date(b.data) - +new Date(a.data))
    }, [reservas])

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
        <IfLoggedDesktop>
            <div className="mt-12 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Reservas (admin)</h2>
                    <button onClick={fetchAll} className="text-sm underline underline-offset-4 hover:opacity-80">
                        {locale === 'pt' ? 'Atualizar' : 'Refresh'}
                    </button>
                </div>

                {reservas === null ? (
                    <p className="opacity-70">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : ordered && ordered.length === 0 ? (
                    <p className="opacity-70">{locale === 'pt' ? 'Nenhuma reserva.' : 'No reservations.'}</p>
                ) : (
                    <ul className="space-y-3">
                        {ordered!.map(r => (
                            <li key={r.id} className="flex items-start justify-between border p-3 rounded">
                                <div className="text-sm">
                                    <div className="font-medium flex items-center gap-2 flex-wrap">
                                        <span>{r.nome} — {r.quantity} {locale === 'pt' ? 'pessoa(s)' : 'guest(s)'}</span>
                                        <span className="opacity-60">•</span>
                                        <span className="opacity-80">{formatWhen(r.data, locale)}</span>
                                        {r.is_confirmed ? (
                                            <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full border border-green-600/40">
                                                {locale === 'pt' ? 'confirmada' : 'confirmed'}
                                            </span>
                                        ) : (
                                            <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full border border-yellow-700/40">
                                                {locale === 'pt' ? 'pendente' : 'pending'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="opacity-80">{r.email} · {r.telefone}</div>
                                    {r.message ? <div className="mt-1 italic opacity-90">{r.message}</div> : null}
                                </div>
                                <div className="ml-4 shrink-0 flex items-center gap-3 text-sm">
                                    <Link
                                        href={`/${locale}/reservas/${r.id}/edit`}
                                        className="underline underline-offset-4 hover:opacity-80"
                                    >
                                        edit
                                    </Link>
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
        </IfLoggedDesktop>
    )
}

/* ===== page (client) ===== */
export default function Page() {
    const { locale } = useParams<{ locale: 'pt' | 'en' }>()
    const [form, setForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        data: '',
        quantity: 2,
        mensagem: ''
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
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: name === 'quantity' ? Number(value) : value }))
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        alert('Reserva enviada (placeholder)')
    }

    const inputClasses =
        "bg-transparent border-b border-isca-verde/40 outline-none ring-0 shadow-none py-2 w-full " +
        "text-isca-verde font-sans placeholder:opacity-40 " +
        "focus:border-isca-laranja focus:outline-none focus:ring-0 "

    const labelClasses =
        "block text-xs md:text-lg lg:text-xs font-medium mb-1 text-isca-laranja Poppins text-left"

    return (
        <section className="pb-20 md:pb-5 md:py-5 lg:mb-20 font-sans relative">
            <div className="relative max-w-md mx-auto">
                <h1
                    className="hidden md:block absolute -top-[40px] right-[32px] font-cirrus -rotate-12 text-4xl md:text-5xl tracking-tightest"
                    style={{ color: 'var(--color-isca-verde)' }}
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
                            required
                            className={inputClasses}
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 bg-isca-laranja text-isca-verde font-medium text-sm hover:opacity-90 active:opacity-80 transition mx-auto"
                    >
                        {t.submit}
                    </button>
                </form>

                {/* índice de reservas (admin only) */}
                <ReservasIndex locale={locale} />
            </div>
        </section>
    )
}
