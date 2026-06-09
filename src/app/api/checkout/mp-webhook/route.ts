import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mercado Pago sends webhook notifications here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    // MP sends "payment" notifications
    if (type === 'payment' && data?.id) {
      const { MercadoPagoConfig, Payment } = await import('mercadopago')
      const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
      const payment = new Payment(mp)
      const paymentData = await payment.get({ id: data.id })

      const orderId = paymentData.external_reference
      if (!orderId) return NextResponse.json({ ok: true })

      const mpStatus = paymentData.status

      let newStatus: string | null = null
      if (mpStatus === 'approved') newStatus = 'PAGO'
      else if (mpStatus === 'rejected' || mpStatus === 'cancelled') newStatus = 'CANCELADO'
      else if (mpStatus === 'pending' || mpStatus === 'in_process') newStatus = 'AGUARDANDO_PAGAMENTO'

      if (newStatus) {
        await prisma.order.updateMany({
          where: { id: orderId },
          data: { status: newStatus as any },
        })

        // If paid, deduct stock
        if (newStatus === 'PAGO') {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          })
          if (order) {
            for (const item of order.items) {
              let targetVariantId = item.variantId
              if (!targetVariantId && item.productId) {
                const firstVariant = await prisma.productVariant.findFirst({
                  where: { productId: item.productId },
                  orderBy: { id: 'asc' },
                })
                if (firstVariant) {
                  targetVariantId = firstVariant.id
                }
              }

              if (targetVariantId) {
                await prisma.productVariant.update({
                  where: { id: targetVariantId },
                  data: { stock: { decrement: item.quantity } },
                })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mp-webhook]', err)
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 })
  }
}
