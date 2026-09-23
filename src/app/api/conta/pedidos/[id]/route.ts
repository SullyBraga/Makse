import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as any).id

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        address: true,
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, price: true, slug: true } },
            variant: { select: { id: true, label: true, price: true } },
            kit: { select: { id: true, name: true, images: true, price: true } },
          },
        },
        coupon: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.userId !== userId && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (err: any) {
    console.error('[pedidos GET]', err)
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as any).id

  try {
    const { action } = await req.json()

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (action === 'MARK_DELIVERED') {
      if (order.status !== 'ENVIADO' && order.status !== 'EM_SEPARACAO' && order.status !== 'PAGO') {
        return NextResponse.json({ error: 'Apenas pedidos enviados ou em transporte podem ser marcados como recebidos' }, { status: 400 })
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'ENTREGUE' },
        include: {
          address: true,
          items: {
            include: {
              product: { select: { name: true, images: true, price: true } },
              variant: { select: { label: true, price: true } },
            },
          },
          coupon: true,
        },
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
  } catch (err: any) {
    console.error('[pedidos PATCH]', err)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}
