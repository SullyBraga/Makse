'use client'
import { X, ShoppingBag, Plus, Minus, Trash2, Scissors, ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { useSession } from 'next-auth/react'

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, toggleDrawer, updateQuantity, removeItem, total } = useCartStore()
  const { data: session } = useSession()

  const role = (session?.user as any)?.role
  const discountPct: number = (session?.user as any)?.discountPct ?? 0
  const isPro = role === 'CABELEIREIRA' && discountPct > 0
  const hasProOnlyItems = items.some(i => i.proOnly)
  const isClientFinal = role === 'CLIENTE_FINAL'

  const discountedTotal = isPro ? total() * (1 - discountPct / 100) : total()

  if (!drawerOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 50, backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.25s ease both',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: '100%', maxWidth: '420px',
        background: '#fff', zIndex: 51,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 60px rgba(0,0,0,0.14)',
        animation: 'drawerSlideIn 0.38s var(--smooth) both',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={18} style={{ color: 'var(--navy)' }} />
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--navy)' }}>
              Seu Carrinho
            </span>
            {items.length > 0 && (
              <span style={{ background: 'var(--navy)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {items.reduce((t, i) => t + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            style={{ padding: '0.4rem', background: 'var(--cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', color: 'var(--navy)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge de desconto profissional */}
        {isPro && (
          <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scissors size={13} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>
              Desconto profissional de <strong>{discountPct}%</strong> aplicado
            </span>
          </div>
        )}

        {/* Aviso itens pro-only para não-profissionais */}
        {hasProOnlyItems && !isPro && (
          <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={13} style={{ color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
              Seu carrinho contém itens <strong>exclusivos para profissionais</strong>.{' '}
              <Link href="/cadastro" onClick={closeDrawer} style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'underline' }}>
                Solicitar acesso
              </Link>
            </span>
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={32} style={{ color: 'var(--border)' }} />
              </div>
              <div>
                <p style={{ color: 'var(--navy)', fontWeight: 500, marginBottom: '0.3rem' }}>Carrinho vazio</p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Explore nosso catálogo e encontre o produto ideal.</p>
              </div>
              <Link href="/catalogo" onClick={closeDrawer} className="btn-outline" style={{ fontSize: '0.7rem', padding: '0.6rem 1.5rem' }}>
                Ver Catálogo
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {items.map(item => {
                const discountedPrice = isPro ? item.price * (1 - discountPct / 100) : item.price
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '0.875rem', padding: '1rem 0', borderBottom: '1px solid var(--cream)' }}>
                    {/* Thumb */}
                    <div style={{ width: 72, height: 72, background: 'var(--cream)', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border)', fontFamily: 'var(--font-cormorant)', fontSize: '1.5rem' }}>
                          M
                        </div>
                      )}
                      {item.proOnly && (
                        <div style={{ position: 'absolute', top: 3, right: 3, background: 'var(--navy)', borderRadius: '4px', padding: '1px 4px' }}>
                          <Scissors size={9} style={{ color: 'var(--gold)' }} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.3, marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </p>
                      {item.variantLabel && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{item.variantLabel}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isPro ? '#16a34a' : 'var(--navy)' }}>
                          R$ {discountedPrice.toFixed(2).replace('.', ',')}
                        </span>
                        {isPro && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      {/* Qty + Remove */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick={() => updateQuantity(item.id ?? item.productId, item.quantity - 1)} style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)', display: 'flex' }}>
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQuantity(item.id ?? item.productId, item.quantity + 1)} style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)', display: 'flex' }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.id ?? item.productId)} style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', borderRadius: '6px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {isPro && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ textDecoration: 'line-through' }}>R$ {total().toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {isPro && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#16a34a' }}>
                  <span>Desconto ({discountPct}%)</span>
                  <span>−R$ {(total() * discountPct / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.4rem', fontWeight: 400, color: isPro ? '#16a34a' : 'var(--navy)' }}>
                  R$ {discountedTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Frete calculado no checkout</p>
            </div>

            {session ? (
              <Link
                href={role === 'VENDEDOR' ? '/admin/vendas' : '/checkout'}
                onClick={closeDrawer}
                className="btn-primary"
                style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {role === 'VENDEDOR' ? 'Registrar Venda' : 'Finalizar Compra'} <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={closeDrawer}
                className="btn-primary"
                style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Lock size={14} /> Entre para finalizar
              </Link>
            )}
            <button onClick={closeDrawer} className="btn-outline" style={{ width: '100%', fontSize: '0.7rem' }}>
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
