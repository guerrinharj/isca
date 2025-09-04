// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'isca | pintxos + bar',
    description: 'isca | pintxos + bar',
    icons: {
        icon: '/favisca3.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt">
            <body className="font-sans relative min-h-screen animate-fadeIn">
                {children}
            </body>
        </html>
    )
}
