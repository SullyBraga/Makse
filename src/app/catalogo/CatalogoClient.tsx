'use client'
import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, ShoppingBag, Layers, X, Search } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import Link from 'next/link'

type Item = {
  id: string; name: string; slug: string; price: number
  productType: string | null; weight: string | null
  proOnly: boolean; featured: boolean; images: string[]
  lineName: string | null; lineSlug: string | null; totalStock: number
  isKit: boolean
  description?: string | null
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
  const [searchQuery, setSearchQuery] = useState('')

  // Active filters states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedWeights, setSelectedWeights] = useState<string[]>([])

  // Modal dialog reference
  const filtersDialogRef = useRef<HTMLDialogElement>(null)

  // Temporary states for filters popup (non-realtime filtering)
  const [tempLineSlug, setTempLineSlug] = useState<string | null>(null)
  const [tempKitsOnly, setTempKitsOnly] = useState(false)
  const [tempSelectedTypes, setTempSelectedTypes] = useState<string[]>([])
  const [tempSelectedWeights, setTempSelectedWeights] = useState<string[]>([])

  // Sync with URL query parameter '?linha=slug'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const linha = params.get('linha')
      if (linha) {
        const matchedLine = lines.find(l => l.slug.toLowerCase() === linha.toLowerCase())
        if (matchedLine) {
          setActiveLineSlug(matchedLine.slug)
          setTempLineSlug(matchedLine.slug) // Sync temp state as well
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

  const openFiltersModal = () => {
    // Populate temp states from currently active filters
    setTempLineSlug(activeLineSlug)
    setTempKitsOnly(showKitsOnly)
    setTempSelectedTypes(selectedTypes)
    setTempSelectedWeights(selectedWeights)
    
    filtersDialogRef.current?.showModal()
    document.body.style.overflow = 'hidden' // Lock background scroll
  }

  const closeFiltersModal = () => {
    filtersDialogRef.current?.close()
    document.body.style.overflow = ''
  }

  const applyFilters = () => {
    setActiveLineSlug(tempLineSlug)
    setShowKitsOnly(tempKitsOnly)
    setSelectedTypes(tempSelectedTypes)
    setSelectedWeights(tempSelectedWeights)
    closeFiltersModal()
  }

  const clearAllFilters = () => {
    setActiveLineSlug(null)
    setShowKitsOnly(false)
    setSelectedTypes([])
    setSelectedWeights([])
    setTempLineSlug(null)
    setTempKitsOnly(false)
    setTempSelectedTypes([])
    setTempSelectedWeights([])
    setSearchQuery('')
  }

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === filtersDialogRef.current) {
      closeFiltersModal()
    }
  }

  const filtered = products
    .filter(p => {
      // Filter by Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = p.name.toLowerCase().includes(query)
        const matchesDesc = (p.description || p.name).toLowerCase().includes(query)
        const matchesLine = (p.lineName || '').toLowerCase().includes(query)
        const matchesType = (p.productType || '').toLowerCase().includes(query)
        if (!matchesName && !matchesDesc && !matchesLine && !matchesType) return false
      }

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

        {/* Barra de Pesquisa */}
        <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
          <input
            type="text"
            placeholder="Pesquisar por produto, linha, tipo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              border: '1px solid var(--cream-dark)',
              borderRadius: '14px',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#fff',
              color: 'var(--navy)',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease',
            }}
            className="search-input"
          />
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          {searchQuery.trim() !== '' && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: 0
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Count + sort + filter button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} {showKitsOnly ? 'kit' : 'produto'}{filtered.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={openFiltersModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.875rem', border: '1px solid var(--cream-dark)',
                borderRadius: '999px', fontSize: '0.75rem', background: '#fff',
                color: 'var(--navy)', fontFamily: 'var(--font-dm-sans)',
                outline: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Filtrar</span>
              {(activeLineSlug || showKitsOnly || selectedTypes.length > 0 || selectedWeights.length > 0) && (
                <span style={{
                  background: 'var(--navy)',
                  color: '#fff',
                  fontSize: '0.6rem', padding: '1px 5px', borderRadius: '99px', fontWeight: 700,
                  marginLeft: '0.25rem'
                }}>
                  {(activeLineSlug ? 1 : 0) + (showKitsOnly ? 1 : 0) + selectedTypes.length + selectedWeights.length}
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

        {/* Active Filters Tags Bar */}
        {(activeLineSlug || showKitsOnly || selectedTypes.length > 0 || selectedWeights.length > 0) && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filtros ativos:</span>
            
            {activeLineSlug && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.625rem', borderRadius: '99px', background: 'var(--cream)',
                color: 'var(--navy)', fontSize: '0.7rem', fontWeight: 500, border: '1px solid var(--cream-dark)'
              }}>
                <span>Linha: {lines.find(l => l.slug === activeLineSlug)?.name || activeLineSlug}</span>
                <button
                  onClick={() => {
                    setActiveLineSlug(null)
                    setTempLineSlug(null)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {showKitsOnly && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.625rem', borderRadius: '99px', background: '#f5f3ff',
                color: '#7c3aed', fontSize: '0.7rem', fontWeight: 500, border: '1px solid #ddd6fe'
              }}>
                <span>Apenas Kits</span>
                <button
                  onClick={() => {
                    setShowKitsOnly(false)
                    setTempKitsOnly(false)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', display: 'flex', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {selectedTypes.map(type => (
              <span key={type} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.625rem', borderRadius: '99px', background: 'var(--cream)',
                color: 'var(--navy)', fontSize: '0.7rem', fontWeight: 500, border: '1px solid var(--cream-dark)'
              }}>
                <span>{type}</span>
                <button
                  onClick={() => {
                    setSelectedTypes(prev => prev.filter(t => t !== type))
                    setTempSelectedTypes(prev => prev.filter(t => t !== type))
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {selectedWeights.map(weight => (
              <span key={weight} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.625rem', borderRadius: '99px', background: 'var(--cream)',
                color: 'var(--navy)', fontSize: '0.7rem', fontWeight: 500, border: '1px solid var(--cream-dark)'
              }}>
                <span>{weight}</span>
                <button
                  onClick={() => {
                    setSelectedWeights(prev => prev.filter(w => w !== weight))
                    setTempSelectedWeights(prev => prev.filter(w => w !== weight))
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            <button
              onClick={clearAllFilters}
              style={{
                background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem',
                fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0
              }}
            >
              Limpar Todos
            </button>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <ShoppingBag size={40} style={{ color: 'var(--cream-dark)', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Nenhum item encontrado.</p>
            <button onClick={clearAllFilters} style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpar filtros</button>
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

      {/* Premium Minimalist Filters Pop-up Dialog */}
      <dialog
        ref={filtersDialogRef}
        onClick={handleDialogClick}
        onClose={closeFiltersModal}
        className="filters-dialog"
        data-lenis-prevent
      >
        <div className="filters-dialog-header">
          <h2 className="filters-dialog-title">Filtrar Produtos</h2>
          <button className="filters-dialog-close" onClick={closeFiltersModal} aria-label="Fechar modal">
            <X size={15} />
          </button>
        </div>

        <div className="filters-dialog-content">
          {/* Linhas & Kits */}
          <div>
            <h4 className="filters-dialog-section-title">Linhas & Kits</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setTempLineSlug(null)
                  setTempKitsOnly(false)
                }}
                className={`filter-pill ${!tempLineSlug && !tempKitsOnly ? 'active' : ''}`}
              >
                Todas as Linhas
              </button>
              {lines.map(l => {
                const isSelected = tempLineSlug === l.slug
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      setTempLineSlug(l.slug)
                      setTempKitsOnly(false)
                    }}
                    className={`filter-pill ${isSelected ? 'active' : ''}`}
                  >
                    {l.name}
                  </button>
                )
              })}
              {kitCount > 0 && (
                <button
                  onClick={() => {
                    setTempKitsOnly(true)
                    setTempLineSlug(null)
                  }}
                  className={`filter-pill ${tempKitsOnly ? 'active' : ''}`}
                >
                  Kits ({kitCount})
                </button>
              )}
            </div>
          </div>

          {/* Tipo de Produto */}
          {productTypes.length > 0 && (
            <div>
              <h4 className="filters-dialog-section-title">Tipo de Produto</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {productTypes.map(type => {
                  const isSelected = tempSelectedTypes.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setTempSelectedTypes(prev =>
                          isSelected ? prev.filter(t => t !== type) : [...prev, type]
                        )
                      }}
                      className={`filter-pill ${isSelected ? 'active' : ''}`}
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
              <h4 className="filters-dialog-section-title">Volumetria / Peso</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {weights.map(weight => {
                  const isSelected = tempSelectedWeights.includes(weight)
                  return (
                    <button
                      key={weight}
                      onClick={() => {
                        setTempSelectedWeights(prev =>
                          isSelected ? prev.filter(w => w !== weight) : [...prev, weight]
                        )
                      }}
                      className={`filter-pill ${isSelected ? 'active' : ''}`}
                    >
                      {weight}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="filters-dialog-footer">
          <button
            onClick={() => {
              setTempLineSlug(null)
              setTempKitsOnly(false)
              setTempSelectedTypes([])
              setTempSelectedWeights([])
            }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem',
              fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', padding: 0
            }}
          >
            Limpar Filtros
          </button>
          <button
            onClick={applyFilters}
            className="btn-primary"
            style={{
              padding: '0.55rem 2rem', fontSize: '0.7rem',
            }}
          >
            Aplicar Filtros
          </button>
        </div>
      </dialog>

      <style>{`
        /* Clean & Premium Minimalist Dialog Styles */
        .filters-dialog {
          border: 1px solid var(--cream-dark);
          border-radius: 20px;
          background: #ffffff;
          color: var(--navy);
          max-width: 500px;
          width: calc(100% - 2rem);
          padding: 1.75rem 2rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          outline: none;
          font-family: var(--font-dm-sans), sans-serif;
          overflow: hidden;
          display: none;
          flex-direction: column;
          max-height: 80vh;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          box-sizing: border-box;
          z-index: 100;
        }
        .filters-dialog[open] {
          display: flex;
        }
        .filters-dialog::backdrop {
          background: rgba(13, 27, 42, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .filters-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 0.875rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .filters-dialog-title {
          font-family: var(--font-cormorant), Cormorant Garamond, serif;
          font-size: 1.6rem;
          color: var(--navy);
          font-weight: 400;
          margin: 0;
        }
        .filters-dialog-close {
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: var(--navy);
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .filters-dialog-close:hover {
          background: var(--navy);
          border-color: var(--navy);
          color: #fff;
          transform: rotate(90deg);
        }
        .filters-dialog-content {
          overflow-y: auto;
          max-height: 45vh;
          padding-right: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          text-align: left;
        }
        .filters-dialog-content::-webkit-scrollbar {
          width: 5px;
        }
        .filters-dialog-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .filters-dialog-content::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        .filters-dialog-section-title {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--navy);
          opacity: 0.5;
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.6rem;
        }
        .filters-dialog-footer {
          border-top: 1px solid var(--border);
          padding-top: 1rem;
          margin-top: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .filter-pill {
          padding: 0.4rem 0.9rem;
          font-size: 0.72rem;
          border-radius: 8px;
          background: var(--cream);
          color: var(--navy);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 400;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .filter-pill:hover {
          background: var(--cream-dark);
          border-color: var(--cream-dark);
        }
        .filter-pill.active {
          background: var(--navy);
          color: #fff;
          border-color: var(--navy);
          font-weight: 600;
        }
        .search-input:focus {
          border-color: var(--navy) !important;
          box-shadow: 0 4px 15px rgba(13, 27, 42, 0.06) !important;
        }
      `}</style>
    </div>
  )
}
