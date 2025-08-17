import { createClient } from '@supabase/supabase-js'

export function createClientAnon() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, key)
}

export function createClientService() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    return createClient(url, key, {
        auth: { persistSession: false },
        global: { headers: { 'X-Client-Info': 'isca-api' } },
    })
}
