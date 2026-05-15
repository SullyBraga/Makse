'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, User, MapPin, Phone, AtSign, Building2 } from 'lucide-react'

type AccountType = 'client' | 'professional'

export default function CadastroPage() {
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    // cliente
    address: '',
    // profissional
    salonName: '', city: '', cnpj: '', salonAddress: '', instagram: '',
  })

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountType) {
      setError('Selecione o tipo de cadastro.')
      return
    }
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
        phone: form.phone,
        password: form.password,
        type: accountType,
      }
      if (accountType === 'client') {
        payload.address = form.address
      }
      if (accountType === 'professional') {
        payload.salonName = form.salonName
        payload.city = form.city
        payload.cnpj = form.cnpj
        payload.salonAddress = form.salonAddress
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
  const isClient = accountType === 'client'

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
                <input type="text" className="input-field" required placeholder="Seu nome completo" style={{ paddingLeft: '2.25rem' }} value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Telefone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="tel" className="input-field" required placeholder="(00) 00000-0000" style={{ paddingLeft: '2.25rem' }} value={form.phone} onChange={e => update('phone', e.target.value)} />
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

            {/* Seletor de tipo — botões pequenos e sutis */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '0.6rem' }}>Tipo de cadastro</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {([
                  { type: 'client' as AccountType, label: 'Cliente' },
                  { type: 'professional' as AccountType, label: 'Profissional' },
                ]).map(item => {
                  const active = accountType === item.type
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setAccountType(item.type)}
                      style={{
                        padding: '0.35rem 0.9rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: active ? 600 : 400,
                        letterSpacing: '0.08em',
                        border: `1.5px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
                        background: active ? 'var(--navy)' : 'transparent',
                        color: active ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campos extras — Cliente */}
            {isClient && (
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <p style={sectionLabelStyle}>Endereço de entrega</p>
                <div>
                  <label style={labelStyle}>Endereço completo</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-field" placeholder="Rua, número, bairro, cidade, CEP" style={{ paddingLeft: '2.25rem' }} value={form.address} onChange={e => update('address', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Campos extras — Profissional */}
            {isPro && (
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <p style={sectionLabelStyle}>Dados do estabelecimento</p>

                <div>
                  <label style={labelStyle}>Nome do salão / estabelecimento *</label>
                  <input type="text" className="input-field" required={isPro} placeholder="Studio Beauty Hair" value={form.salonName} onChange={e => update('salonName', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>CNPJ *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" className="input-field" required={isPro} placeholder="00.000.000/0001-00" style={{ paddingLeft: '2.25rem' }} value={form.cnpj} onChange={e => update('cnpj', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Cidade *</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" className="input-field" required={isPro} placeholder="Rio de Janeiro" style={{ paddingLeft: '2.25rem' }} value={form.city} onChange={e => update('city', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Endereço do estabelecimento *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-field" required={isPro} placeholder="Rua, número, bairro, CEP" style={{ paddingLeft: '2.25rem' }} value={form.salonAddress} onChange={e => update('salonAddress', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Rede social profissional *</label>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-field" required={isPro} placeholder="@seusalao" style={{ paddingLeft: '2.25rem' }} value={form.instagram} onChange={e => update('instagram', e.target.value)} />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--navy)' }}>Aprovação em até 48h.</strong> Nossa equipe analisará seus dados para liberar o acesso profissional.
                </div>
              </div>
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

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '0.25rem',
}
