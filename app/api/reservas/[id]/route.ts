// app/api/reservas/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/reservas/:id  (admin)
export async function GET(_req: Request, context: Ctx) {
    try {
        await requireAdmin()
        const { id } = await context.params
        const supabase = createClientService()

        const { data: reserva, error } = await supabase
            .from('Reserva')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            // PGRST116 = No rows found
            if ((error as any).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('RESERVA_GET_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return NextResponse.json({ reserva })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('RESERVA_GET_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// PUT /api/reservas/:id  (admin)
export async function PUT(req: Request, context: Ctx) {
    try {
        await requireAdmin()
        const { id } = await context.params
        const body = (await req.json()) as Partial<{
            nome: string
            email: string
            telefone: string
            quantity: number
            is_confirmed: boolean
            data: string
        }>

        // Monta objeto de updates somente com campos válidos
        const updates: Record<string, unknown> = {}
        if (typeof body.nome === 'string') updates.nome = body.nome
        if (typeof body.email === 'string') updates.email = body.email
        if (typeof body.telefone === 'string') updates.telefone = body.telefone
        if (typeof body.quantity === 'number' && Number.isFinite(body.quantity)) {
            updates.quantity = body.quantity
        }
        if (typeof body.is_confirmed === 'boolean') updates.is_confirmed = body.is_confirmed
        if (typeof body.data === 'string') {
            const when = new Date(body.data)
            if (Number.isNaN(when.getTime())) {
                return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
            }
            updates.data = when.toISOString()
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        const supabase = createClientService()
        const { data: reserva, error } = await supabase
            .from('Reserva')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            if ((error as any).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('RESERVA_PUT_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return NextResponse.json({ reserva })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('RESERVA_PUT_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// DELETE /api/reservas/:id  (admin)
export async function DELETE(_req: Request, context: Ctx) {
    try {
        await requireAdmin()
        const { id } = await context.params
        const supabase = createClientService()

        const { error } = await supabase
            .from('Reserva')
            .delete()
            .eq('id', id)

        if (error) {
            if ((error as any).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('RESERVA_DELETE_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return new Response(null, { status: 204 })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('RESERVA_DELETE_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
