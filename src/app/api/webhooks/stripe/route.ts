import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
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
    await prisma.order.create({
      data: {
        userId,
        addressId: addressId || userId, // fallback temporário
        status: 'PAGO',
        total: (session.amount_total ?? 0) / 100,
        stripeSessionId: session.id,
        items: {
          create: lineItems.data.map(item => ({
            productId: (item.price?.product as any)?.metadata?.productId ?? userId,
            quantity: item.quantity ?? 1,
            unitPrice: (item.price?.unit_amount ?? 0) / 100,
          }))
        }
      }
    })

    // TODO: Chamar API do Bling para baixa no estoque
    // await updateBlingStock(lineItems.data)

    // TODO: Enviar email de confirmação
    // await sendOrderConfirmationEmail(userId, session)
  }

  return NextResponse.json({ received: true })
}
