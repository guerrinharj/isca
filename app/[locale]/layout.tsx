import '../globals.css'
import NavBar from '../../components/NavBar'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import BigMark from '../../components/BigMark'
import InfoText from '../../components/InfoText'

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
                        flex items-start p-4
                        md:h-full md:items-center md:p-0
                    "
                >
                    <NavBar t={t} locale={safeLocale} />
                </aside>

                <main className="py-8">
                    <div className="mx-auto w-full px-4 md:max-w-[500px] lg:max-w-none lg:px-8">
                        {children}
                    </div>
                </main>

                {/* Mobile (<md): disabled */}
                <div className="hidden md:hidden">
                    {/* nothing will render here */}
                </div>

                {/* Tablet (md to <lg): fixed footer wrapper with horizontal flex */}
                <footer
                    className="
                        hidden md:flex lg:hidden
                        fixed bottom-0 left-0 right-0 z-30
                        bg-isca-creme border-t-2 border-isca-laranja
                        py-6 px-4
                    "
                >
                    <div className="mx-auto w-full flex justify-between items-center">
                        <BigMark locale={safeLocale} className="text-[8vw] md:w-auto" />
                        <InfoText locale={safeLocale as 'pt' | 'en'} className="text-right" />
                    </div>
                </footer>

                {/* Desktop (lg+): fixed corners */}
                <div className="hidden lg:block">
                    <div className="fixed bottom-4 left-4 z-40">
                        <BigMark locale={safeLocale} />
                    </div>
                    <div className="fixed bottom-4 right-4 z-30">
                        <InfoText locale={safeLocale as 'pt' | 'en'} />
                    </div>
                </div>
            </body>
        </html>
    )
}
