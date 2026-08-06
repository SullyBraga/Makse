'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Upload, Download, Edit2, Trash2, Search, RefreshCw, Layers, Eye, EyeOff, Tag } from 'lucide-react'

type KitItem = {
  id: string
  product: { id: string; name: string; sku: string | null }
  quantity: number
}

type Kit = {
  id: string; name: string; sku: string | null; price: number
  pricePro: number | null; priceVendedor: number | null
  showInCatalog: boolean; showAsSuggestion: boolean; active: boolean
  items: KitItem[]
}

export default function AdminKitsPage() {
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/kits')
    if (res.ok) setKits(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir kit "${name}" permanentemente?`)) return
    setDeleting(id)
    await fetch('/api/admin/kits', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setKits(prev => prev.filter(k => k.id !== id))
    setDeleting(null)
  }

  const toggle = async (id: string, field: 'showInCatalog' | 'showAsSuggestion', current: boolean) => {
    await fetch('/api/admin/kits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: !current }),
    })
    setKits(prev => prev.map(k => k.id === id ? { ...k, [field]: !current } : k))
  }

  const filtered = kits.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    (k.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>Kits</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Conjuntos de produtos para venda agrupada</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="/api/admin/kits/export" download style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
            <Download size={13} /> Exportar Kits XLSX
          </a>
          <Link href="/admin/kits/importar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
            <Upload size={13} /> Importar Planilha
          </Link>
          <Link href="/admin/kits/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: 'var(--navy)', color: '#fff', borderRadius: '99px', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 500 }}>
            <Plus size={13} /> Novo Kit
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
            <Layers size={14} style={{ color: 'var(--gold)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>Kits ({filtered.length})</h2>
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
            <Layers size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Nenhum kit encontrado.</p>
            <Link href="/admin/kits/novo" className="btn-primary" style={{ fontSize: '0.72rem', padding: '0.5rem 1.25rem', display: 'inline-flex', gap: '0.4rem' }}><Plus size={13} />Criar kit</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                  {['Kit', 'SKU', 'Componentes', 'Preço', 'Catálogo', 'Sugestão', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.1rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(kit => (
                  <tr key={kit.id} style={{ borderBottom: '1px solid var(--cream)' }}>
                    <td style={{ padding: '0.875rem 1.1rem', maxWidth: '200px' }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.3 }}>{kit.name}</p>
                      {!kit.active && <span style={{ fontSize: '0.55rem', background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '99px' }}>Inativo</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{kit.sku ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1.1rem', maxWidth: '220px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {kit.items.slice(0, 3).map(item => (
                          <span key={item.id} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.quantity}× {item.product.name}
                          </span>
                        ))}
                        {kit.items.length > 3 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{kit.items.length - 3} mais</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.1rem', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--navy)' }}>R$ {kit.price.toFixed(2).replace('.', ',')}</p>
                      {kit.pricePro && <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pro: R$ {kit.pricePro.toFixed(2).replace('.', ',')}</p>}
                    </td>
                    <td style={{ padding: '0.875rem 1.1rem' }}>
                      <button
                        onClick={() => toggle(kit.id, 'showInCatalog', kit.showInCatalog)}
                        title={kit.showInCatalog ? 'Remover do catálogo' : 'Exibir no catálogo'}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.625rem', border: `1px solid ${kit.showInCatalog ? '#22c55e' : 'var(--border)'}`, borderRadius: '8px', background: kit.showInCatalog ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: '0.65rem', color: kit.showInCatalog ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}
                      >
                        {kit.showInCatalog ? <Eye size={11} /> : <EyeOff size={11} />}
                        {kit.showInCatalog ? 'Sim' : 'Não'}
                      </button>
                    </td>
                    <td style={{ padding: '0.875rem 1.1rem' }}>
                      <button
                        onClick={() => toggle(kit.id, 'showAsSuggestion', kit.showAsSuggestion)}
                        title={kit.showAsSuggestion ? 'Remover das sugestões' : 'Exibir como sugestão'}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.625rem', border: `1px solid ${kit.showAsSuggestion ? '#3b82f6' : 'var(--border)'}`, borderRadius: '8px', background: kit.showAsSuggestion ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '0.65rem', color: kit.showAsSuggestion ? '#1d4ed8' : 'var(--text-muted)', fontWeight: 600 }}
                      >
                        <Tag size={11} />
                        {kit.showAsSuggestion ? 'Sim' : 'Não'}
                      </button>
                    </td>
                    <td style={{ padding: '0.875rem 1.1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link href={`/admin/kits/${kit.id}/editar`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.7rem', color: 'var(--navy)', textDecoration: 'none', background: '#fff' }}>
                          <Edit2 size={11} /> Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(kit.id, kit.name)}
                          disabled={deleting === kit.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.7rem', color: '#dc2626', background: '#fff', cursor: 'pointer', opacity: deleting === kit.id ? 0.6 : 1 }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
