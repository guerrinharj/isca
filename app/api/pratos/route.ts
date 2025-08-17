import { NextResponse } from 'next/server'
import { createClientService } from '@/lib/supabase'

export async function GET() {
    try {
        const supabase = createClientService()
        const { data, error } = await supabase
            .from('Prato')
            .select('*')
            .eq('isActive', true)
            .order('createdAt', { ascending: false })

        if (error) {
            console.error('GET /pratos error:', error)
            return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 })
        }
        return NextResponse.json({ pratos: data ?? [] })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: 'Internal', details: msg }, { status: 500 })
    }
}
