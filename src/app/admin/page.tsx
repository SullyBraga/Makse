import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ShoppingBag, Users, Package, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react'

async function getStats() {
  const [totalOrders, pendingOrders, paidOrders, totalUsers, pendingPro, totalProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'AGUARDANDO_PAGAMENTO' } }),
    prisma.order.count({ where: { status: { in: ['PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'] } } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'PENDENTE' } }),
    prisma.product.count({ where: { active: true } }),
  ])
  const revenueAgg = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { in: ['PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'] } },
  })
  return { totalOrders, pendingOrders, paidOrders, totalUsers, pendingPro, totalProducts, revenue: revenueAgg._sum.total ?? 0 }
}

const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
  PAGO:                 { label: 'Pago',        bg: 'var(--cream)',  color: 'var(--navy)' },
  EM_SEPARACAO:         { label: 'Em Separação',bg: '#fef9c3',       color: '#a16207'     },
  ENVIADO:              { label: 'Enviado',     bg: '#dcfce7',       color: '#166534'     },
  ENTREGUE:             { label: 'Entregue',    bg: '#f3f4f6',       color: '#4b5563'     },
  CANCELADO:            { label: 'Cancelado',   bg: '#fee2e2',       color: '#dc2626'     },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando',  bg: '#ffedd5',       color: '#c2410c'     },
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const recentOrders = await prisma.order.findMany({
    take: 5, orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  })
  const pendingUsers = await prisma.user.findMany({
    where: { role: 'PENDENTE' },
    include: { professionalReq: true },
    take: 3, orderBy: { createdAt: 'desc' },
  })

  const kpis = [
    { icon: <TrendingUp size={16} />, label: 'Receita Confirmada', value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: `${stats.paidOrders} pedido(s) confirmado(s)` },
    { icon: <ShoppingBag size={16} />, label: 'Pedidos', value: String(stats.totalOrders), sub: `${stats.pendingOrders} aguardando pagamento` },
    { icon: <Users size={16} />, label: 'Usuários', value: String(stats.totalUsers), sub: `${stats.pendingPro} aguardando aprovação` },
    { icon: <Package size={16} />, label: 'Produtos', value: String(stats.totalProducts), sub: 'ativos no catálogo' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2.25rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>Dashboard</h1>
        <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Visão geral do negócio em tempo real</p>
      </div>

      {/* KPI Grid */}
      <div className="dashboard-kpi-grid stagger animate-up">
        {kpis.map(card => (
          <div key={card.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.375rem' }} className="hover-lift animate-up">
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.125rem' }}>
              <span style={{ color: 'var(--gold)' }}>{card.icon}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', lineHeight: 1, marginBottom: '0.2rem' }}>{card.value}</p>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{card.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Alert */}
      {stats.pendingPro > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderLeft: '4px solid var(--gold)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="animate-up">
          <AlertTriangle size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.84rem', color: 'var(--navy)' }}>
            <strong>{stats.pendingPro} profissional(s)</strong> aguardando aprovação.{' '}
            <Link href="/admin/usuarios" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Revisar agora →</Link>
          </p>
        </div>
      )}

      {/* Two columns */}
      <div className="dashboard-two-cols">
        {/* Pedidos recentes */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }} className="animate-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.375rem', borderBottom: '1px solid var(--cream)' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>Pedidos Recentes</h2>
            <Link href="/admin/pedidos" style={{ fontSize: '0.7rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ver todos →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <Clock size={26} style={{ color: 'var(--border)', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Nenhum pedido ainda</p>
            </div>
          ) : recentOrders.map(order => {
            const s = statusBadge[order.status] ?? { label: order.status, bg: 'var(--cream)', color: 'var(--navy)' }
            return (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.375rem', borderBottom: '1px solid var(--cream)' }}>
                <div>
                  <p style={{ fontSize: '0.82', fontWeight: 500, color: 'var(--navy)' }}>{order.user.name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>R$ {order.total.toFixed(2).replace('.', ',')}</p>
                </div>
                <span style={{ fontSize: '0.62rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
              </div>
            )
          })}
        </div>

        {/* Aprovações pendentes */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }} className="animate-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.375rem', borderBottom: '1px solid var(--cream)' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>Aprovações Pendentes</h2>
            <Link href="/admin/usuarios" style={{ fontSize: '0.7rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gerenciar →</Link>
          </div>
          {pendingUsers.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <CheckCircle size={26} style={{ color: '#bbf7d0', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Nada pendente — tudo em dia!</p>
            </div>
          ) : pendingUsers.map(user => (
            <div key={user.id} style={{ padding: '0.75rem 1.375rem', borderBottom: '1px solid var(--cream)' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '0.15rem' }}>{user.name}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user.professionalReq?.salonName ?? '—'} · {user.professionalReq?.city ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dashboard-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .dashboard-two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        @media (max-width: 1024px) {
          .dashboard-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .dashboard-kpi-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-two-cols {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
