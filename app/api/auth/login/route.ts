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

        // 1) Buscar usuário
        const { data: user, error: findErr } = await supabase
            .from('users')
            .select('id, name, email, password, role')
            .eq('email', normalizedEmail)
            .single()

        if (findErr || !user) {
            // Não revelar qual campo falhou
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // 2) Verificar senha (hash Bcrypt salvo em users.password)
        const ok = await verifyPassword(password, user.password as string)
        if (!ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // 3) Criar sessão
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 dias

        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            req.headers.get('x-real-ip') ??
            null
        const userAgent = req.headers.get('user-agent') ?? null

        // Atenção aos nomes das colunas na tabela sessions:
        // user_id (text), token (text), ip (text), userAgent (text),
        // expires_at (timestamp), created_at (timestamp default)
        const { error: insertErr } = await supabase.from('sessions').insert([
            {
                user_id: user.id,
                token,
                ip,
                userAgent,
                expires_at: expiresAt.toISOString(),
            },
        ])

        if (insertErr) {
            // Log detalhado no server; resposta com detalhe ajuda a depurar
            console.error('SESSION_INSERT_ERROR', insertErr)
            return NextResponse.json(
                { error: 'Internal error', detail: insertErr.message },
                { status: 500 }
            )
        }

        // 4) Responder e setar cookie httpOnly
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
    } catch (err: unknown) {
        // Expor detalhes só durante depuração
        const message =
            err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
        console.error('LOGIN_ERROR', err)
        return NextResponse.json(
            {
                error: 'Internal error',
                detail: message,
                // Remova o stack em produção se preferir
                stack: process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
            },
            { status: 500 }
        )
    }
}
