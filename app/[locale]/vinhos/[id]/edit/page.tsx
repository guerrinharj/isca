// app/[locale]/vinhos/[id]/edit/page.tsx
'use client'

import { use, useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type Vinho = {
    id: string
    nome: string
    tipo: string
    ano: string
    quantidade: string
    descricao: string
    descricao_en: string
    preco_grf: string
    preco_125ml: string
}

export default function EditVinhoPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = use(params)

    const router = useRouter()
    const [form, setForm] = useState<Vinho | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Single source of truth for the client key (segue padrão do seu edit de pratos)
    const API_KEY =
        (process.env.NEXT_PUBLIC_API_KEY ?? process.env.NEXT_PUBLIC_API_SECRET) || undefined

    useEffect(() => {
        fetch(`/api/vinhos/${id}`, {
            credentials: 'include',
            headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
                return r.json()
            })
            .then((d) => {
                // d.vinho vem da rota GET /api/vinhos/:id
                const v = d.vinho as Partial<Vinho>
                setForm({
                    id: v.id || id,
                    nome: v.nome || '',
                    tipo: v.tipo || '',
                    ano: v.ano || '',
                    quantidade: v.quantidade || '',
                    descricao: v.descricao || '',
                    descricao_en: v.descricao_en || '',
                    preco_grf: v.preco_grf || '',
                    preco_125ml: v.preco_125ml || '',
                })
            })
            .catch((e) => {
                console.error(e)
                setError('Não autorizado ou erro ao carregar vinho')
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
    }

    const onTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
    }

    // Radios exclusivos para tipo (use target.value para evitar null no currentTarget)
    const onTipoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setForm((prev) => (prev ? { ...prev, tipo: value } : prev))
    }

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        if (!form) return
        setSaving(true)
        try {
            const res = await fetch(`/api/vinhos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
                },
                credentials: 'include',
                body: JSON.stringify(form),
                redirect: 'manual',
            })

            // Evita falha silenciosa em ambientes com redirect de middleware
            if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
                throw new Error(`Redirect detected on PUT /api/vinhos/${id}.`)
            }

            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`${res.status} ${txt}`)
            }

            alert('Vinho atualizado com sucesso!')
            router.push(`/${locale}/vinhos`)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert('Erro ao atualizar vinho')
        } finally {
            setSaving(false)
        }
    }

    if (error) {
        return <p>{error}</p>
    }

    if (!form) {
        return <p>Carregando...</p>
    }

    return (
        <section className="max-w-3xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Editar Vinho</h1>
            <form onSubmit={submit} className="space-y-4">
                <input
                    name="nome"
                    value={form.nome}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    placeholder="Nome"
                    required
                />

                {/* Tipo - radio buttons exclusivos */}
                <div className="space-y-2">
                    <p className="font-semibold">Tipo</p>
                    {['Bolhas', 'Branco', 'Rosé', 'Laranja', 'Tinto'].map((tipo) => (
                        <label key={tipo} className="block">
                            <input
                                type="radio"
                                name="tipo"
                                value={tipo}
                                checked={form.tipo === tipo}
                                onChange={onTipoChange}
                                className="mr-2"
                                required
                            />
                            {tipo}
                        </label>
                    ))}
                </div>

                <input
                    name="ano"
                    value={form.ano}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    placeholder="Ano"
                />

                <input
                    name="quantidade"
                    value={form.quantidade}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    placeholder="Quantidade (ex: 750ml)"
                />

                <textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={onTextareaChange}
                    className="border p-2 w-full"
                    placeholder="Descrição (PT)"
                />
                <textarea
                    name="descricao_en"
                    value={form.descricao_en}
                    onChange={onTextareaChange}
                    className="border p-2 w-full"
                    placeholder="Descrição (EN)"
                />

                <input
                    name="preco_125ml"
                    value={form.preco_125ml}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    placeholder="Preço 125ml"
                />
                <input
                    name="preco_grf"
                    value={form.preco_grf}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    placeholder="Preço Garrafa"
                />

                <button
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded mt-4"
                >
                    {saving ? 'Salvando...' : 'Atualizar'}
                </button>
            </form>
        </section>
    )
}
