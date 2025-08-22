import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import SobreBottomStack from '../../../components/SobreBottomStack'


type SobrePageProps = {
    params: Promise<{ locale: Locale }>
}

export default async function SobrePage({ params }: SobrePageProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    return (
        <div>
        <section className="py-8">
            <h1 className="text-3xl font-display tracking-tightest mb-6">{t.nav.sobre}</h1>
            <p className="opacity-90 max-w-2xl">
                {safeLocale === 'pt'
                    ? 'O Isca é um bar de pintxos com foco em ingredientes frescos e uma atmosfera acolhedora.'
                    : 'Isca is a pintxos bar focused on fresh ingredients and a cozy atmosphere.'}
            </p>
        </section>
        <SobreBottomStack locale={locale} />
        </div>
    )
}
