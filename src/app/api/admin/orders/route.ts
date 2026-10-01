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
    const { orderId, status, trackingCode, deliveryStatus, reverterEstoque, deductStock } = await req.json()

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

    const wasStockDeducted = orderBefore.stockDeducted ?? false
    const targetDeliveryStatus = deliveryStatus !== undefined ? deliveryStatus : orderBefore.deliveryStatus

    // Se deductStock for explicitamente informado, respeita.
    // Senão, se cancelado -> false.
    // Senão, se entrega for ENVIADO ou ENTREGUE -> true.
    // Senão, se pré-venda ou entrega pendente -> não deduz por padrão (false).
    let shouldDeductStock = wasStockDeducted
    if (deductStock !== undefined) {
      shouldDeductStock = Boolean(deductStock)
    } else if (status === 'CANCELADO' || targetDeliveryStatus === 'CANCELADO') {
      shouldDeductStock = false
    } else if (['ENVIADO', 'ENTREGUE'].includes(targetDeliveryStatus || '')) {
      shouldDeductStock = true
    } else if (['PRE_VENDA', 'PENDENTE'].includes(targetDeliveryStatus || '')) {
      // Pré-venda ou entrega pendente NÃO deduz estoque na mudança de status financeiro
      shouldDeductStock = false
    } else if (['PAGO', 'EM_SEPARACAO'].includes(status) && !wasStockDeducted && !orderBefore.sellerId) {
      // Pedido online comum (sem vendedor / pré-venda) deduz ao pagar
      shouldDeductStock = true
    }

    const data: Record<string, any> = {
      status,
      stockDeducted: shouldDeductStock,
    }
    if (deliveryStatus !== undefined) data.deliveryStatus = deliveryStatus
    if (trackingCode !== undefined) data.trackingCode = trackingCode || null

    const updated = await prisma.order.update({ where: { id: orderId }, data })

    // Caso 1: Estoque não estava baixado e agora deve ser baixado -> Deduzir estoque
    if (!wasStockDeducted && shouldDeductStock) {
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

    // Caso 2: Estoque estava baixado e agora não deve mais estar baixado (ex: CANCELADO) -> Devolver estoque
    if (wasStockDeducted && !shouldDeductStock && reverterEstoque !== false) {
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
