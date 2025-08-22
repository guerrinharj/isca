import '../globals.css'
import NavBar from '../../components/NavBar'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import BigMark from '../../components/BigMark'

type LayoutProps = {
    children: React.ReactNode
    params: Promise<{ locale: Locale }>
}

export default async function RootLayout({ children, params }: LayoutProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    return (
        <html lang={safeLocale}>
            <body className="bg-isca-creme font-sans relative min-h-screen">
                <aside
                    className="
                        fixed top-0 right-0 z-20
                        flex
                        items-start
                        p-4
                        md:h-full md:items-center md:p-0
                    "
                >
                    <NavBar t={t} locale={safeLocale} />
                </aside>

                <main className="py-8">{children}</main>

                {/* Client Component handles hiding logic */}
                <BigMark locale={safeLocale} />
            </body>
        </html>
    )
}
