import Link from 'next/link'
import { Clock } from 'lucide-react'
export default function CheckoutPendente() {
  return (
    <div style={{ maxWidth: 480, margin: '8rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
      <Clock size={56} style={{ color: '#d97706', margin: '0 auto 1.5rem', display: 'block' }} />
      <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>Pagamento pendente</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Estamos aguardando a confirmação do pagamento. Você também pode acessar <strong>Meus Pedidos</strong> na sua conta para concluir o pagamento a qualquer momento.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/conta" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Meus Pedidos
        </Link>
        <Link href="/" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
