'use client'
import { useState, useRef, useCallback } from 'react'
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

type Variant = { id: string; label: string; price: number; pricePro: number | null; priceVendedor: number | null; stock: number }

type Props = {
  product: { id: string; name: string; slug: string; proOnly: boolean }
  variants: Variant[]
  basePrice: number
  discountPct: number
  isPro?: boolean
}

type Particle = { id: number; dx: string; dy: string; color: string; size: number }

const PARTICLE_COLORS = ['#64748b', '#1e293b', '#94a3b8', '#fff', '#e2e8f0', '#475569']

export default function ProductActions({ product, variants, basePrice, discountPct, isPro = false }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants[0] ?? null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [cep, setCep] = useState('')
  const [shipping, setShipping] = useState<string | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const addItem = useCartStore(s => s.addItem)

  // Pick the right price based on user role
  const getRolePrice = (v: Variant | null) => {
    if (!v) return basePrice
    if (isPro && v.pricePro != null) return v.pricePro
    return v.price
  }

  const price = getRolePrice(selectedVariant)
  const discounted = discountPct > 0 ? price * (1 - discountPct / 100) : price
  const originalClientPrice = selectedVariant?.price ?? basePrice
  const outOfStock = selectedVariant ? selectedVariant.stock === 0 : false

  const burst = useCallback(() => {
    const colors = ['#64748b', '#e2e8f0', '#94a3b8', '#fff', '#475569']
    const newParticles: Particle[] = Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * 360 + Math.random() * 20
      const dist = 32 + Math.random() * 20
      const rad = (angle * Math.PI) / 180
      return {
        id: Date.now() + i,
        dx: `${Math.cos(rad) * dist}px`,
        dy: `${Math.sin(rad) * dist}px`,
        color: colors[i % colors.length],
        size: 5 + Math.round(Math.random() * 4),
      }
    })
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 800)
  }, [])

  const handleAdd = useCallback(() => {
    if (outOfStock || added) return
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        variantLabel: selectedVariant?.label,
        price: discounted,
        image: '',
      })
    }
    burst()
    setAdded(true)
    setTimeout(() => setAdded(false), 2800)
  }, [outOfStock, added, qty, addItem, product, selectedVariant, discounted, burst])

  const calcShipping = async () => {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    setCalcLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setShipping('Frete Grátis · Entrega em 3–7 dias úteis')
    setCalcLoading(false)
  }

  const formatCep = (v: string) =>
    v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')

  const installment = (discounted / 3).toFixed(2).replace('.', ',')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Price */}
      <div>
        {/* Show strikethrough client price when pro user sees pro price */}
        {isPro && selectedVariant?.pricePro != null && !product.proOnly && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
            <span style={{ fontSize: '0.6rem', background: '#ede9fe', color: '#7c3aed', padding: '1px 6px', borderRadius: '99px', fontWeight: 600, marginRight: '0.4rem' }}>PRO</span>
            Preço público: R$ {originalClientPrice.toFixed(2).replace('.', ',')}
          </p>
        )}
        {discountPct > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginBottom: '0.15rem' }}>
            R$ {price.toFixed(2).replace('.', ',')}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '2.25rem', fontWeight: 400, lineHeight: 1,
            color: discountPct > 0 ? '#16a34a' : 'var(--navy)',
            transition: 'color 0.3s',
          }}>
            R$ {discounted.toFixed(2).replace('.', ',')}
          </span>
          {discountPct > 0 && (
            <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', padding: '0.2rem 0.7rem', borderRadius: '999px', fontWeight: 700, animation: 'popIn 0.4s var(--spring) both' }}>
              -{discountPct}% desconto
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          Em até 3x de R$ {installment} sem juros
        </p>
      </div>

      <div style={{ height: '1px', background: 'var(--cream)' }} />

      {/* Variant selector */}
      {variants.length > 1 && (
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.625rem' }}>Tamanho</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {variants.map(v => (
              <button key={v.id} onClick={() => setSelectedVariant(v)} style={{
                padding: '0.45rem 1.1rem', borderRadius: '999px',
                cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${selectedVariant?.id === v.id ? 'var(--navy)' : 'var(--border)'}`,
                background: selectedVariant?.id === v.id ? 'var(--navy)' : 'transparent',
                color: selectedVariant?.id === v.id ? '#fff' : v.stock === 0 ? 'var(--border)' : 'var(--navy)',
                fontSize: '0.78rem', fontFamily: 'var(--font-dm-sans), sans-serif',
                textDecoration: v.stock === 0 ? 'line-through' : 'none',
                opacity: v.stock === 0 ? 0.5 : 1,
                transition: 'all 0.25s var(--spring)',
                transform: selectedVariant?.id === v.id ? 'scale(1.05)' : 'scale(1)',
              }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty + Add */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
        {/* Quantity */}
        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 42, height: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', transition: 'background 0.15s' }}>
            <Minus size={14} />
          </button>
          <span style={{ width: 38, textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', transition: 'transform 0.2s var(--spring)', display: 'block' }}>
            {qty}
          </span>
          <button onClick={() => setQty(q => Math.min(99, q + 1))} style={{ width: 42, height: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', transition: 'background 0.15s' }}>
            <Plus size={14} />
          </button>
        </div>

        {/* Main CTA */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Particles */}
          {particles.map(p => (
            <span key={p.id} className="cart-particle" style={{
              background: p.color,
              width: p.size, height: p.size,
              marginTop: -(p.size / 2), marginLeft: -(p.size / 2),
              ['--dx' as any]: p.dx,
              ['--dy' as any]: p.dy,
            }} />
          ))}

          <button
            ref={btnRef}
            onClick={handleAdd}
            disabled={outOfStock}
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem 1.5rem', borderRadius: '12px', border: 'none',
              background: outOfStock ? 'var(--border)' : added ? '#16a34a' : 'var(--navy)',
              color: '#fff', fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              transition: 'background 0.5s ease, transform 0.35s var(--spring), box-shadow 0.5s ease',
              transform: added ? 'scale(1.02)' : 'scale(1)',
              boxShadow: added ? '0 6px 24px rgba(22,163,74,0.3)' : '0 3px 12px rgba(50,50,50,0.15)',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {added ? (
              <>
                <Check size={16} style={{ animation: 'checkPop 0.35s var(--spring) both' }} />
                <span style={{ animation: 'slideUp 0.3s var(--smooth) both' }}>Adicionado!</span>
              </>
            ) : outOfStock ? (
              'Esgotado'
            ) : (
              <>
                <ShoppingBag size={15} style={{ transition: 'transform 0.3s var(--spring)' }} />
                Adicionar ao Carrinho
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shipping */}
      <div style={{ background: 'var(--cream)', borderRadius: '14px', padding: '1.25rem', transition: 'box-shadow 0.2s' }}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>
          🚚 Calcular Frete e Prazo
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text" placeholder="00000-000"
            value={formatCep(cep)}
            onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={e => e.key === 'Enter' && calcShipping()}
            style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans)', background: '#fff', color: 'var(--navy)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocus={e => { e.target.style.borderColor = 'var(--navy)'; e.target.style.boxShadow = '0 0 0 3px rgba(50,50,50,0.07)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
          <button onClick={calcShipping} style={{ padding: '0.625rem 1.1rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', fontWeight: 700, transition: 'transform 0.2s var(--spring), background 0.2s' }}>
            {calcLoading ? '...' : 'Calcular'}
          </button>
        </div>
        {shipping && (
          <p style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.625rem', fontWeight: 600, animation: 'slideUp 0.4s var(--smooth) both' }}>
            ✓ {shipping}
          </p>
        )}
      </div>

      <style>{`
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-20deg); opacity:0; }
          60%  { transform: scale(1.3) rotate(5deg); opacity:1; }
          100% { transform: scale(1) rotate(0); opacity:1; }
        }
      `}</style>
    </div>
  )
}
