import { getSessionUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ user: null })
    const { id, name, email, role } = user
    return NextResponse.json({ user: { id, name, email, role } })
}
