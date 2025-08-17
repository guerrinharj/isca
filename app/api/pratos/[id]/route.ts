import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
    const prato = await prisma.prato.findUnique({ where: { id: params.id } })
    if (!prato) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ prato })
}

export async function PUT(req: Request, { params }: Params) {
    try {
        await requireAdmin()
        const body = await req.json()
        const prato = await prisma.prato.update({
            where: { id: params.id },
            data: {
                nome: body.nome,
                preco: body.preco,
                descricao: body.descricao,
                descricao_en: body.descricao_en,
                imagens: Array.isArray(body.imagens) ? body.imagens : undefined,
                isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
            },
        })
        return NextResponse.json({ prato })
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
        await prisma.prato.delete({ where: { id: params.id } })
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
