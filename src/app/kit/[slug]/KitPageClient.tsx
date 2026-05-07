'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Layers, ShoppingCart, Package } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

type KitItem = {
  quantity: number
  product: { id: string; name: string; images: string[] }
}

type KitData = {
  id: string; name: string; slug: string; sku: string | null
  description: string | null; images: string[]
  price: number; pricePublic: number
  items: KitItem[]
}

export default function KitPageClient({ kit, isPro }: { kit: KitData; isPro: boolean }) {
  const [activeImg, setActiveImg] = useState(0)
  const addItem = useCartStore(s => s.addItem)

  const handleAddToCart = () => {
    addItem({
      productId: kit.id,
      name: kit.name,
      price: kit.price,
      image: kit.images[0] ?? '',
      variantLabel: 'Kit',
    })
  }

  const displayImages = kit.images.length > 0 ? kit.images : []

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* Image gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ aspectRatio: '1', background: 'var(--cream)', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
            {displayImages[activeImg] ? (
              <Image src={displayImages[activeImg]} alt={kit.name} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Layers size={64} style={{ color: 'var(--border)' }} />
              </div>
            )}
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#7c3aed', color: '#fff', fontSize: '0.6rem', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Kit
            </div>
          </div>
          {displayImages.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {displayImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{ width: 64, height: 64, borderRadius: '10px', overflow: 'hidden', border: `2px solid ${activeImg === i ? '#7c3aed' : 'var(--border)'}`, background: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
                  <Image src={img} alt="" fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Layers size={14} style={{ color: '#7c3aed' }} />
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 700 }}>Kit de Produtos</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--navy)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {kit.name}
            </h1>
            {kit.sku && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SKU: {kit.sku}</p>
            )}
          </div>

          {/* Price */}
          <div>
            {isPro && kit.pricePublic !== kit.price ? (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  R$ {kit.pricePublic.toFixed(2).replace('.', ',')}
                </p>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.2rem', fontWeight: 400, color: 'var(--navy)' }}>
                  R$ {kit.price.toFixed(2).replace('.', ',')}
                  <span style={{ fontSize: '0.75rem', color: '#7c3aed', marginLeft: '0.5rem', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Preço Pro</span>
                </p>
              </>
            ) : (
              <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.2rem', fontWeight: 400, color: 'var(--navy)' }}>
                R$ {kit.price.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          {/* Description */}
          {kit.description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {kit.description}
            </p>
          )}

          {/* Add to cart */}
          <button onClick={handleAddToCart}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '1rem 2rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'opacity 0.15s' }}>
            <ShoppingCart size={16} /> Adicionar Kit ao Carrinho
          </button>

          {/* Components */}
          <div style={{ background: 'var(--cream)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Package size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                O Kit Inclui ({kit.items.length} {kit.items.length === 1 ? 'produto' : 'produtos'})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {kit.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, background: '#fff', borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    {item.product.images[0] ? (
                      <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Package size={16} style={{ color: 'var(--border)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>{item.product.name}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#fff', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '99px', fontWeight: 500 }}>
                    ×{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
