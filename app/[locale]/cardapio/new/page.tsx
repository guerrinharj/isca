'use client'

import { use, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type NewPratoForm = {
    nome: string
    preco: string
    descricao: string
    descricao_en: string
    isActive: boolean
    is_pintxo: boolean
    is_vegan: boolean
    is_vegetariano: boolean
    is_drink: boolean
    is_alcoolico: boolean
    is_soft: boolean
    is_outro: boolean
    promo_description: string
}

export default function NewPratoPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    // ✅ Unwrap Next 15 params promise
    const { locale } = use(params)

    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<NewPratoForm>({
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
        promo_description: '',
    })

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, checked } = e.currentTarget
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const onTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/pratos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_SECRET || '',
                },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Prato criado com sucesso!')
            router.push(`/${locale}/cardapio`)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert('Erro ao criar prato')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="max-w-3xl mx-auto py-10 !text-isca-verde">
            <h1 className="text-2xl font-bold mb-6">Novo Prato</h1>
            <form onSubmit={submit} className="space-y-4">
                <input
                    name="nome"
                    placeholder="Nome"
                    value={form.nome}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                />
                <input
                    name="preco"
                    placeholder="Preço"
                    value={form.preco}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                />
                <textarea
                    name="descricao"
                    placeholder="Descrição (PT)"
                    value={form.descricao}
                    onChange={onTextareaChange}
                    className="border p-2 w-full"
                />
                <textarea
                    name="descricao_en"
                    placeholder="Descrição (EN)"
                    value={form.descricao_en}
                    onChange={onTextareaChange}
                    className="border p-2 w-full"
                />

                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_pintxo"
                        checked={form.is_pintxo}
                        onChange={onInputChange}
                    /> Pintxo
                </label>
                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_vegan"
                        checked={form.is_vegan}
                        onChange={onInputChange}
                    /> Vegano
                </label>
                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_vegetariano"
                        checked={form.is_vegetariano}
                        onChange={onInputChange}
                    /> Vegetariano
                </label>
                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_drink"
                        checked={form.is_drink}
                        onChange={onInputChange}
                    /> Drink
                </label>
                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_alcoolico"
                        checked={form.is_alcoolico}
                        onChange={onInputChange}
                    /> Alcoólico
                </label>
                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_soft"
                        checked={form.is_soft}
                        onChange={onInputChange}
                    /> Soft
                </label>
                <label>
                    <input
                        type="checkbox"
                        className="mx-2"
                        name="is_outro"
                        checked={form.is_outro}
                        onChange={onInputChange}
                    /> Outro
                </label>

                <textarea
                    name="promo_description"
                    placeholder="Promo (opcional)"
                    value={form.promo_description}
                    onChange={onTextareaChange}
                    className="border p-2 w-full"
                />

                <button
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    {saving ? 'Salvando...' : 'Criar'}
                </button>
            </form>
        </section>
    )
}
