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
    const { orderId, status, trackingCode } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId e status são obrigatórios' }, { status: 400 })
    }

    const validStatuses = ['AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const data: Record<string, any> = { status }
    if (trackingCode !== undefined) data.trackingCode = trackingCode || null

    const updated = await prisma.order.update({ where: { id: orderId }, data })

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
