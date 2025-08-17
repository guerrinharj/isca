import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json()
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

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
    } catch (err) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
