// app/[locale]/cardapio/page.tsx
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

// Accept param as value OR promise (matches your env's typing)
type ParamValue = { locale: string }
type ParamLike = ParamValue | Promise<ParamValue>

type CardapioPageProps = {
    params: ParamLike
    searchParams?: SearchParams
}

type Prato = {
    id: string
    nome: string
    preco: string | number | null
    descricao?: string | null
    descricao_en?: string | null
    is_pintxo?: boolean | null
    promo_description?: string | null
    is_vegan?: boolean | null
    is_vegetariano?: boolean | null
    is_drink?: boolean | null
    is_alcoolico?: boolean | null
    is_soft?: boolean | null
    is_outro?: boolean | null
}

/* utils */
function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null
}
function isPromise<T = unknown>(x: unknown): x is Promise<T> {
    return typeof (x as { then?: unknown })?.then === 'function'
}
async function resolveParams(p: ParamLike): Promise<ParamValue> {
    return isPromise<ParamValue>(p) ? await p : p
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
function pickNumberOrString(r: Record<string, unknown>, keys: readonly string[]): number | string | null {
    for (const k of keys) {
        const v = r[k]
        if (typeof v === 'number') return v
        if (typeof v === 'string') return v
    }
    return null
}
function pickBool(r: Record<string, unknown>, keys: readonly string[]): boolean | null {
    for (const k of keys) {
        const v = r[k]
        if (typeof v === 'boolean') return v
        if (typeof v === 'number') return v !== 0
        if (typeof v === 'string') {
            const s = v.toLowerCase().trim()
            if (s === 'true') return true
            if (s === 'false') return false
            if (s === '1') return true
            if (s === '0') return false
        }
    }
    return null
}

/* coercion */
function coercePrato(r: Record<string, unknown>): Prato | null {
    const id =
        pickString(r, ['id', 'uuid', '_id']) ??
        `${pickString(r, ['nome', 'name']) ?? 'item'}-${Math.random()}`
    const nome = pickString(r, ['nome', 'name', 'titulo', 'title']) ?? ''
    if (!nome) return null

    const preco = pickNumberOrString(r, ['preco', 'price', 'valor'])
    const descricao = pickString(r, ['descricao', 'description'])
    const descricao_en = pickString(r, ['descricao_en', 'description_en', 'descriptionEn'])
    const promo_description = pickString(r, ['promo_description', 'promoDescription', 'promotion', 'promo'])
    const is_pintxo = pickBool(r, ['is_pintxo', 'isPintxo', 'pintxo'])
    const is_vegan = pickBool(r, ['is_vegan', 'isVegan', 'vegan'])
    const is_vegetariano = pickBool(r, ['is_vegetariano', 'isVegetariano', 'vegetarian'])
    const is_drink = pickBool(r, ['is_drink', 'isDrink', 'drink'])
    const is_alcoolico = pickBool(r, ['is_alcoolico', 'isAlcoolico', 'alcoolico'])
    const is_soft = pickBool(r, ['is_soft', 'isSoft', 'soft'])
    const is_outro = pickBool(r, ['is_outro', 'isOutro', 'outro'])

    return {
        id,
        nome,
        preco: preco ?? null,
        descricao: descricao ?? null,
        descricao_en: descricao_en ?? null,
        promo_description: promo_description ?? null,
        is_pintxo: is_pintxo ?? null,
        is_vegan: is_vegan ?? null,
        is_vegetariano: is_vegetariano ?? null,
        is_drink: is_drink ?? null,
        is_alcoolico: is_alcoolico ?? null,
        is_soft: is_soft ?? null,
        is_outro: is_outro ?? null,
    }
}

async function fetchPratos(): Promise<Prato[]> {
    const res = await fetch('https://isca-omega.vercel.app/api/pratos', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const json: unknown = await res.json()
    const arr = firstArrayIn(json)
    if (!arr) return []

    const coerced: Prato[] = []
    for (const x of arr) {
        if (isRecord(x)) {
            const p = coercePrato(x)
            if (p) coerced.push(p)
        }
    }
    return coerced
}

/* UI */
function ItemRow({ item, locale }: { item: Prato; locale: Locale }) {
    const descricao =
        locale === 'en'
            ? (item.descricao_en?.trim() || item.descricao?.trim() || '')
            : (item.descricao?.trim() || item.descricao_en?.trim() || '')

    const precoText =
        typeof item.preco === 'number' ? String(item.preco) : (item.preco ?? '')

    const isVeganVegetariano = Boolean(item.is_vegan) && Boolean(item.is_vegetariano)
    const veganLabel = locale === 'en' ? '(Vegan & Vegetarian)' : '(Vegano & Vegetariano)'

    return (
        <li className="py-3 text-isca-verde">
            <div className="flex items-baseline justify-between gap-4">
                <span className="font-burns-ultra text-xl">{item.nome}</span>
                <span className="font-burns-ultra text-xl">{precoText}</span>
            </div>
            {(descricao || isVeganVegetariano) && (
                <p className="mt-1 font-poppins text-base">
                    {descricao}
                    {isVeganVegetariano && (
                        <span className="ml-2 font-cirrus text-base">{veganLabel}</span>
                    )}
                </p>
            )}
            {item.promo_description && (
                <p className="mt-1 font-burns-ultra text-base">[{item.promo_description}]</p>
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
}: {
    id: string
    title: string
    items: Prato[]
    locale: Locale
    hidden?: boolean
}) {
    return (
        <section id={id} className={hidden ? 'hidden' : ''}>
            <h2 className="font-burns-ultra text-3xl text-isca-verde underline">{title}</h2>
            <ul className="mt-4 divide-y divide-current/20">
                {items.length > 0 ? (
                    items.map(item => <ItemRow key={item.id} item={item} locale={locale} />)
                ) : (
                    <li className="py-3 font-poppins text-isca-verde">
                        {locale === 'en' ? 'No items yet.' : 'Sem itens por enquanto.'}
                    </li>
                )}
            </ul>
        </section>
    )
}

function Tabs({ baseHref, active, locale }: { baseHref: string; active: string; locale: Locale }) {
    const items = [
        { key: 'pintxo', label: 'Pintxo' },
        { key: 'outros', label: locale === 'en' ? 'Other' : 'Outros' },
        { key: 'drinks', label: 'Drinks' },
        { key: 'alcoolicos', label: locale === 'en' ? 'Beverages' : 'Alcoólicos' },
        { key: 'softs', label: 'Softs' },
    ]
    return (
        <div className="mb-8 flex flex-wrap gap-3">
            {items.map(it => {
                const href = `${baseHref}?f=${it.key}`
                const isActive = active === it.key
                return (
                    <Link
                        key={it.key}
                        href={href}
                        className={[
                            'px-4 py-2 rounded-full border font-burns-ultra text-base',
                            isActive
                                ? 'bg-isca-verde text-black border-isca-verde'
                                : 'text-isca-verde border-isca-verde/50 hover:border-isca-verde',
                        ].join(' ')}
                    >
                        {it.label}
                    </Link>
                )
            })}
        </div>
    )
}

export default async function CardapioPage({ params, searchParams }: CardapioPageProps) {
    // Normalize params whether it's a Promise or a plain object
    const { locale: localeParam } = await resolveParams(params)
    const safeLocale: Locale = locales.includes(localeParam as Locale) ? (localeParam as Locale) : 'pt'

    await getMessages(safeLocale)

    const pratos = await fetchPratos()
    const pintxos = pratos.filter(p => Boolean(p.is_pintxo))
    const drinks = pratos.filter(p => Boolean(p.is_drink))
    const alcoolicos = pratos.filter(p => Boolean(p.is_alcoolico))
    const softs = pratos.filter(p => Boolean(p.is_soft))
    const outros = pratos.filter(p => Boolean(p.is_outro))

    const rawF = searchParams?.f
    const activeFilter = Array.isArray(rawF) ? (rawF[0] ?? '') : (rawF ?? '')

    const baseHref = `/${safeLocale}/cardapio`

    return (
        <div className="container mx-auto max-w-3xl p-6 pb-40">
            <Tabs baseHref={baseHref} active={activeFilter} locale={safeLocale} />
            <div className="space-y-10">
                <Section id="pintxos" title="Pintxos" items={pintxos} locale={safeLocale} hidden={activeFilter !== 'pintxo'} />
                <Section id="drinks" title="Drinks" items={drinks} locale={safeLocale} hidden={activeFilter !== 'drinks'} />
                <Section id="alcoolicos" title={safeLocale === 'en' ? 'Beverages' : 'Alcoólicos'} items={alcoolicos} locale={safeLocale} hidden={activeFilter !== 'alcoolicos'} />
                <Section id="softs" title="Softs" items={softs} locale={safeLocale} hidden={activeFilter !== 'softs'} />
                <Section id="outros" title={safeLocale === 'en' ? 'Other' : 'Outros'} items={outros} locale={safeLocale} hidden={activeFilter !== 'outros'} />
            </div>
        </div>
    )
}
