// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RegisterBody = { name?: string; email?: string; password?: string }
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export async function POST(req: Request) {
    try {
        const { name = '', email = '', password = '' } = (await req.json()) as RegisterBody

        const n = name.trim()
        const e = email.trim().toLowerCase()

        if (!n || !e || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isValidEmail(e)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const supabase = createClientService()

        // Check if email already exists
        const { data: existing, error: findErr } = await supabase
            .from('users')
            .select('id')
            .eq('email', e)
            .maybeSingle()

        if (findErr) {
            console.error('Find error:', findErr)
            return NextResponse.json(
                { error: 'Find failed', detail: findErr.message, hint: findErr.details ?? null },
                { status: 500 }
            )
        }
        if (existing) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
        }

        const id = randomUUID()
        const now = new Date().toISOString()
        const passwordHash = await hashPassword(password)

        // Insert new user
        const { data: user, error: insertErr } = await supabase
            .from('users')
            .insert([
                {
                    id,
                    name: n,
                    email: e,
                    password: passwordHash,
                    role: 'USER', // ⚠️ must exist in your enum/domain, or drop this field
                    createdAt: now,
                    updatedAt: now,
                },
            ])
            .select('id, name, email, role')
            .single()

        if (insertErr) {
            console.error('Insert error:', insertErr)
            return NextResponse.json(
                { error: 'Insert failed', detail: insertErr.message, hint: insertErr.details ?? null },
                { status: 500 }
            )
        }

        return NextResponse.json({ user }, { status: 201 })
    } catch (err: any) {
        console.error('Unhandled error:', err)
        return NextResponse.json(
            { error: 'Internal error (unhandled)', detail: String(err?.message ?? err) },
            { status: 500 }
        )
    }
}
