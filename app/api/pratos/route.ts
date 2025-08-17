import { prisma } from '@/lib/prisma'
import { requireAdmin, getSessionUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const url = new URL(req.url)
    const all = url.searchParams.get('all') === '1'
    const user = await getSessionUser()

    const where = all && user?.role === 'ADMIN' ? {} : { isActive: true }
    const pratos = await prisma.prato.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ pratos })
}

export async function POST(req: Request) {
    try {
        await requireAdmin()
        const { nome, preco, descricao, descricao_en, imagens, isActive } = await req.json()
        if (!nome || !preco || !descricao || !descricao_en) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        const prato = await prisma.prato.create({
            data: {
                nome,
                preco,
                descricao,
                descricao_en,
                imagens: Array.isArray(imagens) ? imagens : [],
                isActive: typeof isActive === 'boolean' ? isActive : true,
            },
        })
        return NextResponse.json({ prato }, { status: 201 })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
