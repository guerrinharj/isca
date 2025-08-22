'use client'

import { usePathname } from 'next/navigation'

type InfoTextProps = {
    locale: 'pt' | 'en'
    inline?: boolean
}

export default function InfoText({ locale, inline = false }: InfoTextProps) {
    const pathname = usePathname()

    const isAbout = pathname === `/${locale}/sobre`

    // Hide on mobile for /cardapio, /reservas, and /about — only when NOT inline
    const hideOnMobileFixed =
        !inline &&
        (
            pathname?.startsWith(`/${locale}/cardapio`) ||
            pathname?.startsWith(`/${locale}/reservas`) ||
            isAbout
        )

    const textBlock = (
        <div className="font-burns-ultra text-sm leading-relaxed text-isca-verde">
            {locale === 'en' ? (
                <>
                    <p>
                        Wednesday - Saturday:{' '}
                        <span className="text-isca-laranja">5:30PM - 00:30AM</span>
                    </p>
                    <p>
                        Sunday:{' '}
                        <span className="text-isca-laranja">12:00PM - 10:00PM</span>
                    </p>
                    <p>Rua do Russel, 724 - loja A - Glória - Rio de Janeiro</p>
                </>
            ) : (
                <>
                    <p>
                        Quarta - Sábado:{' '}
                        <span className="text-isca-laranja">17h30 às 00h30</span>
                    </p>
                    <p>
                        Domingo:{' '}
                        <span className="text-isca-laranja">12h às 22h</span>
                    </p>
                    <p>Rua do Russel, 724 - loja A - Glória - Rio de Janeiro</p>
                </>
            )}
        </div>
    )

    if (inline) {
        // unpositioned, for stacking
        return textBlock
    }

    // default: fixed instance controlled by layout
    return (
        <div
            className={[
                'fixed bottom-4 right-4 z-30',
                hideOnMobileFixed ? 'hidden md:block' : 'block'
            ].join(' ')}
        >
            {textBlock}
        </div>
    )
}
