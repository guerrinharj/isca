import { headers as nextHeaders, cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'isca_session'

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash)
}

/**
 * Creates a DB session and returns { token, expiresAt }.
 * Caller (route handler) must set the cookie on the response.
 */
export async function createSession(userId: string, days = 30) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days)

    await prisma.session.create({
        data: { userId, token, expiresAt },
    })

    return { token, expiresAt }
}

export async function getSession() {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null

    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    })
    if (!session || session.expiresAt < new Date()) {
        return null
    }
    return session
}

export async function getSessionUser() {
    const session = await getSession()
    return session?.user ?? null
}

/**
 * Legacy admin guard (session only).
 */
export async function requireAdmin() {
    const user = await getSessionUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('UNAUTHORIZED')
    }
    return user
}

/**
 * New admin guard:
 * - If x-api-key matches API_SECRET, authorize immediately (no cookie/DB).
 * - Otherwise, require an ADMIN user session.
 */
export async function requireApiKeyOrAdmin(req?: Request) {
    const H = req ? req.headers : await nextHeaders()
    const apiKey = H.get('x-api-key') ?? ''
    const secret = process.env.API_SECRET ?? ''

    if (secret && apiKey && apiKey === secret) {
        return { source: 'api-key' } as const
    }

    // Só cai aqui se NÃO tinha x-api-key válida → tenta sessão (usa Prisma)
    const user = await getSessionUser()
    if (!user || user.role !== 'ADMIN') throw new Error('UNAUTHORIZED')
    return { source: 'session', user } as const
}

export async function destroySession() {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (token) {
        await prisma.session.deleteMany({ where: { token } })
    }
}
