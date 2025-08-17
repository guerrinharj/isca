import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

export default async function CardapioPage({ params }: { params: { locale: Locale } }) {
    const locale = locales.includes(params.locale) ? params.locale : 'pt'
    const t = await getMessages(locale)

    return (
        <section className="py-8">
            <h1 className="text-3xl font-display tracking-tightest mb-6">{t.nav.menu}</h1>
            <div className="card">Cardápio virá do banco (placeholder)</div>
        </section>
    )
}
