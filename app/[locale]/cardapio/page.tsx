// app/[locale]/cardapio/page.tsx
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic' // disable caching while debugging

type CardapioPageProps = {
    params: Promise<{ locale: Locale }>
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
}

/* -------------------- safe type utils (no `any`) -------------------- */
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

/* Coerce a generic object (record) into Prato, tolerating different key names */
function coercePrato(r: Record<string, unknown>): Prato | null {
    const id =
        pickString(r, ['id', 'uuid', '_id']) ?? `${pickString(r, ['nome', 'name']) ?? 'item'}-${Math.random()}`
    const nome =
        pickString(r, ['nome', 'name', 'titulo', 'title']) ?? ''
    // Require at least a name to render
    if (!nome) return null

    const preco = pickNumberOrString(r, ['preco', 'price', 'valor'])
    const descricao = pickString(r, ['descricao', 'description'])
    const descricao_en = pickString(r, ['descricao_en', 'description_en', 'descriptionEn'])
    const promo_description = pickString(r, ['promo_description', 'promoDescription', 'promotion', 'promo'])
    const is_pintxo = pickBool(r, ['is_pintxo', 'isPintxo', 'pintxo'])
    const is_vegan = pickBool(r, ['is_vegan', 'isVegan', 'vegan'])
    const is_vegetariano = pickBool(r, ['is_vegetariano', 'isVegetariano', 'vegetarian', 'isVegetarian'])

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
    }
}

async function fetchPratos(): Promise<Prato[]> {
    const res = await fetch('https://isca-omega.vercel.app/api/pratos', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
        // Surface server error as empty list (UI shows “No items yet.”)
        return []
    }
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

/* -------------------- UI -------------------- */
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
                <span className="font-burns-ultra text-xl leading-tight">{item.nome}</span>
                <span className="font-burns-ultra text-xl leading-tight">{precoText}</span>
            </div>

            {(descricao || isVeganVegetariano) && (
                <p className="mt-1 font-poppins text-base leading-snug">
                    {descricao}
                    {isVeganVegetariano && (
                        <span className="ml-2 font-cirrus text-base">{veganLabel}</span>
                    )}
                </p>
            )}

            {item.promo_description && item.promo_description.trim().length > 0 && (
                <p className="mt-1 font-burns-ultra text-base leading-tight">
                    [{item.promo_description}]
                </p>
            )}
        </li>
    )
}

export default async function CardapioPage({ params }: CardapioPageProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    const pratos = await fetchPratos()

    const pintxos = pratos.filter(p => Boolean(p.is_pintxo))
    const outros = pratos.filter(p => !Boolean(p.is_pintxo))

    const labelPintxos = 'Pintxos'
    const labelOutros = safeLocale === 'en' ? 'Other' : 'Outros'

    return (
        <div className="container mx-auto max-w-3xl p-6">
            {/* Pintxos */}
            <section className="mb-10">
                <h2 className="font-burns-ultra text-isca-verde text-3xl underline">{labelPintxos}</h2>
                <ul className="mt-4 divide-y divide-current/20">
                    {pintxos.length > 0 ? (
                        pintxos.map(item => (
                            <ItemRow key={item.id ?? `${item.nome}-${item.preco}`} item={item} locale={safeLocale} />
                        ))
                    ) : (
                        <li className="py-3 font-poppins">
                            {safeLocale === 'en' ? 'No items yet.' : 'Sem itens por enquanto.'}
                        </li>
                    )}
                </ul>
            </section>

            {/* Outros / Other */}
            <section>
                <h2 className="font-burns-ultra text-3xl text-isca-verde underline">{labelOutros}</h2>
                <ul className="mt-4 divide-y divide-current/20">
                    {outros.length > 0 ? (
                        outros.map(item => (
                            <ItemRow key={item.id ?? `${item.nome}-${item.preco}`} item={item} locale={safeLocale} />
                        ))
                    ) : (
                        <li className="py-3 font-poppins">
                            {safeLocale === 'en' ? 'No items yet.' : 'Sem itens por enquanto.'}
                        </li>
                    )}
                </ul>
            </section>
        </div>
    )
}
