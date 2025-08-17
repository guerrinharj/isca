import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, SESSION_COOKIE } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()
        if (!email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const ok = await verifyPassword(password, user.password)
        if (!ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const { token, expiresAt } = await createSession(user.id)

        const res = NextResponse.json({
            ok: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })

        // Set cookie on the RESPONSE (not via cookies())
        res.cookies.set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            path: '/',
            expires: expiresAt,
        })

        return res
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
