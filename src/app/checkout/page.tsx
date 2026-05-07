'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/store/cartStore'
import { ShoppingBag, Lock, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { items, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const role = (session?.user as any)?.role
  const discountPct: number = (session?.user as any)?.discountPct ?? 0
  const isPro = role === 'CABELEIREIRA' && discountPct > 0
  const discountedTotal = isPro ? total() * (1 - discountPct / 100) : total()

  // VENDEDOR should not be here — redirect to /admin/vendas
  useEffect(() => {
    if (role === 'VENDEDOR') {
      window.location.href = '/admin/vendas'
    }
  }, [role])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <RefreshCw size={28} style={{ color: 'var(--gold)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ maxWidth: '480px', margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <Lock size={40} style={{ color: 'var(--gold)', margin: '0 auto 1.5rem', display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.75rem' }}>
          Entre para continuar
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Você precisa estar logado para finalizar a compra.
        </p>
        <Link href="/login?redirect=/checkout" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Entrar <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '480px', margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <ShoppingBag size={40} style={{ color: 'var(--cream-dark)', margin: '0 auto 1.5rem', display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.75rem' }}>
          Carrinho vazio
        </h1>
        <Link href="/catalogo" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Ver Catálogo <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar pagamento')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 400, color: 'var(--navy)', marginBottom: '2rem' }}>
        Finalizar Compra
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

        {/* Order summary */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>
            Resumo do Pedido
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map(item => {
              const itemPrice = isPro ? item.price * (1 - discountPct / 100) : item.price
              return (
                <div key={`${item.productId}-${item.variantId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 56, height: 56, background: 'var(--cream)', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    {item.image ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)' }}>{item.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variantLabel} · Qtd: {item.quantity}</p>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                    R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--navy)' }}>R$ {total().toFixed(2).replace('.', ',')}</span>
            </div>
            {isPro && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>Desconto pro ({discountPct}%)</span>
                <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>
                  -R$ {(total() - discountedTotal).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--cream-dark)', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--navy)' }}>
                R$ {discountedTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button onClick={handleCheckout} disabled={loading}
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, background: '#009EE3' }}>
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Aguarde...</>
              : <>Pagar com Mercado Pago <ArrowRight size={14} /></>
            }
          </button>

          <Link href="/catalogo" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none' }}>
            ← Continuar comprando
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 380px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
