import { prisma } from '@/lib/prisma'
import { AlertTriangle, Package } from 'lucide-react'

function StockBar({ stock, min }: { stock: number; min: number }) {
  const max = Math.max(min * 4, 1)
  const pct = Math.min((stock / max) * 100, 100)
  const color = stock === 0 ? '#ef4444' : stock < min ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div style={{ flex: 1, height: '5px', background: '#f0ebe4', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: '28px', textAlign: 'right' }}>{stock}</span>
    </div>
  )
}

export default async function AdminEstoquePage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      variants: true,
      line: { select: { name: true } },
    },
  })

  // Simular estoque mínimo de 10 enquanto não há campo no schema
  const MIN_STOCK = 10
  const critical = products.filter(p => {
    const totalStock = p.variants.length > 0
      ? p.variants.reduce((t, v) => t + v.stock, 0)
      : 0
    return totalStock < MIN_STOCK
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#0d1b2a', marginBottom: '0.25rem' }}>Estoque</h1>
        <p style={{ fontSize: '0.835rem', color: '#6b6b6b' }}>Gerencie o estoque dos produtos e variantes</p>
      </div>

      {/* Alertas críticos */}
      {critical.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <AlertTriangle size={15} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.35rem' }}>
              {critical.length} produto(s) com estoque crítico:
            </p>
            <ul style={{ fontSize: '0.78rem', color: '#b91c1c', lineHeight: 1.7 }}>
              {critical.map(p => {
                const total = p.variants.reduce((t, v) => t + v.stock, 0)
                return <li key={p.id}>• {p.name} — {total === 0 ? 'sem estoque' : `${total} un.`}</li>
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid #e8e2da', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f0ebe4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={15} style={{ color: '#c9a96e' }} />
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d1b2a' }}>Produtos Cadastrados ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <Package size={36} style={{ color: '#e2ddd6', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#9b8f88', marginBottom: '0.3rem' }}>Nenhum produto cadastrado</p>
            <p style={{ fontSize: '0.78rem', color: '#b8afa7' }}>Adicione produtos ao catálogo para gerenciar o estoque.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0ebe4' }}>
                  {['Produto', 'Linha', 'Variantes', 'Estoque Total', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const totalStock = product.variants.reduce((t, v) => t + v.stock, 0)
                  const isCritical = totalStock < MIN_STOCK
                  const isOut = totalStock === 0
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f8f4f0', background: isOut ? '#fef2f2' : isCritical ? '#fffbeb' : 'transparent' }}>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <p style={{ fontSize: '0.84rem', fontWeight: 500, color: '#0d1b2a', lineHeight: 1.3 }}>{product.name}</p>
                        {product.proOnly && (
                          <span style={{ fontSize: '0.6rem', background: '#f5f3ff', color: '#7c3aed', padding: '1px 6px', borderRadius: '99px', fontWeight: 600, letterSpacing: '0.05em' }}>PRO</span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.82rem', color: '#6b6b6b' }}>
                        {product.line?.name ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.82rem', color: '#6b6b6b' }}>
                        {product.variants.length > 0 ? product.variants.map(v => v.label).join(', ') : 'Sem variantes'}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', width: '180px' }}>
                        <StockBar stock={totalStock} min={MIN_STOCK} />
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        {isOut ? (
                          <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>Sem Estoque</span>
                        ) : isCritical ? (
                          <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: '#fef9c3', color: '#a16207', fontWeight: 600 }}>Crítico</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>Normal</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
