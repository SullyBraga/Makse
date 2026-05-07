'use client'
import { useState } from 'react'
import { Trash2, RefreshCw, ChevronDown, Check } from 'lucide-react'

type DiscountTable = { id: string; name: string; percentage: number }

type Props = {
  userId: string
  currentRole: string
  userName: string
  currentDiscountTableId?: string | null
  discountTables: DiscountTable[]
  onActionDone: (userId: string, action: 'deleted' | 'roleChanged' | 'discountChanged') => void
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CABELEIREIRA', label: 'Profissional' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'CLIENTE_FINAL', label: 'Cliente Final' },
  { value: 'PENDENTE', label: 'Pendente' },
]

const NONE_VALUE = '__none__'

const selectStyle: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  padding: '0.3rem 1.6rem 0.3rem 0.6rem',
  fontSize: '0.72rem',
  color: 'var(--navy)',
  background: '#fff',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  maxWidth: '130px',
}

const saveBtn = (active: boolean, ok: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.3rem 0.6rem',
  border: 'none', borderRadius: '7px',
  fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer',
  background: ok ? '#dcfce7' : active ? 'var(--navy)' : 'var(--cream)',
  color: ok ? '#166534' : active ? '#fff' : 'var(--text-muted)',
  opacity: 1, transition: 'all 0.2s',
  whiteSpace: 'nowrap' as const,
})

export default function UserActions({
  userId,
  currentRole,
  userName,
  currentDiscountTableId,
  discountTables,
  onActionDone,
}: Props) {
  const [role, setRole] = useState(currentRole)
  const [discountTableId, setDiscountTableId] = useState(currentDiscountTableId ?? NONE_VALUE)
  const [loading, setLoading] = useState<'role' | 'discount' | 'delete' | null>(null)
  const [saved, setSaved] = useState<'role' | 'discount' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleRoleChange = async () => {
    if (role === currentRole || loading) return
    setLoading('role')
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'changeRole', role }),
      })
      setSaved('role')
      setTimeout(() => { setSaved(null); onActionDone(userId, 'roleChanged') }, 1400)
    } finally { setLoading(null) }
  }

  const handleDiscountChange = async () => {
    const newId = discountTableId === NONE_VALUE ? null : discountTableId
    if ((currentDiscountTableId ?? NONE_VALUE) === discountTableId || loading) return
    setLoading('discount')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'changeDiscount', discountTableId: newId }),
      })
      if (res.ok) {
        setSaved('discount')
        setTimeout(() => { setSaved(null); onActionDone(userId, 'discountChanged') }, 1400)
      }
    } finally { setLoading(null) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    if (loading) return
    setLoading('delete')
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      onActionDone(userId, 'deleted')
    } finally { setLoading(null); setConfirmDelete(false) }
  }

  const roleChanged = role !== currentRole
  const discountChanged = discountTableId !== (currentDiscountTableId ?? NONE_VALUE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

      {/* Row 1: Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={role}
            onChange={e => { setRole(e.target.value); setSaved(null) }}
            style={{ ...selectStyle, borderColor: roleChanged ? 'var(--navy)' : 'var(--border)' }}
          >
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={10} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
        <button onClick={handleRoleChange} disabled={!roleChanged || !!loading} style={saveBtn(roleChanged, saved === 'role')}>
          {saved === 'role' ? <><Check size={11} /> Salvo</> : loading === 'role' ? <RefreshCw size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar'}
        </button>
      </div>

      {/* Row 2: Discount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={discountTableId}
            onChange={e => { setDiscountTableId(e.target.value); setSaved(null) }}
            style={{
              ...selectStyle,
              borderColor: discountChanged ? '#d97706' : 'var(--border)',
              maxWidth: '160px',
            }}
          >
            <option value={NONE_VALUE}>— Sem desconto</option>
            {discountTables.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>
            ))}
          </select>
          <ChevronDown size={10} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
        <button
          onClick={handleDiscountChange}
          disabled={!discountChanged || !!loading}
          style={{
            ...saveBtn(discountChanged, saved === 'discount'),
            background: saved === 'discount' ? '#dcfce7' : discountChanged ? '#d97706' : 'var(--cream)',
            color: saved === 'discount' ? '#166534' : discountChanged ? '#fff' : 'var(--text-muted)',
          }}
        >
          {saved === 'discount' ? <><Check size={11} /> Salvo</> : loading === 'discount' ? <RefreshCw size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar'}
        </button>

        {/* Delete — inline with discount row */}
        <button
          onClick={handleDelete}
          disabled={!!loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.3rem 0.6rem',
            border: `1px solid ${confirmDelete ? '#dc2626' : 'var(--border)'}`,
            borderRadius: '7px', fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer',
            background: confirmDelete ? '#fee2e2' : '#fff',
            color: confirmDelete ? '#dc2626' : 'var(--text-muted)',
            opacity: loading === 'delete' ? 0.7 : 1, transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onBlur={() => setTimeout(() => setConfirmDelete(false), 300)}
        >
          {loading === 'delete'
            ? <RefreshCw size={11} style={{ animation: 'spin 0.7s linear infinite' }} />
            : <><Trash2 size={11} /> {confirmDelete ? 'Confirmar?' : 'Excluir'}</>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
