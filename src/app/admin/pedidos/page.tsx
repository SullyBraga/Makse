import { prisma } from '@/lib/prisma'
import UpdateOrderStatus from '@/components/admin/UpdateOrderStatus'
import { ShoppingBag, User, Store } from 'lucide-react'

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  PAGO:                   { label: 'Pago',           bg: '#dbeafe', text: '#1d4ed8' },
  EM_SEPARACAO:           { label: 'Em Separação',   bg: '#fef9c3', text: '#a16207' },
  ENVIADO:                { label: 'Enviado',        bg: '#dcfce7', text: '#166534' },
  ENTREGUE:               { label: 'Entregue',       bg: '#f3f4f6', text: '#4b5563' },
  CANCELADO:              { label: 'Cancelado',      bg: '#fee2e2', text: '#dc2626' },
  AGUARDANDO_PAGAMENTO:   { label: 'Aguardando',     bg: '#ffedd5', text: '#c2410c' },
}

const paymentLabel: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CREDITO: 'Crédito',
  DEBITO: 'Débito', STRIPE: 'Stripe', OUTRO: 'Outro',
}

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, role: true } },
      seller: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true } },
          kit: { select: { name: true } },
          variant: { select: { label: true } },
        },
      },
    },
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#0d1b2a', marginBottom: '0.25rem' }}>Pedidos</h1>
        <p style={{ fontSize: '0.835rem', color: '#6b6b6b' }}>Todos os pedidos — online e registrados por vendedores</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e8e2da', borderRadius: '14px', padding: '4rem 1.5rem', textAlign: 'center' }}>
            <ShoppingBag size={36} style={{ color: '#e2ddd6', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem', color: '#9b8f88' }}>Nenhum pedido ainda</p>
          </div>
        ) : orders.map(order => {
          const sc = statusConfig[order.status] ?? { label: order.status, bg: '#f3f4f6', text: '#6b7280' }
          const clientName = order.customerName || order.user.name
          const clientEmail = order.customerName ? null : order.user.email
          const isSeller = !!order.sellerId

          return (
            <div key={order.id} style={{ background: '#fff', border: '1px solid #e8e2da', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.375rem', borderBottom: '1px solid #f0ebe4', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9b8f88', background: '#f8f4f0', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: sc.bg, color: sc.text, fontWeight: 600 }}>
                    {sc.label}
                  </span>
                  {isSeller && (
                    <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#fef9c3', color: '#a16207', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Store size={9} /> Venda direta
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9b8f88' }}>
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: '#0d1b2a' }}>
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', borderBottom: '1px solid #f0ebe4' }}>

                {/* Cliente */}
                <div style={{ padding: '1rem 1.375rem', borderRight: '1px solid #f0ebe4' }}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <User size={9} /> Cliente
                  </p>
                  <p style={{ fontSize: '0.84rem', fontWeight: 500, color: '#0d1b2a' }}>{clientName}</p>
                  {clientEmail && <p style={{ fontSize: '0.72rem', color: '#9b8f88' }}>{clientEmail}</p>}
                  {order.customerCpf && <p style={{ fontSize: '0.72rem', color: '#9b8f88' }}>CPF: {order.customerCpf}</p>}
                  {order.customerPhone && <p style={{ fontSize: '0.72rem', color: '#9b8f88' }}>Tel: {order.customerPhone}</p>}
                  {order.customerAddress && <p style={{ fontSize: '0.72rem', color: '#9b8f88', marginTop: '0.25rem' }}>{order.customerAddress}</p>}
                  <p style={{ fontSize: '0.65rem', color: '#b8afa7', marginTop: '0.2rem' }}>{order.user.role}</p>
                </div>

                {/* Venda / Pagamento */}
                <div style={{ padding: '1rem 1.375rem', borderRight: '1px solid #f0ebe4' }}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Store size={9} /> Venda
                  </p>
                  {order.seller ? (
                    <p style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0d1b2a' }}>Vendedor: {order.seller.name}</p>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#9b8f88' }}>Online (site)</p>
                  )}
                  <p style={{ fontSize: '0.72rem', color: '#9b8f88', marginTop: '0.2rem' }}>
                    Pgto: {paymentLabel[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}
                  </p>
                  {order.sellerNote && (
                    <p style={{ fontSize: '0.72rem', color: '#9b8f88', fontStyle: 'italic', marginTop: '0.25rem' }}>"{order.sellerNote}"</p>
                  )}
                  {order.trackingCode && (
                    <p style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#1d4ed8', marginTop: '0.25rem' }}>📦 {order.trackingCode}</p>
                  )}
                </div>

                {/* Itens */}
                <div style={{ padding: '1rem 1.375rem' }}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Itens ({order.items.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.78rem', color: '#0d1b2a' }}>
                          {item.kit ? `[Kit] ${item.kit.name}` : `${item.product?.name ?? '?'}${item.variant ? ` — ${item.variant.label}` : ''}`}
                          <span style={{ color: '#9b8f88' }}> ×{item.quantity}</span>
                        </p>
                        <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                          R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '0.75rem 1.375rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
