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

    // Single source of truth for the client key
    const API_KEY =
        (process.env.NEXT_PUBLIC_API_KEY ?? process.env.NEXT_PUBLIC_API_SECRET) || undefined

    useEffect(() => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const res = await fetch(`/api/pratos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
                },
                credentials: 'include',
                body: JSON.stringify(form),
                redirect: 'manual',
            })

            if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
                throw new Error(`Redirect detected on PUT /api/pratos/${id}.`)
            }

            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`${res.status} ${txt}`)
            }

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
        return <p className="text-isca-verde">{error}</p>
    }

    if (!form) {
        return <p className="text-isca-verde">Carregando...</p>
    }

    return (
        <section className="max-w-3xl mx-auto py-10 text-isca-verde">
            <h1 className="text-2xl font-bold mb-6">Editar Prato</h1>
            <form onSubmit={submit} className="space-y-4 text-isca-verde">
                <input
                    name="nome"
                    value={form.nome}
                    onChange={onInputChange}
                    className="border p-2 w-full text-isca-verde"
                />
                <input
                    name="preco"
                    value={form.preco}
                    onChange={onInputChange}
                    className="border p-2 w-full text-isca-verde"
                />
                <textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={onTextareaChange}
                    className="border p-2 w-full text-isca-verde"
                />
                <textarea
                    name="descricao_en"
                    value={form.descricao_en}
                    onChange={onTextareaChange}
                    className="border p-2 w-full text-isca-verde"
                />

                {/* Checkboxes */}
                <div className="space-y-2">
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_pintxo"
                            checked={form.is_pintxo}
                            onChange={onInputChange}
                        /> Pintxo
                    </label>
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_vegan"
                            checked={form.is_vegan}
                            onChange={onInputChange}
                        /> Vegano
                    </label>
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_vegetariano"
                            checked={form.is_vegetariano}
                            onChange={onInputChange}
                        /> Vegetariano
                    </label>
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_drink"
                            checked={form.is_drink}
                            onChange={onInputChange}
                        /> Drink
                    </label>
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_alcoolico"
                            checked={form.is_alcoolico}
                            onChange={onInputChange}
                        /> Alcoólico
                    </label>
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_soft"
                            checked={form.is_soft}
                            onChange={onInputChange}
                        /> Soft
                    </label>
                    <label className="text-isca-verde block">
                        <input
                            type="checkbox"
                            className="mx-2 align-middle"
                            name="is_outro"
                            checked={form.is_outro}
                            onChange={onInputChange}
                        /> Outro
                    </label>
                </div>

                <button
                    disabled={saving}
                    className="bg-isca-verde text-white px-4 py-2 rounded mt-4"
                >
                    {saving ? 'Salvando...' : 'Atualizar'}
                </button>
            </form>
        </section>
    )
}
