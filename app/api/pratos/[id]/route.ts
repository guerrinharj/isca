// app/api/pratos/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, context: Ctx) {
    try {
        const { id } = await context.params
        const supabase = createClientService()

        const { data: prato, error } = await supabase
            .from('Prato')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('PRATO_GET_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return NextResponse.json({ prato })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('PRATO_GET_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function PUT(req: Request, context: Ctx) {
    try {
        await requireAdmin()
        const { id } = await context.params
        const body = await req.json()
        const supabase = createClientService()

        // Monta apenas campos presentes (evita sobrescrever com null)
        const updates: Record<string, unknown> = {}
        if (typeof body.nome === 'string') updates.nome = body.nome
        if (typeof body.preco === 'string') updates.preco = body.preco
        if (typeof body.descricao === 'string') updates.descricao = body.descricao
        if (typeof body.descricao_en === 'string') updates.descricao_en = body.descricao_en
        if (Array.isArray(body.imagens)) updates.imagens = body.imagens as string[]
        if (typeof body.isActive === 'boolean') updates.isActive = body.isActive

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        const { data: prato, error } = await supabase
            .from('Prato')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('PRATO_PUT_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return NextResponse.json({ prato })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('PRATO_PUT_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function DELETE(_req: Request, context: Ctx) {
    try {
        await requireAdmin()
        const { id } = await context.params
        const supabase = createClientService()

        const { error } = await supabase
            .from('Prato')
            .delete()
            .eq('id', id)

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('PRATO_DELETE_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return new Response(null, { status: 204 })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('PRATO_DELETE_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
