'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'


const API_KEY = process.env.NEXT_PUBLIC_API_SECRET as string

function useLoggedIn() {
    const [loggedIn, setLoggedIn] = useState(false)
    useEffect(() => {
        fetch('/api/me', { credentials: 'include' })
            .then(r => r.json())
            .then(d => setLoggedIn(Boolean(d?.loggedIn)))
            .catch(() => setLoggedIn(false))
    }, [])
    return loggedIn
}

function IfLoggedDesktop({ children }: { children: React.ReactNode }) {
    const loggedIn = useLoggedIn()
    if (!loggedIn) return null
    return <div className="hidden md:block">{children}</div>
}

function AdminFAB({ locale }: { locale: string }) {
    const loggedIn = useLoggedIn()
    if (!loggedIn) return null
    return (
        <Link
            href={`/${locale}/pratos/new`}
            className="
                hidden md:flex fixed bottom-6 left-6 z-40
                h-14 w-14 items-center justify-center
                rounded-full border border-black/20 bg-isca-verde text-white
                text-3xl leading-none shadow-lg hover:scale-105 transition
            "
            aria-label="Criar Prato"
            title="Criar Prato"
        >
            +
        </Link>
    )
}

type Reserva = {
    id: string
    nome: string
    email: string
    telefone: string
    quantity: number
    message?: string | null
    data: string
    is_confirmed: boolean
}

function ReservasIndex({ locale }: { locale: string }) {
    const [reservas, setReservas] = useState<Reserva[] | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetch('/api/reservas', {
            headers: { 'x-api-key': API_KEY },
            credentials: 'include',
            cache: 'no-store',
        })
            .then(r => r.json())
            .then(d => setReservas(d?.reservas ?? []))
            .catch(() => setReservas([]))
    }, [])

    const onDelete = async (id: string) => {
        if (!confirm('Deseja deletar esta reserva?')) return
        try {
            const res = await fetch(`/api/reservas/${id}`, {
                method: 'DELETE',
                headers: { 'x-api-key': API_KEY },
                credentials: 'include',
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Reserva deletada com sucesso!')
            router.refresh()
        } catch (e) {
            alert('Erro ao deletar reserva.')
            console.error(e)
        }
    }

    return (
        <IfLoggedDesktop>
            <div className="mt-12 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Reservas (admin)</h2>

                {reservas === null ? (
                    <p>Carregando...</p>
                ) : reservas.length === 0 ? (
                    <p>Nenhuma reserva.</p>
                ) : (
                    <ul className="space-y-3">
                        {reservas.map(r => (
                            <li key={r.id} className="flex items-start justify-between border p-3 rounded">
                                <div className="text-sm">
                                    <div className="font-medium">
                                        {r.nome} — {r.quantity} pessoa(s)
                                    </div>
                                    <div className="opacity-80">{r.email} · {r.telefone}</div>
                                    {r.message ? <div className="mt-1 italic">{r.message}</div> : null}
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

/* =========================
   Página (/[locale]/reservas)
   ========================= */
export default function ReservasPage() {
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
        "text-isca-verde font-sans placeholder: placeholder:opacity-40 " +
        "focus:border-isca-laranja focus:outline-none focus:ring-0 "

    const labelClasses =
        "block text-xs md:text-lg lg:text-xs font-medium mb-1 text-isca-laranja Poppins text-left"

    return (
        <section className="pb-20 md:pb-5 md:py-5 lg:mb-20 font-sans relative">
            {/* Botão + (criar prato) */}
            <AdminFAB locale={locale} />

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
