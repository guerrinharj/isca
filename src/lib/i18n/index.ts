import { isLocale, type Locale, defaultLocale } from './locales'

export type Messages = Awaited<ReturnType<typeof getMessages>>

const cache = new Map<string, any>()

export async function getMessages(locale: string) {
    const key = isLocale(locale) ? locale : defaultLocale
    if (cache.has(key)) {
        return cache.get(key)
    }
    const dict =
        key === 'pt'
            ? (await import('./messages/pt')).default
            : (await import('./messages/en')).default
    cache.set(key, dict)
    return dict
}

/** Helpers opcionais de formatação local */
export function formatCurrency(value: number, locale: Locale = 'pt', currency: 'BRL' | 'USD' = 'BRL') {
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value)
}

export function formatDateTime(date: Date | string, locale: Locale = 'pt') {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(d)
}
