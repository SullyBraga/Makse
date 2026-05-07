'use client'
import { useState } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'

type DiscountTable = { id: string; name: string; percentage: number }

type Props = {
  userId: string
  discountTables: DiscountTable[]
}

export default function ApproveUserClient({ userId, discountTables }: Props) {
  const [selectedTable, setSelectedTable] = useState(discountTables[0]?.id ?? '')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  const handleApprove = async () => {
    if (!selectedTable) return
    setLoading('approve')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve', discountTableId: selectedTable }),
      })
      if (res.ok) setDone('approved')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    setLoading('reject')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject' }),
      })
      if (res.ok) setDone('rejected')
    } finally {
      setLoading(null)
    }
  }

  if (done === 'approved') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '0.4rem 0.875rem', borderRadius: '99px' }}>
        <Check size={13} /> Aprovada como Cabeleireira
      </div>
    )
  }

  if (done === 'rejected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', background: '#fee2e2', padding: '0.4rem 0.875rem', borderRadius: '99px' }}>
        <X size={13} /> Não aprovada
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
      {/* Select tabela de desconto */}
      <div style={{ position: 'relative' }}>
        <select
          value={selectedTable}
          onChange={e => setSelectedTable(e.target.value)}
          style={{
            appearance: 'none', border: '1px solid #e8e2da', borderRadius: '8px',
            padding: '0.45rem 2rem 0.45rem 0.75rem', fontSize: '0.78rem',
            color: '#0d1b2a', background: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >
          {discountTables.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9b8f88', pointerEvents: 'none' }} />
      </div>

      {/* Aprovar */}
      <button
        onClick={handleApprove}
        disabled={!!loading || !selectedTable}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.45rem 0.875rem', background: '#16a34a', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 500,
          cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
        }}
      >
        <Check size={13} /> {loading === 'approve' ? 'Aprovando...' : 'Aprovar'}
      </button>

      {/* Rejeitar */}
      <button
        onClick={handleReject}
        disabled={!!loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.45rem 0.875rem', background: '#fee2e2', color: '#dc2626',
          border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 500,
          cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
        }}
      >
        <X size={13} /> {loading === 'reject' ? 'Rejeitando...' : 'Rejeitar'}
      </button>
    </div>
  )
}
