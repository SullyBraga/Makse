'use client'
import { Layers, Plus, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'

type KitItem = {
  id: string
  product: { id: string; name: string; sku: string | null; images: string[]; price: number; pricePro: number | null }
  quantity: number
}

type Kit = {
  id: string; name: string; sku: string | null; description: string | null
  price: number; pricePro: number | null; priceVendedor: number | null; images: string[]
  items: KitItem[]
}

type Props = {
  kits: Kit[]
  isPro: boolean
  discountPct: number
}

export default function KitSuggestions({ kits, isPro, discountPct }: Props) {
  const { addItem } = useCartStore()

  const getKitPrice = (kit: Kit) => {
    const base = isPro ? (kit.pricePro ?? kit.price) : kit.price
    return isPro && discountPct > 0 ? base * (1 - discountPct / 100) : base
  }

  const addKitToCart = (kit: Kit) => {
    // Add each component product to the cart
    for (const item of kit.items) {
      const price = isPro ? (item.product.pricePro ?? item.product.price) : item.product.price
      const discounted = isPro && discountPct > 0 ? price * (1 - discountPct / 100) : price
      for (let q = 0; q < item.quantity; q++) {
        addItem({
          id: item.product.id,
          productId: item.product.id,
          name: item.product.name,
          price: discounted,
          image: item.product.images[0] || '',
          proOnly: false,
        })
      }
    }
  }

  return (
    <div style={{ marginTop: 'clamp(2.5rem,6vw,5rem)' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
          Compre Junto
        </span>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>
          Kits Sugeridos
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {kits.map(kit => {
          const price = getKitPrice(kit)
          const originalPrice = isPro ? (kit.pricePro ?? kit.price) : kit.price
          const hasDiscount = isPro && discountPct > 0

          return (
            <div key={kit.id} style={{ background: '#fff', borderRadius: '20px', border: '1px solid var(--cream)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Kit header */}
              <div style={{ padding: '1.25rem 1.25rem 0.875rem', borderBottom: '1px solid var(--cream)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Layers size={14} style={{ color: 'var(--gold)' }} />
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>Kit</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.15rem', fontWeight: 400, color: 'var(--navy)', margin: '0 0 0.25rem' }}>{kit.name}</h3>
                {kit.description && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {kit.description}
                  </p>
                )}
              </div>

              {/* Products list */}
              <div style={{ padding: '0.875rem 1.25rem', flex: 1 }}>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.625rem' }}>
                  Inclui {kit.items.length} produto(s)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {kit.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 36, height: 36, background: 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        {item.product.images[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--navy)', fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.quantity > 1 && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{item.quantity}× </span>}
                          {item.product.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price + CTA */}
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  {hasDiscount && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through', margin: 0 }}>
                      R$ {originalPrice.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 400, color: hasDiscount ? '#16a34a' : 'var(--navy)', margin: 0 }}>
                    R$ {price.toFixed(2).replace('.', ',')}
                  </p>
                  {hasDiscount && (
                    <p style={{ fontSize: '0.65rem', color: '#16a34a', margin: 0 }}>{discountPct}% de desconto</p>
                  )}
                </div>
                <button
                  onClick={() => addKitToCart(kit)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <ShoppingBag size={13} /> Adicionar Kit
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
