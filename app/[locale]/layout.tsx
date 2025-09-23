// app/[locale]/layout.tsx
import '../globals.css'
import NavBar from '../../components/NavBar'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import BigMark from '../../components/BigMark'
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

            {/* Add bottom padding so content doesn't sit under the fixed palette+footer */}
            <main className="py-8 md:py-0 pb-40 md:pb-48 lg:pb-56 animate-fadeIn">
                <div className="mx-auto w-full px-4 md:max-w-[480px] lg:max-w-none lg:px-8">
                    {children}
                </div>
            </main>

            {/* Overlay scribble canvas (footer/palette sit above via z-index) */}
            <ScribbleCanvas />

            {/* === FIXED BOTTOM WRAPPER: Palette (on top) + Footer (below) === */}
            <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
                {/* Palette row (centered, full width, auto height) */}
                <div className="mx-auto w-full max-w-3xl px-3 mb-3 pointer-events-auto">
                    <div className="w-full flex justify-center">
                        <ScribblePalette />
                    </div>
                </div>

                {/* Footer bar */}
                <footer
                    className="
                        bg-theme
                        py-2 px-3
                        md:py-6 md:px-4
                        lg:py-2
                        pointer-events-auto
                    "
                >
                    <div
                        className="
                            border-t-[0.1px]
                            mx-auto w-full flex items-center
                            justify-center
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
                </footer>
            </div>

            {/* Theme switcher fixed bottom-right (above footer) */}
            <div
                className="
                    fixed bottom-3 right-3 z-50
                    scale-75 md:scale-90
                "
            >
                <ThemeSwitcher />
            </div>
        </>
    )
}
