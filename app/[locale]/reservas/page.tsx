'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function ReservasPage() {
    const { locale } = useParams<{ locale: 'pt' | 'en' }>()
    const [form, setForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        data: '',
        quantity: 2,
    })
    const t = {
        title: locale === 'pt' ? 'Reservas' : 'Reservations',
        name: locale === 'pt' ? 'Nome' : 'Name',
        email: 'Email',
        phone: locale === 'pt' ? 'Telefone' : 'Phone',
        datetime: locale === 'pt' ? 'Data e hora' : 'Date & time',
        qty: locale === 'pt' ? 'Quantidade de pessoas' : 'Party size',
        submit: locale === 'pt' ? 'Fazer reserva' : 'Create reservation',
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm((f) => ({ ...f, [name]: name === 'quantity' ? Number(value) : value }))
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: POST para sua API /api/reservas
        alert('Reserva enviada (placeholder)')
    }

    return (
        <section className="py-8">
            <h1 className="text-3xl font-display tracking-tightest mb-6">{t.title}</h1>
            <form onSubmit={onSubmit} className="card grid gap-4 max-w-xl">
                <input name="nome" value={form.nome} onChange={onChange} placeholder={t.name}
                        className="bg-transparent border border-white/10 rounded-xl px-4 py-3" required />
                <input name="email" type="email" value={form.email} onChange={onChange} placeholder={t.email}
                        className="bg-transparent border border-white/10 rounded-xl px-4 py-3" required />
                <input name="telefone" value={form.telefone} onChange={onChange} placeholder={t.phone}
                        className="bg-transparent border border-white/10 rounded-xl px-4 py-3" required />
                <input name="data" type="datetime-local" value={form.data} onChange={onChange} placeholder={t.datetime}
                        className="bg-transparent border border-white/10 rounded-xl px-4 py-3" required />
                <input name="quantity" type="number" min={1} value={form.quantity} onChange={onChange} placeholder={t.qty}
                        className="bg-transparent border border-white/10 rounded-xl px-4 py-3" required />
                <button type="submit" className="btn">{t.submit}</button>
            </form>
        </section>
    )
}
