'use client'
import { useState } from 'react'
import { ChevronDown, Truck } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'EM_SEPARACAO', label: 'Em Separação' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

type Props = {
  orderId: string
  currentStatus: string
}

export default function UpdateOrderStatus({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [tracking, setTracking] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, trackingCode: tracking || undefined }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setLoading(false)
    }
  }

  const needsTracking = status === 'ENVIADO'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '160px' }}>
      <div style={{ position: 'relative' }}>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setSaved(false) }}
          style={{
            width: '100%', appearance: 'none', border: '1px solid #e8e2da', borderRadius: '8px',
            padding: '0.4rem 1.75rem 0.4rem 0.625rem', fontSize: '0.75rem',
            color: '#0d1b2a', background: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={11} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9b8f88', pointerEvents: 'none' }} />
      </div>

      {needsTracking && (
        <div style={{ position: 'relative' }}>
          <Truck size={11} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9b8f88' }} />
          <input
            type="text"
            placeholder="Código de rastreio"
            value={tracking}
            onChange={e => setTracking(e.target.value)}
            style={{
              width: '100%', border: '1px solid #e8e2da', borderRadius: '8px',
              padding: '0.4rem 0.625rem 0.4rem 1.75rem', fontSize: '0.72rem',
              fontFamily: 'monospace', color: '#0d1b2a', outline: 'none',
            }}
          />
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading || saved}
        style={{
          padding: '0.375rem 0.625rem', border: 'none', borderRadius: '8px', fontSize: '0.72rem',
          background: saved ? '#dcfce7' : '#0d1b2a', color: saved ? '#166534' : '#fff',
          cursor: 'pointer', fontWeight: 500, opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
        }}
      >
        {loading ? 'Salvando...' : saved ? '✓ Salvo' : 'Atualizar'}
      </button>
    </div>
  )
}
