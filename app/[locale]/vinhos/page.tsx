// app/[locale]/vinhos/page.tsx
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { CSSProperties } from 'react'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
type ParamValue = { locale: string }
type ParamLike = ParamValue | Promise<ParamValue>

type Vinho = {
    id: string
    nome: string
    tipo: string
    ano?: string | null
    quantidade?: string | null
    descricao?: string | null
    descricao_en?: string | null
    preco_grf?: string | null
    preco_125ml?: string | null
}

type CSSVars = CSSProperties & { ['--i']?: number | string }

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null
}
function firstArrayIn(x: unknown): unknown[] | null {
    if (Array.isArray(x)) return x
    if (isRecord(x)) {
        for (const v of Object.values(x)) {
            if (Array.isArray(v)) return v
        }
    }
    return null
}
function pickString(r: Record<string, unknown>, keys: readonly string[]): string | null {
    for (const k of keys) {
        const v = r[k]
        if (typeof v === 'string') return v
        if (typeof v === 'number') return String(v)
    }
    return null
}

function coerceVinho(r: Record<string, unknown>): Vinho | null {
    const id = pickString(r, ['id']) ?? `${Math.random()}`
    const nome = pickString(r, ['nome', 'name']) ?? ''
    const tipo = pickString(r, ['tipo', 'type']) ?? ''
    if (!id || !nome || !tipo) return null

    return {
        id,
        nome,
        tipo,
        ano: pickString(r, ['ano', 'year']),
        quantidade: pickString(r, ['quantidade', 'amount']),
        descricao: pickString(r, ['descricao', 'description']),
        descricao_en: pickString(r, ['descricao_en', 'description_en']),
        preco_grf: pickString(r, ['preco_grf']),
        preco_125ml: pickString(r, ['preco_125ml']),
    }
}

async function fetchVinhos(): Promise<Vinho[]> {
    const res = await fetch('https://isca-omega.vercel.app/api/vinhos', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const json: unknown = await res.json()
    const arr = firstArrayIn(json)
    if (!arr) return []

    const coerced: Vinho[] = []
    for (const x of arr) {
        if (isRecord(x)) {
            const v = coerceVinho(x)
            if (v) coerced.push(v)
        }
    }
    return coerced
}

/* UI */
function ItemRow({
    item,
    locale,
    loggedIn,
    deleteActionFor,
}: {
    item: Vinho
    locale: Locale
    loggedIn: boolean
    deleteActionFor: (id: string) => (formData: FormData) => Promise<void>
}) {
    const descricao =
        locale === 'en'
            ? (item.descricao_en?.trim() || item.descricao?.trim() || '')
            : (item.descricao?.trim() || item.descricao_en?.trim() || '')

    const p125 = (item.preco_125ml ?? '').toString().trim()
    const pgrf = (item.preco_grf ?? '').toString().trim()
    const precoLine = [p125, pgrf].filter(Boolean).join(' | ')

    return (
        <li className="py-3">
            <div className="flex items-baseline justify-between gap-4">
                <span className="font-burns-ultra text-base md-text-xl">
                    {item.nome}
                    <span className="poppins-bold text-sm"> {item.quantidade && ` · ${item.quantidade}`} </span>
                </span>

                <div className="flex items-center gap-3">
                    {precoLine && (
                        <span className="font-burns-ultra text-base md-text-xl">
                            {precoLine}
                        </span>
                    )}

                    {loggedIn && (
                        <>
                            <Link
                                href={`/${locale}/vinhos/${item.id}/edit`}
                                className="text-sm underline underline-offset-4 hover:opacity-80"
                            >
                                edit
                            </Link>
                            <form action={deleteActionFor(item.id)}>
                                <button
                                    type="submit"
                                    className="text-red-600 text-sm underline underline-offset-4 hover:opacity-80"
                                >
                                    delete
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {(descricao || item.ano) && (
                <p className="mt-1 text-sm font-poppins">
                    <span className="poppins-bold">{item.ano && `${item.ano} ·    `}</span>
                    <span className="poppins-medium-italic">{descricao}</span>
                </p>
            )}
        </li>
    )
}

function Section({
    id,
    title,
    items,
    locale,
    hidden,
    loggedIn,
    deleteActionFor,
}: {
    id: string
    title: string
    items: Vinho[]
    locale: Locale
    hidden?: boolean
    loggedIn: boolean
    deleteActionFor: (id: string) => (formData: FormData) => Promise<void>
}) {
    return (
        <section id={id} className={hidden ? 'hidden' : ''}>
            <div className="relative">
                <h2 className="font-cirrus -rotate-12 text-4xl absolute right-0 top-1/2 -translate-y-1/2">
                    {title}
                </h2>
            </div>
            <ul className="mt-8 divide-y divide-current/20">
                {items.length > 0 ? (
                    items.map(item => (
                        <ItemRow
                            key={item.id}
                            item={item}
                            locale={locale}
                            loggedIn={loggedIn}
                            deleteActionFor={deleteActionFor}
                        />
                    ))
                ) : (
                    <li className="py-3 font-poppins">
                        {locale === 'en' ? 'No wines yet.' : 'Sem vinhos por enquanto.'}
                    </li>
                )}
            </ul>
        </section>
    )
}

function Tabs({ baseHref, active, locale }: { baseHref: string; active: string; locale: Locale }) {
    const items = [
        { key: 'Bolhas', label: locale === 'en' ? 'Sparkling' : 'Bolhas' },
        { key: 'Branco', label: locale === 'en' ? 'White' : 'Branco' },
        { key: 'Rosé', label: 'Rosé' },
        { key: 'Laranja', label: locale === 'en' ? 'Orange' : 'Laranja' },
        { key: 'Tinto', label: locale === 'en' ? 'Red' : 'Tinto' },
    ]

    return (
        <div className="mb-8 flex flex-wrap overflow-x-auto no-scrollbar gap-4">
            {items.map(it => {
                const href = `${baseHref}?f=${encodeURIComponent(it.key)}`
                const isActive = active === it.key
                return (
                    <Link
                        key={it.key}
                        href={href}
                        aria-label={it.label}
                        className={[
                            'px-1 py-1 font-burns-ultra text-xs',
                            isActive ? 'underline underline-offset-4' : 'hover:underline'
                        ].join(' ')}
                    >
                        <span className="sr-only">{it.label}</span>
                        <span className="wave-hover" aria-hidden="true">
                            {Array.from(it.label).map((ch, i) => {
                                const spanStyle: CSSVars = { ['--i']: i }
                                return (
                                    <span key={i} style={spanStyle}>
                                        {ch === ' ' ? '\u00A0' : ch}
                                    </span>
                                )
                            })}
                        </span>
                    </Link>
                )
            })}
        </div>
    )
}

export default async function VinhosPage(props: { params: ParamLike; searchParams: Promise<SearchParams> }) {
    const { params, searchParams } = props
    const { locale: localeParam } = await params
    const sp = (await searchParams) ?? {}

    const safeLocale: Locale = locales.includes(localeParam as Locale)
        ? (localeParam as Locale)
        : 'pt'

    await getMessages(safeLocale)

    const vinhos = await fetchVinhos()

    const rawF = sp.f
    const activeFilter = Array.isArray(rawF) ? (rawF[0] ?? '') : (rawF ?? '')

    const baseHref = `/${safeLocale}/vinhos`
    const showAll = !activeFilter
    const isHidden = (key: string) => (showAll ? false : activeFilter !== key)

    const jar = await cookies()
    const loggedIn = Boolean(jar.get('isca_session')?.value)

    const deleteActionFor = (id: string) => {
        return async (_formData: FormData) => {
            'use server'
            try {
                await fetch(`https://isca-omega.vercel.app/api/vinhos/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'x-api-key': process.env.API_SECRET || '',
                    },
                })
            } finally {
                revalidatePath(`/${safeLocale}/vinhos`)
            }
        }
    }

    return (
        <>
            {loggedIn && (
                <Link
                    href={`/${safeLocale}/vinhos/new`}
                    className="
                        text
                        hidden md:flex fixed left-8 top-5 z-40
                        h-14 w-14 items-center justify-center
                        rounded-full border border-white
                        text-3xl leading-none shadow-lg hover:scale-105 transition
                    "
                    aria-label={safeLocale === 'en' ? 'Create Wine' : 'Criar Vinho'}
                    title={safeLocale === 'en' ? 'Create Wine' : 'Criar Vinho'}
                >
                    +
                </Link>
            )}

            <div
                className="container mx-auto max-w-3xl pb-20 pt-20 md:pt-6 relative will-change-[opacity,transform]"
                style={{ animation: 'fadeInUpMini 220ms ease-out both' }}
            >
                <Tabs baseHref={baseHref} active={activeFilter} locale={safeLocale} />

                <div className="space-y-10">
                    <Section
                        id="bolhas"
                        title={safeLocale === 'en' ? 'Sparkling' : 'Bolhas'}
                        items={vinhos.filter(v => v.tipo === 'Bolhas')}
                        locale={safeLocale}
                        hidden={isHidden('Bolhas')}
                        loggedIn={loggedIn}
                        deleteActionFor={deleteActionFor}
                    />
                    <Section
                        id="branco"
                        title={safeLocale === 'en' ? 'White' : 'Branco'}
                        items={vinhos.filter(v => v.tipo === 'Branco')}
                        locale={safeLocale}
                        hidden={isHidden('Branco')}
                        loggedIn={loggedIn}
                        deleteActionFor={deleteActionFor}
                    />
                    <Section
                        id="rose"
                        title="Rosé"
                        items={vinhos.filter(v => v.tipo === 'Rosé')}
                        locale={safeLocale}
                        hidden={isHidden('Rosé')}
                        loggedIn={loggedIn}
                        deleteActionFor={deleteActionFor}
                    />
                    <Section
                        id="laranja"
                        title={safeLocale === 'en' ? 'Orange' : 'Laranja'}
                        items={vinhos.filter(v => v.tipo === 'Laranja')}
                        locale={safeLocale}
                        hidden={isHidden('Laranja')}
                        loggedIn={loggedIn}
                        deleteActionFor={deleteActionFor}
                    />
                    <Section
                        id="tinto"
                        title={safeLocale === 'en' ? 'Red' : 'Tinto'}
                        items={vinhos.filter(v => v.tipo === 'Tinto')}
                        locale={safeLocale}
                        hidden={isHidden('Tinto')}
                        loggedIn={loggedIn}
                        deleteActionFor={deleteActionFor}
                    />
                </div>
            </div>

            <div className="mt-8 text-center font-poppins text-sm text-neutral-400">
                {safeLocale === 'en'
                    ? 'All wines on this list are natural, organic, or biodynamic.'
                    : 'Todos os vinhos dessa carta são naturais, orgânicos ou biodinâmicos.'}
            </div>
        </>
    )
}
