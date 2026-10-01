import { prisma } from '@/lib/prisma'
import AdminPedidosManager from '@/components/admin/AdminPedidosManager'

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, role: true } },
      seller: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, price: true, priceVendedor: true, pricePro: true } },
          kit: { select: { id: true, name: true, images: true, price: true, priceVendedor: true, pricePro: true } },
          variant: { select: { id: true, label: true, price: true, priceVendedor: true, pricePro: true } },
        },
      },
    },
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#0d1b2a', marginBottom: '0.25rem' }}>Pedidos</h1>
        <p style={{ fontSize: '0.835rem', color: '#6b6b6b' }}>Todos os pedidos — online e registrados por vendedores com suporte a edição completa e separação de estoque</p>
      </div>

      <AdminPedidosManager initialOrders={orders} />
    </div>
  )
}
