// app/api/reservas/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'
import { requireApiKeyOrAdmin } from '@/lib/auth'
import nodemailer from 'nodemailer'

type PostBody = {
    nome?: string
    data?: string // ISO
    email?: string
    telefone?: string
    quantity?: number
    message?: string
}

/* ===== helpers ===== */
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

function sanitizeFrom(from: string | undefined, fallbackUser: string) {
    // Garante que o "from" tenha o e-mail entre <>, ex.: "Isca Reserva <conta@gmail.com>"
    const f = (from ?? '').trim()
    if (!f) return `"Isca Reserva" <${fallbackUser}>`
    // já veio com <...@...>?
    if (/<.+@.+>/.test(f)) return f
    // veio só o nome?
    if (!/@/.test(f)) return `"${f}" <${fallbackUser}>`
    // veio só o e-mail
    return f.includes('<') ? f : `"Isca Reserva" <${f}>`
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

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !RESERVA_NOTIFY_TO) {
        return { ok: false, error: 'Missing SMTP envs' as const }
    }

    const port = Number(SMTP_PORT)
    const secure = port === 465 // 465 = TLS implícito; 587 = STARTTLS
    const from = sanitizeFrom(RESERVA_NOTIFY_FROM, SMTP_USER)

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        requireTLS: !secure, // força STARTTLS quando 587
        tls: { minVersion: 'TLSv1.2' },
    })

    try {
        // opcional mas ajuda a diagnosticar config/porta/creds
        await transporter.verify()

        await transporter.sendMail({
            from,
            to: RESERVA_NOTIFY_TO,
            subject,
            html,
        })
        return { ok: true as const }
    } catch (err) {
        const cause = extractError(err)
        console.error('EMAIL_SEND_ERROR', cause)
        return { ok: false as const, error: cause.message }
    }
}

/* ========== POST /api/reservas ========== */
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as PostBody

        const nome = (body.nome ?? '').trim()
        const email = (body.email ?? '').trim().toLowerCase()
        const telefone = (body.telefone ?? '').trim()
        const quantity = Number(body.quantity)
        const message = (body.message ?? '').trim()
        const rawDate = body.data

        if (!nome || !email || !telefone || !rawDate || !Number.isFinite(quantity)) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        if (!isISODateValid(rawDate)) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }

        // Normaliza para ISO (com Z)
        const when = new Date(rawDate).toISOString()

        const supabase = createClientService() // use service role aqui por ser server-side

        const { data: reserva, error } = await supabase
            .from('Reserva') // ajuste para 'reserva' se sua tabela for minúscula
            .insert([
                {
                    nome,
                    email,
                    telefone,
                    quantity,
                    data: when,
                    is_confirmed: true, // marque como pendente se quiser fluxo de confirmação
                    message: message || null,
                },
            ])
            .select('*')
            .single()

        if (error || !reserva) {
            console.error('RESERVA_POST_ERROR_FULL', error)
            const cause = extractError(error)
            return NextResponse.json({ error: 'Database insert failed', cause }, { status: 500 })
        }

        // ===== Notificação por e-mail (não bloqueia a reserva se falhar) =====
        const subject = `Nova reserva: ${reserva.nome} • ${fmtWhen(reserva.data)}`
        const html = [
            `<p><strong>Nova reserva ${reserva.is_confirmed ? 'confirmada' : 'pendente'}</strong></p>`,
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

        return NextResponse.json(
            { reserva, notifications: { email: emailResult } },
            { status: 201 }
        )
    } catch (err: unknown) {
        const cause = extractError(err)
        console.error('RESERVA_POST_UNHANDLED', cause)
        return NextResponse.json({ error: 'Unhandled error in POST', cause }, { status: 500 })
    }
}

/* ========== GET /api/reservas ========== */
export async function GET(req: Request) {
    try {
        await requireApiKeyOrAdmin() // usa x-api-key ou sessão ADMIN

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
            console.error('RESERVA_GET_ERROR', error)
            const cause = extractError(error)
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
