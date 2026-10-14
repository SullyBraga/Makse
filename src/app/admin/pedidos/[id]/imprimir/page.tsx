import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PrintActions from '@/components/admin/PrintActions'

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  CREDITO: 'Cartão de Crédito',
  DEBITO: 'Cartão de Débito',
  DINHEIRO: 'Dinheiro',
  STRIPE: 'Cartão Online (Stripe)',
  MERCADOPAGO: 'Mercado Pago',
  OUTRO: 'Outro',
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PAGO: { label: 'Pago (Confirmado)', color: '#166534', bg: '#dcfce7' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', color: '#c2410c', bg: '#ffedd5' },
  CANCELADO: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2' },
}

const DELIVERY_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Entrega Pendente', color: '#b45309', bg: '#fef3c7' },
  PRE_VENDA: { label: 'Pré-Venda (Aguardando Estoque)', color: '#6d28d9', bg: '#ede9fe' },
  EM_SEPARACAO: { label: 'Em Separação', color: '#a16207', bg: '#fef9c3' },
  ENVIADO: { label: 'Enviado', color: '#1e40af', bg: '#dbeafe' },
  ENTREGUE: { label: 'Entregue', color: '#166534', bg: '#dcfce7' },
  CANCELADO: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2' },
}

export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as any)?.role
  const currentUserId = (session?.user as any)?.id

  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) {
    redirect(`/login?redirect=/admin/pedidos/${id}/imprimir`)
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          professionalReq: true,
          discountTable: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      address: true,
      coupon: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          kit: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          variant: {
            select: {
              id: true,
              label: true,
              price: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  // Se o usuário for vendedor, só pode ver seu próprio pedido
  if (role === 'VENDEDOR' && order.sellerId && order.sellerId !== currentUserId) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#0d1b2a', marginBottom: '1rem' }}>Acesso Restrito</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Você só tem permissão para visualizar e exportar pedidos e vendas associados ao seu usuário.
        </p>
        <Link
          href="/admin/vendas"
          style={{
            display: 'inline-block',
            padding: '0.6rem 1.25rem',
            background: '#0d1b2a',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Voltar para Minhas Vendas
        </Link>
      </div>
    )
  }

  // Extração de dados do cliente
  const customerName = order.customerName || order.user?.name || 'Cliente Avulso'
  const customerPhone = order.customerPhone || order.user?.professionalReq?.phone || null
  const customerCpf = order.customerCpf || order.user?.professionalReq?.cnpj || null
  const customerEmail = order.user?.email || null
  const salonName = order.user?.professionalReq?.salonName || null

  let fullAddress = order.customerAddress || null
  if (!fullAddress && order.address) {
    const a = order.address
    fullAddress = `${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ''}, ${a.city} - ${a.state}, CEP ${a.zipCode}`
  }

  const paymentStatus = PAYMENT_STATUS_LABELS[order.status] || {
    label: order.status,
    color: '#0d1b2a',
    bg: '#f1f5f9',
  }

  const deliveryStatus = DELIVERY_STATUS_LABELS[order.deliveryStatus || 'PENDENTE'] || {
    label: order.deliveryStatus || 'Pendente',
    color: '#0d1b2a',
    bg: '#f1f5f9',
  }

  const paymentMethodLabel = PAYMENT_LABELS[order.paymentMethod || ''] || order.paymentMethod || 'Não informado'

  const itemsSubtotal = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <PrintActions />

      {/* Folha do Documento Comercial A4 */}
      <div
        className="print-sheet"
        style={{
          maxWidth: '820px',
          margin: '2rem auto',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          padding: '2.5rem',
          boxSizing: 'border-box',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Cabeçalho Comercial */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d1b2a', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <Image
                src="/logo-makse.png"
                alt="Makse Cosméticos"
                width={130}
                height={42}
                style={{ objectFit: 'contain', height: 'auto' }}
                priority
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
              Makse Cosméticos Profissionais
            </p>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
              CNPJ: 57.013.916/0001-38 • www.maksecosmeticos.com.br
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c5a059', fontWeight: 700, display: 'block' }}>
              Comprovante de Pedido & Venda
            </span>
            <h1 style={{ margin: '0.2rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#0d1b2a', fontFamily: 'monospace' }}>
              #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
              Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Badges de Status do Pedido */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Financeiro:</span>
            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', background: paymentStatus.bg, color: paymentStatus.color, fontWeight: 700, fontSize: '0.72rem' }}>
              {paymentStatus.label}
            </span>
          </div>

          <span style={{ color: '#cbd5e1' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Entrega:</span>
            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', background: deliveryStatus.bg, color: deliveryStatus.color, fontWeight: 700, fontSize: '0.72rem' }}>
              {deliveryStatus.label}
            </span>
          </div>

          <span style={{ color: '#cbd5e1' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Estoque:</span>
            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', background: order.stockDeducted ? '#ecfdf5' : '#f5f3ff', color: order.stockDeducted ? '#065f46' : '#6d28d9', fontWeight: 600, fontSize: '0.72rem' }}>
              {order.stockDeducted ? 'Baixa Concluída' : 'Pré-Venda / Sem Baixa'}
            </span>
          </div>

          {order.deliveryDate && (
            <>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Previsão Entrega:</span>
                <span style={{ fontWeight: 600, color: '#0d1b2a', fontSize: '0.75rem' }}>
                  {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Quadro Informativo de Partes (Cliente x Venda) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }} className="print-grid-two">
          {/* Dados do Cliente */}
          <div style={{ padding: '1rem 1.15rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
              Dados do Cliente
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0d1b2a' }}>
              {customerName}
            </p>
            {salonName && (
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#065f46', fontWeight: 600 }}>
                Salão: {salonName}
              </p>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {customerCpf && <div><strong>CPF/CNPJ:</strong> {customerCpf}</div>}
              {customerPhone && <div><strong>Telefone:</strong> {customerPhone}</div>}
              {customerEmail && <div><strong>E-mail:</strong> {customerEmail}</div>}
              {fullAddress && (
                <div style={{ marginTop: '0.25rem', lineHeight: 1.35 }}>
                  <strong>Endereço de Entrega:</strong><br />
                  {fullAddress}
                </div>
              )}
            </div>
          </div>

          {/* Dados da Venda & Vendedor */}
          <div style={{ padding: '1rem 1.15rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
              Detalhes da Venda
            </p>
            <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>
                <strong>Vendedor / Emissor:</strong> {order.seller?.name || 'Administração Makse'}
              </div>
              {order.seller?.email && (
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {order.seller.email}
                </div>
              )}
              <div style={{ marginTop: '0.2rem' }}>
                <strong>Forma de Pagamento:</strong> {paymentMethodLabel}
              </div>
              {order.trackingCode && (
                <div style={{ marginTop: '0.2rem' }}>
                  <strong>Código de Rastreio:</strong> <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{order.trackingCode}</span>
                </div>
              )}
              {order.user?.discountTable && (
                <div style={{ marginTop: '0.2rem', color: '#065f46', fontWeight: 600 }}>
                  Tabela Aplicada: {order.user.discountTable.name} ({order.user.discountTable.percentage}%)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Itens */}
        <div style={{ marginBottom: '1.75rem', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', width: '32px' }}>#</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155' }}>Item / Descrição</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155' }}>Variação</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', textAlign: 'center', width: '50px' }}>Qtd</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', textAlign: 'right', width: '90px' }}>Unitário</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', textAlign: 'right', width: '100px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const itemName = item.kit ? `[Kit] ${item.kit.name}` : (item.product?.name || 'Produto')
                const varLabel = item.variant?.label || (item.kit ? 'Kit Completo' : '—')
                const lineTotal = item.unitPrice * item.quantity
                const isEven = idx % 2 === 0

                return (
                  <tr key={item.id} style={{ background: isEven ? '#ffffff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#94a3b8', fontSize: '0.72rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{itemName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{varLabel}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{item.quantity}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#334155' }}>
                      R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#0d1b2a' }}>
                      R$ {lineTotal.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Resumo Financeiro & Totais */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.75rem' }}>
          {/* Observações do Vendedor */}
          <div style={{ flex: '1', minWidth: '240px' }}>
            {order.sellerNote ? (
              <div style={{ padding: '0.85rem 1rem', background: '#faf8f5', border: '1px dashed #d1c7bd', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8c7b70', fontWeight: 700 }}>
                  Observações / Anotações
                </p>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#44403c', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{order.sellerNote}"
                </p>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Sem anotações adicionais.
              </div>
            )}
          </div>

          {/* Totais */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
              <span>Subtotal dos Itens:</span>
              <span>R$ {itemsSubtotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {order.couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                <span>Desconto Cupom ({order.coupon?.code || 'CUPOM'}):</span>
                <span>- R$ {order.couponDiscount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}

            {order.shippingPrice > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                <span>Frete ({order.shippingMethod || 'Padrão'}):</span>
                <span>R$ {order.shippingPrice.toFixed(2).replace('.', ',')}</span>
              </div>
            )}

            <div style={{ borderTop: '2px solid #0d1b2a', marginTop: '0.4rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0d1b2a' }}>TOTAL:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0d1b2a', fontFamily: 'monospace' }}>
                R$ {order.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Canhoto de Recebimento de Mercadoria */}
        <div className="receipt-voucher page-break-avoid" style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.72rem', color: '#64748b', textAlign: 'center', fontWeight: 500 }}>
            Declaro ter conferido e recebido os produtos descritos neste comprovante em perfeitas condições.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'flex-end' }}>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '0.35rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 600 }}>
                Assinatura do Recebedor / Responsável
              </span>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '0.35rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 600 }}>
                Data: ____ / ____ / 2026
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé Comercial */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.68rem', color: '#94a3b8' }}>
          Makse Cosméticos Profissionais • Comprovante emitido via Sistema Makse em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')} • Documento para conferência comercial
        </div>
      </div>

      {/* Regras de Estilo para Impressão e Tela */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10pt !important;
          }

          .no-print,
          .admin-mobile-header,
          #admin-sidebar,
          .sidebar-toggle-btn,
          .admin-overlay {
            display: none !important;
          }

          .admin-print-wrapper {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }

          .page-break-avoid {
            page-break-inside: avoid;
          }
        }

        @media (max-width: 640px) {
          .print-sheet {
            padding: 1.25rem !important;
            margin: 1rem !important;
          }
          .print-grid-two {
            grid-template-columns: 1fr !important;
          }
          .print-hint-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
