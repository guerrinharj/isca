'use client'

import { use, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type NewVinhoForm = {
    nome: string
    tipo: string
    ano: string
    quantidade: string
    descricao: string
    descricao_en: string
    preco_grf: string
    preco_125ml: string
}

export default function NewVinhoPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = use(params)
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<NewVinhoForm>({
        nome: '',
        tipo: '',
        ano: '',
        quantidade: '',
        descricao: '',
        descricao_en: '',
        preco_grf: '',
        preco_125ml: '',
    })

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const onTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const onTipoChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            tipo: e.target.value,
        }))
    }

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/vinhos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_SECRET || '',
                },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error(await res.text())
            alert('Vinho criado com sucesso!')
            router.push(`/${locale}/vinhos`)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert('Erro ao criar vinho')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="max-w-3xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Novo Vinho</h1>
            <form onSubmit={submit} className="space-y-4">
                <input
                    name="nome"
                    placeholder="Nome"
                    value={form.nome}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    required
                />

                {/* Categorias - radio buttons */}
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
                            />
                            {tipo}
                        </label>
                    ))}
                </div>

                <input
                    name="ano"
                    placeholder="Ano"
                    value={form.ano}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    required
                />

                <input
                    name="quantidade"
                    placeholder="Quantidade (ex: 750ml)"
                    value={form.quantidade}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                    required
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

                <input
                    name="preco_125ml"
                    placeholder="Preço 125ml"
                    value={form.preco_125ml}
                    onChange={onInputChange}
                    className="border p-2 w-full"
                />
                <input
                    name="preco_grf"
                    placeholder="Preço Garrafa"
                    value={form.preco_grf}
                    onChange={onInputChange}
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
