'use client'
import { useEffect, useState } from 'react'
import ApproveUserClient from '@/components/admin/ApproveUserClient'
import UserActions from '@/components/admin/UserActions'
import { Users, Search, RefreshCw, UserPlus, X, Eye, EyeOff, Percent, Trash2 } from 'lucide-react'

const roleConfig: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN:         { label: 'Admin',         bg: 'var(--cream-dark)', color: 'var(--navy)' },
  CABELEIREIRA:  { label: 'Profissional',  bg: '#dcfce7', color: '#166534' },
  CLIENTE_FINAL: { label: 'Cliente Final', bg: '#dbeafe', color: '#1d4ed8' },
  PENDENTE:      { label: 'Pendente',      bg: '#fef9c3', color: '#a16207' },
  VENDEDOR:      { label: 'Vendedor',      bg: '#ede9fe', color: '#7c3aed' },
}

type User = {
  id: string; name: string; email: string; role: string; createdAt: string
  discountTable: { id: string; name: string; percentage: number } | null
  professionalReq: { salonName: string; city: string; phone: string; instagram?: string } | null
}

type DiscountTable = { id: string; name: string; percentage: number }

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [discountTables, setDiscountTables] = useState<DiscountTable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create seller modal
  const [showCreateSeller, setShowCreateSeller] = useState(false)
  const [sellerForm, setSellerForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [sellerLoading, setSellerLoading] = useState(false)
  const [sellerError, setSellerError] = useState('')
  const [sellerOk, setSellerOk] = useState(false)

  // Manage discount tables modal
  const [showDiscountTablesModal, setShowDiscountTablesModal] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTablePercentage, setNewTablePercentage] = useState('')
  const [tableActionLoading, setTableActionLoading] = useState(false)
  const [tableActionError, setTableActionError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const [usersRes, tablesRes] = await Promise.all([
      fetch('/api/admin/users-list'),
      fetch('/api/admin/discount-tables'),
    ])
    if (usersRes.ok) setUsers(await usersRes.json())
    if (tablesRes.ok) {
      const raw: DiscountTable[] = await tablesRes.json()
      const seen = new Set<string>()
      const unique = raw.filter(t => {
        const key = `${t.name}|${t.percentage}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setDiscountTables(unique)
    }
    setLoading(false)
  }

  const handleCreateDiscountTable = async (e: React.FormEvent) => {
    e.preventDefault()
    setTableActionLoading(true)
    setTableActionError('')
    try {
      const res = await fetch('/api/admin/discount-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName, percentage: newTablePercentage }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTableActionError(data.error || 'Erro ao criar tabela de desconto')
      } else {
        setNewTableName('')
        setNewTablePercentage('')
        await fetchData()
      }
    } catch (err) {
      setTableActionError('Erro ao criar tabela de desconto')
    } finally {
      setTableActionLoading(false)
    }
  }

  const handleDeleteDiscountTable = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tabela de desconto? Usuários com este desconto voltarão a ficar "Sem desconto".')) return
    setTableActionLoading(true)
    setTableActionError('')
    try {
      const res = await fetch('/api/admin/discount-tables', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setTableActionError(data.error || 'Erro ao deletar tabela de desconto')
      } else {
        await fetchData()
      }
    } catch (err) {
      setTableActionError('Erro ao deletar tabela de desconto')
    } finally {
      setTableActionLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])


  const handleAction = (userId: string, action: 'deleted' | 'roleChanged' | 'discountChanged') => {
    if (action === 'deleted') {
      setUsers(prev => prev.filter(u => u.id !== userId))
    } else {
      fetchData()
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const pending = filtered.filter(u => u.role === 'PENDENTE')
  const others = filtered.filter(u => u.role !== 'PENDENTE')

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    setSellerLoading(true); setSellerError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sellerForm, type: 'vendedor' }),
    })
    const data = await res.json()
    if (!res.ok) { setSellerError(data.error || 'Erro ao criar conta'); setSellerLoading(false); return }
    setSellerOk(true)
    setTimeout(() => {
      setShowCreateSeller(false); setSellerOk(false)
      setSellerForm({ name: '', email: '', password: '' })
      fetchData()
    }, 2000)
    setSellerLoading(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.2rem' }}>Usuários</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Gerencie clientes, profissionais e aprovações</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button onClick={() => setShowDiscountTablesModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.125rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--navy)', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            <Percent size={13} style={{ color: 'var(--gold)' }} /> Tabelas de Desconto
          </button>
          <button onClick={() => setShowCreateSeller(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.125rem', border: 'none', borderRadius: '99px', background: '#7c3aed', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            <UserPlus size={13} /> Criar Vendedor
          </button>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </div>

      {/* Create Seller Modal */}
      {showCreateSeller && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Criar Conta Vendedor</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>A conta terá acesso ao painel /vendas e preços de vendedor</p>
              </div>
              <button onClick={() => setShowCreateSeller(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={18} /></button>
            </div>

            {sellerError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem', fontSize: '0.82rem', color: '#dc2626', marginBottom: '1rem' }}>{sellerError}</div>}
            {sellerOk && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.82rem', color: '#166534', marginBottom: '1rem' }}>✓ Vendedor criado com sucesso!</div>}

            <form onSubmit={handleCreateSeller} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[{ label: 'Nome completo', key: 'name', type: 'text', placeholder: 'João Silva' },
                { label: 'E-mail', key: 'email', type: 'email', placeholder: 'joao@email.com' }]
                .map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.63rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>{f.label}</label>
                    <input required type={f.type} placeholder={f.placeholder}
                      value={(sellerForm as any)[f.key]}
                      onChange={e => setSellerForm(s => ({ ...s, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '0.55rem 0.875rem', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)' }} />
                  </div>
                ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.63rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>Senha inicial</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" minLength={6}
                    value={sellerForm.password} onChange={e => setSellerForm(s => ({ ...s, password: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 2.25rem 0.55rem 0.875rem', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)' }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={sellerLoading}
                style={{ width: '100%', padding: '0.75rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: sellerLoading ? 0.7 : 1 }}>
                {sellerLoading ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Criando...</> : <><UserPlus size={14} /> Criar Conta Vendedor</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Discount Tables Modal */}
      {showDiscountTablesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Tabelas de Desconto</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Crie e gerencie as opções de desconto para clientes profissionais</p>
              </div>
              <button onClick={() => setShowDiscountTablesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={18} /></button>
            </div>

            {tableActionError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem', fontSize: '0.82rem', color: '#dc2626', marginBottom: '1rem', flexShrink: 0 }}>{tableActionError}</div>}

            {/* List of existing tables */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.5rem' }}>
              {discountTables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhuma tabela cadastrada. Crie uma abaixo.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {discountTables.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--cream)', borderRadius: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>{t.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#d97706', marginLeft: '0.5rem', fontWeight: 500 }}>{t.percentage}%</span>
                      </div>
                      <button
                        onClick={() => handleDeleteDiscountTable(t.id)}
                        disabled={tableActionLoading}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', opacity: tableActionLoading ? 0.5 : 1 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to create new table */}
            <form onSubmit={handleCreateDiscountTable} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>Nova Tabela de Desconto</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.63rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>Nome da Tabela</label>
                  <input required type="text" placeholder="Ex: Bronze"
                    value={newTableName} onChange={e => setNewTableName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.875rem', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.63rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>Desconto %</label>
                  <input required type="number" min="0" max="100" step="any" placeholder="15"
                    value={newTablePercentage} onChange={e => setNewTablePercentage(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.875rem', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)' }} />
                </div>
              </div>
              <button type="submit" disabled={tableActionLoading}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: tableActionLoading ? 0.7 : 1 }}>
                {tableActionLoading ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Criando...</> : 'Criar Tabela'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.82rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <RefreshCw size={24} style={{ margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite', display: 'block', color: 'var(--gold)' }} />
          Carregando...
        </div>
      ) : (
        <>
          {/* Pendentes */}
          {pending.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.875rem' }}>
                ⏳ Aguardando Aprovação ({pending.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pending.map(user => (
                  <div key={user.id} style={{ background: '#fff', border: '1px solid var(--border)', borderLeft: '4px solid var(--gold)', borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '0.2rem' }}>{user.name}</p>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{user.email}</p>
                        {user.professionalReq && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {user.professionalReq.salonName} · {user.professionalReq.city} · {user.professionalReq.phone}
                            {user.professionalReq.instagram && ` · ${user.professionalReq.instagram}`}
                          </p>
                        )}
                      </div>
                      {discountTables.length > 0 && (
                        <ApproveUserClient
                          userId={user.id}
                          discountTables={discountTables.map(t => ({ id: t.id, name: `${t.name} (${t.percentage}%)`, percentage: t.percentage }))}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All users table */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={14} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>
                Todos os Usuários ({filtered.length})
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Search size={28} style={{ color: 'var(--border)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
                      {['Nome', 'E-mail', 'Tipo', 'Desconto', 'Cadastro', 'Ações'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.25rem', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...pending, ...others].map(user => {
                      const rc = roleConfig[user.role] ?? { label: user.role, bg: 'var(--cream)', color: 'var(--navy)' }
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--cream)' }}>
                          <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.84rem', fontWeight: 500, color: 'var(--navy)' }}>{user.name}</td>
                          <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</td>
                          <td style={{ padding: '0.875rem 1.25rem' }}>
                            <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: rc.bg, color: rc.color, fontWeight: 600 }}>
                              {rc.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {user.discountTable ? `${user.discountTable.name} (${user.discountTable.percentage}%)` : '—'}
                          </td>
                          <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '0.875rem 1.25rem' }}>
                            <UserActions
                              userId={user.id}
                              currentRole={user.role}
                              userName={user.name}
                              currentDiscountTableId={user.discountTable?.id ?? null}
                              discountTables={discountTables}
                              onActionDone={handleAction}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
