// app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'
import { createClientService } from '@/lib/supabase'

type SessionRow = {
    userId: string
    expiresAt: string
}

type UserRow = {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'USER'
}

export async function GET(req: Request) {
    const cookieHeader = req.headers.get('cookie') ?? ''
    const sessionCookie = cookieHeader
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(`${SESSION_COOKIE}=`))

    const token = sessionCookie ? sessionCookie.split('=')[1] : null
    if (!token) {
        return NextResponse.json({ user: null })
    }

    const supabase = createClientService()

    // 1) Busca a sessão (userId + expiresAt)
    const { data: session, error: sErr } = await supabase
        .from('sessions')
        .select('userId, expiresAt')
        .eq('token', token)
        .maybeSingle<SessionRow>()

    if (sErr || !session) {
        return NextResponse.json({ user: null })
    }

    const expiresAt = new Date(session.expiresAt)
    if (Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
        return NextResponse.json({ user: null })
    }

    // 2) Busca o usuário
    const { data: user, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', session.userId)
        .single<UserRow>()

    if (uErr || !user) {
        return NextResponse.json({ user: null })
    }

    const { id, name, email, role } = user
    return NextResponse.json({ user: { id, name, email, role } })
}
