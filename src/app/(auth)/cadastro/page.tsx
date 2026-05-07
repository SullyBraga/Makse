'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Scissors, ShoppingBag, ArrowRight, User, MapPin, Phone, AtSign } from 'lucide-react'

type AccountType = 'client' | 'professional'

export default function CadastroPage() {
  const [accountType, setAccountType] = useState<AccountType>('client')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    salonName: '', city: '', phone: '', instagram: '',
  })

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        password: form.password,
        type: accountType,
      }
      if (accountType === 'professional') {
        payload.salonName = form.salonName
        payload.city = form.city
        payload.phone = form.phone
        payload.instagram = form.instagram
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.')
        return
      }
      if (accountType === 'professional') {
        window.location.href = '/login?registered=pending'
      } else {
        window.location.href = '/login?registered=1'
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isPro = accountType === 'professional'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2.25rem', fontWeight: 300, letterSpacing: '0.28em', color: 'var(--navy)' }}>MAKSE</span>
            <span style={{ fontSize: '8px', letterSpacing: '0.4em', color: 'var(--gold)', textTransform: 'uppercase' }}>— Profissional —</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--navy)', marginTop: '1.5rem' }}>
            Criar conta
          </h1>
        </div>

        {/* Seletor de tipo de conta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.75rem' }}>
          {([
            { type: 'client' as AccountType, icon: <ShoppingBag size={18} />, label: 'Cliente Final', desc: 'Produtos selecionados para uso em casa' },
            { type: 'professional' as AccountType, icon: <Scissors size={18} />, label: 'Profissional', desc: 'Acesso completo + tabela de desconto' },
          ]).map(item => (
            <button
              key={item.type}
              type="button"
              onClick={() => setAccountType(item.type)}
              style={{
                border: `2px solid ${accountType === item.type ? 'var(--navy)' : 'var(--border)'}`,
                borderRadius: '14px',
                padding: '1rem 0.875rem',
                background: accountType === item.type ? 'var(--navy)' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ color: accountType === item.type ? 'var(--gold)' : 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>{item.icon}</span>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: accountType === item.type ? '#fff' : 'var(--navy)', marginBottom: '0.2rem' }}>{item.label}</p>
              <p style={{ fontSize: '0.68rem', color: accountType === item.type ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', lineHeight: 1.35 }}>{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Card Formulário */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '2rem 2rem 2.25rem', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Campos comuns */}
            <div>
              <label style={labelStyle}>Nome completo</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input-field" required placeholder="Seu nome" style={{ paddingLeft: '2.25rem' }} value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" className="input-field" required placeholder="seu@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} className="input-field" required placeholder="Mínimo 6 caracteres" style={{ paddingRight: '2.5rem' }} value={form.password} onChange={e => update('password', e.target.value)} />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input type={show ? 'text' : 'password'} className="input-field" required placeholder="Repita a senha" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
              </div>
            </div>

            {/* Campos extras para profissional */}
            {isPro && (
              <>
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.875rem' }}>
                    Dados do Salão
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <label style={labelStyle}>Nome do salão *</label>
                      <input type="text" className="input-field" required={isPro} placeholder="Studio Beauty Hair" value={form.salonName} onChange={e => update('salonName', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={labelStyle}>Cidade *</label>
                        <div style={{ position: 'relative' }}>
                          <MapPin size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input type="text" className="input-field" required={isPro} placeholder="Rio de Janeiro" style={{ paddingLeft: '2.25rem' }} value={form.city} onChange={e => update('city', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Telefone *</label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input type="tel" className="input-field" required={isPro} placeholder="(21) 99999-9999" style={{ paddingLeft: '2.25rem' }} value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Instagram (opcional)</label>
                      <div style={{ position: 'relative' }}>
                        <AtSign size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="input-field" placeholder="@seusalao" style={{ paddingLeft: '2.25rem' }} value={form.instagram} onChange={e => update('instagram', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#92400e' }}>
                  <strong>⏳ Aprovação necessária:</strong> Após o cadastro, nossa equipe analisará sua solicitação e entrará em contato em até 48h.
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  {isPro ? 'Enviando solicitação...' : 'Criando conta...'}
                </>
              ) : (
                <>
                  {isPro ? 'Solicitar acesso profissional' : 'Criar conta'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.68rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontWeight: 500,
  marginBottom: '0.35rem',
}
