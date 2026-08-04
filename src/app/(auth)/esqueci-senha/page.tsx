'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ocorreu um erro ao solicitar a redefinição.')
      } else {
        setSubmitted(true)
        setMessage(data.message || 'Se o e-mail estiver cadastrado, você receberá as instruções.')
      }
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--navy)' }}>
              MAKSE
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '2.5rem', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>
          
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <ArrowLeft size={14} /> Voltar para o Login
          </Link>

          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.4rem' }}>
              Recuperar Senha
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Informe o e-mail da sua conta para receber o link de redefinição de senha.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {submitted ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
              <CheckCircle size={36} style={{ color: '#16a34a', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>
                Solicitação Enviada!
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#15803d', lineHeight: 1.5, margin: 0 }}>
                {message}
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <Link href="/login" style={{ display: 'inline-block', width: '100%', padding: '0.75rem', background: 'var(--navy)', color: '#fff', borderRadius: '999px', fontSize: '0.825rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                  Ir para a página de Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.675rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Seu E-mail Cadastrado *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                      border: '1px solid var(--border)', borderRadius: '10px',
                      fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
                      color: 'var(--navy)', background: '#fff',
                    }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%', padding: '0.875rem', fontSize: '0.825rem',
                  letterSpacing: '0.1em', marginTop: '0.5rem', opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Enviando instruções...' : 'Enviar Link de Redefinição'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
