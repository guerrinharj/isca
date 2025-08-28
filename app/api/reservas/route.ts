// app/api/reservas/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireApiKeyOrAdmin } from '@/lib/auth'
import nodemailer from 'nodemailer'

type PostBody = {
    nome?: string
    data?: string
    email?: string
    telefone?: string
    quantity?: number
    message?: string
}

function isISODateValid(value: string) {
    const d = new Date(value)
    return !Number.isNaN(d.getTime())
}

function extractError(e: unknown): { message: string; code?: string; details?: string } {
    let message = 'Unknown error'
    let code: string | undefined
    let details: string | undefined

    if (typeof e === 'string') {
        message = e
    } else if (typeof e === 'object' && e !== null) {
        const obj = e as Record<string, unknown>
        if (typeof obj.message === 'string') message = obj.message
        if (typeof obj.code === 'string') code = obj.code
        if (typeof obj.details === 'string') details = obj.details
    }

    return { message, code, details }
}

function fmtWhen(iso: string) {
    try {
        const d = new Date(iso)
        return d.toLocaleString('pt-BR', { hour12: false })
    } catch {
        return iso
    }
}

/* ========== EMAIL (Gmail via SMTP) ========== */
async function sendEmail({
    subject,
    html,
}: {
    subject: string
    html: string
}) {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        RESERVA_NOTIFY_FROM,
        RESERVA_NOTIFY_TO,
    } = process.env

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !RESERVA_NOTIFY_FROM || !RESERVA_NOTIFY_TO) {
        return { ok: false, error: 'Missing SMTP envs' }
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465, // TLS implicit para 465; STARTTLS para 587
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    try {
        await transporter.sendMail({
            from: RESERVA_NOTIFY_FROM,
            to: RESERVA_NOTIFY_TO,
            subject,
            html,
        })
        return { ok: true }
    } catch (err) {
        const cause = extractError(err)
        console.error('EMAIL_SEND_ERROR', cause)
        return { ok: false, error: cause.message }
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as PostBody
        const nome = (body.nome ?? '').trim()
        const email = (body.email ?? '').trim().toLowerCase()
        const telefone = (body.telefone ?? '').trim()
        const quantity = body.quantity
        const message = (body.message ?? '').trim()

        if (!nome || !email || !telefone || typeof quantity !== 'number' || !body.data) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isISODateValid(body.data)) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }

        const when = new Date(body.data).toISOString()
        const supabase = createClientService()

        const { data: reserva, error } = await supabase
            .from('Reserva')
            .insert([
                {
                    nome,
                    email,
                    telefone,
                    quantity,
                    data: when,
                    is_confirmed: true,
                    message: message || null,
                },
            ])
            .select('*')
            .single()

        if (error || !reserva) {
            const cause = extractError(error)
            console.error('RESERVA_POST_ERROR', cause)
            return NextResponse.json({ error: 'Database insert failed', cause }, { status: 500 })
        }

        // ===== Notificação por e-mail (não falha a reserva se der erro) =====
        const subject = `Nova reserva: ${reserva.nome} • ${fmtWhen(reserva.data)}`
        const html = [
            `<p><strong>Nova reserva confirmada</strong></p>`,
            `<p><strong>Nome:</strong> ${reserva.nome}</p>`,
            `<p><strong>Email:</strong> ${reserva.email}</p>`,
            `<p><strong>Telefone:</strong> ${reserva.telefone}</p>`,
            `<p><strong>Pessoas:</strong> ${reserva.quantity}</p>`,
            `<p><strong>Quando:</strong> ${fmtWhen(reserva.data)}</p>`,
            reserva.message ? `<p><strong>Mensagem:</strong> ${reserva.message}</p>` : '',
            `<p><strong>ID:</strong> ${reserva.id}</p>`,
        ]
            .filter(Boolean)
            .join('\n')

        const emailResult = await sendEmail({ subject, html })

        return NextResponse.json({ reserva, notifications: { email: emailResult } }, { status: 201 })
    } catch (err: unknown) {
        const cause = extractError(err)
        console.error('RESERVA_POST_UNHANDLED', cause)
        return NextResponse.json({ error: 'Unhandled error in POST', cause }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        await requireApiKeyOrAdmin() // 👈 uses x-api-key or ADMIN session

        const url = new URL(req.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const confirmed = url.searchParams.get('confirmed')

        const supabase = createClientService()
        let query = supabase.from('Reserva').select('*')

        if (from && isISODateValid(from)) {
            query = query.gte('data', new Date(from).toISOString())
        }
        if (to && isISODateValid(to)) {
            query = query.lte('data', new Date(to).toISOString())
        }
        if (confirmed === 'true') {
            query = query.eq('is_confirmed', true)
        } else if (confirmed === 'false') {
            query = query.eq('is_confirmed', false)
        }

        const { data: reservas, error } = await query.order('data', { ascending: true })

        if (error) {
            const cause = extractError(error)
            console.error('RESERVA_GET_ERROR', cause)
            return NextResponse.json({ error: 'Database select failed', cause }, { status: 500 })
        }

        return NextResponse.json({ reservas })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cause = extractError(err)
        console.error('RESERVA_GET_UNHANDLED', cause)
        return NextResponse.json({ error: 'Unhandled error in GET', cause }, { status: 500 })
    }
}
