'use client'
import { ShoppingBag, Check } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useCartStore } from '@/store/cartStore'

type Props = {
  product: { id: string; name: string; price: number; slug: string; proOnly?: boolean }
  variantId?: string
  variantLabel?: string
  disabled?: boolean
}

export default function AddToCartButton({ product, variantId, variantLabel, disabled }: Props) {
  const [added, setAdded] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const addItem = useCartStore(s => s.addItem)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || added) return

    // Ripple position
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { id, x, y }])
    setTimeout(() => setRipples(r => r.filter(ri => ri.id !== id)), 600)

    addItem({
      productId: product.id,
      variantId,
      name: product.name,
      variantLabel,
      price: product.price,
      image: '',
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }, [disabled, added, addItem, product, variantId, variantLabel])

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '100%', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        padding: '0.625rem 1rem',
        background: disabled ? 'var(--cream-dark)' : added ? '#16a34a' : 'var(--navy)',
        color: disabled ? 'var(--text-muted)' : '#fff',
        border: 'none', borderRadius: '10px',
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans), sans-serif',
        transition: 'background 0.35s var(--smooth), transform 0.2s var(--spring), box-shadow 0.3s',
        transform: added ? 'scale(1.04)' : 'scale(1)',
        boxShadow: added ? '0 4px 16px rgba(22,163,74,0.35)' : 'none',
      }}
      onMouseEnter={e => { if (!disabled && !added) { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(50,50,50,0.2)' }}}
      onMouseLeave={e => { if (!added) { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}}
      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)' }}
      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = added ? 'scale(1.04)' : 'scale(1.03)' }}
    >
      {/* Ripples */}
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute', borderRadius: '50%',
          width: 8, height: 8,
          background: 'rgba(255,255,255,0.45)',
          left: r.x - 4, top: r.y - 4,
          pointerEvents: 'none',
          animation: 'rippleExpand 0.6s ease-out forwards',
        }} />
      ))}

      {added ? (
        <>
          <Check size={12} style={{ animation: 'popIn 0.35s var(--spring) both' }} />
          <span style={{ animation: 'slideUp 0.25s var(--smooth) both' }}>Adicionado!</span>
        </>
      ) : disabled ? (
        'Esgotado'
      ) : (
        <>
          <ShoppingBag size={12} />
          Adicionar
        </>
      )}
    </button>
  )
}
