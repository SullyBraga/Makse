import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-03-25.dahlia' })
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { items, addressId } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })

    // Buscar usuário e tabela de desconto
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { discountTable: true }
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    // Buscar produtos e calcular preços no backend (NUNCA confiar no frontend)
    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { variants: true }
    })

    const discountPct = user.discountTable?.percentage ?? 0

    const lineItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) throw new Error(`Produto não encontrado: ${item.productId}`)

      // Bloquear produto pro-only para cliente final
      if (product.proOnly && user.role === 'CLIENTE_FINAL') {
        throw new Error(`Produto restrito: ${product.name}`)
      }

      let basePrice = product.price
      let selectedVariantId = item.variantId || null

      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId)
        if (variant) {
          if (user.role === 'CABELEIREIRA' || user.role === 'ADMIN') {
            basePrice = variant.pricePro ?? variant.price
          } else if (user.role === 'VENDEDOR') {
            basePrice = variant.priceVendedor ?? variant.price
          } else {
            basePrice = variant.price
          }
        }
      } else {
        if (user.role === 'CABELEIREIRA' || user.role === 'ADMIN') {
          basePrice = product.pricePro ?? product.price
        } else if (user.role === 'VENDEDOR') {
          basePrice = product.priceVendedor ?? product.price
        }
      }

      const unitPrice = basePrice * (1 - discountPct / 100)

      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: product.name,
            metadata: {
              productId: product.id,
              variantId: selectedVariantId || '',
            }
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      }
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      payment_method_types: ['card'],
      success_url: `${process.env.NEXTAUTH_URL}/conta/pedidos?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/carrinho`,
      metadata: {
        userId: user.id,
        addressId: addressId ?? '',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message || 'Erro no checkout' }, { status: 500 })
  }
}
