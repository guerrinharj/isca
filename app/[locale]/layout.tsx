// app/[locale]/layout.tsx
import '../globals.css'
import NavBar from '../../components/NavBar'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import BigMark from '../../components/BigMark'
import InfoText from '../../components/InfoText'
import ThemeSwitcher from '../../components/ThemeSwitcher'
import { ScribbleCanvas, ScribblePalette } from '../../components/Scribble'

type LayoutProps = {
    children: React.ReactNode
    params: Promise<{ locale: Locale }>
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    return (
        <>
            <aside
                className="
                    fixed top-0 right-0 z-20
                    flex items-start p-4
                    md:h-full md:items-center md:p-0
                "
            >
                <NavBar t={t} locale={safeLocale} />
            </aside>

            <main className="py-8 md:py-0 animate-fadeIn">
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
                    py-2 px-3
                    md:py-6 md:px-4
                    lg:py-2
                "
            >

                {/* Palette mobile floating, fixed above footer */}
                <div
                    className="
                        fixed bottom-20 md:bottom-22 lg:bottom-25 left-1/2 -translate-x-1/2
                        z-40 flex justify-center
                        transform-gpu origin-bottom
                        scale-[0.8] md:scale-[0.85] lg:scale-[0.9]
                    "
                >
                    <ScribblePalette />
                </div>


                <div
                    className="
                        mx-auto w-full flex items-center
                        justify-center
                        border-t-1 border-isca-verde
                        pt-2
                    "
                >
                <BigMark
                    locale={safeLocale}
                    className="
                        text-5xl leading-none
                        md:text-[6vw]
                        lg:text-[5vw]
                        w-auto
                        transform translate-y-[2px]
                    "
                />
                </div>

                {/* Theme switcher row */}
                <div className="mx-auto w-full max-w-5xl flex items-center justify-center mb-2 md:mb-3">
                    <ThemeSwitcher />
                </div>
            </footer>
        </>
    )
}
