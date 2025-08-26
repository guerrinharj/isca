'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditPratoPage({ params }: { params: { locale: string; id: string } }) {
    const { locale, id } = params
    const router = useRouter()
    const [form, setForm] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch(`/api/pratos/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => setForm(d.prato))
    }, [id])

    if (!form) return <p>Carregando...</p>

    const onChange = (e: any) => {
        const { name, value, type, checked } = e.target
        setForm((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const submit = async (e: any) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch(`/api/pratos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.API_SECRET || '' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Prato atualizado com sucesso!')
            router.push(`/${locale}/cardapio`)
            router.refresh()
        } catch (err) {
            alert('Erro ao atualizar prato')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="max-w-3xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Editar Prato</h1>
            <form onSubmit={submit} className="space-y-4">
                <input name="nome" value={form.nome} onChange={onChange} className="border p-2 w-full" />
                <input name="preco" value={form.preco} onChange={onChange} className="border p-2 w-full" />
                <textarea name="descricao" value={form.descricao} onChange={onChange} className="border p-2 w-full" />
                <textarea name="descricao_en" value={form.descricao_en} onChange={onChange} className="border p-2 w-full" />
                {/* repete os checkboxes como no New */}
                <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {saving ? 'Salvando...' : 'Atualizar'}
                </button>
            </form>
        </section>
    )
}
