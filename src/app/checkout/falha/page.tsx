import Link from 'next/link'
import { XCircle } from 'lucide-react'
export default function CheckoutFalha() {
  return (
    <div style={{ maxWidth: 480, margin: '8rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
      <XCircle size={56} style={{ color: '#dc2626', margin: '0 auto 1.5rem', display: 'block' }} />
      <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>Pagamento não aprovado</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Verifique os dados e tente novamente.</p>
      <Link href="/checkout" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>Tentar novamente</Link>
    </div>
  )
}
