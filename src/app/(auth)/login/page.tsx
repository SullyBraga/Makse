'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Scissors, ShoppingBag, ArrowRight } from 'lucide-react'
import { signIn } from 'next-auth/react'

function LoginForm() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const redirect = searchParams.get('redirect') || '/'

  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.error) {
        setError('E-mail ou senha incorretos. Verifique seus dados.')
      } else {
        // Fetch session to determine redirect based on role
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role
        if (role === 'ADMIN') {
          window.location.href = '/admin'
        } else if (role === 'VENDEDOR') {
          window.location.href = '/admin/vendas'
        } else {
          window.location.href = redirect
        }
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2.25rem', fontWeight: 300, letterSpacing: '0.28em', color: 'var(--navy)' }}>MAKSE</span>
            <span style={{ fontSize: '8px', letterSpacing: '0.4em', color: 'var(--gold)', textTransform: 'uppercase' }}>— Profissional —</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '2.5rem', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.85rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.4rem' }}>
              Bem-vinda de volta
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Entre na sua conta Makse Profissional
            </p>
          </div>

          {/* Banner de registro bem-sucedido */}
          {registered === '1' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#166534', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem' }}>✅</span>
              <div>
                <strong>Conta criada com sucesso!</strong>
                <br />Faça login para continuar.
              </div>
            </div>
          )}
          {registered === 'pending' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#92400e', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem' }}>⏳</span>
              <div>
                <strong>Solicitação enviada!</strong>
                <br />Sua conta profissional está em análise. Você receberá um retorno em breve.
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.4rem' }}>
                E-mail
              </label>
              <input
                type="email"
                className="input-field"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.4rem' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{ paddingRight: '2.75rem' }}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/esqueci-senha" style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.25rem', opacity: loading ? 0.7 : 1, gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Entrando...
                </>
              ) : (
                <>Entrar <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Divisor tipo de cliente */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
          {[
            { icon: <ShoppingBag size={15} />, label: 'Cliente Final', desc: 'Produtos selecionados' },
            { icon: <Scissors size={15} />, label: 'Profissional', desc: 'Acesso completo + desconto' },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: 'var(--gold)' }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.3 }}>{item.label}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
