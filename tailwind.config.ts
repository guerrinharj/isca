import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                isca: {
                    verde: '#104730',
                    laranja: '#ff7e45',
                    azul: '#3b429f',
                    verdeClaro: '#73a580',
                    preto: '#1e1e1e',
                    creme: '#ffeecf',
                },
            },
            fontFamily: {
                display: ['"TWKBurnsUltra"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            letterSpacing: {
                tightest: '-.03em',
                tighter: '-.02em',
            },
            borderRadius: {
                xl: '0.75rem',
                '2xl': '1rem',
            },
            boxShadow: {
                soft: '0 4px 24px rgba(0,0,0,0.12)',
            },
            container: {
                center: true,
                padding: '1rem',
                screens: {
                    '2xl': '1200px',
                },
            },
        },
    },
    plugins: [],
}
export default config

