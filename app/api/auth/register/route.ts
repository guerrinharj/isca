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
        const supabase = createClientService()

        // ---- optional debug: if ?debug=1, tell me which DB role I'm using
        const url = new URL(req.url)
        if (url.searchParams.get('debug') === '1') {
            const who = await supabase.rpc('whoami')
            console.log('WHOAMI RPC →', who.data, who.error)
        }
        // -------------------------------------

        const { name = '', email = '', password = '' } = (await req.json()) as RegisterBody
        const n = name.trim()
        const e = email.trim().toLowerCase()

        if (!n || !e || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isValidEmail(e)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const id = randomUUID()
        const now = new Date().toISOString()
        const passwordHash = await hashPassword(password)

        // NO pre-check SELECT. Let the DB's unique index enforce uniqueness.
        const { data, error } = await supabase
            .from('users')
            .upsert(
                [{
                    id,
                    name: n,
                    email: e,
                    password: passwordHash,
                    // if "role" is an enum and you don't know its values, comment the next line
                    role: 'USER',
                    createdAt: now,
                    updatedAt: now,
                }],
                { onConflict: 'email', ignoreDuplicates: true }
            )
            .select('id, name, email, role')
            .single()

        if (error) {
            console.error('UPSERT error:', error) // check Vercel → Deployments → Functions
            return NextResponse.json(
                { error: 'Insert failed', detail: error.message, hint: (error as any).details ?? null },
                { status: 500 }
            )
        }

        return NextResponse.json({ user: data }, { status: 201 })
    } catch (err: any) {
        console.error('Unhandled error (register):', err)
        return NextResponse.json(
            { error: 'Internal error (unhandled)', detail: String(err?.message ?? err) },
            { status: 500 }
        )
    }
}
