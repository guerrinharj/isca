import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()
        if (!email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const ok = await verifyPassword(password, user.password)
        if (!ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        await createSession(user.id)
        return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
