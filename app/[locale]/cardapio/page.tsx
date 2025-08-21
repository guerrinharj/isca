// app/[locale]/cardapio/page.tsx
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic' // no cache while debugging

type CardapioPageProps = {
    // Your route is emitting Promise-based dynamic params
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

type ApiResponse = Prato[] | { data: Prato[] }

async function fetchPratos(): Promise<Prato[]> {
    const res = await fetch('https://isca-omega.vercel.app/api/pratos', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Failed to load pratos (${res.status})`)

    const json: ApiResponse = await res.json()
    const items = Array.isArray(json) ? json : json?.data
    return Array.isArray(items) ? items : []
}

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
        <li className="py-3">
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
    // ✅ Await the promise-based params (no `any`, no helper)
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    let pratos: Prato[] = []
    try {
        pratos = await fetchPratos()
        console.log('Loaded pratos:', pratos.length) // server logs
    } catch (err) {
        console.error('Cardápio fetch error:', err)
        return (
            <div className="p-6">
                <h1 className="font-burns-ultra text-2xl underline">Cardápio</h1>
                <p className="mt-4 font-poppins">
                    {safeLocale === 'en'
                        ? 'Unable to load the menu right now.'
                        : 'Não foi possível carregar o cardápio agora.'}
                </p>
            </div>
        )
    }

    const pintxos = pratos.filter(p => Boolean(p.is_pintxo))
    const outros = pratos.filter(p => !Boolean(p.is_pintxo))

    const labelPintxos = safeLocale === 'en' ? 'Pintxos' : 'Pintxos'
    const labelOutros = safeLocale === 'en' ? 'Other' : 'Outros'

    return (
        <div className="container mx-auto max-w-3xl p-6">
            {/* Pintxos */}
            <section className="mb-10">
                <h2 className="font-burns-ultra text-3xl underline">{labelPintxos}</h2>
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
                <h2 className="font-burns-ultra text-3xl underline">{labelOutros}</h2>
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
