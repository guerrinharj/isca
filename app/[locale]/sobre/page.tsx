import { getMessages } from '@/lib/i18n'
import { locales, type Locale } from '@/lib/i18n/locales'
import InfoText from '../../../components/InfoText'

type SobrePageProps = {
    params: Promise<{ locale: Locale }>
}

export default async function SobrePage({ params }: SobrePageProps) {
    const { locale } = await params
    const safeLocale = locales.includes(locale) ? locale : 'pt'
    const t = await getMessages(safeLocale)

    return (
        <>
            <style>{`
                @keyframes fadeInUpMini {
                    from { opacity: 0; transform: translateY(2px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div>
                <section
                    className="py-20 text-isca-verde will-change-[opacity,transform]"
                    style={{ animation: 'fadeInUpMini 220ms ease-out both' }}
                >
                    <div className="relative max-w-2xl mx-auto">
                        <h1
                            className="hidden md:block absolute md:-top-[40px] right-[32px] font-cirrus text-isca-verde -rotate-12 text-4xl lg:text-5xl font-display tracking-tightest"
                        >
                            {t.nav.sobre}
                        </h1>

                        {safeLocale === 'pt' ? (
                            <>
                                <div className="text-lg md:pt-12">
                                    <p className="text-left opacity-90 mb-4">
                                        O Isca é um bar de pintxos com foco em ingredientes frescos e uma atmosfera acolhedora.
                                    </p>
                                    <p className="text-left opacity-90">
                                        Desde os tempos do Comuna, a trajetória de Tatiana Fernandes e Gabriel Cabral reflete um
                                        movimento de abrir e fechar ciclos. O Isca nasce dessa experiência: um espaço que
                                        carrega memória, mas se reinventa no presente. Mais do que reproduzir tradições do País
                                        Basco, o bar se propõe a experimentar — como quem testa, erra, acerta e segue adiante.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-left opacity-90 mb-4">
                                    Isca is a pintxos bar focused on fresh ingredients and a cozy atmosphere.
                                </p>
                                <p className="text-left opacity-90">
                                    Since the days of Comuna, the path of Tatiana Fernandes and Gabriel Cabral has been one of
                                    cycles opening and closing. Isca emerges from that experience: a place that carries memory
                                    yet reinvents itself in the present. More than recreating Basque traditions, it invites
                                    experimentation — testing, failing, creating, and moving forward.
                                </p>
                            </>
                        )}
                    </div>

                    <InfoText
                        locale={safeLocale as 'pt' | 'en'}
                        className="
                            hidden
                            md:block
                            text-right
                            text-[0.7rem]
                            md:text-sm
                            lg:text-base
                        "
                    />
                </section>
            </div>
        </>
    )
}
