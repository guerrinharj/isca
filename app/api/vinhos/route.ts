// app/api/vinhos/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'

type NovoVinho = {
    id?: string
    nome: string
    tipo: string
    ano?: string
    quantidade?: string        
    descricao?: string         
    descricao_en?: string
    preco_grf?: string
    preco_125ml?: string
}

function normalizeTipo(input: unknown): string | null {
    if (!input) return null
    const raw = String(input).trim()

    const asIs = ['Bolhas', 'Branco', 'Laranja', 'Rosé', 'Tinto']
    if (asIs.includes(raw)) return raw

    const upper = raw.toUpperCase()
    const map: Record<string, string> = {
        BOLHAS: 'Bolhas',
        BRANCO: 'Branco',
        LARANJA: 'Laranja',
        ROSE: 'Rosé',
        ROSÉ: 'Rosé',
        TINTO: 'Tinto',
    }
    if (map[upper]) return map[upper]

    return null
}

export async function GET() {
    try {
        const supabase = createClientService()
        const { data, error } = await supabase
            .from('Vinho')
            .select('*')
            .order('createdAt', { ascending: false })

        if (error) {
            console.error('GET /vinhos error:', error)
            return NextResponse.json(
                { error: 'DB error', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ vinhos: data ?? [] })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<NovoVinho>
        const supabase = createClientService()

        const missing: string[] = []
        if (!body.nome) missing.push('nome')
        if (!body.tipo) missing.push('tipo')

        const tipoNorm = normalizeTipo(body.tipo)
        if (!tipoNorm) missing.push('tipo(enum)')

        if (missing.length) {
            return NextResponse.json(
                { error: 'Validation error', details: `Missing/invalid fields: ${missing.join(', ')}` },
                { status: 400 }
            )
        }

        const id =
            typeof body.id === 'string' && body.id.trim().length > 0
                ? body.id.trim()
                : globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`

        const novoVinho: Record<string, unknown> = {
            id,
            nome: body.nome,
            tipo: tipoNorm,
        }

        const optionalStringKeys: Array<keyof NovoVinho> = [
            'ano',
            'quantidade',
            'descricao',
            'descricao_en',
            'preco_grf',
            'preco_125ml',
        ]
        for (const k of optionalStringKeys) {
            const v = body[k]
            if (v !== undefined) {
                novoVinho[k] = String(v)
            }
        }

        const { data, error } = await supabase
            .from('Vinho')
            .insert(novoVinho)
            .select('*')
            .single()

        if (error) {
            console.error('POST /vinhos error:', error, { novoVinho })
            return NextResponse.json(
                { error: 'DB error', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ vinho: data }, { status: 201 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        )
    }
}
