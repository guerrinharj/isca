// app/api/reservas/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireApiKeyOrAdmin } from '@/lib/auth'

type PostBody = {
    nome?: string
    data?: string
    email?: string
    telefone?: string
    quantity?: number
    message?: string
}

function isISODateValid(value: string) {
    const d = new Date(value)
    return !Number.isNaN(d.getTime())
}

function extractError(e: unknown): { message: string; code?: string; details?: string } {
    let message = 'Unknown error'
    let code: string | undefined
    let details: string | undefined

    if (typeof e === 'string') {
        message = e
    } else if (typeof e === 'object' && e !== null) {
        const obj = e as Record<string, unknown>
        if (typeof obj.message === 'string') message = obj.message
        if (typeof obj.code === 'string') code = obj.code
        if (typeof obj.details === 'string') details = obj.details
    }

    return { message, code, details }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as PostBody
        const nome = (body.nome ?? '').trim()
        const email = (body.email ?? '').trim().toLowerCase()
        const telefone = (body.telefone ?? '').trim()
        const quantity = body.quantity
        const message = (body.message ?? '').trim()

        if (!nome || !email || !telefone || typeof quantity !== 'number' || !body.data) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isISODateValid(body.data)) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }

        const when = new Date(body.data).toISOString()
        const supabase = createClientService()

        const { data: reserva, error } = await supabase
            .from('Reserva')
            .insert([
                {
                    nome,
                    email,
                    telefone,
                    quantity,
                    data: when,
                    is_confirmed: false,
                    message: message || null,
                },
            ])
            .select('*')
            .single()

        if (error) {
            const cause = extractError(error)
            console.error('RESERVA_POST_ERROR', cause)
            return NextResponse.json({ error: 'Database insert failed', cause }, { status: 500 })
        }

        return NextResponse.json({ reserva }, { status: 201 })
    } catch (err: unknown) {
        const cause = extractError(err)
        console.error('RESERVA_POST_UNHANDLED', cause)
        return NextResponse.json({ error: 'Unhandled error in POST', cause }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        await requireApiKeyOrAdmin() // 👈 uses x-api-key or ADMIN session

        const url = new URL(req.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const confirmed = url.searchParams.get('confirmed')

        const supabase = createClientService()
        let query = supabase.from('Reserva').select('*')

        if (from && isISODateValid(from)) {
            query = query.gte('data', new Date(from).toISOString())
        }
        if (to && isISODateValid(to)) {
            query = query.lte('data', new Date(to).toISOString())
        }
        if (confirmed === 'true') {
            query = query.eq('is_confirmed', true)
        } else if (confirmed === 'false') {
            query = query.eq('is_confirmed', false)
        }

        const { data: reservas, error } = await query.order('data', { ascending: true })

        if (error) {
            const cause = extractError(error)
            console.error('RESERVA_GET_ERROR', cause)
            return NextResponse.json({ error: 'Database select failed', cause }, { status: 500 })
        }

        return NextResponse.json({ reservas })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cause = extractError(err)
        console.error('RESERVA_GET_UNHANDLED', cause)
        return NextResponse.json({ error: 'Unhandled error in GET', cause }, { status: 500 })
    }
}
