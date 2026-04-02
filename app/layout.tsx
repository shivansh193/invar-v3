import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'INVARIANT | Autonomous Security Intelligence',
  description: 'Invariant logs into your product and explores it like a real attacker — not a script.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}