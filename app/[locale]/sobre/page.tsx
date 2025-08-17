import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

export default async function SobrePage({ params }: { params: { locale: Locale } }) {
    const locale = locales.includes(params.locale) ? params.locale : 'pt'
    const t = await getMessages(locale)

    return (
        <section className="py-8">
            <h1 className="text-3xl font-display tracking-tightest mb-6">{t.nav.sobre}</h1>
            <p className="opacity-90 max-w-2xl">
                {locale === 'pt'
                    ? 'O Isca é um bar de pintxos com foco em ingredientes frescos e atmosfera acolhedora.'
                    : 'Isca is a pintxos bar focused on fresh ingredients and a cozy atmosphere.'}
            </p>
        </section>
    )
}
