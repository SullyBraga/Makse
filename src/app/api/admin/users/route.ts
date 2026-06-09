import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

// PATCH — approve, reject, changeRole
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { userId, action, discountTableId, role } = await req.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId e action são obrigatórios' }, { status: 400 })
    }

    if (action === 'approve') {
      if (!discountTableId) return NextResponse.json({ error: 'discountTableId obrigatório' }, { status: 400 })
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'CABELEIREIRA', discountTableId },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      await prisma.user.update({ where: { id: userId }, data: { role: 'CLIENTE_FINAL' } })
      return NextResponse.json({ success: true })
    }

    if (action === 'changeRole') {
      const validRoles = ['ADMIN', 'CABELEIREIRA', 'CLIENTE_FINAL', 'PENDENTE', 'VENDEDOR']
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role inválida' }, { status: 400 })
      }
      await prisma.user.update({ where: { id: userId }, data: { role } })
      return NextResponse.json({ success: true })
    }

    if (action === 'changeDiscount') {
      // discountTableId null = remove discount
      if (discountTableId !== null && discountTableId !== undefined) {
        const table = await prisma.discountTable.findUnique({ where: { id: discountTableId } })
        if (!table) return NextResponse.json({ error: 'Tabela de desconto não encontrada' }, { status: 404 })
      }
      await prisma.user.update({
        where: { id: userId },
        data: { discountTableId: discountTableId ?? null },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err) {
    console.error('[admin/users PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — remove user
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

    // Delete related records first
    await prisma.professionalRequest.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/users DELETE]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
