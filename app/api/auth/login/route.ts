// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { verifyPassword, SESSION_COOKIE } from '@/lib/auth'
import { createClientService } from '@/lib/supabase'
import crypto from 'crypto'

type Body = {
    email?: string
    password?: string
}

export async function POST(req: Request) {
    try {
        const { email, password } = (await req.json()) as Body
        if (!email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const supabase = createClientService()
        const normalizedEmail = String(email).toLowerCase().trim()

        // Busca usuário
        const { data: user, error: findErr } = await supabase
            .from('users')
            .select('id, name, email, password, role')
            .eq('email', normalizedEmail)
            .single()

        if (findErr || !user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Verifica senha
        const ok = await verifyPassword(password, user.password)
        if (!ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Cria sessão (token + expiração)
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 dias

        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            req.headers.get('x-real-ip') ??
            null
        const userAgent = req.headers.get('user-agent') ?? null

        const { error: insertErr } = await supabase
            .from('sessions')
            .insert([
                {
                    userId: user.id,
                    token,
                    ip,
                    userAgent,
                    expiresAt: expiresAt.toISOString(),
                },
            ])

        if (insertErr) {
            console.error('SESSION_INSERT_ERROR', insertErr)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        // Resposta + cookie httpOnly
        const res = NextResponse.json({
            ok: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })

        res.cookies.set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            path: '/',
            expires: expiresAt,
        })

        return res
    } catch (err) {
        console.error('LOGIN_ERROR', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
