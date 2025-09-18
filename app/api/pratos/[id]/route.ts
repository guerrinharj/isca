export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

const API_KEY_HEADER = 'x-api-key'
const INTERNAL_PROXY_HEADER = 'x-internal-proxy'

function hasValidApiKey(req: Request) {
    const apiKey = req.headers.get(API_KEY_HEADER)
    return Boolean(apiKey && process.env.API_SECRET && apiKey === process.env.API_SECRET)
}

function isInternalProxy(req: Request) {
    return req.headers.get(INTERNAL_PROXY_HEADER) === '1'
}

function resolveBaseUrl(req: Request) {
    const configured = process.env.NEXT_PUBLIC_BASE_URL
    if (configured) return configured.replace(/\/$/, '')
    const host = req.headers.get('host') || 'localhost:3000'
    const isProd = Boolean(process.env.VERCEL)
    const proto = isProd ? 'https' : 'http'
    return `${proto}://${host}`
}

async function proxyWithApiKey(method: 'PUT' | 'DELETE', req: Request, id: string) {
    const base = resolveBaseUrl(req)
    const url = `${base}/api/pratos/${id}`

    const bodyText = method === 'PUT' ? await req.text() : undefined

    const headers: Record<string, string> = {
        [API_KEY_HEADER]: process.env.API_SECRET as string,
        [INTERNAL_PROXY_HEADER]: '1',
    }
    const ct = req.headers.get('content-type')
    if (ct) headers['content-type'] = ct

    const res = await fetch(url, {
        method,
        headers,
        body: method === 'PUT' ? bodyText : undefined,
        cache: 'no-store',
    })

    const text = await res.text()
    return new NextResponse(text || null, {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    })
}

/* =========================
    GET (público)
   ========================= */
export async function GET(_req: Request, context: Ctx) {
    try {
        const { id } = await context.params
        const supabase = createClientService()

        const { data: prato, error } = await supabase
            .from('Prato')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if ((error as { code?: string }).code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            console.error('PRATO_GET_ERROR', error)
            return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }

        return NextResponse.json({ prato })
    } catch (err) {
        console.error('PRATO_GET_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

/* =========================
    PUT (protege por API key; auto-proxy se faltar)
   ========================= */
export async function PUT(req: Request, context: Ctx) {
    try {
        const { id } = await context.params

        if (hasValidApiKey(req) || isInternalProxy(req)) {
            const body = await req.json()
            const supabase = createClientService()

            const updates: Record<string, unknown> = {}

            // escalares
            if (typeof body.nome === 'string') updates.nome = body.nome
            if (typeof body.preco === 'string' || typeof body.preco === 'number') {
                updates.preco = String(body.preco)
            }
            if (typeof body.descricao === 'string') updates.descricao = body.descricao
            if (typeof body.descricao_en === 'string') updates.descricao_en = body.descricao_en
            if (Array.isArray(body.imagens)) updates.imagens = body.imagens as string[]
            if (typeof body.isActive === 'boolean') updates.isActive = body.isActive

            // booleans permitidos
            const booleanKeys = [
                'is_pintxo',
                'is_outro',
                'is_drink',
                'is_alcoolico',
                'is_soft',
                'is_vegan',
                'is_vegetariano',
                'is_sobremesa', 
            ] as const

            for (const k of booleanKeys) {
                const v = body[k as keyof typeof body]
                if (typeof v === 'boolean') {
                    updates[k] = v
                }
            }

            // updatedAt (se existir NOT NULL no schema)
            updates.updatedAt = new Date().toISOString()

            // nada pra atualizar além do updatedAt?
            if (Object.keys(updates).length === 1 && 'updatedAt' in updates) {
                return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
            }

            const { data: prato, error } = await supabase
                .from('Prato')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()

            if (error) {
                if ((error as { code?: string }).code === 'PGRST116') {
                    return NextResponse.json({ error: 'Not found' }, { status: 404 })
                }
                const cause = {
                    message:
                        typeof (error as { message?: unknown }).message === 'string'
                            ? (error as { message: string }).message
                            : 'Unknown DB error',
                    code:
                        typeof (error as { code?: unknown }).code === 'string'
                            ? (error as { code: string }).code
                            : undefined,
                    details:
                        typeof (error as { details?: unknown }).details === 'string'
                            ? (error as { details: string }).details
                            : undefined,
                    hint:
                        typeof (error as { hint?: unknown }).hint === 'string'
                            ? (error as { hint: string }).hint
                            : undefined,
                }
                console.error('PRATO_PUT_ERROR', cause)
                return NextResponse.json({ error: 'Update failed', cause }, { status: 500 })
            }

            return NextResponse.json({ prato })
        }

        // auto-proxy interno se não veio x-api-key
        if (!process.env.API_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await proxyWithApiKey('PUT', req, id)
    } catch (err: unknown) {
        const cause =
            err instanceof Error
                ? { message: err.message, name: err.name }
                : typeof err === 'string'
                ? { message: err }
                : { message: 'Unhandled non-Error exception' }

        console.error('PRATO_PUT_UNHANDLED', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}

/* =========================
    DELETE (protege por API key; auto-proxy se faltar)
   ========================= */
export async function DELETE(req: Request, context: Ctx) {
    try {
        const { id } = await context.params

        if (hasValidApiKey(req) || isInternalProxy(req)) {
            const supabase = createClientService()

            const { error } = await supabase.from('Prato').delete().eq('id', id)

            if (error) {
                if ((error as { code?: string }).code === 'PGRST116') {
                    return NextResponse.json({ error: 'Not found' }, { status: 404 })
                }
                const cause = {
                    message:
                        typeof (error as { message?: unknown }).message === 'string'
                            ? (error as { message: string }).message
                            : 'Unknown DB error',
                    code:
                        typeof (error as { code?: unknown }).code === 'string'
                            ? (error as { code: string }).code
                            : undefined,
                    details:
                        typeof (error as { details?: unknown }).details === 'string'
                            ? (error as { details: string }).details
                            : undefined,
                    hint:
                        typeof (error as { hint?: unknown }).hint === 'string'
                            ? (error as { hint: string }).hint
                            : undefined,
                }
                console.error('PRATO_DELETE_ERROR', cause)
                return NextResponse.json({ error: 'Delete failed', cause }, { status: 500 })
            }

            return new Response(null, { status: 204 })
        }

        if (!process.env.API_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await proxyWithApiKey('DELETE', req, id)
    } catch (err) {
        console.error('PRATO_DELETE_UNHANDLED', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
