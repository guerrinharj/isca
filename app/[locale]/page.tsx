import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'

type HomePageProps = {
    params: Promise<{ locale: Locale }>
}

export default async function HomePage({ params }: HomePageProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    return (
    <div></div>
    )
}
