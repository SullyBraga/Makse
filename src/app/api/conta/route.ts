import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      discountTable: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true },
      },
    },
  })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Exclude passwordHash from response
  const { passwordHash: _, ...safeUser } = user
  return NextResponse.json(safeUser)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const { name, currentPassword, newPassword } = await req.json()
    const data: Record<string, any> = {}

    if (name?.trim()) data.name = name.trim()

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Senha atual obrigatória para alterar a senha' }, { status: 400 })
      }
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
      data.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração fornecida' }, { status: 400 })
    }

    const updated = await prisma.user.update({ where: { id: userId }, data })
    return NextResponse.json({ success: true, name: updated.name })
  } catch (err) {
    console.error('[conta PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
