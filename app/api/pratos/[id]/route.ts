import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    const prato = await prisma.prato.findUnique({ where: { id } })
    if (!prato) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ prato })
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await context.params
        const body = await req.json()
        const prato = await prisma.prato.update({
            where: { id },
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
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await context.params
        await prisma.prato.delete({ where: { id } })
        return new Response(null, { status: 204 })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
