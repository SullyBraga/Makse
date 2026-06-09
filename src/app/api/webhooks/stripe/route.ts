import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-03-25.dahlia' })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, addressId } = session.metadata!

    // Buscar itens da sessão
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] })

    // Criar pedido no banco
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: addressId || null,
        status: 'PAGO',
        total: (session.amount_total ?? 0) / 100,
        stripeSessionId: session.id,
        items: {
          create: lineItems.data.map(item => {
            const prodMetadata = (item.price?.product as any)?.metadata || {}
            return {
              productId: prodMetadata.productId || null,
              variantId: prodMetadata.variantId || null,
              quantity: item.quantity ?? 1,
              unitPrice: (item.price?.unit_amount ?? 0) / 100,
            }
          })
        }
      },
      include: { items: true }
    })

    // Reduzir estoque dos produtos
    for (const item of order.items) {
      let targetVariantId = item.variantId
      if (!targetVariantId && item.productId) {
        const firstVariant = await prisma.productVariant.findFirst({
          where: { productId: item.productId },
          orderBy: { id: 'asc' }
        })
        if (firstVariant) {
          targetVariantId = firstVariant.id
        }
      }

      if (targetVariantId) {
        try {
          await prisma.productVariant.update({
            where: { id: targetVariantId },
            data: { stock: { decrement: item.quantity } }
          })
        } catch (stockErr) {
          console.error(`[stripe-webhook] Erro ao deduzir estoque para a variante ${targetVariantId}:`, stockErr)
        }
      }
    }

    // TODO: Chamar API do Bling para baixa no estoque
    // await updateBlingStock(lineItems.data)

    // TODO: Enviar email de confirmação
    // await sendOrderConfirmationEmail(userId, session)
  }

  return NextResponse.json({ received: true })
}
