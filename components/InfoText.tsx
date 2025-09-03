'use client'

type InfoTextProps = {
    locale: 'pt' | 'en'
    className?: string
}

export default function InfoText({ locale, className = '' }: InfoTextProps) {
    return (
        <div className={`font-burns-ultra text-sm leading-relaxed ${className}`}>
            {locale === 'en' ? (
                <>
                    <p>
                        Wednesday - Saturday:{' '}
                        <span className="poppins-regular">5:30PM - 00:30AM</span>
                    </p>
                    <p>
                        Sunday:{' '}
                        <span className="poppins-regular">12:00PM - 10:00PM</span>
                    </p>
                    <p>Rua do Russel, 724 - <span className="poppins-regular">Rio de Janeiro</span></p>
                </>
            ) : (
                <>
                    <p>
                        Quarta - Sábado:{' '}
                        <span className="poppins-regular">17h30 às 00h30</span>
                    </p>
                    <p>
                        Domingo:{' '}
                        <span className="poppins-regular">12h às 22h</span>
                    </p>
                    <div className="mt-5">
                        <p className="underline">Rua do Russel, 724</p>
                        <p className="poppins-regular">Rio de Janeiro, Brasil</p>
                    </div>
                </>
            )}
        </div>
    )
}
