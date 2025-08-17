import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

export default async function HomePage({ params }: { params: { locale: Locale } }) {
    const locale = locales.includes(params.locale) ? params.locale : 'pt'
    const t = await getMessages(locale)

    return (
        <section className="text-center py-16">
            <h1 className="text-4xl font-display tracking-tightest mb-4">{t.hero.title}</h1>
            <p className="text-lg max-w-2xl mx-auto mb-6">{t.hero.subtitle}</p>
            <a
                href={`/${locale}/reservas`}
                className="btn"
            >
                {t.hero.cta}
            </a>
        </section>
    )
}
