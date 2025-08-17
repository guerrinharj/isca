import { isLocale, defaultLocale, type Locale } from './locales'

// Os dois arquivos têm o mesmo shape; usamos o de PT como referência de tipo.
export type Messages = typeof import('./messages/pt').default

const cache = new Map<Locale, Messages>()

export async function getMessages(locale: string): Promise<Messages> {
    const key: Locale = isLocale(locale) ? locale : defaultLocale

    const cached = cache.get(key)
    if (cached) return cached

    const dict: Messages =
        key === 'pt'
            ? (await import('./messages/pt')).default
            : (await import('./messages/en')).default

    cache.set(key, dict)
    return dict
}

export function formatCurrencyBRL(value: number, locale: Locale = 'pt'): string {
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}
