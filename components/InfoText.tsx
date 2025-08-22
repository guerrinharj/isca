'use client'

import { usePathname } from 'next/navigation'

type InfoTextProps = {
    locale: 'pt' | 'en'
}

export default function InfoText({ locale }: InfoTextProps) {
    const pathname = usePathname()

    // hide on mobile for /cardapio or /reservas
    const hideOnMobile =
        pathname?.startsWith(`/${locale}/cardapio`) ||
        pathname?.startsWith(`/${locale}/reservas`)

    return (
        <div
            className={[
                'fixed bottom-4 right-4 z-30',
                'font-burns-ultra text-sm leading-relaxed text-isca-verde',
                hideOnMobile ? 'hidden md:block' : 'block'
            ].join(' ')}
        >
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
}
