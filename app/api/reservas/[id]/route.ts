import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
    try {
        await requireAdmin()
        const reserva = await prisma.reserva.findUnique({ where: { id: params.id } })
        if (!reserva) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ reserva })
    } catch (err: any) {
        if (err?.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: Params) {
    try {
        await requireAdmin()
        const body = await req.json()
        const data: any = {
            nome: body.nome,
            email: body.email,
            telefone: body.telefone,
            quantity: typeof body.quantity === 'number' ? body.quantity : undefined,
            is_confirmed: typeof body.is_confirmed === 'boolean' ? body.is_confirmed : undefined,
        }
        if (body.data) {
            const when = new Date(body.data)
            if (Number.isNaN(when.getTime())) {
                return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
            }
            data.data = when
        }
        const reserva = await prisma.reserva.update({
            where: { id: params.id },
            data,
        })
        return NextResponse.json({ reserva })
    } catch (err: any) {
        if (err?.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err?.code === 'P2025') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function DELETE(_: Request, { params }: Params) {
    try {
        await requireAdmin()
        await prisma.reserva.delete({ where: { id: params.id } })
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        if (err?.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err?.code === 'P2025') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
