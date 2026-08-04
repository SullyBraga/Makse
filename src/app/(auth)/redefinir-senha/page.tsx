'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Token de redefinição ausente na URL.')
      return
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem. Digite novamente.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir a senha.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!token && !success) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Link de redefinição inválido ou incompleto.
        </p>
        <Link href="/esqueci-senha" style={{ color: 'var(--navy)', fontSize: '0.85rem', fontWeight: 600 }}>
          Solicitar novo link de redefinição
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.4rem' }}>
          Nova Senha
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Crie uma nova senha de acesso para sua conta
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {success ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <CheckCircle size={36} style={{ color: '#16a34a', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>
            Senha Alterada com Sucesso!
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#15803d', marginBottom: '1.25rem' }}>
            Sua nova senha foi salva. Você já pode fazer login na sua conta.
          </p>
          <Link href="/login" style={{ display: 'inline-block', width: '100%', padding: '0.75rem', background: 'var(--navy)', color: '#fff', borderRadius: '999px', fontSize: '0.825rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
            Fazer Login Agora
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.675rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Nova Senha *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="No mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 2.5rem',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
                  color: 'var(--navy)', background: '#fff',
                }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.675rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Confirmar Nova Senha *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 2.5rem',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
                  color: 'var(--navy)', background: '#fff',
                }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
            {loading ? 'Salvando nova senha...' : 'Redefinir Senha'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

      </div>
    </div>
  )
}
