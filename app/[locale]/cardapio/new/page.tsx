'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPratoPage({ params }: { params: Promise<{ locale: string }> }) {
    // ✅ Unwrap the promise in client components on Next 15
    const { locale } = use(params)

    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        nome: '',
        preco: '',
        descricao: '',
        descricao_en: '',
        isActive: true,
        is_pintxo: false,
        is_vegan: false,
        is_vegetariano: false,
        is_drink: false,
        is_alcoolico: false,
        is_soft: false,
        is_outro: true,
        promo_description: ''
    })

    const onChange = (e: any) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const submit = async (e: any) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/pratos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_SECRET || ''
                },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Prato criado com sucesso!')
            router.push(`/${locale}/cardapio`)
            router.refresh()
        } catch (err) {
            alert('Erro ao criar prato')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="max-w-3xl mx-auto py-10 !text-isca-verde">
            <h1 className="text-2xl font-bold mb-6">Novo Prato</h1>
            <form onSubmit={submit} className="space-y-4">
                <input name="nome" placeholder="Nome" value={form.nome} onChange={onChange} className="border p-2 w-full" />
                <input name="preco" placeholder="Preço" value={form.preco} onChange={onChange} className="border p-2 w-full" />
                <textarea name="descricao" placeholder="Descrição (PT)" value={form.descricao} onChange={onChange} className="border p-2 w-full" />
                <textarea name="descricao_en" placeholder="Descrição (EN)" value={form.descricao_en} onChange={onChange} className="border p-2 w-full" />

                <label><input type="checkbox" className="mx-2"name="is_pintxo" checked={form.is_pintxo} onChange={onChange}/> Pintxo</label>
                <label><input type="checkbox" className="mx-2" name="is_vegan" checked={form.is_vegan} onChange={onChange}/> Vegano</label>
                <label><input type="checkbox" className="mx-2" name="is_vegetariano" checked={form.is_vegetariano} onChange={onChange}/> Vegetariano</label>
                <label><input type="checkbox" className="mx-2" name="is_drink" checked={form.is_drink} onChange={onChange}/> Drink</label>
                <label><input type="checkbox" className="mx-2" name="is_alcoolico" checked={form.is_alcoolico} onChange={onChange}/> Alcoólico</label>
                <label><input type="checkbox" className="mx-2" name="is_soft" checked={form.is_soft} onChange={onChange}/> Soft</label>
                <label><input type="checkbox" className="mx-2" name="is_outro" checked={form.is_outro} onChange={onChange}/> Outro</label>

                <textarea name="promo_description" placeholder="Promo (opcional)" value={form.promo_description} onChange={onChange} className="border p-2 w-full" />

                <button disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
                    {saving ? 'Salvando...' : 'Criar'}
                </button>
            </form>
        </section>
    )
}
