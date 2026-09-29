import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireSeller() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) return null
  return session
}

// GET /api/admin/sales/[id] — get single sale details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSeller()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params
  const role = (session.user as any)?.role
  const sellerId = (session.user as any)?.id

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, price: true, priceVendedor: true, proOnly: true } },
          kit: { select: { id: true, name: true, images: true, price: true, priceVendedor: true } },
          variant: { select: { id: true, label: true, price: true, priceVendedor: true, stock: true } },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  if (role === 'VENDEDOR' && order.sellerId !== sellerId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  return NextResponse.json(order)
}

// PUT /api/admin/sales/[id] — edit/update a sale
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSeller()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params
  const role = (session.user as any)?.role
  const sellerId = (session.user as any)?.id

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    if (role === 'VENDEDOR' && existingOrder.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const {
      customerName,
      customerCpf,
      customerPhone,
      customerAddress,
      paymentMethod,
      note,
      status,
      deliveryStatus,
      deliveryDate,
      items,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'A venda deve ter ao menos um item' }, { status: 400 })
    }

    const newStatus = status || existingOrder.status || 'PAGO'
    const newDeliveryStatus = deliveryStatus || existingOrder.deliveryStatus || 'PENDENTE'
    const newDeliveryDate = deliveryDate ? new Date(deliveryDate) : (deliveryDate === null ? null : existingOrder.deliveryDate)
    const newTotal = items.reduce((sum: number, i: any) => sum + (parseFloat(i.unitPrice) * parseInt(i.quantity)), 0)

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const wasPaid = ['PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'].includes(existingOrder.status)
      const isPaid = ['PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'].includes(newStatus)

      // 1. If previous status was paid, restore stock for old items
      if (wasPaid) {
        for (const item of existingOrder.items) {
          let targetVariantId = item.variantId
          if (!targetVariantId && item.productId) {
            const firstVariant = await tx.productVariant.findFirst({
              where: { productId: item.productId },
              orderBy: { id: 'asc' },
            })
            if (firstVariant) targetVariantId = firstVariant.id
          }

          if (targetVariantId) {
            await tx.productVariant.update({
              where: { id: targetVariantId },
              data: { stock: { increment: item.quantity } },
            })
          } else if (item.kitId) {
            const kitItems = await tx.kitItem.findMany({ where: { kitId: item.kitId } })
            for (const ki of kitItems) {
              let targetKitVariantId = ki.variantId
              if (!targetKitVariantId && ki.productId) {
                const firstVar = await tx.productVariant.findFirst({
                  where: { productId: ki.productId },
                  orderBy: { id: 'asc' },
                })
                if (firstVar) targetKitVariantId = firstVar.id
              }
              if (targetKitVariantId) {
                await tx.productVariant.update({
                  where: { id: targetKitVariantId },
                  data: { stock: { increment: ki.quantity * item.quantity } },
                })
              }
            }
          }
        }
      }

      // 2. Delete old order items
      await tx.orderItem.deleteMany({ where: { orderId: id } })

      // 3. Create new order items
      await tx.orderItem.createMany({
        data: items.map((i: any) => ({
          orderId: id,
          productId: i.productId || null,
          kitId: i.kitId || null,
          variantId: i.variantId || null,
          quantity: parseInt(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      })

      // 4. If new status is paid, deduct stock for new items
      if (isPaid) {
        for (const item of items) {
          let targetVariantId = item.variantId
          if (!targetVariantId && item.productId) {
            const firstVariant = await tx.productVariant.findFirst({
              where: { productId: item.productId },
              orderBy: { id: 'asc' },
            })
            if (firstVariant) targetVariantId = firstVariant.id
          }

          if (targetVariantId) {
            await tx.productVariant.update({
              where: { id: targetVariantId },
              data: { stock: { decrement: parseInt(item.quantity) } },
            })
          } else if (item.kitId) {
            const kitItems = await tx.kitItem.findMany({ where: { kitId: item.kitId } })
            for (const ki of kitItems) {
              let targetKitVariantId = ki.variantId
              if (!targetKitVariantId && ki.productId) {
                const firstVar = await tx.productVariant.findFirst({
                  where: { productId: ki.productId },
                  orderBy: { id: 'asc' },
                })
                if (firstVar) targetKitVariantId = firstVar.id
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
      }

      // 5. Update Order record
      const updated = await tx.order.update({
        where: { id },
        data: {
          customerName: customerName !== undefined ? customerName : existingOrder.customerName,
          customerCpf: customerCpf !== undefined ? customerCpf : existingOrder.customerCpf,
          customerPhone: customerPhone !== undefined ? customerPhone : existingOrder.customerPhone,
          customerAddress: customerAddress !== undefined ? customerAddress : existingOrder.customerAddress,
          paymentMethod: paymentMethod !== undefined ? paymentMethod : existingOrder.paymentMethod,
          sellerNote: note !== undefined ? note : existingOrder.sellerNote,
          status: newStatus,
          deliveryStatus: newDeliveryStatus,
          deliveryDate: newDeliveryDate,
          total: newTotal,
        },
        include: {
          user: { select: { name: true, email: true } },
          seller: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true } },
              kit: { select: { name: true } },
              variant: { select: { label: true } },
            },
          },
        },
      })

      return updated
    })

    return NextResponse.json(updatedOrder)
  } catch (err: any) {
    console.error('[sales PUT]', err)
    return NextResponse.json({ error: 'Erro ao atualizar venda' }, { status: 500 })
  }
}
