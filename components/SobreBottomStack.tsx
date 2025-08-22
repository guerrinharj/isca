'use client'

import BigMark from './BigMark'
import InfoText from './InfoText'

export default function SobreBottomStack({ locale }: { locale: 'pt' | 'en' }) {
    // mobile-only stack; desktop uses the layout-fixed versions
    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <div className="flex flex-col items-start gap-2">
                <BigMark locale={locale} inline />
                <InfoText locale={locale} inline />
            </div>
        </div>
    )
}
