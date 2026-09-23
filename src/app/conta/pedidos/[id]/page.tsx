'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, ExternalLink, CheckCircle2, CreditCard, RefreshCw, MapPin, AlertCircle, ShoppingBag } from 'lucide-react'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  PAGO:                 { bg: 'var(--cream)', color: 'var(--navy)', label: 'Pago' },
  EM_SEPARACAO:         { bg: '#fef9c3', color: '#a16207', label: 'Em Separação' },
  ENVIADO:              { bg: '#dcfce7', color: '#166534', label: 'Enviado' },
  ENTREGUE:             { bg: '#f3f4f6', color: '#6b7280', label: 'Entregue' },
  CANCELADO:            { bg: '#fee2e2', color: '#dc2626', label: 'Cancelado' },
  AGUARDANDO_PAGAMENTO: { bg: '#ffedd5', color: '#c2410c', label: 'Aguardando Pagamento' },
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const id = resolvedParams.id

  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetch(`/api/conta/pedidos/${id}`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao carregar detalhes do pedido')
        }
        return res.json()
      })
      .then(data => {
        setOrder(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const handlePayPending = async () => {
    if (!order) return
    setPaying(true)
    try {
      const res = await fetch('/api/checkout/mp/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar link de pagamento')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar pagamento')
      setPaying(false)
    }
  }

  const handleMarkAsReceived = async () => {
    if (!order || !confirm('Confirmar o recebimento deste pedido?')) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/conta/pedidos/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_DELIVERED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao confirmar entrega')
      setOrder((prev: any) => prev ? { ...prev, status: 'ENTREGUE' } : prev)
      alert('Entrega confirmada com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar pedido')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <RefreshCw size={24} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--cream)', padding: '2rem' }}>
        <AlertCircle size={40} style={{ color: '#dc2626' }} />
        <p style={{ color: 'var(--navy)', fontWeight: 500 }}>{error || 'Pedido não encontrado'}</p>
        <Link href="/conta" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Voltar para Meus Pedidos
        </Link>
      </div>
    )
  }

  const st = statusColors[order.status] ?? { bg: 'var(--cream)', color: 'var(--navy)', label: order.status }
  const isPending = order.status === 'AGUARDANDO_PAGAMENTO'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>

        {/* Voltar para Meus Pedidos Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/conta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--navy)',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              background: '#fff',
              borderRadius: '99px',
              border: '1px solid var(--border)',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            }}
          >
            <ArrowLeft size={16} /> Voltar para Meus Pedidos
          </Link>
        </div>

        {/* Main Card */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Detalhes do Pedido
              </span>
              <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.8rem', fontWeight: 600, color: 'var(--navy)', margin: '0.2rem 0' }}>
                #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.4rem 1rem',
              borderRadius: '99px',
              background: st.bg,
              color: st.color,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              {st.label}
            </span>
          </div>

          {/* Payment Warning / Button if Pending */}
          {isPending && (
            <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderLeft: '4px solid #f97316', borderRadius: '14px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#c2410c', margin: '0 0 0.25rem' }}>
                  Aguardando Pagamento
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#9a3412', margin: 0 }}>
                  Seu pedido ainda não teve o pagamento confirmado. Você pode concluir o pagamento a qualquer momento.
                </p>
              </div>
              <button
                onClick={handlePayPending}
                disabled={paying}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.7rem 1.5rem',
                  background: '#009EE3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '99px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(0, 158, 227, 0.3)',
                  opacity: paying ? 0.7 : 1,
                  flexShrink: 0,
                }}
              >
                {paying ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                    Gerando link...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} /> Efetuar Pagamento
                  </>
                )}
              </button>
            </div>
          )}

          {/* RASTREIO E STATUS DE ENVIO */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Truck size={18} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                Status de Envio & Rastreamento
              </h3>
            </div>

            {order.trackingCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Código de Rastreio (Correios)</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>{order.trackingCode}</span>
                  </div>
                  <a
                    href={`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      background: 'var(--navy)',
                      color: '#fff',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Rastrear nos Correios <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {order.status === 'AGUARDANDO_PAGAMENTO'
                  ? 'Aguardando confirmação do pagamento para iniciar a separação do produto.'
                  : order.status === 'PAGO' || order.status === 'EM_SEPARACAO'
                  ? 'Seu pedido está em separação no nosso centro de distribuição. O código de rastreio será disponibilizado assim que for postado.'
                  : order.status === 'ENTREGUE'
                  ? 'Pedido entregue e finalizado.'
                  : 'Informações de rastreamento pendentes.'}
              </p>
            )}

            {/* Botão de Marcar como Recebido */}
            {order.status === 'ENVIADO' && (
              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#15803d', margin: 0, fontWeight: 500 }}>
                  Seu pedido já foi enviado! Caso já tenha recebido em mãos, confirme abaixo:
                </p>
                <button
                  onClick={handleMarkAsReceived}
                  disabled={updatingStatus}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    background: '#166534',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '99px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: updatingStatus ? 0.7 : 1,
                  }}
                >
                  {updatingStatus ? (
                    <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  Marcar como Recebido
                </button>
              </div>
            )}

            {order.status === 'ENTREGUE' && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Entregue e confirmado pelo cliente
              </div>
            )}
          </div>

          {/* ITENS COMPRADOS */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.75rem' }}>
              Itens Comprados ({order.items?.length || 0})
            </h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
              {order.items?.map((item: any, idx: number) => {
                const name = item.product?.name || item.kit?.name || item.productId || 'Produto'
                const variant = item.variant?.label ? ` (${item.variant.label})` : ''
                const img = item.product?.images?.[0] || (Array.isArray(item.kit?.images) ? item.kit.images[0] : typeof item.kit?.images === 'string' ? JSON.parse(item.kit.images)?.[0] : null) || null

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderBottom: idx < order.items.length - 1 ? '1px solid var(--border)' : 'none',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '8px', background: 'var(--cream)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {img ? <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={20} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>{name}{variant}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                          Qtd: {item.quantity} · R$ {(item.unitPrice || 0).toFixed(2).replace('.', ',')} cada
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                      R$ {((item.unitPrice || 0) * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ENDEREÇO DE ENTREGA */}
          {order.address || order.customerAddress ? (
            <div style={{ background: '#fafafa', borderRadius: '14px', border: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <MapPin size={15} style={{ color: 'var(--gold)' }} />
                <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>Endereço de Entrega</h4>
              </div>
              {order.address ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {order.address.street}, {order.address.number}
                  {order.address.complement && ` — ${order.address.complement}`}
                  <br />
                  {order.address.city} - {order.address.state}, CEP: {order.address.zipCode} ({order.address.country})
                </p>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{order.customerAddress}</p>
              )}
            </div>
          ) : null}

          {/* RESUMO FINANCEIRO */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Forma de Pagamento</span>
              <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{order.paymentMethod || 'Mercado Pago'}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#16a34a' }}>
                <span>Desconto do Cupom ({order.coupon?.code || 'Cupom'})</span>
                <span>-R$ {order.couponDiscount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Frete ({order.shippingMethod || 'Envio'})</span>
              <span>{order.shippingPrice === 0 ? 'Grátis' : `R$ ${order.shippingPrice.toFixed(2).replace('.', ',')}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>Total Geral</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-cormorant), serif' }}>
                R$ {order.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <Link
              href="/conta"
              className="btn-outline"
              style={{ fontSize: '0.78rem', padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <ArrowLeft size={15} /> Voltar para Meus Pedidos
            </Link>

            {isPending && (
              <button
                onClick={handlePayPending}
                disabled={paying}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.7rem 1.5rem',
                  background: '#009EE3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '99px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(0, 158, 227, 0.3)',
                  opacity: paying ? 0.7 : 1,
                }}
              >
                {paying ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                    Gerando link...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} /> Efetuar Pagamento
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
