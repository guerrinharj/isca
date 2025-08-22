// app/layout.tsx
import './globals.css'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt">
            <body className="bg-isca-creme font-sans relative min-h-screen">
                {children}
            </body>
        </html>
    )
}
