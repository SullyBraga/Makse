import type { Metadata } from 'next'
import './globals.css'
import ScrollReveal from '@/components/ScrollReveal'
import SmoothScroll from '@/components/SmoothScroll'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { Cormorant_Garamond, DM_Sans, Playfair_Display } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Makse Profissional | Cosméticos Capilares',
  description: 'Fórmulas exclusivas desenvolvidas para profissionais que exigem performance e clientes que buscam transformação real.',
  openGraph: {
    title: 'Makse Profissional',
    description: 'Beleza que se sente no toque.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${dmSans.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning>
        <SmoothScroll />
        <ScrollReveal />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  )
}