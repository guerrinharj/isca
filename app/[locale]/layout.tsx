import '../globals.css'
import NavBar from '../../components/NavBar'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import Link from 'next/link'

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
                {/* Right-side vertical NavBar */}
                {/* NavBar wrapper */}
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


                {/* Page content (add right margin so it doesn’t sit under the NavBar) */}
                <main className="py-8">
                    {children}
                </main>

        {/* Big 'isca' mark */}
        <Link
            href={`/${safeLocale}`}
            className="
                fixed bottom-4 left-4
                font-burns-ultra leading-none
                text-isca-verde
                text-[20vw] md:text-[15vw] 
                w-[95%] md:w-[60%]
                !text-isca-verde hover:!text-isca-verde
                z-40
            "
        >
            isca
        </Link>
            </body>
        </html>
    )
}
