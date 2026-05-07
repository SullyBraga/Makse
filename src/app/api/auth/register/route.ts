import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, type, salonName, city, phone, instagram } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    if (type === 'professional') {
      // Criar usuário com role PENDENTE e solicitar aprovação
      if (!salonName || !city || !phone) {
        return NextResponse.json({ error: 'Dados do salão são obrigatórios' }, { status: 400 })
      }

      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'PENDENTE' },
      })

      await prisma.professionalRequest.create({
        data: { userId: user.id, salonName, city, phone, instagram: instagram || null },
      })

      return NextResponse.json(
        { id: user.id, name: user.name, email: user.email, type: 'professional' },
        { status: 201 }
      )
    } else if (type === 'vendedor') {
      // Criação direta de vendedor — apenas via admin
      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'VENDEDOR' },
      })
      return NextResponse.json(
        { id: user.id, name: user.name, email: user.email, type: 'vendedor' },
        { status: 201 }
      )
    } else {
      // Cliente final
      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'CLIENTE_FINAL' },
      })

      return NextResponse.json(
        { id: user.id, name: user.name, email: user.email, type: 'client' },
        { status: 201 }
      )
    }
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
