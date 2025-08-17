// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

type RegisterBody = { name?: string; email?: string; password?: string }
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export async function POST(req: Request) {
    try {
        const { name = '', email = '', password = '' } = (await req.json()) as RegisterBody
        const n = name.trim()
        const e = email.trim().toLowerCase()
        if (!n || !e || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        if (!isValidEmail(e)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

        const supabase = createClientService()

        const { data: existing, error: findErr } = await supabase
            .from('users')
            .select('id')
            .eq('email', e)
            .maybeSingle()
        if (findErr) return NextResponse.json({ error: `Find failed: ${findErr.message}` }, { status: 500 })
        if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

        const passwordHash = await hashPassword(password)

        const id = crypto.randomUUID()

        const { data: user, error: insertErr } = await supabase
            .from('users')
            .insert([{ id, name: n, email: e, password: passwordHash, role: 'USER' }])
            .select('id, name, email, role')
            .single()

        if (insertErr) return NextResponse.json({ error: `Insert failed: ${insertErr.message}` }, { status: 500 })

        return NextResponse.json({ user }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'Internal error (unhandled)' }, { status: 500 })
    }
}
