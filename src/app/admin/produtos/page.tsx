'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Upload, Edit2, Trash2, Search, RefreshCw, Package, Star } from 'lucide-react'

type Product = {
  id: string; name: string; sku: string | null; price: number
  productType: string | null; weight: string | null; active: boolean; featured: boolean; proOnly: boolean
  line: { name: string } | null; variants: { stock: number }[]
}

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    if (res.ok) setProducts(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}" permanentemente?`)) return
    setDeleting(id)
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setProducts(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, featured: !current }) })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !current } : p))
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>Produtos</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Gerencie o catálogo completo</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/admin/produtos/importar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
            <Upload size={13} /> Importar Planilha
          </Link>
          <Link href="/admin/produtos/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: 'var(--navy)', color: '#fff', borderRadius: '99px', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 500 }}>
            <Plus size={13} /> Novo Produto
          </Link>
        </div>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.82rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff' }} />
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
                  {['Produto', 'SKU', 'Linha', 'Tipo', 'Preço', 'Estoque', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.1rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const stock = p.variants.reduce((t: number, v: any) => t + v.stock, 0)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--cream)' }}>
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
