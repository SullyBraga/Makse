import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireSeller() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) return null
  return session
}

// POST /api/admin/sales — register a sale (seller flow, no payment gateway)
export async function POST(req: NextRequest) {
  const session = await requireSeller()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const {
      customerId,
      customerName,
      customerCpf,
      customerPhone,
      customerAddress,
      items,
      paymentMethod,
      note,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'O pedido deve ter ao menos um item' }, { status: 400 })
    }

    const sellerId = (session.user as any)?.id as string
    const total = items.reduce((sum: number, i: any) => sum + (i.unitPrice * i.quantity), 0)
    const userId = customerId || sellerId

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          sellerId,
          status: 'PAGO',
          total,
          paymentMethod: paymentMethod || 'OUTRO',
          sellerNote: note || null,
          customerName: customerId ? null : (customerName || null),
          customerCpf: customerCpf || null,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          items: {
            create: items.map((i: any) => ({
              productId: i.productId || null,
              kitId: i.kitId || null,
              variantId: i.variantId || null,
              quantity: parseInt(i.quantity),
              unitPrice: parseFloat(i.unitPrice),
            })),
          },
        },
        include: { items: true },
      })

      // Deduct stock for each item
      for (const item of items) {
        let targetVariantId = item.variantId
        if (!targetVariantId && item.productId) {
          const firstVariant = await tx.productVariant.findFirst({
            where: { productId: item.productId },
            orderBy: { id: 'asc' },
          })
          if (firstVariant) {
            targetVariantId = firstVariant.id
          }
        }

        if (targetVariantId) {
          await tx.productVariant.update({
            where: { id: targetVariantId },
            data: { stock: { decrement: parseInt(item.quantity) } },
          })
        } else if (item.kitId) {
          // Deduct stock for each product in the kit
          const kitItems = await tx.kitItem.findMany({ where: { kitId: item.kitId } })
          for (const ki of kitItems) {
            let targetKitVariantId = ki.variantId
            if (!targetKitVariantId && ki.productId) {
              const firstVar = await tx.productVariant.findFirst({
                where: { productId: ki.productId },
                orderBy: { id: 'asc' },
              })
              if (firstVar) {
                targetKitVariantId = firstVar.id
              }
            }

            if (targetKitVariantId) {
              await tx.productVariant.update({
                where: { id: targetKitVariantId },
                data: { stock: { decrement: ki.quantity * parseInt(item.quantity) } },
              })
            }
          }
        }
      }

      return created
    })

    // Gerar código de rastreamento automaticamente para a venda manual (status é PAGO)
    try {
      const { generateShippingLabel } = await import('@/lib/shipping')
      await generateShippingLabel(order.id)
    } catch (shipErr) {
      console.error('[sales POST] Erro ao gerar etiqueta de envio:', shipErr)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error('[sales POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET /api/admin/sales — list sales registered by sellers
export async function GET() {
  const session = await requireSeller()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const role = (session.user as any)?.role
  const sellerId = (session.user as any)?.id

  const orders = await prisma.order.findMany({
    where: {
      sellerId: { not: null },
      ...(role === 'VENDEDOR' && { sellerId }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      seller: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          kit: { select: { name: true } },
        },
      },
    },
  })

  return NextResponse.json(orders)
}
