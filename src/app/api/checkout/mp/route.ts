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
    const { items, addressId, shippingPrice, shippingMethod } = await req.json()
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
    }

    const userId = (session.user as any)?.id as string
    const role = (session.user as any)?.role as string
    const discountPct: number = (session.user as any)?.discountPct ?? 0
    const isPro = role === 'CABELEIREIRA' && discountPct > 0

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const shipPrice = parseFloat(shippingPrice) || 0

    // Build MP items
    const mpItems = items.map((i: any) => ({
      id: i.productId || i.variantId || 'item',
      title: i.name,
      quantity: Number(i.quantity),
      unit_price: isPro
        ? parseFloat((i.price * (1 - discountPct / 100)).toFixed(2))
        : parseFloat(Number(i.price).toFixed(2)),
      currency_id: 'BRL',
    }))

    if (shipPrice > 0) {
      mpItems.push({
        id: 'shipping',
        title: `Frete: ${shippingMethod || 'Envio Correios'}`,
        quantity: 1,
        unit_price: parseFloat(shipPrice.toFixed(2)),
        currency_id: 'BRL',
      })
    }

    const total = mpItems.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)

    // Create order in DB as AGUARDANDO_PAGAMENTO
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'AGUARDANDO_PAGAMENTO',
        total,
        shippingPrice: shipPrice,
        shippingMethod: shippingMethod || null,
        addressId: addressId || null,
        paymentMethod: 'MP',
        items: {
          create: items.map((i: any) => ({
            productId: i.productId || null,
            variantId: i.variantId || null,
            quantity: Number(i.quantity),
            unitPrice: isPro
              ? parseFloat((i.price * (1 - discountPct / 100)).toFixed(2))
              : parseFloat(Number(i.price).toFixed(2)),
          })),
        },
      },
    })

    const preference = new Preference(mp)
    const pref = await preference.create({
      body: {
        items: mpItems,
        payer: {
          email: session.user?.email ?? undefined,
          name: session.user?.name ?? undefined,
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
  } catch (err) {
    console.error('[mp-checkout]', err)
    return NextResponse.json({ error: 'Erro ao criar preferência' }, { status: 500 })
  }
}
