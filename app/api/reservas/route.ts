import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            nome?: string
            data?: string
            email?: string
            telefone?: string
            quantity?: number
        }

        const { nome, data, email, telefone, quantity } = body
        if (!nome || !data || !email || !telefone || typeof quantity !== 'number') {
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
                quantity,
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

        const where: Prisma.ReservaWhereInput = {}

        if (from || to) {
            const range: Prisma.DateTimeFilter = {}
            if (from) {
                const d = new Date(from)
                if (!Number.isNaN(d.getTime())) range.gte = d
            }
            if (to) {
                const d = new Date(to)
                if (!Number.isNaN(d.getTime())) range.lte = d
            }
            if (Object.keys(range).length) where.data = range
        }

        if (confirmed === 'true') where.is_confirmed = true
        if (confirmed === 'false') where.is_confirmed = false

        const reservas = await prisma.reserva.findMany({
            where,
            orderBy: { data: 'asc' },
        })

        return NextResponse.json({ reservas })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
