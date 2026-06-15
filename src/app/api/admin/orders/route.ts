import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { orderId, status, trackingCode, reverterEstoque } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId e status são obrigatórios' }, { status: 400 })
    }

    const validStatuses = ['AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const orderBefore = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!orderBefore) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const data: Record<string, any> = { status }
    if (trackingCode !== undefined) data.trackingCode = trackingCode || null

    const updated = await prisma.order.update({ where: { id: orderId }, data })

    // Controle de estoque baseado nas transições de estado
    const wasPaid = ['PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'].includes(orderBefore.status)
    const isPaid = ['PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'].includes(status)

    // Caso 1: Passou de não-pago para pago -> Deduzir estoque
    if (!wasPaid && isPaid) {
      for (const item of orderBefore.items) {
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
          try {
            await prisma.productVariant.update({
              where: { id: targetVariantId },
              data: { stock: { decrement: item.quantity } },
            })
          } catch (stockErr) {
            console.error(`[admin/orders PATCH] Erro ao deduzir estoque para variante ${targetVariantId}:`, stockErr)
          }
        } else if (item.kitId) {
          try {
            const kitItems = await prisma.kitItem.findMany({ where: { kitId: item.kitId } })
            for (const ki of kitItems) {
              let targetKitVariantId = ki.variantId
              if (!targetKitVariantId && ki.productId) {
                const firstVar = await prisma.productVariant.findFirst({
                  where: { productId: ki.productId },
                  orderBy: { id: 'asc' },
                })
                if (firstVar) {
                  targetKitVariantId = firstVar.id
                }
              }

              if (targetKitVariantId) {
                await prisma.productVariant.update({
                  where: { id: targetKitVariantId },
                  data: { stock: { decrement: ki.quantity * item.quantity } },
                })
              }
            }
          } catch (kitStockErr) {
            console.error(`[admin/orders PATCH] Erro ao deduzir estoque de kit ${item.kitId}:`, kitStockErr)
          }
        }
      }
    }

    // Caso 2: Passou de pago para CANCELADO -> Devolver estoque
    if (wasPaid && status === 'CANCELADO' && reverterEstoque !== false) {
      for (const item of orderBefore.items) {
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
          try {
            await prisma.productVariant.update({
              where: { id: targetVariantId },
              data: { stock: { increment: item.quantity } },
            })
          } catch (stockErr) {
            console.error(`[admin/orders PATCH] Erro ao devolver estoque para variante ${targetVariantId}:`, stockErr)
          }
        } else if (item.kitId) {
          try {
            const kitItems = await prisma.kitItem.findMany({ where: { kitId: item.kitId } })
            for (const ki of kitItems) {
              let targetKitVariantId = ki.variantId
              if (!targetKitVariantId && ki.productId) {
                const firstVar = await prisma.productVariant.findFirst({
                  where: { productId: ki.productId },
                  orderBy: { id: 'asc' },
                })
                if (firstVar) {
                  targetKitVariantId = firstVar.id
                }
              }

              if (targetKitVariantId) {
                await prisma.productVariant.update({
                  where: { id: targetKitVariantId },
                  data: { stock: { increment: ki.quantity * item.quantity } },
                })
              }
            }
          } catch (kitStockErr) {
            console.error(`[admin/orders PATCH] Erro ao devolver estoque de kit ${item.kitId}:`, kitStockErr)
          }
        }
      }
    }

    if (updated.status === 'PAGO' && !updated.trackingCode) {
      try {
        const { generateShippingLabel } = await import('@/lib/shipping')
        await generateShippingLabel(orderId)
      } catch (shipErr) {
        console.error('[admin/orders PATCH] Erro ao gerar etiqueta de envio:', shipErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/orders PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
