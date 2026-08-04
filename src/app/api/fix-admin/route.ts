import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const email = 'bragasullivan@icloud.com'
  const password = '12018181Aa@'

  try {
    const hash = await bcrypt.hash(password, 10)

    // Upsert bragasullivan@icloud.com as ADMIN
    const adminUser = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hash,
        role: 'ADMIN',
      },
      create: {
        name: 'Administrador Makse',
        email,
        passwordHash: hash,
        role: 'ADMIN',
      },
    })

    // Also sync old admin user if present
    const oldAdmin = await prisma.user.findUnique({ where: { email: 'admin@makse.com.br' } })
    if (oldAdmin) {
      await prisma.user.update({
        where: { email: 'admin@makse.com.br' },
        data: { passwordHash: hash, role: 'ADMIN' },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Conta admin (${adminUser.email}) configurada com sucesso no banco de dados!`,
      email: adminUser.email,
      role: adminUser.role,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const targetEmail: string = body.email ?? 'bragasullivan@icloud.com'
  const newPassword: string = body.password ?? '12018181Aa@'
  const secret: string = body.secret ?? ''

  if (secret !== 'reset-makse-admin') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const hash = await bcrypt.hash(newPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: targetEmail },
    update: {
      passwordHash: hash,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador Makse',
      email: targetEmail,
      passwordHash: hash,
      role: 'ADMIN',
    },
  })

  return NextResponse.json({
    success: true,
    message: `Usuário Admin ${adminUser.email} configurado com sucesso!`,
  })
}
