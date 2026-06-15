'use client'
import { useEffect, useState } from 'react'
import { Percent, Plus, Trash2, RefreshCw, Calendar, Sparkles } from 'lucide-react'

type Coupon = {
  id: string
  code: string
  discountType: string
  value: number
  minOrderValue: number | null
  expiresAt: string | null
  usageLimit: number | null
  usageCount: number
  active: boolean
  createdAt: string
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [usageLimit, setUsageLimit] = useState('')

  const fetchCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        setCoupons(await res.json())
      } else {
        setError('Erro ao carregar cupons')
      }
    } catch {
      setError('Erro de conexão ao buscar cupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          value: parseFloat(value),
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar cupom')
      } else {
        setSuccess('Cupom criado com sucesso!')
        setCode('')
        setValue('')
        setMinOrderValue('')
        setExpiresAt('')
        setUsageLimit('')
        fetchCoupons()
      }
    } catch {
      setError('Erro ao criar cupom. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, codeStr: string) => {
    if (!confirm(`Excluir o cupom "${codeStr}" permanentemente?`)) return

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id))
      } else {
        alert('Erro ao excluir cupom')
      }
    } catch {
      alert('Erro de conexão ao excluir cupom')
    }
  }

  const inpStyle = {
    width: '100%',
    padding: '0.55rem 0.875rem',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '0.84rem',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans), sans-serif',
    background: '#fff',
    color: 'var(--navy)',
  }

  const lblStyle = {
    display: 'block',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '0.35rem',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.2rem' }}>Cupons de Desconto</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Crie códigos promocionais para campanhas e clientes</p>
        </div>
        <button onClick={fetchCoupons} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#166534', marginBottom: '1.5rem' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }} className="cupons-grid">
        
        {/* List of Coupons */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={14} style={{ color: 'var(--gold)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>Cupons Ativos ({coupons.length})</h2>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={22} style={{ color: 'var(--gold)', margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <Percent size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhum cupom promocional cadastrado ainda.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                    {['Código', 'Desconto', 'Mínimo', 'Limite Uso', 'Expiração', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.25rem', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                    const limitReached = coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit
                    const active = coupon.active && !isExpired && !limitReached

                    return (
                      <tr key={coupon.id} style={{ borderBottom: '1px solid var(--cream)' }}>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy)', background: 'var(--cream)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {coupon.code}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2).replace('.', ',')}`}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {coupon.minOrderValue ? `R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')}` : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {coupon.usageLimit ? `${coupon.usageCount} / ${coupon.usageLimit}` : `${coupon.usageCount} usos`}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.78rem', color: isExpired ? '#dc2626' : 'var(--text-muted)' }}>
                          {coupon.expiresAt ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={12} />
                              {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '99px', background: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#dc2626', fontWeight: 600 }}>
                              {active ? 'Ativo' : isExpired ? 'Expirado' : limitReached ? 'Esgotado' : 'Inativo'}
                            </span>
                            <button onClick={() => handleDelete(coupon.id, coupon.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex' }} title="Excluir cupom">
                              <Trash2 size={13} style={{ color: '#dc2626' }} />
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

        {/* Creation Form */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
            <Sparkles size={14} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Novo Cupom</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={lblStyle}>Código do Cupom</label>
              <input required type="text" placeholder="Ex: CAMPANHA10" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Tipo de Desconto</label>
              <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={inpStyle}>
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
              </select>
            </div>

            <div>
              <label style={lblStyle}>Valor do Desconto</label>
              <input required type="number" step="0.01" min="0.01" placeholder={discountType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 15.00'} value={value} onChange={e => setValue(e.target.value)} style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Compra Mínima (Opcional)</label>
              <input type="number" step="0.01" min="0" placeholder="Ex: 100.00" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Limite de Usos (Opcional)</label>
              <input type="number" min="1" placeholder="Ex: 50" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Data de Expiração (Opcional)</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inpStyle} />
            </div>

            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.7rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Criando...</> : <><Plus size={14} /> Criar Cupom</>}
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .cupons-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
