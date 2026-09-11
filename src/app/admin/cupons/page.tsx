'use client'
import { useEffect, useState } from 'react'
import { Percent, Plus, Trash2, RefreshCw, Calendar, Sparkles, Edit2, X, DollarSign, Filter, CheckCircle2 } from 'lucide-react'

type ProductOption = { id: string; name: string }

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
  isFreeShipping?: boolean
  createdAt: string
  partnerName?: string | null
  commissionRate?: number | null
  productId?: string | null
  product?: { id: string; name: string } | null
  totalSales?: number
  totalRevenue?: number
  totalCommission?: number
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Date Filter States
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Edit / Form States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [activeState, setActiveState] = useState(true)
  
  // Influenciador & Restrição
  const [partnerName, setPartnerName] = useState('')
  const [commissionRate, setCommissionRate] = useState('')
  const [productId, setProductId] = useState('')
  const [isFreeShipping, setIsFreeShipping] = useState(false)

  const fetchCoupons = async (overrideStart?: string, overrideEnd?: string) => {
    setLoading(true)
    setError('')
    try {
      const s = overrideStart !== undefined ? overrideStart : startDate
      const e = overrideEnd !== undefined ? overrideEnd : endDate

      const params = new URLSearchParams()
      if (s) params.set('startDate', s)
      if (e) params.set('endDate', e)

      const res = await fetch(`/api/admin/coupons?${params.toString()}`)
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
    fetch('/api/admin/products?limit=200')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data.map(p => ({ id: p.id, name: p.name })))
      })
      .catch(err => console.error('Error fetching products for coupons:', err))
  }, [])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCoupons()
  }

  const applyThisMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]
    setStartDate(firstDay)
    setEndDate(today)
    fetchCoupons(firstDay, today)
  }

  const applyLastDays = (days: number) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const past = new Date(now.setDate(now.getDate() - days)).toISOString().split('T')[0]
    setStartDate(past)
    setEndDate(today)
    fetchCoupons(past, today)
  }

  const clearFilter = () => {
    setStartDate('')
    setEndDate('')
    fetchCoupons('', '')
  }

  const startEdit = (c: Coupon) => {
    setEditingId(c.id)
    setCode(c.code)
    setDiscountType(c.discountType)
    setValue(String(c.value))
    setMinOrderValue(c.minOrderValue ? String(c.minOrderValue) : '')
    setExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '')
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '')
    setPartnerName(c.partnerName || '')
    setCommissionRate(c.commissionRate ? String(c.commissionRate) : '')
    setProductId(c.productId || '')
    setIsFreeShipping(!!c.isFreeShipping)
    setActiveState(c.active)

    setError('')
    setSuccess('')

    // Scroll smoothly to form container
    const formEl = document.getElementById('coupon-form-card')
    formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setCode('')
    setValue('')
    setMinOrderValue('')
    setExpiresAt('')
    setUsageLimit('')
    setPartnerName('')
    setCommissionRate('')
    setProductId('')
    setIsFreeShipping(false)
    setActiveState(true)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      value: parseFloat(value),
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      partnerName: partnerName.trim() || null,
      commissionRate: commissionRate ? parseFloat(commissionRate) : null,
      productId: productId || null,
      isFreeShipping,
      active: activeState,
    }

    try {
      const isEditing = !!editingId
      const url = '/api/admin/coupons'
      const method = isEditing ? 'PUT' : 'POST'
      const bodyData = isEditing ? { ...payload, id: editingId } : payload

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} cupom`)
      } else {
        setSuccess(`Cupom ${isEditing ? 'atualizado' : 'criado'} com sucesso!`)
        cancelEdit()
        fetchCoupons()
      }
    } catch {
      setError(`Erro ao ${editingId ? 'atualizar' : 'criar'} cupom. Tente novamente.`)
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
        if (editingId === id) cancelEdit()
      } else {
        alert('Erro ao excluir cupom')
      }
    } catch {
      alert('Erro de conexão ao excluir cupom')
    }
  }

  const totalPeriodRevenue = coupons.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
  const totalPeriodCommission = coupons.reduce((sum, c) => sum + (c.totalCommission || 0), 0)
  const isFiltered = !!(startDate || endDate)

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.2rem' }}>Cupons & Comissões</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Crie, edite e metrifique comissões de parceiros por período de datas</p>
        </div>
        <button onClick={() => fetchCoupons()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <RefreshCw size={13} /> Atualizar Lista
        </button>
      </div>

      {/* Cards de Métricas do Período */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-muted)' }}>
              {isFiltered ? 'Vendas no Período' : 'Vendas Totais'}
            </span>
            <DollarSign size={16} style={{ color: 'var(--gold)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-dm-sans)' }}>
            R$ {totalPeriodRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isFiltered ? `Filtrado de ${startDate || 'início'} até ${endDate || 'hoje'}` : 'Vendas acumuladas dos cupons'}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#166534' }}>
              {isFiltered ? 'Comissões Pagar (Período)' : 'Total de Comissões Pagar'}
            </span>
            <Sparkles size={16} style={{ color: '#166534' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#14532d', fontFamily: 'var(--font-dm-sans)' }}>
            R$ {totalPeriodCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.25rem' }}>
            {isFiltered ? `Metrificado de ${startDate || 'início'} até ${endDate || 'hoje'}` : 'Comissões geradas pelos cupons de parceiros'}
          </div>
        </div>
      </div>

      {/* Filtro de Datas para Metrificação */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--navy)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
            <Filter size={15} style={{ color: 'var(--gold)' }} />
            Metrificar por Período de Datas:
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={lblStyle}>Data Inicial</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inpStyle} />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={lblStyle}>Data Final</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inpStyle} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" style={{ padding: '0.55rem 1.25rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Filtrar Período
            </button>
            <button type="button" onClick={applyThisMonth} style={{ padding: '0.55rem 0.85rem', background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
              Este Mês
            </button>
            <button type="button" onClick={() => applyLastDays(15)} style={{ padding: '0.55rem 0.85rem', background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
              Últimos 15 Dias
            </button>
            {isFiltered && (
              <button type="button" onClick={clearFilter} style={{ padding: '0.55rem 0.85rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Limpar Filtro
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#166534', marginBottom: '1.5rem' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }} className="cupons-grid">
        
        {/* List of Coupons */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Percent size={14} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>Cupons Cadastrados ({coupons.length})</h2>
            </div>
            {isFiltered && (
              <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                🗓️ Período: {startDate || 'início'} até {endDate || 'hoje'}
              </span>
            )}
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
                    {['Código', 'Desconto / Aplicação', 'Parceiro / Comissão', 'Vendas Período', 'Comissão Período', 'Usos', 'Ações'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.25rem', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                    const limitReached = coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit
                    const active = coupon.active && !isExpired && !limitReached
                    const isEditing = editingId === coupon.id

                    return (
                      <tr key={coupon.id} style={{ borderBottom: '1px solid var(--cream)', background: isEditing ? '#f0f7ff' : 'transparent' }}>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy)', background: 'var(--cream)', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'inline-block' }}>
                            {coupon.code}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>
                          <div>
                            {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2).replace('.', ',')} OFF`}
                            {coupon.isFreeShipping && <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 600, marginLeft: '0.4rem' }}>+ Frete Grátis</span>}
                          </div>
                          {coupon.product ? (
                            <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginTop: '2px' }}>
                              🏷️ Exclusivo: {coupon.product.name}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Loja inteira
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem' }}>
                          {coupon.partnerName ? (
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{coupon.partnerName}</span>
                              <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>
                                {coupon.commissionRate ?? 0}% comissão
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                            R$ {(coupon.totalRevenue || 0).toFixed(2).replace('.', ',')}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {coupon.totalSales || 0} pedidos {isFiltered ? 'no período' : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, color: coupon.partnerName ? '#166534' : 'var(--text-muted)' }}>
                          {coupon.partnerName ? `R$ ${(coupon.totalCommission || 0).toFixed(2).replace('.', ',')}` : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {coupon.usageLimit ? `${coupon.usageCount} / ${coupon.usageLimit}` : `${coupon.usageCount} usos`}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '99px', background: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#dc2626', fontWeight: 600 }}>
                              {active ? 'Ativo' : isExpired ? 'Expirado' : limitReached ? 'Esgotado' : 'Inativo'}
                            </span>
                            <button
                              onClick={() => startEdit(coupon)}
                              style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--navy)', padding: '0.35rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 600 }}
                              title="Editar cupom"
                            >
                              <Edit2 size={12} /> Editar
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id, coupon.code)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem', display: 'flex' }}
                              title="Excluir cupom"
                            >
                              <Trash2 size={13} />
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

        {/* Creation / Editing Form */}
        <div id="coupon-form-card" style={{ background: '#fff', border: editingId ? '2px solid var(--navy)' : '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {editingId ? <Edit2 size={15} style={{ color: 'var(--navy)' }} /> : <Sparkles size={15} style={{ color: 'var(--gold)' }} />}
              <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                {editingId ? `Editar Cupom: ${code}` : 'Novo Cupom'}
              </h3>
            </div>
            {editingId && (
              <button onClick={cancelEdit} style={{ background: '#f1f5f9', border: 'none', borderRadius: '99px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <X size={12} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={lblStyle}>Código do Cupom *</label>
              <input required type="text" placeholder="Ex: JOAOLUCAS10 ou PROMOSEXY" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={inpStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lblStyle}>Tipo</label>
                <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={inpStyle}>
                  <option value="PERCENTAGE">% Desconto</option>
                  <option value="FIXED">R$ Fixo</option>
                </select>
              </div>
              <div>
                <label style={lblStyle}>Valor *</label>
                <input required type="number" step="0.01" min="0.01" placeholder={discountType === 'PERCENTAGE' ? '10' : '15.00'} value={value} onChange={e => setValue(e.target.value)} style={inpStyle} />
              </div>
            </div>

            {/* Influenciador / Revendedor */}
            <div style={{ background: 'var(--cream)', padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
                🤝 Influenciador / Revendedor (Opcional)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div>
                  <label style={lblStyle}>Nome do Parceiro</label>
                  <input type="text" placeholder="Ex: João Lucas" value={partnerName} onChange={e => setPartnerName(e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Comissão do Parceiro (%)</label>
                  <input type="number" step="0.1" min="0" max="100" placeholder="Ex: 10" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} style={inpStyle} />
                </div>
              </div>
            </div>

            {/* Restrição de Produto */}
            <div>
              <label style={lblStyle}>Restrito a Produto Específico (Opcional)</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} style={inpStyle}>
                <option value="">Aplicar a toda a loja</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={lblStyle}>Compra Mínima (Opcional)</label>
              <input type="number" step="0.01" min="0" placeholder="Ex: 100.00" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} style={inpStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lblStyle}>Limite Usos</label>
                <input type="number" min="1" placeholder="Ex: 50" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} style={inpStyle} />
              </div>
              <div>
                <label style={lblStyle}>Expiração</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inpStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                id="isFreeShipping"
                checked={isFreeShipping}
                onChange={e => setIsFreeShipping(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--navy)' }}
              />
              <label htmlFor="isFreeShipping" style={{ fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 500, cursor: 'pointer', margin: 0 }}>
                🎁 Concede Frete Grátis ao cliente
              </label>
            </div>

            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  id="activeState"
                  checked={activeState}
                  onChange={e => setActiveState(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--navy)' }}
                />
                <label htmlFor="activeState" style={{ fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 500, cursor: 'pointer', margin: 0 }}>
                  Cupom Ativo
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1, marginTop: '0.5rem' }}>
                {submitting ? (
                  <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> {editingId ? 'Salvando...' : 'Criando...'}</>
                ) : editingId ? (
                  <><CheckCircle2 size={14} /> Salvar Alterações</>
                ) : (
                  <><Plus size={14} /> Criar Cupom</>
                )}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{ padding: '0.75rem 1rem', background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                  Cancelar
                </button>
              )}
            </div>
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
