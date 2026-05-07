import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, salonName, city, instagram } = await req.json()
    if (!name || !email || !phone || !salonName || !city) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Criar usuário com role PENDENTE se não existir
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const tempPassword = await bcrypt.hash(Math.random().toString(36), 12)
      user = await prisma.user.create({
        data: { name, email, passwordHash: tempPassword, role: 'PENDENTE' }
      })
    }

    // Verificar se já tem solicitação
    const existing = await prisma.professionalRequest.findUnique({ where: { userId: user.id } })
    if (existing) return NextResponse.json({ error: 'Solicitação já enviada' }, { status: 409 })

    await prisma.professionalRequest.create({
      data: { userId: user.id, salonName, city, phone, instagram }
    })

    // TODO: Enviar email de notificação para o admin
    // await notifyAdminNewRequest({ name, email, salonName, city })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
