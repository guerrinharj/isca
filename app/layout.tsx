// app/layout.tsx
import './globals.css'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt">
            <body className="font-sans relative min-h-screen  animate-fadeIn">
                {children}
            </body>
        </html>
    )
}
