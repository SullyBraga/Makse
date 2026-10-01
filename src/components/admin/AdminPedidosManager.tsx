'use client'

import { useState } from 'react'
import UpdateOrderStatus from '@/components/admin/UpdateOrderStatus'
import EditOrderModal, { EditOrderTarget } from '@/components/admin/EditOrderModal'
import { ShoppingBag, User, Store, Search, Filter, Edit3, Truck, Package, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  PAGO:                   { label: 'Pago',           bg: '#dbeafe', text: '#1d4ed8' },
  EM_SEPARACAO:           { label: 'Em Separação',   bg: '#fef9c3', text: '#a16207' },
  ENVIADO:                { label: 'Enviado',        bg: '#dcfce7', text: '#166534' },
  ENTREGUE:               { label: 'Entregue',       bg: '#f3f4f6', text: '#4b5563' },
  CANCELADO:              { label: 'Cancelado',      bg: '#fee2e2', text: '#dc2626' },
  AGUARDANDO_PAGAMENTO:   { label: 'Aguardando',     bg: '#ffedd5', text: '#c2410c' },
}

const deliveryConfig: Record<string, { label: string; bg: string; text: string }> = {
  PENDENTE:     { label: 'Entrega Pendente',               bg: '#fef3c7', text: '#b45309' },
  PRE_VENDA:    { label: 'Pré-Venda (Aguardando Estoque)', bg: '#ede9fe', text: '#6d28d9' },
  EM_SEPARACAO: { label: 'Em Separação',                   bg: '#fef9c3', text: '#a16207' },
  ENVIADO:      { label: 'Enviado',                        bg: '#dbeafe', text: '#1e40af' },
  ENTREGUE:     { label: 'Entregue',                       bg: '#dcfce7', text: '#166534' },
  CANCELADO:    { label: 'Cancelado',                      bg: '#fee2e2', text: '#dc2626' },
}

const paymentLabel: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CREDITO: 'Crédito',
  DEBITO: 'Débito', STRIPE: 'Stripe', OUTRO: 'Outro',
}

interface AdminPedidosManagerProps {
  initialOrders: any[]
}

export default function AdminPedidosManager({ initialOrders }: AdminPedidosManagerProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [editingOrder, setEditingOrder] = useState<EditOrderTarget | null>(null)

  const handleOrderUpdated = (updated: any) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false
    if (!search.trim()) return true

    const q = search.toLowerCase()
    const idMatch = order.id.toLowerCase().includes(q)
    const nameMatch = (order.customerName || order.user?.name || '').toLowerCase().includes(q)
    const emailMatch = (order.user?.email || '').toLowerCase().includes(q)
    const sellerMatch = (order.seller?.name || '').toLowerCase().includes(q)
    const cpfMatch = (order.customerCpf || '').toLowerCase().includes(q)
    const trackingMatch = (order.trackingCode || '').toLowerCase().includes(q)

    return idMatch || nameMatch || emailMatch || sellerMatch || cpfMatch || trackingMatch
  })

  return (
    <div>
      {/* Top Filter and Search Bar */}
      <div style={{ background: '#fff', border: '1px solid #e8e2da', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9b8f88' }} />
            <input
              type="text"
              placeholder="Buscar por cliente, pedido, vendedor, CPF ou rastreio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.875rem 0.6rem 2.25rem',
                border: '1px solid #e8e2da',
                borderRadius: '99px',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#faf8f5',
                color: '#0d1b2a',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#6b6b6b' }}>
            <span>Mostrando <strong>{filteredOrders.length}</strong> de {orders.length} pedidos</span>
          </div>
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PAGO', label: 'Pagos' },
            { id: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando' },
            { id: 'EM_SEPARACAO', label: 'Em Separação' },
            { id: 'ENVIADO', label: 'Enviados' },
            { id: 'ENTREGUE', label: 'Entregues' },
            { id: 'CANCELADO', label: 'Cancelados' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '99px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: statusFilter === f.id ? '#0d1b2a' : '#f0ebe4',
                color: statusFilter === f.id ? '#fff' : '#6b6b6b',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e8e2da', borderRadius: '14px', padding: '4rem 1.5rem', textAlign: 'center' }}>
            <ShoppingBag size={36} style={{ color: '#e2ddd6', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem', color: '#9b8f88' }}>Nenhum pedido encontrado</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const sc = statusConfig[order.status] ?? { label: order.status, bg: '#f3f4f6', text: '#6b7280' }
            const dc = order.deliveryStatus ? (deliveryConfig[order.deliveryStatus] ?? { label: order.deliveryStatus, bg: '#f3f4f6', text: '#6b7280' }) : null
            const clientName = order.customerName || order.user?.name || 'Cliente'
            const clientEmail = order.customerName ? null : order.user?.email
            const isSeller = !!order.sellerId
            const isStockDeducted = order.stockDeducted ?? false

            return (
              <div key={order.id} style={{ background: '#fff', border: '1px solid #e8e2da', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.375rem', borderBottom: '1px solid #f0ebe4', flexWrap: 'wrap', gap: '0.5rem', background: '#faf8f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9b8f88', background: '#fff', border: '1px solid #e8e2da', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </span>

                    {/* Status de Pagamento */}
                    <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: sc.bg, color: sc.text, fontWeight: 600 }}>
                      {sc.label}
                    </span>

                    {/* Status de Entrega */}
                    {dc && (
                      <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: dc.bg, color: dc.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Truck size={10} /> {dc.label}
                      </span>
                    )}

                    {/* Controle de Estoque (Pré-venda vs Baixado) */}
                    {isStockDeducted ? (
                      <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#ecfdf5', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={10} /> Estoque Baixado
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#f5f3ff', color: '#6d28d9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={10} /> Sem Baixa (Pré-Venda)
                      </span>
                    )}

                    {/* Origem da Venda */}
                    {isSeller ? (
                      <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#fef9c3', color: '#a16207', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Store size={9} /> Vendedor: {order.seller?.name || 'Direta'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                        Online (site)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9b8f88' }}>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 600, color: '#0d1b2a' }}>
                      R$ {order.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Body Grid */}
                <div className="pedido-details-grid">
                  {/* Cliente */}
                  <div className="pedido-col">
                    <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={10} /> Cliente
                    </p>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0d1b2a', margin: 0 }}>{clientName}</p>
                    {clientEmail && <p style={{ fontSize: '0.72rem', color: '#9b8f88', margin: '0.15rem 0 0 0' }}>{clientEmail}</p>}
                    {order.customerCpf && <p style={{ fontSize: '0.72rem', color: '#9b8f88', margin: '0.15rem 0 0 0' }}>CPF/CNPJ: {order.customerCpf}</p>}
                    {order.customerPhone && <p style={{ fontSize: '0.72rem', color: '#9b8f88', margin: '0.15rem 0 0 0' }}>Tel: {order.customerPhone}</p>}
                    {order.customerAddress && <p style={{ fontSize: '0.72rem', color: '#9b8f88', marginTop: '0.35rem', lineHeight: 1.3 }}>{order.customerAddress}</p>}
                    {order.user?.role && <span style={{ display: 'inline-block', fontSize: '0.62rem', color: '#b8afa7', marginTop: '0.3rem' }}>{order.user.role}</span>}
                  </div>

                  {/* Venda / Pagamento */}
                  <div className="pedido-col">
                    <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Store size={10} /> Venda & Entrega
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#0d1b2a', margin: 0 }}>
                      <strong>Pagamento:</strong> {paymentLabel[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}
                    </p>
                    {order.deliveryDate && (
                      <p style={{ fontSize: '0.72rem', color: '#9b8f88', marginTop: '0.2rem' }}>
                        Previsão Entrega: {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {order.sellerNote && (
                      <p style={{ fontSize: '0.72rem', color: '#6b6b6b', fontStyle: 'italic', marginTop: '0.35rem', background: '#faf8f5', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
                        "{order.sellerNote}"
                      </p>
                    )}
                    {order.trackingCode && (
                      <p style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#1d4ed8', marginTop: '0.35rem' }}>
                        📦 {order.trackingCode}
                      </p>
                    )}
                  </div>

                  {/* Itens */}
                  <div className="pedido-col">
                    <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b8f88', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Itens ({order.items.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {order.items.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.78rem', color: '#0d1b2a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                            {item.kit ? `[Kit] ${item.kit.name}` : `${item.product?.name ?? '?'}${item.variant ? ` — ${item.variant.label}` : ''}`}
                            <span style={{ color: '#9b8f88' }}> ×{item.quantity}</span>
                          </p>
                          <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', marginLeft: '0.5rem', margin: 0 }}>
                            R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ padding: '0.75rem 1.375rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: '#fff', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.72rem', color: '#9b8f88' }}>
                    Status atual: <span style={{ fontWeight: 600, color: sc.text }}>{sc.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Botão de Edição Completa */}
                    <button
                      onClick={() => setEditingOrder(order)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#0d1b2a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <Edit3 size={13} /> Editar Pedido
                    </button>

                    {/* Dropdown de Mudança Rápida de Status */}
                    <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={handleOrderUpdated}
        />
      )}

      <style>{`
        .pedido-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          border-bottom: 1px solid #f0ebe4;
        }
        .pedido-col {
          padding: 1rem 1.375rem;
          border-right: 1px solid #f0ebe4;
        }
        .pedido-col:last-child {
          border-right: none;
        }
        @media (max-width: 768px) {
          .pedido-details-grid {
            grid-template-columns: 1fr;
          }
          .pedido-col {
            border-right: none !important;
            border-bottom: 1px solid #f0ebe4;
          }
          .pedido-col:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  )
}
