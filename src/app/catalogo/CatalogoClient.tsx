'use client'
import { useState, useEffect } from 'react'
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

  // Reactive filters states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedWeights, setSelectedWeights] = useState<string[]>([])
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // Sync with URL query parameter '?linha=slug'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const linha = params.get('linha')
      if (linha) {
        const matchedLine = lines.find(l => l.slug.toLowerCase() === linha.toLowerCase())
        if (matchedLine) {
          setActiveLineSlug(matchedLine.slug)
        }
      }
    }
  }, [lines])

  // Extract unique product types dynamically
  const productTypes = Array.from(
    new Set(
      products
        .map(p => p.productType)
        .filter((t): t is string => !!t)
    )
  ).sort()

  // Extract unique weights dynamically
  const weights = Array.from(
    new Set(
      products
        .map(p => p.weight)
        .filter((w): w is string => !!w)
    )
  ).sort()

  const filtered = products
    .filter(p => {
      // Filter by Line / Kits
      if (showKitsOnly) {
        if (!p.isKit) return false
      } else if (activeLineSlug) {
        if (p.isKit || p.lineSlug !== activeLineSlug) return false
      }

      // Filter by Product Type
      if (selectedTypes.length > 0) {
        if (!p.productType || !selectedTypes.includes(p.productType)) return false
      }

      // Filter by Weight / Volumetria
      if (selectedWeights.length > 0) {
        if (!p.weight || !selectedWeights.includes(p.weight)) return false
      }

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

        {/* Count + sort + filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} {showKitsOnly ? 'kit' : 'produto'}{filtered.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.875rem', border: `1px solid ${showFiltersPanel ? 'var(--navy)' : 'var(--cream-dark)'}`,
                borderRadius: '999px', fontSize: '0.75rem', background: showFiltersPanel ? 'var(--navy)' : '#fff',
                color: showFiltersPanel ? '#fff' : 'var(--navy)', fontFamily: 'var(--font-dm-sans)',
                outline: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Filtrar</span>
              {(selectedTypes.length > 0 || selectedWeights.length > 0) && (
                <span style={{
                  background: showFiltersPanel ? '#fff' : 'var(--navy)',
                  color: showFiltersPanel ? 'var(--navy)' : '#fff',
                  fontSize: '0.6rem', padding: '1px 5px', borderRadius: '99px', fontWeight: 700,
                  marginLeft: '0.25rem'
                }}>
                  {selectedTypes.length + selectedWeights.length}
                </span>
              )}
            </button>

            <select value={sort} onChange={e => setSort(e.target.value as any)}
              style={{ padding: '0.4rem 0.875rem', border: '1px solid var(--cream-dark)', borderRadius: '999px', fontSize: '0.75rem', background: '#fff', fontFamily: 'var(--font-dm-sans)', outline: 'none', cursor: 'pointer', color: 'var(--navy)' }}>
              <option value="relevance">Mais Relevantes</option>
              <option value="asc">Menor Preço</option>
              <option value="desc">Maior Preço</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <div style={{
          maxHeight: showFiltersPanel ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease-in-out',
          marginBottom: showFiltersPanel ? '1.5rem' : '0',
        }}>
          <div style={{
            background: '#fff', border: '1px solid var(--cream-dark)',
            borderRadius: '16px', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              
              {/* Categoria / Tipo */}
              {productTypes.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>Tipo de Produto</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {productTypes.map(type => {
                      const isSelected = selectedTypes.includes(type)
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTypes(prev =>
                              isSelected ? prev.filter(t => t !== type) : [...prev, type]
                            )
                          }}
                          style={{
                            padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '8px',
                            background: isSelected ? 'var(--cream-dark)' : '#f3f4f6',
                            color: isSelected ? 'var(--navy)' : 'var(--text-muted)',
                            border: `1px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,
                            cursor: 'pointer', transition: 'all 0.15s', fontWeight: isSelected ? 600 : 400
                          }}
                        >
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Volumetria / Peso */}
              {weights.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>Volumetria / Peso</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {weights.map(weight => {
                      const isSelected = selectedWeights.includes(weight)
                      return (
                        <button
                          key={weight}
                          onClick={() => {
                            setSelectedWeights(prev =>
                              isSelected ? prev.filter(w => w !== weight) : [...prev, weight]
                            )
                          }}
                          style={{
                            padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '8px',
                            background: isSelected ? 'var(--cream-dark)' : '#f3f4f6',
                            color: isSelected ? 'var(--navy)' : 'var(--text-muted)',
                            border: `1px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,
                            cursor: 'pointer', transition: 'all 0.15s', fontWeight: isSelected ? 600 : 400
                          }}
                        >
                          {weight}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Ações adicionais do painel de filtros */}
            {(selectedTypes.length > 0 || selectedWeights.length > 0) && (
              <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setSelectedTypes([])
                    setSelectedWeights([])
                  }}
                  style={{
                    background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem',
                    fontWeight: 600, cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  Limpar Filtros Selecionados
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <ShoppingBag size={40} style={{ color: 'var(--cream-dark)', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Nenhum item encontrado.</p>
            <button onClick={() => {
              setActiveLineSlug(null)
              setShowKitsOnly(false)
              setSelectedTypes([])
              setSelectedWeights([])
            }} style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpar filtros</button>
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
