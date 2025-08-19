// app/api/reservas/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireApiKeyOrAdmin } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

function isISODateValid(value: string) {
    const d = new Date(value)
    return !Number.isNaN(d.getTime())
}

function extractError(e: unknown): { message: string; code?: string; details?: string; hint?: string } {
    let message = 'Unknown error'
    let code: string | undefined
    let details: string | undefined
    let hint: string | undefined
    if (typeof e === 'string') {
        message = e
    } else if (typeof e === 'object' && e !== null) {
        const obj = e as Record<string, unknown>
        if (typeof obj.message === 'string') message = obj.message
        if (typeof obj.code === 'string') code = obj.code
        if (typeof obj.details === 'string') details = obj.details
        if (typeof obj.hint === 'string') hint = obj.hint
    }
    return { message, code, details, hint }
}

export async function GET(_req: Request, context: RouteContext) {
    try {
        await requireApiKeyOrAdmin()
        const { id } = await context.params
        const supabase = createClientService()

        const { data: reserva, error } = await supabase
            .from('Reserva')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if ((error as { code?: string }).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            const cause = extractError(error)
            console.error('RESERVA_ID_GET_ERROR', cause)
            return NextResponse.json({ error: 'Database select failed', cause }, { status: 500 })
        }

        if (!reserva) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ reserva })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cause = extractError(err)
        console.error('RESERVA_ID_GET_UNHANDLED', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}

export async function PUT(req: Request, context: RouteContext) {
    try {
        await requireApiKeyOrAdmin()
        const { id } = await context.params
        const body = (await req.json()) as Partial<{
            nome: string
            email: string
            telefone: string
            quantity: number
            is_confirmed: boolean
            data: string
            message: string
        }>

        const updates: Record<string, unknown> = {}

        if (typeof body.nome === 'string') updates.nome = body.nome
        if (typeof body.email === 'string') updates.email = body.email
        if (typeof body.telefone === 'string') updates.telefone = body.telefone
        if (typeof body.quantity === 'number' && Number.isFinite(body.quantity)) updates.quantity = body.quantity
        if (typeof body.is_confirmed === 'boolean') updates.is_confirmed = body.is_confirmed
        if (typeof body.data === 'string') {
            if (!isISODateValid(body.data)) {
                return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
            }
            updates.data = new Date(body.data).toISOString()
        }
        if (typeof body.message === 'string') updates.message = body.message.trim()

        // keep updatedAt fresh if your schema enforces NOT NULL
        updates.updatedAt = new Date().toISOString()

        if (Object.keys(updates).length === 1 && 'updatedAt' in updates) {
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
            if ((error as { code?: string }).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            const cause = extractError(error)
            console.error('RESERVA_ID_PUT_ERROR', cause)
            return NextResponse.json({ error: 'Update failed', cause }, { status: 500 })
        }

        return NextResponse.json({ reserva })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cause = extractError(err)
        console.error('RESERVA_ID_PUT_UNHANDLED', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}

export async function DELETE(_req: Request, context: RouteContext) {
    try {
        await requireApiKeyOrAdmin()
        const { id } = await context.params
        const supabase = createClientService()

        const { error } = await supabase
            .from('Reserva')
            .delete()
            .eq('id', id)

        if (error) {
            if ((error as { code?: string }).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            const cause = extractError(error)
            console.error('RESERVA_ID_DELETE_ERROR', cause)
            return NextResponse.json({ error: 'Delete failed', cause }, { status: 500 })
        }

        return new Response(null, { status: 204 })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cause = extractError(err)
        console.error('RESERVA_ID_DELETE_UNHANDLED', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}
