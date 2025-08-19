// app/api/reservas/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiKeyOrAdmin } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

function extractError(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
            kind: 'PrismaClientKnownRequestError',
            code: e.code,
            message: e.message,
            meta: e.meta,
        }
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
        return {
            kind: 'PrismaClientInitializationError',
            message: e.message,
            errorCode: e.errorCode,
        }
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
        return {
            kind: 'PrismaClientValidationError',
            message: e.message,
        }
    }
    if (e instanceof Error) {
        return { kind: e.name, message: e.message }
    }
    return { kind: 'Unknown', message: String(e) }
}

export async function GET(_req: Request, context: RouteContext) {
    try {
        await requireApiKeyOrAdmin()
        const { id } = await context.params
        const reserva = await prisma.reserva.findUnique({ where: { id } })
        if (!reserva) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ reserva })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cause = extractError(err)
        console.error('RESERVA_ID_GET_UNHANDLED', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}

export async function PUT(req: Request, context: RouteContext) {
    try {
        await requireApiKeyOrAdmin()
        const { id } = await context.params
        const body = (await req.json()) as Partial<{
            nome: string
            email: string
            telefone: string
            quantity: number
            is_confirmed: boolean
            data: string
            message: string
        }>

        const data: {
            nome?: string
            email?: string
            telefone?: string
            quantity?: number
            is_confirmed?: boolean
            data?: Date
            message?: string
            updatedAt?: Date
        } = {}

        if (typeof body.nome === 'string') data.nome = body.nome
        if (typeof body.email === 'string') data.email = body.email
        if (typeof body.telefone === 'string') data.telefone = body.telefone
        if (typeof body.quantity === 'number' && Number.isFinite(body.quantity)) data.quantity = body.quantity
        if (typeof body.is_confirmed === 'boolean') data.is_confirmed = body.is_confirmed
        if (typeof body.data === 'string') {
            const when = new Date(body.data)
            if (Number.isNaN(when.getTime())) {
                return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
            }
            data.data = when
        }
        if (typeof body.message === 'string') data.message = body.message.trim()

        // keep updatedAt fresh
        data.updatedAt = new Date()

        if (Object.keys(data).length === 1 && 'updatedAt' in data) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        const reserva = await prisma.reserva.update({ where: { id }, data })
        return NextResponse.json({ reserva })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            // record not found
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        const cause = extractError(err)
        console.error('RESERVA_ID_PUT_ERROR', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}

export async function DELETE(_req: Request, context: RouteContext) {
    try {
        await requireApiKeyOrAdmin()
        const { id } = await context.params
        await prisma.reserva.delete({ where: { id } })
        return new Response(null, { status: 204 })
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        const cause = extractError(err)
        console.error('RESERVA_ID_DELETE_ERROR', cause)
        return NextResponse.json({ error: 'Internal error', cause }, { status: 500 })
    }
}
