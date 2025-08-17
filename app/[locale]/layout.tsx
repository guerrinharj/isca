import '../globals.css'
import Link from 'next/link'
import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import LocaleSwitcher from '../../components/locale-switcher'

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { locale: Locale }
}) {
    const locale = locales.includes(params.locale) ? params.locale : 'pt'
    const t = await getMessages(locale)

    return (
        <html lang={locale}>
            <body className="bg-isca-preto text-isca-creme font-sans">
                <header className="bg-isca-verde text-isca-creme">
                    <div className="container flex items-center justify-between py-4">
                        <Link
                            href={`/${locale}`}
                            className="text-2xl font-display tracking-tightest"
                        >
                            Isca
                        </Link>
                        <nav className="flex items-center gap-6">
                            <Link href={`/${locale}`} className="hover:text-isca-laranja transition-colors">
                                {t.nav.home}
                            </Link>
                            <Link href={`/${locale}/cardapio`} className="hover:text-isca-laranja transition-colors">
                                {t.nav.menu}
                            </Link>
                            <Link href={`/${locale}/reservas`} className="hover:text-isca-laranja transition-colors">
                                {t.nav.reservas}
                            </Link>
                            <Link href={`/${locale}/sobre`} className="hover:text-isca-laranja transition-colors">
                                {t.nav.sobre}
                            </Link>
                            <LocaleSwitcher current={locale} />
                        </nav>
                    </div>
                </header>

                <main className="container py-8">{children}</main>

                <footer className="bg-isca-verde text-isca-creme mt-12">
                    <div className="container py-6 text-sm flex justify-between items-center">
                        <span>&copy; {new Date().getFullYear()} Isca</span>
                        <span>{t.footer.rights}</span>
                    </div>
                </footer>
            </body>
        </html>
    )
}
