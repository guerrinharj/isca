import '../globals.css'
import NavBar from '../../components/NavBar'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import BigMark from '../../components/BigMark'
import InfoText from '../../components/InfoText'
import { ScribbleCanvas, ScribblePalette } from '../../components/Scribble'

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
                    <div className="mx-auto w-full px-4 md:max-w-[480px] lg:max-w-none lg:px-8">
                        {children}
                    </div>
                </main>

                {/* Overlay canvas (draw everywhere except NavBar/Footer which sit above it) */}
                <ScribbleCanvas />

                {/* Unified footer across breakpoints */}
                <footer
                    className="
                        fixed bottom-0 left-0 right-0 z-30
                        bg-isca-creme border-t-2 border-isca-laranja
                        py-2 px-3
                        md:py-6 md:px-4
                        lg:py-2
                    "
                >
                    <div className="mx-auto w-full flex justify-between items-center">
                        <BigMark
                            locale={safeLocale}
                            className="
                                text-5xl leading-none
                                md:text-[8vw]
                                lg:text-[5vw]
                                w-auto
                            "
                        />

                        {/* Palette centered: use a flex spacer technique */}
                        <div className="flex-1 flex justify-center">
                            <div className="hidden md:block"><ScribblePalette /></div>
                        </div>

                        <InfoText
                            locale={safeLocale as 'pt' | 'en'}
                            className="
                                text-right
                                text-[0.7rem]
                                md:text-sm
                                lg:text-base
                            "
                        />
                    </div>
                </footer>
            </body>
        </html>
    )
}
