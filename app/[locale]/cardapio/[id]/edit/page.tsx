'use client'

import { use, useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type Prato = {
    id: string
    nome: string
    preco: string | number
    descricao: string
    descricao_en: string
    is_pintxo: boolean
    is_vegan: boolean
    is_vegetariano: boolean
    is_drink: boolean
    is_alcoolico: boolean
    is_soft: boolean
    is_outro: boolean
}

export default function EditPratoPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = use(params)

    const router = useRouter()
    const [form, setForm] = useState<Prato | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY
        fetch(`/api/pratos/${id}`, {
            credentials: 'include',
            headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
                return r.json()
            })
            .then((d) => setForm(d.prato as Prato))
            .catch((e) => {
                console.error(e)
                setError('Não autorizado ou erro ao carregar prato')
            })
    }, [id])

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, checked } = e.currentTarget
        setForm((prev) =>
            prev
                ? {
                        ...prev,
                        [name]: type === 'checkbox' ? checked : value,
                    }
                : prev
        )
    }

    const onTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
    }

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        if (!form) return
        setSaving(true)
        try {
            const API_KEY = process.env.NEXT_PUBLIC_API_KEY
            const res = await fetch(`/api/pratos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
                },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Prato atualizado com sucesso!')
            router.push(`/${locale}/cardapio`)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert('Erro ao atualizar prato')
        } finally {
            setSaving(false)
        }
    }

    if (error) {
        return <p className="text-red-600">{error}</p>
    }

    if (!form) {
        return <p>Carregando...</p>
    }

    return (
        <section className="max-w-3xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Editar Prato</h1>
            <form onSubmit={submit} className="space-y-4">
                <input
                    name="nome"
                    value={form.nome}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                />
                <input
                    name="preco"
                    value={form.preco}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                />
                <textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={onTextareaChange}
                    className="border p-2 w-full"
                />
                <textarea
                    name="descricao_en"
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

                <button
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {saving ? 'Salvando...' : 'Atualizar'}
                </button>
            </form>
        </section>
    )
}
