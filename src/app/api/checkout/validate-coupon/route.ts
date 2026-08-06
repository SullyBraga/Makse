import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, subtotal, cartItems } = body

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Código do cupom é obrigatório' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
      include: { product: { select: { id: true, name: true } } },
    })

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Cupom inválido ou não encontrado' })
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: 'Este cupom não está mais ativo' })
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Este cupom expirou' })
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Limite de uso deste cupom já foi atingido' })
    }

    const orderSubtotal = parseFloat(subtotal) || 0
    if (coupon.minOrderValue !== null && orderSubtotal < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        error: `O valor mínimo para usar este cupom é de R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')}`,
      })
    }

    // Se o cupom for restrito a um produto específico
    let eligibleSubtotal = orderSubtotal
    if (coupon.productId) {
      const items = Array.isArray(cartItems) ? cartItems : []
      const matchingItems = items.filter((item: any) => item.productId === coupon.productId || item.id === coupon.productId)

      if (matchingItems.length === 0) {
        const prodName = coupon.product?.name ? `"${coupon.product.name}"` : 'um produto específico'
        return NextResponse.json({
          valid: false,
          error: `Este cupom é válido apenas para o produto ${prodName}.`,
        })
      }
      eligibleSubtotal = matchingItems.reduce((acc: number, item: any) => acc + (parseFloat(item.price) * (parseInt(item.quantity) || 1)), 0)
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        productId: coupon.productId,
        productName: coupon.product?.name ?? null,
        eligibleSubtotal,
      },
    })
  } catch (err) {
    console.error('[validate-coupon POST]', err)
    return NextResponse.json({ valid: false, error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
