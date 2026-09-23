import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(req: NextRequest) {
  const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
  })

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 })
    }

    const userId = (session.user as any)?.id as string

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        coupon: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (order.status !== 'AGUARDANDO_PAGAMENTO') {
      return NextResponse.json({ error: 'Este pedido não está pendente de pagamento' }, { status: 400 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Calculate subtotal of order items
    const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    // Construct MP items deducting coupon discount proportionally if present
    const mpItems = order.items.map((item) => {
      let finalPrice = item.unitPrice

      if (order.couponDiscount > 0 && itemsSubtotal > 0) {
        const share = (item.unitPrice * item.quantity) / itemsSubtotal
        const itemDiscountTotal = order.couponDiscount * share
        const itemDiscountUnit = parseFloat((itemDiscountTotal / item.quantity).toFixed(2))
        finalPrice = parseFloat(Math.max(0, item.unitPrice - itemDiscountUnit).toFixed(2))
      }

      const title = item.product?.name
        ? `${item.product.name}${item.variant?.label ? ` (${item.variant.label})` : ''}`
        : 'Produto'

      return {
        id: item.productId || item.variantId || item.id,
        title,
        quantity: item.quantity,
        unit_price: finalPrice,
        currency_id: 'BRL',
      }
    })

    if (order.shippingPrice > 0) {
      mpItems.push({
        id: 'shipping',
        title: `Frete: ${order.shippingMethod || 'Envio Correios'}`,
        quantity: 1,
        unit_price: parseFloat(order.shippingPrice.toFixed(2)),
        currency_id: 'BRL',
      })
    }

    const preference = new Preference(mp)
    const pref = await preference.create({
      body: {
        items: mpItems,
        payer: {
          email: session.user?.email ?? undefined,
          name: session.user?.name ?? undefined,
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
        },
        back_urls: {
          success: `${baseUrl}/checkout/sucesso?orderId=${order.id}`,
          failure: `${baseUrl}/checkout/falha?orderId=${order.id}`,
          pending: `${baseUrl}/checkout/pendente?orderId=${order.id}`,
        },
        ...(baseUrl.includes('localhost') ? {} : { auto_return: 'approved' }),
        external_reference: order.id,
        ...(baseUrl.includes('localhost') ? {} : { notification_url: `${baseUrl}/api/checkout/mp-webhook` }),
      },
    })

    return NextResponse.json({ url: pref.init_point, preferenceId: pref.id })
  } catch (err: any) {
    console.error('[mp-repay]', err)
    return NextResponse.json({ error: 'Erro ao gerar pagamento para o pedido' }, { status: 500 })
  }
}
