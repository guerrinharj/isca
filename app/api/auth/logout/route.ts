import { destroySession, SESSION_COOKIE } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
    await destroySession()

    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: new Date(0),
    })
    return res
}
