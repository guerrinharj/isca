import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'

type RegisterBody = {
    name?: string
    email?: string
    password?: string
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as RegisterBody

        const name = (body.name ?? '').trim()
        const email = (body.email ?? '').trim().toLowerCase()
        const password = body.password ?? ''

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }
        // Nunca permitir elevar role por API pública — admin vem do seed
        // (ignorar qualquer "role" enviado)
        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
        }

        const passwordHash = await hashPassword(password)
        const user = await prisma.user.create({
            data: { name, email, password: passwordHash, role: 'USER' },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        })

        return NextResponse.json({ user }, { status: 201 })
    } catch {
        // Prisma unique constraint race (fallback)
        // Se quiser tratar estritamente:
        // import { Prisma } from '@prisma/client'
        // if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {...}
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
