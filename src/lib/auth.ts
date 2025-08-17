import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'isca_session'

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash)
}

export async function createSession(userId: string, days = 30) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days)
    await prisma.session.create({
        data: { userId, token, expiresAt },
    })
    cookies().set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: expiresAt,
    })
}

export async function getSession() {
    const token = cookies().get(SESSION_COOKIE)?.value
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

export async function requireAdmin() {
    const user = await getSessionUser()
    if (!user || user.role !== 'ADMIN') {
        throw new Error('UNAUTHORIZED')
    }
    return user
}

export async function destroySession() {
    const token = cookies().get(SESSION_COOKIE)?.value
    if (token) {
        await prisma.session.deleteMany({ where: { token } })
    }
    cookies().set(SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: new Date(0),
    })
}
