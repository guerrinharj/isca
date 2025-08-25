// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'
import { createClientService } from '@/lib/supabase'

export async function POST(req: Request) {
    const supabase = createClientService()
    const cookieHeader = req.headers.get('cookie') ?? ''
    const sessionCookie = cookieHeader
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(`${SESSION_COOKIE}=`))

    const token = sessionCookie ? sessionCookie.split('=')[1] : null

    if (token) {
        await supabase.from('sessions').delete().eq('token', token)
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(0),
    })

    return res
}
