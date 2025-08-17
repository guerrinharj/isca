import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { nome, data, email, telefone, quantity } = await req.json()
        if (!nome || !data || !email || !telefone || !quantity) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        const when = new Date(data)
        if (Number.isNaN(when.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }
        const reserva = await prisma.reserva.create({
            data: {
                nome,
                data: when,
                email,
                telefone,
                quantity: Number(quantity),
            },
        })
        return NextResponse.json({ reserva }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        await requireAdmin()
        const url = new URL(req.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const confirmed = url.searchParams.get('confirmed')

        const where: any = {}
        if (from || to) {
            where.data = {}
            if (from) where.data.gte = new Date(from)
            if (to) where.data.lte = new Date(to)
        }
        if (confirmed === 'true') where.is_confirmed = true
        if (confirmed === 'false') where.is_confirmed = false

        const reservas = await prisma.reserva.findMany({
            where,
            orderBy: { data: 'asc' },
        })
        return NextResponse.json({ reservas })
    } catch (err: any) {
        if (err?.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
