'use client'
import { useState } from 'react'
import { SlidersHorizontal, ShoppingBag, Layers } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import Link from 'next/link'

type Item = {
  id: string; name: string; slug: string; price: number
  productType: string | null; weight: string | null
  proOnly: boolean; featured: boolean; images: string[]
  lineName: string | null; lineSlug: string | null; totalStock: number
  isKit: boolean
}
type Line = { id: string; name: string; slug: string }

type Props = {
  products: Item[]
  lines: Line[]
  discountPct: number
  isPro: boolean
  role: string
}

export default function CatalogoClient({ products, lines, discountPct, isPro, role }: Props) {
  const [activeLineSlug, setActiveLineSlug] = useState<string | null>(null)
  const [sort, setSort] = useState<'relevance' | 'asc' | 'desc'>('relevance')
  const [showKitsOnly, setShowKitsOnly] = useState(false)

  const filtered = products
    .filter(p => {
      if (showKitsOnly) return p.isKit
      if (activeLineSlug) return !p.isKit && p.lineSlug === activeLineSlug
      return true
    })
    .sort((a, b) => {
      if (sort === 'asc') return a.price - b.price
      if (sort === 'desc') return b.price - a.price
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    })

  const kitCount = products.filter(p => p.isKit).length

  const btnBase: React.CSSProperties = {
    padding: '0.4rem 1.1rem', fontSize: '0.65rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', borderRadius: '999px', cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 600,
    transition: 'all 0.18s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* Hero */}
      <section style={{ background: 'var(--cream)', padding: 'clamp(3rem,6vw,4.5rem) 0', textAlign: 'center', borderBottom: '1px solid var(--cream-dark)' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }} className="animate-up">
          <span className="section-label">Nosso Portfólio</span>
          <h1 style={{ fontFamily: 'var(--font-cormorant),Georgia,serif', fontSize: 'clamp(2rem,4vw,3.25rem)', fontWeight: 400, color: 'var(--navy)', margin: '0.5rem 0 0.625rem' }}>
            Catálogo Completo
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            {isPro && discountPct > 0
              ? `Acesso profissional ativo • ${discountPct}% de desconto em todos os produtos`
              : isPro
              ? 'Acesso profissional completo'
              : 'Produtos selecionados para uso doméstico'}
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: 'clamp(1.5rem,4vw,2.5rem) 1.5rem' }}>

        {/* Line filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'center' }}>
          <button onClick={() => { setActiveLineSlug(null); setShowKitsOnly(false) }}
            style={{ ...btnBase, background: !activeLineSlug && !showKitsOnly ? 'var(--navy)' : '#fff', color: !activeLineSlug && !showKitsOnly ? '#fff' : 'var(--text-muted)', boxShadow: !activeLineSlug && !showKitsOnly ? 'none' : '0 1px 4px rgba(0,0,0,0.06)', border: !activeLineSlug && !showKitsOnly ? 'none' : '1px solid var(--cream-dark)' }}>
            Todos
          </button>
          {lines.map(l => (
            <button key={l.id} onClick={() => { setActiveLineSlug(l.slug); setShowKitsOnly(false) }}
              style={{ ...btnBase, background: activeLineSlug === l.slug ? 'var(--navy)' : '#fff', color: activeLineSlug === l.slug ? '#fff' : 'var(--text-muted)', boxShadow: activeLineSlug === l.slug ? 'none' : '0 1px 4px rgba(0,0,0,0.06)', border: activeLineSlug === l.slug ? 'none' : '1px solid var(--cream-dark)' }}>
              {l.name}
            </button>
          ))}
          {kitCount > 0 && (
            <button onClick={() => { setShowKitsOnly(true); setActiveLineSlug(null) }}
              style={{ ...btnBase, display: 'flex', alignItems: 'center', gap: '0.35rem', background: showKitsOnly ? '#7c3aed' : '#fff', color: showKitsOnly ? '#fff' : '#7c3aed', border: `1px solid ${showKitsOnly ? '#7c3aed' : '#c4b5fd'}` }}>
              <Layers size={11} /> Kits ({kitCount})
            </button>
          )}
        </div>

        {/* Count + sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} {showKitsOnly ? 'kit' : 'produto'}{filtered.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={13} style={{ color: 'var(--text-muted)' }} />
            <select value={sort} onChange={e => setSort(e.target.value as any)}
              style={{ padding: '0.4rem 0.875rem', border: '1px solid var(--cream-dark)', borderRadius: '999px', fontSize: '0.75rem', background: '#fff', fontFamily: 'var(--font-dm-sans)', outline: 'none', cursor: 'pointer', color: 'var(--navy)' }}>
              <option value="relevance">Mais Relevantes</option>
              <option value="asc">Menor Preço</option>
              <option value="desc">Maior Preço</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <ShoppingBag size={40} style={{ color: 'var(--cream-dark)', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Nenhum item encontrado.</p>
            <button onClick={() => { setActiveLineSlug(null); setShowKitsOnly(false) }} style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpar filtros</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(p => {
              const discounted = !p.isKit && discountPct > 0 ? p.price * (1 - discountPct / 100) : null
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.isKit ? `kit/${p.slug}` : p.slug}
                  price={p.price}
                  discountedPrice={discounted}
                  discountPct={!p.isKit && discountPct > 0 ? discountPct : undefined}
                  lineName={p.lineName}
                  productType={p.productType}
                  images={p.images}
                  proOnly={p.proOnly}
                  outOfStock={p.totalStock === 0}
                  badgeLabel={p.isKit ? 'Kit' : undefined}
                  badgeColor={p.isKit ? '#7c3aed' : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
