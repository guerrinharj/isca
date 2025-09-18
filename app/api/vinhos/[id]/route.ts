// app/api/vinhos/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'

type UpdateVinho = {
    nome?: string
    tipo?: string
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

// Helper para extrair params com tipagem
function getParams(ctx: unknown): { id: string } {
    const safe = ctx as { params: { id: string } }
    return safe.params
}

// GET /api/vinhos/:id  (PÚBLICO)
export async function GET(_req: Request, ctx: unknown) {
    const { id } = getParams(ctx)
    try {
        const supabase = createClientService()
        const { data, error } = await supabase
            .from('Vinho')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Not found', details: error.message },
                { status: 404 }
            )
        }

        return NextResponse.json({ vinho: data })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        )
    }
}

// PUT /api/vinhos/:id  (PROTEGIDO via middleware)
export async function PUT(req: Request, ctx: unknown) {
    const { id } = getParams(ctx)
    try {
        const body = (await req.json()) as UpdateVinho
        const supabase = createClientService()

        const updateData: Record<string, unknown> = {}
        if (body.nome !== undefined) updateData.nome = body.nome
        if (body.tipo !== undefined) {
            const tipoNorm = normalizeTipo(body.tipo)
            if (!tipoNorm) {
                return NextResponse.json(
                    { error: 'Validation error', details: 'Invalid tipo(enum)' },
                    { status: 400 }
                )
            }
            updateData.tipo = tipoNorm
        }
        if (body.ano !== undefined) updateData.ano = body.ano
        if (body.quantidade !== undefined) updateData.quantidade = body.quantidade
        if (body.descricao !== undefined) updateData.descricao = body.descricao
        if (body.descricao_en !== undefined) updateData.descricao_en = body.descricao_en
        if (body.preco_grf !== undefined) updateData.preco_grf = body.preco_grf
        if (body.preco_125ml !== undefined) updateData.preco_125ml = body.preco_125ml

        const { data, error } = await supabase
            .from('Vinho')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'DB error', details: error.message },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        return NextResponse.json({ vinho: data })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        )
    }
}

// DELETE /api/vinhos/:id  (PROTEGIDO via middleware)
export async function DELETE(_req: Request, ctx: unknown) {
    const { id } = getParams(ctx)
    try {
        const supabase = createClientService()
        const { error } = await supabase
            .from('Vinho')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json(
                { error: 'DB error', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        )
    }
}
