import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

type RegisterBody = {
    name?: string
    email?: string
    password?: string
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as RegisterBody

        const name = (body.name ?? '').trim()
        const email = (body.email ?? '').trim().toLowerCase()
        const password = body.password ?? ''

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const supabase = createClientService()

        // checa se já existe usuário
        const { data: existing, error: findErr } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (findErr && findErr.code !== 'PGRST116') {
            // erro inesperado que não é "no rows found"
            console.error(findErr)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        if (existing) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
        }

        // cria hash da senha
        const passwordHash = await hashPassword(password)

        // insere no Supabase
        const { data: user, error: insertErr } = await supabase
            .from('users')
            .insert([
                {
                    name,
                    email,
                    password: passwordHash,
                    role: 'USER',
                },
            ])
            .select('id, name, email, role, created_at')
            .single()

        if (insertErr) {
            console.error(insertErr)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return NextResponse.json({ user }, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
