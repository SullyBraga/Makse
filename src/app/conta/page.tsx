'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Package, User, LogOut, Edit3, Check, X, Eye, EyeOff, Scissors, RefreshCw, MapPin, Plus, Trash2 } from 'lucide-react'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  PAGO:                 { bg: 'var(--cream)', color: 'var(--navy)', label: 'Pago' },
  EM_SEPARACAO:         { bg: '#fef9c3', color: '#a16207', label: 'Em Separação' },
  ENVIADO:              { bg: '#dcfce7', color: '#166534', label: 'Enviado' },
  ENTREGUE:             { bg: '#f3f4f6', color: '#6b7280', label: 'Entregue' },
  CANCELADO:            { bg: '#fee2e2', color: '#dc2626', label: 'Cancelado' },
  AGUARDANDO_PAGAMENTO: { bg: '#ffedd5', color: '#c2410c', label: 'Aguardando' },
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  CABELEIREIRA: 'Profissional',
  CLIENTE_FINAL: 'Cliente Final',
  PENDENTE: 'Pendente',
}

type UserData = {
  id: string; name: string; email: string; role: string
  discountTable: { name: string; percentage: number } | null
  orders: { id: string; total: number; status: string; createdAt: string; items: any[] }[]
}

export default function ContaPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [tab, setTab] = useState<'pedidos' | 'enderecos'>('pedidos')
  const [addresses, setAddresses] = useState<any[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [editingAddress, setEditingAddress] = useState<any | null>(null)
  const [addingAddress, setAddingAddress] = useState(false)
  const [addrForm, setAddrForm] = useState({ street: '', number: '', complement: '', city: '', state: '', zipCode: '', country: 'Brasil' })
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrError, setAddrError] = useState('')

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses')
      const data = await res.json()
      if (Array.isArray(data)) setAddresses(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    fetch('/api/conta')
      .then(r => r.json())
      .then(data => {
        setUser(data)
        setForm(f => ({ ...f, name: data.name }))
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetchAddresses()
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload: Record<string, string> = {}
      if (form.name !== user?.name) payload.name = form.name
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }
      const res = await fetch('/api/conta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setUser(prev => prev ? { ...prev, name: data.name ?? prev.name } : prev)
      setSuccess('Dados atualizados com sucesso!')
      setEditing(false)
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddrSaving(true)
    setAddrError('')
    try {
      const isEdit = !!editingAddress
      const url = isEdit ? `/api/addresses/${editingAddress.id}` : '/api/addresses'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addrForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar endereço')
      
      if (isEdit) {
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? data : a))
      } else {
        setAddresses(prev => [data, ...prev])
      }
      
      setEditingAddress(null)
      setAddingAddress(false)
      setAddrForm({ street: '', number: '', complement: '', city: '', state: '', zipCode: '', country: 'Brasil' })
    } catch (err: any) {
      setAddrError(err.message)
    } finally {
      setAddrSaving(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir endereço')
      }
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao definir endereço como padrão')
      }
      setAddresses(prev =>
        prev.map(a => ({
          ...a,
          isDefault: a.id === id,
        })).sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
      )
    } catch (err: any) {
      alert(err.message)
    }
  }

  const startEditAddress = (addr: any) => {
    setEditingAddress(addr)
    setAddingAddress(false)
    setAddrForm({
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country || 'Brasil',
    })
    setAddrError('')
  }

  const startNewAddress = () => {
    setAddingAddress(true)
    setEditingAddress(null)
    setAddrForm({ street: '', number: '', complement: '', city: '', state: '', zipCode: '', country: 'Brasil' })
    setAddrError('')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Não foi possível carregar sua conta.</p>
        <Link href="/login" className="btn-primary" style={{ fontSize: '0.72rem' }}>Fazer login</Link>
      </div>
    )
  }

  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 2rem' }}>

        <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(2rem,3vw,2.5rem)', fontWeight: 400, color: 'var(--navy)', marginBottom: '2rem' }}>
          Minha Conta
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Avatar card */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.75rem', border: '1px solid var(--border)', textAlign: 'center' }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), var(--cream-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 400,
                color: 'var(--navy)', margin: '0 auto 1rem', flexShrink: 0,
              }}>
                {initial}
              </div>
              <p style={{ fontWeight: 500, color: 'var(--navy)', marginBottom: '0.25rem' }}>{user.name}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>{user.email}</p>
              <span style={{
                display: 'inline-block', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.3rem 0.75rem', borderRadius: '99px',
                background: 'var(--cream)', color: 'var(--navy)', fontWeight: 600,
                border: '1px solid var(--border)',
              }}>
                {user.role === 'CABELEIREIRA' ? <><Scissors size={10} style={{ display: 'inline', marginRight: 4 }} />Profissional</> : roleLabel[user.role] ?? user.role}
              </span>
              {user.discountTable && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  ✦ {user.discountTable.name} — {user.discountTable.percentage}% de desconto
                </p>
              )}
            </div>

            {/* Nav */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {[
                { icon: <Package size={14} />, label: 'Meus Pedidos', active: tab === 'pedidos' && !editing, onClick: () => { setTab('pedidos'); setEditing(false) } },
                { icon: <MapPin size={14} />, label: 'Meus Endereços', active: tab === 'enderecos' && !editing, onClick: () => { setTab('enderecos'); setEditing(false) } },
                { icon: <User size={14} />, label: 'Dados Pessoais', active: editing, onClick: () => setEditing(true) },
              ].map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1.25rem', width: '100%', background: 'none', border: 'none',
                    fontSize: '0.82rem', color: item.active ? 'var(--navy)' : 'var(--text-muted)',
                    fontWeight: item.active ? 600 : 400,
                    borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    borderLeft: item.active ? '3px solid var(--gold)' : '3px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: item.active ? 'var(--navy)' : 'var(--gold)', display: 'flex' }}>{item.icon}</span> {item.label}
                </button>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', width: '100%', background: 'none', border: 'none', fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', borderTop: '1px solid var(--border)', borderLeft: '3px solid transparent', textAlign: 'left' }}
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Editar dados */}
            {editing && (
              <div id="dados" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.3rem', fontWeight: 400, color: 'var(--navy)' }}>
                    Editar Dados
                  </h2>
                  <button onClick={() => { setEditing(false); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    <X size={18} />
                  </button>
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#dc2626' }}>{error}</div>}
                {success && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#166534' }}>{success}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Nome completo</label>
                    <input type="text" className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Alterar senha (opcional)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Senha atual</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showPwd ? 'text' : 'password'} className="input-field" style={{ paddingRight: '2.5rem' }} value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
                          <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Nova senha</label>
                        <input type={showPwd ? 'text' : 'password'} className="input-field" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', padding: '0.65rem 1.5rem', opacity: saving ? 0.7 : 1 }}>
                      {saving ? <RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Check size={13} />}
                      {saving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-outline" style={{ fontSize: '0.72rem', padding: '0.65rem 1.25rem' }}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Botão editar — quando não estiver editando */}
            {!editing && (
              <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '0.15rem' }}>{user.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--navy)', letterSpacing: '0.05em' }}
                >
                  <Edit3 size={12} /> Editar
                </button>
              </div>
            )}

            {/* PENDENTE warning */}
            {user.role === 'PENDENTE' && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '12px', padding: '1rem 1.25rem' }} className="animate-up">
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e', marginBottom: '0.3rem' }}>⏳ Aprovação em análise</p>
                <p style={{ fontSize: '0.82rem', color: '#a16207', lineHeight: 1.6 }}>
                  Sua solicitação como <strong>Profissional</strong> está sendo analisada pela nossa equipe. Você será notificado em até 48h e receberá acesso completo e desconto exclusivo após a aprovação.
                </p>
              </div>
            )}

            {tab === 'pedidos' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>
                  Meus Pedidos
                </h2>

                {user.orders.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '3rem', textAlign: 'center' }}>
                    <Package size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Você ainda não realizou nenhum pedido.
                    </p>
                    <Link href="/catalogo" className="btn-primary" style={{ fontSize: '0.7rem' }}>Ver Produtos</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {user.orders.map(order => {
                      const st = statusColors[order.status] ?? { bg: 'var(--cream)', color: 'var(--navy)', label: order.status }
                      return (
                        <div key={order.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{order.id.slice(-8)}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')} · {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                              </p>
                            </div>
                            <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.75rem', borderRadius: '99px', background: st.bg, color: st.color, fontWeight: 500, letterSpacing: '0.05em' }}>
                              {st.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-cormorant), serif' }}>
                              R$ {order.total.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'enderecos' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>
                    Meus Endereços
                  </h2>
                  {!addingAddress && !editingAddress && (
                    <button onClick={startNewAddress} className="btn-primary" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                      <Plus size={14} /> Novo Endereço
                    </button>
                  )}
                </div>

                {/* Form for Adding or Editing Address */}
                {(addingAddress || editingAddress) && (
                  <form onSubmit={handleSaveAddress} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>
                      {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                    </h3>
                    
                    {addrError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#dc2626' }}>{addrError}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>CEP *</label>
                        <input type="text" className="input-field" required placeholder="00000-000" value={addrForm.zipCode} onChange={e => setAddrForm(f => ({ ...f, zipCode: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Cidade *</label>
                        <input type="text" className="input-field" required placeholder="Cidade" value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Rua / Logradouro *</label>
                        <input type="text" className="input-field" required placeholder="Av. Paulista" value={addrForm.street} onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Número *</label>
                        <input type="text" className="input-field" required placeholder="123" value={addrForm.number} onChange={e => setAddrForm(f => ({ ...f, number: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Bairro / Complemento</label>
                        <input type="text" className="input-field" placeholder="Apto, Bloco, etc." value={addrForm.complement} onChange={e => setAddrForm(f => ({ ...f, complement: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.35rem' }}>Estado (UF) *</label>
                        <input type="text" className="input-field" required placeholder="SP" value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                      <button type="submit" disabled={addrSaving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', padding: '0.65rem 1.5rem', opacity: addrSaving ? 0.7 : 1 }}>
                        {addrSaving ? <RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Check size={13} />}
                        {addrSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button type="button" onClick={() => { setAddingAddress(false); setEditingAddress(null) }} className="btn-outline" style={{ fontSize: '0.72rem', padding: '0.65rem 1.25rem' }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {loadingAddresses ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
                  </div>
                ) : addresses.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '3rem', textAlign: 'center' }}>
                    <MapPin size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Você não tem nenhum endereço cadastrado.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {addresses.map(addr => (
                      <div key={addr.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {addr.street}, {addr.number}
                            {addr.isDefault && (
                              <span style={{ fontSize: '0.55rem', background: 'var(--navy)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Padrão</span>
                            )}
                          </p>
                          {addr.complement && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{addr.complement}</p>
                          )}
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {addr.city} - {addr.state}, CEP {addr.zipCode}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!addr.isDefault && (
                            <button onClick={() => handleSetDefaultAddress(addr.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', border: '1px solid var(--gold)', borderRadius: '99px', background: 'none', fontSize: '0.68rem', cursor: 'pointer', color: 'var(--gold)', fontWeight: 600 }}>
                              Definir como Principal
                            </button>
                          )}
                          <button onClick={() => startEditAddress(addr)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.68rem', cursor: 'pointer', color: 'var(--navy)' }}>
                            <Edit3 size={11} /> Editar
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.68rem', cursor: 'pointer', color: '#dc2626' }}>
                            <Trash2 size={11} /> Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}