import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSucesso() {
  return (
    <div style={{ maxWidth: 480, margin: '8rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
      <CheckCircle size={56} style={{ color: '#16a34a', margin: '0 auto 1.5rem', display: 'block' }} />
      <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>
        Pagamento aprovado!
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Seu pedido foi confirmado. Em breve você receberá mais informações.
      </p>
      <Link href="/catalogo" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        Continuar comprando
      </Link>
    </div>
  )
}
