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
        <section className="py-20 md:py-30 lg:py-5 lg:mb-20 font-sans">
            <h1
                className="text-3xl tracking-tightest mb-6 text-center"
                style={{ color: 'var(--color-isca-verde)' }}
                >
                {t.title}
            </h1>

            <form onSubmit={onSubmit} className="grid gap-6 max-w-md mx-auto w-full">
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
        </section>
    )
}
