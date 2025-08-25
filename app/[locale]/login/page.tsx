'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

type MeResponse =
    | { user: null }
    | {
            user: {
                id: string
                name: string
                email: string
                role: 'ADMIN' | 'USER'
            }
        }

export default function LoginPage() {
    const { locale: rawLocale } = useParams<{ locale: Locale }>()
    const locale = locales.includes(rawLocale) ? rawLocale : 'pt'
    const router = useRouter()

    const t = useMemo(
        () =>
            locale === 'pt'
                ? {
                        title: 'Entrar',
                        subtitle: 'Acesse com seu e-mail e senha.',
                        email: 'E-mail',
                        password: 'Senha',
                        submit: 'Entrar',
                        loggingIn: 'Entrando…',
                        required: 'Preencha todos os campos.',
                        invalid: 'Credenciais inválidas.',
                        unknown: 'Erro inesperado. Tente novamente.',
                        alreadyIn: 'Você já está conectado. Redirecionando…',
                        back: 'Voltar',
                    }
                : {
                        title: 'Sign in',
                        subtitle: 'Sign in with your email and password.',
                        email: 'Email',
                        password: 'Password',
                        submit: 'Sign in',
                        loggingIn: 'Signing in…',
                        required: 'Please fill in all fields.',
                        invalid: 'Invalid credentials.',
                        unknown: 'Unexpected error. Please try again.',
                        alreadyIn: 'You are already signed in. Redirecting…',
                        back: 'Back',
                    },
            [locale]
    )

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    // If already logged in, bounce away
    useEffect(() => {
        let alive = true
        ;(async () => {
            try {
                const r = await fetch('/api/auth/me', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'cache-control': 'no-store' },
                })
                const data: MeResponse = await r.json()
                if (!alive) return
                if (data.user) {
                    setNotice(t.alreadyIn)
                    const target = `/${locale}`
                    setTimeout(() => router.replace(target), 400)
                }
            } catch {
                /* ignore */
            }
        })()
        return () => {
            alive = false
        }
    }, [locale, router, t.alreadyIn])

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        if (!email.trim() || !password.trim()) {
            setError(t.required)
            return
        }

        setLoading(true)
        try {
            const r = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_SECRET ?? ''
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            })

            if (!r.ok) {
                try {
                    const j = await r.json()
                    setError(j?.error === 'Invalid credentials' ? t.invalid : t.unknown)
                } catch {
                    setError(t.unknown)
                }
                setLoading(false)
                return
            }

            const me = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 'cache-control': 'no-store' },
            })
            const data: MeResponse = await me.json()

            setLoading(false)
            if (data.user) {
                router.replace(`/${locale}`)
            } else {
                setError(t.unknown)
            }
        } catch {
            setLoading(false)
            setError(t.unknown)
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white/70 shadow-lg border border-black/5 backdrop-blur p-6">
                <h1 className="text-2xl font-semibold text-isca-verde mb-1">
                    {t.title}
                </h1>
                <p className="text-sm text-black/60 mb-6">{t.subtitle}</p>

                {notice && (
                    <div className="mb-4 text-xs rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2">
                        {notice}
                    </div>
                )}
                {error && (
                    <div className="mb-4 text-xs rounded-md bg-red-50 border border-red-200 text-red-800 px-3 py-2">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-isca-verde">
                            {t.email}
                        </label>
                        <input
                            id="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-isca-verde/40 bg-white text-isca-verde"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-sm font-medium text-isca-verde">
                            {t.password}
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-isca-verde/40 bg-white text-isca-verde"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-isca-verde text-white py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-60 transition"
                    >
                        {loading ? t.loggingIn : t.submit}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                        <a
                            href={`/${locale}`}
                            className="text-xs underline underline-offset-2 text-black/60 hover:text-black"
                        >
                            {t.back}
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
