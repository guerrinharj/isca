'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditReservaPage({ params }: { params: { locale: string; id: string } }) {
    const { locale, id } = params
    const router = useRouter()
    const [form, setForm] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch(`/api/reservas/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => setForm(d.reserva))
    }, [id])

    if (!form) return <p>Carregando...</p>

    const onChange = (e: any) => {
        const { name, value } = e.target
        setForm((prev: any) => ({ ...prev, [name]: value }))
    }

    const submit = async (e: any) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch(`/api/reservas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-api-key':  process.env.NEXT_PUBLIC_API_SECRET || '' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Reserva atualizada com sucesso!')
            router.push(`/${locale}/reserva`)
            router.refresh()
        } catch (err) {
            alert('Erro ao atualizar reserva')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="max-w-xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Editar Reserva</h1>
            <form onSubmit={submit} className="space-y-4">
                <input name="nome" value={form.nome} onChange={onChange} className="border p-2 w-full" />
                <input name="email" value={form.email} onChange={onChange} className="border p-2 w-full" />
                <input name="telefone" value={form.telefone} onChange={onChange} className="border p-2 w-full" />
                <input name="quantity" type="number" value={form.quantity} onChange={onChange} className="border p-2 w-full" />
                <textarea name="message" value={form.message ?? ''} onChange={onChange} className="border p-2 w-full" />
                <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {saving ? 'Salvando...' : 'Atualizar'}
                </button>
            </form>
        </section>
    )
}
