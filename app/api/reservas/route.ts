// app/api/reservas/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

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
            console.error('RESERVA_POST_ERROR', error)
            // 👇 return full error for debugging
            return NextResponse.json({ error: 'Database insert failed', details: error }, { status: 500 })
        }

        return NextResponse.json({ reserva }, { status: 201 })
    } catch (err) {
        console.error('RESERVA_POST_UNHANDLED', err)
        // 👇 return err.message for debugging
        return NextResponse.json(
            { error: 'Unhandled error in POST', details: (err as Error).message },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        await requireAdmin()

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
            console.error('RESERVA_GET_ERROR', error)
            // 👇 include error details
            return NextResponse.json({ error: 'Database select failed', details: error }, { status: 500 })
        }

        return NextResponse.json({ reservas })
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('RESERVA_GET_UNHANDLED', err)
        return NextResponse.json(
            { error: 'Unhandled error in GET', details: (err as Error).message },
            { status: 500 }
        )
    }
}

