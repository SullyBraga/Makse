'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Upload, Download, Edit2, Trash2, Search, RefreshCw, Package, Star, ChevronDown } from 'lucide-react'

type Product = {
  id: string; name: string; sku: string | null; price: number
  productType: string | null; weight: string | null; active: boolean; featured: boolean; proOnly: boolean
  line: { id: string; name: string } | null; variants: { stock: number }[]
}

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [lines, setLines] = useState<{ id: string; name: string }[]>([])
  const [selectedLineId, setSelectedLineId] = useState<string>('')

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    if (res.ok) {
      setProducts(await res.json())
      setSelectedIds([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetch_()
    fetch('/api/admin/lines')
      .then(async r => {
        if (r.ok) {
          const data = await r.json()
          setLines(data)
        }
      })
      .catch(err => console.error('Error fetching lines:', err))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}" permanentemente?`)) return
    setDeleting(id)
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setProducts(prev => prev.filter(p => p.id !== id))
    setSelectedIds(prev => prev.filter(x => x !== id))
    setDeleting(null)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir permanentemente os ${selectedIds.length} produtos selecionados?`)) return
    setDeletingBulk(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)))
        setSelectedIds([])
      } else {
        alert('Erro ao excluir produtos')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao excluir produtos')
    } finally {
      setDeletingBulk(false)
    }
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, featured: !current }) })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !current } : p))
  }

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesLine = !selectedLineId || p.line?.id === selectedLineId
    return matchesSearch && matchesLine
  })

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.includes(p.id))
  const someSelected = filtered.some(p => selectedIds.includes(p.id)) && !allSelected

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        {selectedIds.length > 0 ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>
              {selectedIds.length} {selectedIds.length === 1 ? 'selecionado' : 'selecionados'}
            </h1>
            <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Ações em massa disponíveis</p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>Produtos</h1>
            <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Gerencie o catálogo completo</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deletingBulk}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', opacity: deletingBulk ? 0.6 : 1 }}
            >
              <Trash2 size={13} /> Excluir Selecionados ({selectedIds.length})
            </button>
          )}
          <a href="/api/admin/products/export" download style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
            <Download size={13} /> Exportar XLSX
          </a>
          <Link href="/admin/produtos/importar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
            <Upload size={13} /> Importar Planilha
          </Link>
          <Link href="/admin/produtos/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: 'var(--navy)', color: '#fff', borderRadius: '99px', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 500 }}>
            <Plus size={13} /> Novo Produto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.82rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff' }} />
        </div>

        <div style={{ position: 'relative', width: '200px' }}>
          <select
            value={selectedLineId}
            onChange={e => setSelectedLineId(e.target.value)}
            style={{
              width: '100%',
              appearance: 'none',
              border: '1px solid var(--border)',
              borderRadius: '99px',
              padding: '0.6rem 2.25rem 0.6rem 1rem',
              fontSize: '0.82rem',
              color: 'var(--navy)',
              background: '#fff',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            <option value="">Todas as linhas</option>
            {lines.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={14} style={{ color: 'var(--gold)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>Produtos ({filtered.length})</h2>
          </div>
          <button onClick={fetch_} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.875rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={11} /> Atualizar
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={22} style={{ color: 'var(--gold)', margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Package size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Nenhum produto encontrado.</p>
            <Link href="/admin/produtos/novo" className="btn-primary" style={{ fontSize: '0.72rem', padding: '0.5rem 1.25rem', display: 'inline-flex', gap: '0.4rem' }}><Plus size={13} />Adicionar produto</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ width: '48px', padding: '0.7rem 1.1rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => {
                        if (el) el.indeterminate = someSelected
                      }}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--navy)' }}
                    />
                  </th>
                  {['Produto', 'SKU', 'Linha', 'Tipo', 'Preço', 'Estoque', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.1rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const stock = p.variants.reduce((t: number, v: any) => t + v.stock, 0)
                  const isSelected = selectedIds.includes(p.id)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--cream)', background: isSelected ? '#fafaf9' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ width: '48px', padding: '0.875rem 1.1rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(p.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--navy)' }}
                        />
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', maxWidth: '200px' }}>
                        <p style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.3 }}>{p.name}</p>
                        {p.proOnly && <span style={{ fontSize: '0.55rem', background: 'var(--cream)', color: 'var(--navy)', padding: '1px 5px', borderRadius: '99px', letterSpacing: '0.08em', fontWeight: 600 }}>PRO</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.sku ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.line?.name ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.productType ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.84rem', fontWeight: 500, color: 'var(--navy)', whiteSpace: 'nowrap' }}>R$ {p.price.toFixed(2).replace('.', ',')}</td>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: stock === 0 ? '#dc2626' : stock < 10 ? '#a16207' : '#166534' }}>
                          {stock} un.
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '99px', background: p.active ? '#dcfce7' : '#fee2e2', color: p.active ? '#166534' : '#dc2626', fontWeight: 600, textAlign: 'center' }}>
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                          {p.featured && <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '99px', background: 'var(--cream)', color: 'var(--gold)', fontWeight: 600, textAlign: 'center' }}>Destaque</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => toggleFeatured(p.id, p.featured)}
                            title={p.featured ? 'Remover destaque' : 'Marcar como destaque'}
                            style={{ display: 'flex', alignItems: 'center', padding: '0.35rem 0.5rem', border: `1px solid ${p.featured ? '#fbbf24' : 'var(--border)'}`, borderRadius: '8px', fontSize: '0.7rem', background: p.featured ? '#fffbeb' : '#fff', cursor: 'pointer', color: p.featured ? '#d97706' : 'var(--text-muted)' }}
                          >
                            <Star size={12} fill={p.featured ? '#d97706' : 'none'} />
                          </button>
                          <Link href={`/admin/produtos/${p.id}/editar`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.7rem', color: 'var(--navy)', textDecoration: 'none', background: '#fff' }}>
                            <Edit2 size={11} /> Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deleting === p.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.7rem', color: '#dc2626', background: '#fff', cursor: 'pointer', opacity: deleting === p.id ? 0.6 : 1 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
