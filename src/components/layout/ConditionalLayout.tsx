'use client'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import CartDrawer from '../cart/CartDrawer'
import AuthProvider from '../providers/SessionProvider'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <AuthProvider>
      {!isAdmin && <Header />}
      <main style={{ paddingTop: isAdmin ? 0 : '96px' }}>
        {children}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <CartDrawer />}
    </AuthProvider>
  )
}
