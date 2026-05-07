'use client'
import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cartStore'

// Inner component that watches session changes
function CartSessionGuard() {
  const { data: session } = useSession()
  const clearCart = useCartStore(s => s.clearCart)
  const prevUidRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const uid = (session?.user as any)?.id ?? null
    // undefined = first render (not yet resolved), skip
    if (prevUidRef.current === undefined) {
      prevUidRef.current = uid
      return
    }
    // If session user changed (including logout → null), clear cart
    if (prevUidRef.current !== uid) {
      clearCart()
      prevUidRef.current = uid
    }
  }, [session, clearCart])

  return null
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSessionGuard />
      {children}
    </SessionProvider>
  )
}
