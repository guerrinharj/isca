import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

type CardapioPageProps = {
    params: Promise<{ locale: Locale }>
}

export default async function CardapioPage({ params }: CardapioPageProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    return (
        <section className="py-8">
            <h1 className="text-3xl font-display tracking-tightest mb-6">
                {t.nav.menu}
            </h1>
            <div className="card">Cardápio virá do banco (placeholder)</div>
        </section>
    )
}
