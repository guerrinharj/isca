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

        const id = randomUUID()
        const now = new Date().toISOString()
        const passwordHash = await hashPassword(password)

        
        const { data, error } = await supabase
            .from('users')
            .upsert(
                [{
                    id,
                    name: n,
                    email: e,
                    password: passwordHash,
                    role: 'USER',         // remove or set a valid default if your enum differs
                    createdAt: now,
                    updatedAt: now,
                }],
                { onConflict: 'email', ignoreDuplicates: true }
            )
            .select('id, name, email, role')
            .single()

        if (error) {
            console.error('UPSERT error:', error)
            return NextResponse.json(
                { error: 'Insert failed', detail: error.message, hint: error.details ?? null },
                { status: 500 }
            )
        }

        return NextResponse.json({ user: data }, { status: 201 })
    } catch (err: any) {
        console.error('Unhandled error:', err)
        return NextResponse.json(
            { error: 'Internal error (unhandled)', detail: String(err?.message ?? err) },
            { status: 500 }
        )
    }
}
